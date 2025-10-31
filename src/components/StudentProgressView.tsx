import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Lock, BookOpen } from 'lucide-react';
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

export const StudentProgressView = ({ studentId, isEditable }: StudentProgressViewProps) => {
  const queryClient = useQueryClient();
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [weekTheme, setWeekTheme] = useState('');
  const [weekObjectives, setWeekObjectives] = useState('');

  // Fetch all weeks for this student
  const { data: weeks, isLoading } = useQuery({
    queryKey: ['student-progress-weeks', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .select(`
          *,
          completed_by_profile:profiles!student_progress_weeks_completed_by_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .order('week_number', { ascending: true });
      
      if (error) throw error;
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
          author:profiles!student_progress_notes_created_by_fkey(full_name)
        `)
        .in('week_id', weekIds);
      
      if (error) throw error;
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

  // Mark week as completed
  const completeWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      const { error } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', weekId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      toast.success('Semana marcada como completada');
    },
    onError: () => {
      toast.error('Error al completar la semana');
    }
  });

  // Initialize weeks if they don't exist
  const initializeWeeks = async () => {
    if (!weeks || weeks.length === 0) {
      const weeksToCreate = Array.from({ length: 12 }, (_, i) => ({
        student_id: studentId,
        week_number: i + 1,
        week_theme: `Semana ${i + 1}`,
        week_objectives: ''
      }));

      await supabase.from('student_progress_weeks').insert(weeksToCreate);
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!weeks || weeks.length === 0) {
    if (isEditable) {
      initializeWeeks();
    }
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {isEditable ? 'Inicializando semanas...' : 'No hay progreso registrado aún'}
        </CardContent>
      </Card>
    );
  }

  const completedWeeks = weeks.filter(w => w.is_completed).length;
  const progressPercentage = (completedWeeks / 12) * 100;

  // Determine which weeks are accessible (current week or completed weeks)
  const lastCompletedWeekNumber = weeks
    .filter(w => w.is_completed)
    .sort((a, b) => b.week_number - a.week_number)[0]?.week_number || 0;
  const currentWeekNumber = lastCompletedWeekNumber + 1;

  const getWeekNotes = (weekId: string) => {
    return notes?.filter(n => n.week_id === weekId) || [];
  };

  const getNoteForDay = (weekId: string, dayType: string) => {
    return getWeekNotes(weekId).find(n => n.day_type === dayType);
  };

  const handleSaveNote = async (weekId: string, dayType: string, content: string) => {
    await saveNoteMutation.mutateAsync({ weekId, dayType, noteContent: content });
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
                  {completedWeeks} / 12 Semanas
                </p>
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

      <Accordion type="single" collapsible defaultValue="week-1" className="space-y-4">
        {weeks.map((week) => {
          const isCurrent = week.week_number === currentWeekNumber;
          const canEditNotes = isEditable && isCurrent;
          const weekNotes = getWeekNotes(week.id);

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
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold">
                        Semana {week.week_number} - {week.week_theme}
                      </p>
                      {isCurrent && !week.is_completed && (
                        <span className="text-xs text-blue-600 font-medium">Semana Actual</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {week.is_completed && (
                      <span className="text-sm text-green-600 font-medium">Completada</span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

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

                  {/* Daily Notes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className={`p-4 rounded-lg border ${
                          day === 'strengths' ? 'bg-green-50 dark:bg-green-950/20 col-span-1' :
                          day === 'weaknesses' ? 'bg-yellow-50 dark:bg-yellow-950/20 col-span-1' :
                          'bg-background'
                        }`}
                      >
                        <Label className="font-semibold mb-2 block">
                          {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                        </Label>
                        {canEditNotes ? (
                          <Textarea
                            value={getNoteForDay(week.id, day)?.notes || ''}
                            onChange={(e) => {
                              handleSaveNote(week.id, day, e.target.value);
                            }}
                            placeholder={`Notas para ${DAY_LABELS[day as keyof typeof DAY_LABELS]}...`}
                            rows={4}
                            className="resize-none"
                          />
                        ) : (
                          <div className="space-y-2">
                            <div className="min-h-[100px] p-3 bg-muted/50 rounded-md text-sm">
                              {getNoteForDay(week.id, day)?.notes || 'Sin notas'}
                            </div>
                            {getNoteForDay(week.id, day)?.author?.full_name && (
                              <p className="text-xs text-muted-foreground italic">
                                Escrito por: {getNoteForDay(week.id, day)?.author?.full_name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Complete Week Button */}
                  {isEditable && !week.is_completed && isCurrent && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => completeWeekMutation.mutate(week.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Semana como Completada
                    </Button>
                  )}
                  
                  {/* Show who completed the week */}
                  {week.is_completed && week.completed_by_profile?.full_name && (
                    <p className="text-sm text-muted-foreground text-center">
                      Completada por: {week.completed_by_profile.full_name}
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
