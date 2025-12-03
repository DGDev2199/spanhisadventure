import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Lock, BookOpen, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface StudentProgressViewProps {
  studentId: string;
  isEditable: boolean; // true for teacher/tutor/admin, false for student
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'strengths', 'weaknesses'];
const DAY_LABELS = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  strengths: 'Fortalezas',
  weaknesses: 'Debilidades'
};

// Helper function to format week display name
const formatWeekName = (weekNumber: number): string => {
  if (weekNumber >= 100) {
    const baseWeek = Math.floor(weekNumber / 100);
    const specialNumber = weekNumber % 100;
    return `Semana ${baseWeek}-${specialNumber}+`;
  }
  return `Semana ${weekNumber}`;
};

// Helper to check if week is special
const isSpecialWeek = (weekNumber: number): boolean => weekNumber >= 100;

export const StudentProgressView = ({ studentId, isEditable }: StudentProgressViewProps) => {
  const queryClient = useQueryClient();
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [weekTheme, setWeekTheme] = useState('');
  const [weekObjectives, setWeekObjectives] = useState('');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [renamingWeekId, setRenamingWeekId] = useState<string | null>(null);
  const [newWeekTheme, setNewWeekTheme] = useState('');

  // Fetch current user to determine role
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is teacher or tutor
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      return { id: user.id, roles: roles?.map(r => r.role) || [] };
    }
  });

  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', studentId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all weeks for this student
  const { data: weeks, isLoading } = useQuery({
    queryKey: ['student-progress-weeks', studentId],
    queryFn: async () => {
      console.log('📚 Fetching student progress weeks for student:', studentId);
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .select(`
          *,
          completed_by_profile:profiles!student_progress_weeks_completed_by_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .order('week_number', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching weeks:', error);
        throw error;
      }
      console.log('✅ Weeks fetched:', data?.length || 0, 'weeks');
      console.log('📊 Week numbers:', data?.map(w => w.week_number));
      return data || [];
    }
  });

  // Fetch all notes for all weeks
  const { data: notes } = useQuery({
    queryKey: ['student-progress-notes', studentId],
    queryFn: async () => {
      if (!weeks || weeks.length === 0) return [];
      
      const weekIds = weeks.map(w => w.id);
      const { data, error } = await supabase
        .from('student_progress_notes')
        .select(`
          *,
          author:profiles!student_progress_notes_created_by_fkey(full_name, id)
        `)
        .in('week_id', weekIds);
      
      if (error) throw error;
      
      // Fetch roles for all authors
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(n => n.created_by))];
        const { data: authorRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', authorIds);
        
        // Attach roles to notes
        return data.map(note => ({
          ...note,
          author_role: authorRoles?.find(r => r.user_id === note.created_by)?.role
        }));
      }
      
      return data || [];
    },
    enabled: !!weeks && weeks.length > 0
  });

  // Create or update week
  const saveWeekMutation = useMutation({
    mutationFn: async ({ weekNumber, theme, objectives }: { weekNumber: number; theme: string; objectives: string }) => {
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .upsert({
          student_id: studentId,
          week_number: weekNumber,
          week_theme: theme,
          week_objectives: objectives
        }, {
          onConflict: 'student_id,week_number'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Semana guardada');
      setEditingWeek(null);
    },
    onError: () => {
      toast.error('Error al guardar la semana');
    }
  });

  // Save note
  const saveNoteMutation = useMutation({
    mutationFn: async ({ weekId, dayType, noteContent }: { weekId: string; dayType: string; noteContent: string }) => {
      const { error } = await supabase
        .from('student_progress_notes')
        .upsert({
          week_id: weekId,
          day_type: dayType,
          notes: noteContent,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'week_id,day_type'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-notes', studentId] });
      toast.success('Nota guardada');
    },
    onError: () => {
      toast.error('Error al guardar la nota');
    }
  });

  // Mark week as special (complete current and create special week)
  const specialWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      console.log('⭐ Creating special week from:', weekId);
      
      // Get the current week data
      const { data: currentWeekData, error: fetchError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('id', weekId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching week data:', fetchError);
        throw fetchError;
      }
      
      console.log('📊 Current week data for special:', currentWeekData);
      
      // Mark current week as completed
      const { error: updateError } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', weekId);
      
      if (updateError) {
        console.error('❌ Error updating week:', updateError);
        throw updateError;
      }
      
      console.log('✅ Week marked as completed');
      
      // Create special week - use a unique week number (base week * 100 + count)
      console.log('📝 Creating special week for week:', currentWeekData.week_number);
      
      // Check how many special weeks exist for this base week (week numbers 100+)
      const baseSpecialNumber = currentWeekData.week_number * 100;
      const { data: existingSpecialWeeks } = await supabase
        .from('student_progress_weeks')
        .select('week_number')
        .eq('student_id', studentId)
        .gte('week_number', baseSpecialNumber)
        .lt('week_number', baseSpecialNumber + 100);
      
      const specialCount = (existingSpecialWeeks?.length || 0) + 1;
      const specialWeekNumber = baseSpecialNumber + specialCount;
      
      console.log('📝 Special week number:', specialWeekNumber, 'count:', specialCount);
      
      const { error: insertError } = await supabase
        .from('student_progress_weeks')
        .insert({
          student_id: studentId,
          week_number: specialWeekNumber, // Unique number for special weeks (e.g., 101, 102 for week 1 specials)
          week_theme: `Semana ${currentWeekData.week_number}+`,
          week_objectives: `Objetivos de refuerzo para semana ${currentWeekData.week_number}`,
          is_completed: false
        });
      
      if (insertError) {
        console.error('❌ Error creating special week:', insertError);
        throw insertError;
      }
      
      console.log('✅ Special week created successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Semana especial creada');
    },
    onError: (error: any) => {
      console.error('❌ Special week mutation error:', error);
      toast.error('Error al crear semana especial');
    }
  });

  // Delete week mutation
  const deleteWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      // First delete all notes for this week
      const { error: notesError } = await supabase
        .from('student_progress_notes')
        .delete()
        .eq('week_id', weekId);
      
      if (notesError) throw notesError;
      
      // Then delete the week
      const { error } = await supabase
        .from('student_progress_weeks')
        .delete()
        .eq('id', weekId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Semana eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la semana');
    }
  });

  // Rename week mutation
  const renameWeekMutation = useMutation({
    mutationFn: async ({ weekId, theme }: { weekId: string; theme: string }) => {
      const { error } = await supabase
        .from('student_progress_weeks')
        .update({ week_theme: theme })
        .eq('id', weekId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Nombre de semana actualizado');
      setRenamingWeekId(null);
      setNewWeekTheme('');
    },
    onError: () => {
      toast.error('Error al renombrar la semana');
    }
  });

  // Mark week as completed and create next week if needed
  const completeWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      console.log('🎯 Completing week:', weekId);
      
      // Get the current week data
      const { data: currentWeekData, error: fetchError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('id', weekId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching week data:', fetchError);
        throw fetchError;
      }
      
      console.log('📊 Current week data:', currentWeekData);
      
      // Mark current week as completed
      const { error: updateError } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', weekId);
      
      if (updateError) {
        console.error('❌ Error updating week:', updateError);
        throw updateError;
      }
      
      console.log('✅ Week marked as completed');
      
      // Create next week if we haven't reached week 12
      const nextWeekNumber = currentWeekData.week_number + 1;
      if (nextWeekNumber <= 12) {
        console.log('📝 Creating next week:', nextWeekNumber);
        
        // Check if next week already exists
        const { data: existingWeek } = await supabase
          .from('student_progress_weeks')
          .select('id')
          .eq('student_id', studentId)
          .eq('week_number', nextWeekNumber)
          .maybeSingle();
        
        if (!existingWeek) {
          // Determine the level and theme for the next week
          const levelWeeks: Record<string, { level: string; weeks: number[] }> = {
            'A1': { level: 'A1', weeks: [1, 2] },
            'A2': { level: 'A2', weeks: [3, 4] },
            'B1': { level: 'B1', weeks: [5, 6] },
            'B2': { level: 'B2', weeks: [7, 8] },
            'C1': { level: 'C1', weeks: [9, 10] },
            'C2': { level: 'C2', weeks: [11, 12] }
          };
          
          let nextLevel = 'A1';
          for (const [level, data] of Object.entries(levelWeeks)) {
            if (data.weeks.includes(nextWeekNumber)) {
              nextLevel = level;
              break;
            }
          }
          
          const { error: insertError } = await supabase
            .from('student_progress_weeks')
            .insert({
              student_id: studentId,
              week_number: nextWeekNumber,
              week_theme: `${nextLevel} - Semana ${nextWeekNumber}`,
              week_objectives: `Objetivos para la semana ${nextWeekNumber} del nivel ${nextLevel}`,
              is_completed: false
            });
          
          if (insertError) {
            console.error('❌ Error creating next week:', insertError);
          } else {
            console.log('✅ Next week created successfully:', nextWeekNumber);
          }
        } else {
          console.log('ℹ️ Next week already exists:', nextWeekNumber);
        }
      } else {
        console.log('🎓 Student has completed all 12 weeks!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Semana marcada como completada');
    },
    onError: (error: any) => {
      console.error('❌ Complete week mutation error:', error);
      toast.error('Error al completar la semana');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!weeks || weeks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {isEditable 
            ? 'Las semanas se crearán automáticamente al asignar un nivel al estudiante' 
            : 'No hay progreso registrado aún. Las semanas se crearán cuando se te asigne un nivel.'}
        </CardContent>
      </Card>
    );
  }

  const completedWeeks = weeks.filter(w => w.is_completed).length;
  const totalWeeks = weeks.length;
  const progressPercentage = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

  // Determine current week (first non-completed week)
  const currentWeek = weeks.find(w => !w.is_completed);
  const currentWeekNumber = currentWeek?.week_number || (weeks[weeks.length - 1]?.week_number || 0);
  
  console.log('📈 Progress calculation:', {
    completedWeeks,
    totalWeeks,
    currentWeekNumber,
    progressPercentage: Math.round(progressPercentage)
  });

  const getWeekNotes = (weekId: string) => {
    return notes?.filter(n => n.week_id === weekId) || [];
  };

  const getNoteForDay = (weekId: string, dayType: string) => {
    return getWeekNotes(weekId).find(n => n.day_type === dayType);
  };

  const handleNoteChange = (weekId: string, dayType: string, content: string) => {
    const key = `${weekId}-${dayType}`;
    setEditingNotes({ ...editingNotes, [key]: content });
  };

  const handleSaveNote = (weekId: string, dayType: string) => {
    const key = `${weekId}-${dayType}`;
    const content = editingNotes[key];
    if (content !== undefined) {
      saveNoteMutation.mutate({ weekId, dayType, noteContent: content });
      // Remove from editing state after save
      const newEditingNotes = { ...editingNotes };
      delete newEditingNotes[key];
      setEditingNotes(newEditingNotes);
    }
  };

  const getNoteValue = (weekId: string, dayType: string) => {
    const key = `${weekId}-${dayType}`;
    const note = getNoteForDay(weekId, dayType);
    return editingNotes[key] !== undefined ? editingNotes[key] : (note?.notes || '');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Progreso del Estudiante
          </CardTitle>
          <CardDescription>
            Seguimiento semanal del aprendizaje y desarrollo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Progreso General</p>
                <p className="text-2xl font-bold text-primary">
                  {completedWeeks} / {totalWeeks} Semanas
                </p>
                {currentWeek && (
                  <p className="text-xs text-muted-foreground">
                    Semana actual: {currentWeek.week_number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-secondary">{Math.round(progressPercentage)}%</p>
                <p className="text-xs text-muted-foreground">Completado</p>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible defaultValue={`week-${currentWeekNumber}`} className="space-y-4">
        {/* Show initial feedback only until the first week is completed */}
        {studentProfile?.initial_feedback && completedWeeks === 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">📋</span> Evaluación Inicial
              </CardTitle>
              <CardDescription className="text-xs">
                Este mensaje desaparecerá cuando completes tu primera semana asignada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{studentProfile.initial_feedback}</p>
            </CardContent>
          </Card>
        )}

        {weeks.map((week) => {
          const isCurrent = week.week_number === currentWeekNumber;
          const canEditNotes = isEditable && isCurrent;
          const weekNotes = getWeekNotes(week.id);
          const isTeacher = currentUser?.roles?.includes('teacher');
          const isTutor = currentUser?.roles?.includes('tutor');
          const canViewNotes = isEditable || week.is_completed || (!week.is_completed && weeks.find(w => !w.is_completed)?.id === week.id);

          return (
            <AccordionItem
              key={week.id}
              value={`week-${week.week_number}`}
              className={`border rounded-lg ${
                week.is_completed ? 'bg-green-50 dark:bg-green-950/20' : 
                isCurrent ? 'bg-blue-50 dark:bg-blue-950/20' : 
                'bg-card'
              }`}
            >
              <AccordionTrigger
                className="px-4 hover:no-underline"
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    {week.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary animate-pulse" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold">
                        {isSpecialWeek(week.week_number) 
                          ? `${formatWeekName(week.week_number)} - ${week.week_theme}` 
                          : `Semana ${week.week_number} - ${week.week_theme}`}
                      </p>
                      {isCurrent && !week.is_completed && (
                        <span className="text-xs text-blue-600 font-medium">Semana Actual</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditable && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingWeekId(week.id);
                            setNewWeekTheme(week.week_theme);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isSpecialWeek(week.week_number) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('¿Estás seguro de eliminar esta semana especial?')) {
                                deleteWeekMutation.mutate(week.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {week.is_completed && (
                      <span className="text-sm text-green-600 font-medium">Completada</span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              {/* Rename Dialog */}
              {renamingWeekId === week.id && (
                <div className="px-4 py-3 bg-muted/50 border-b">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newWeekTheme}
                      onChange={(e) => setNewWeekTheme(e.target.value)}
                      placeholder="Nuevo nombre de la semana"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => renameWeekMutation.mutate({ weekId: week.id, theme: newWeekTheme })}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRenamingWeekId(null);
                        setNewWeekTheme('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Week Theme and Objectives */}
                  {isEditable && editingWeek === week.week_number ? (
                    <div className="space-y-3 bg-background p-4 rounded-lg border">
                      <div>
                        <Label>Tema de la Semana</Label>
                        <Input
                          value={weekTheme}
                          onChange={(e) => setWeekTheme(e.target.value)}
                          placeholder="Ej: Presente Simple"
                        />
                      </div>
                      <div>
                        <Label>Objetivos de la Semana</Label>
                        <Textarea
                          value={weekObjectives}
                          onChange={(e) => setWeekObjectives(e.target.value)}
                          placeholder="Describe los objetivos de aprendizaje..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            saveWeekMutation.mutate({
                              weekNumber: week.week_number,
                              theme: weekTheme,
                              objectives: weekObjectives
                            });
                          }}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingWeek(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-background p-4 rounded-lg border space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Objetivos:</p>
                        <p className="text-sm">
                          {week.week_objectives || 'No hay objetivos definidos aún'}
                        </p>
                      </div>
                      {isEditable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingWeek(week.week_number);
                            setWeekTheme(week.week_theme);
                            setWeekObjectives(week.week_objectives || '');
                          }}
                        >
                          Editar Objetivos
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Daily Notes Grid - Only shown for completed weeks or if user can edit */}
                  {canViewNotes && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {DAYS.map((day) => {
                        const note = getNoteForDay(week.id, day);
                        
                        return (
                          <div
                            key={day}
                            className={`p-4 rounded-lg border ${
                              day === 'strengths' ? 'col-span-1' :
                              day === 'weaknesses' ? 'col-span-1' :
                              ''
                            }`}
                          >
                            <Label className="font-semibold mb-2 block">
                              {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                            </Label>
                            {canEditNotes ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={getNoteValue(week.id, day)}
                                  onChange={(e) => {
                                    handleNoteChange(week.id, day, e.target.value);
                                  }}
                                  placeholder={`Notas para ${DAY_LABELS[day as keyof typeof DAY_LABELS]}...`}
                                  rows={4}
                                  className="resize-none"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNote(week.id, day)}
                                  disabled={editingNotes[`${week.id}-${day}`] === undefined}
                                >
                                  Guardar Nota
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {note?.notes ? (
                                  <>
                                    <div className={`min-h-[100px] p-3 rounded-md text-sm border-l-4 ${
                                      (note as any).author_role === 'teacher' ? 
                                      'border-green-500 bg-green-50 dark:bg-green-950/20' :
                                      (note as any).author_role === 'tutor' ?
                                      'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
                                      'border-muted bg-muted/50'
                                    }`}>
                                      {note.notes}
                                    </div>
                                    {note.author?.full_name && (
                                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                        (note as any).author_role === 'teacher' ? 
                                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                        (note as any).author_role === 'tutor' ?
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {(note.author as any)?.full_name}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="min-h-[100px] p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                                    Sin notas
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Message for students when week is not completed */}
                  {!canViewNotes && (
                    <div className="p-6 text-center bg-muted/30 rounded-lg border-2 border-dashed">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Las notas estarán disponibles cuando se complete esta semana
                      </p>
                    </div>
                  )}

                  {/* Complete Week Button - Only for current week */}
                  {isEditable && isCurrent && !week.is_completed && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => completeWeekMutation.mutate(week.id)}
                        disabled={completeWeekMutation.isPending}
                        className="flex-1"
                      >
                        {completeWeekMutation.isPending ? 'Completando...' : 'Marcar Semana como Completada'}
                      </Button>
                      <Button
                        onClick={() => specialWeekMutation.mutate(week.id)}
                        disabled={specialWeekMutation.isPending}
                        variant="secondary"
                        className="flex-1"
                      >
                        {specialWeekMutation.isPending ? 'Creando...' : 'Semana Especial'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Show who completed the week */}
                  {week.is_completed && (week as any).completed_by_profile?.full_name && (
                    <p className="text-sm text-muted-foreground text-center">
                      Completada por: {(week as any).completed_by_profile.full_name}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
