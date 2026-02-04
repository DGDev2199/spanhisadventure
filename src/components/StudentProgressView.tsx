import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, Lock, BookOpen, Trash2, Pencil, Calendar, Download, GraduationCap, Users, AlertCircle, Circle, ArrowLeftRight, RotateCcw, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { DayProgressModal } from './DayProgressModal';
import { ReassignLevelDialog } from './ReassignLevelDialog';
import { MarkAsAlumniDialog } from './MarkAsAlumniDialog';
import { useProgramWeeks, useAllWeekTopics, useStudentTopicProgress, useCheckAndAwardBadges } from '@/hooks/useGamification';
import jsPDF from 'jspdf';

interface StudentProgressViewProps {
  studentId: string;
  isEditable: boolean;
}

// Days are now Tuesday to Friday only (class days)
const DAYS = ['tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS: Record<string, string> = {
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
};

const formatWeekName = (weekNumber: number): string => {
  if (weekNumber >= 100) {
    const baseWeek = Math.floor(weekNumber / 100);
    const specialNumber = weekNumber % 100;
    return `Semana ${baseWeek}-${specialNumber}+`;
  }
  return `Semana ${weekNumber}`;
};

const isSpecialWeek = (weekNumber: number): boolean => weekNumber >= 100;

export const StudentProgressView = ({ studentId, isEditable }: StudentProgressViewProps) => {
  const queryClient = useQueryClient();
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [weekTheme, setWeekTheme] = useState('');
  const [weekObjectives, setWeekObjectives] = useState('');
  const [renamingWeekId, setRenamingWeekId] = useState<string | null>(null);
  const [newWeekTheme, setNewWeekTheme] = useState('');
  
  // Modal state
  const [selectedDay, setSelectedDay] = useState<{ weekId: string; weekNumber: number; dayType: string; dayLabel: string } | null>(null);
  
  // Validation modal state for completing week
  const [weekToComplete, setWeekToComplete] = useState<{ id: string; weekNumber: number } | null>(null);
  
  // Reassign level dialog state
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  
  // Mark as alumni dialog state
  const [showAlumniDialog, setShowAlumniDialog] = useState(false);

  // Fetch program weeks and topics for suggestions
  const { data: programWeeks = [] } = useProgramWeeks();
  const { data: allCurriculumTopics = [] } = useAllWeekTopics();
  
  // Fetch student topic progress for validation
  const { data: studentTopicProgress = [] } = useStudentTopicProgress(studentId);
  // Fetch current user to determine role
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

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

  // Fetch student name for dialogs
  const { data: studentName } = useQuery({
    queryKey: ['student-name', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentId)
        .single();
      
      if (error) return 'Estudiante';
      return data?.full_name || 'Estudiante';
    },
  });

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

  const { data: notes } = useQuery({
    queryKey: ['student-progress-notes', studentId],
    queryFn: async () => {
      if (!weeks || weeks.length === 0) return [];
      
      const weekIds = weeks.map(w => w.id);
      const { data, error } = await supabase
        .from('student_progress_notes')
        .select('*')
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

  // Mark week as special (complete current and create special week)
  const specialWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      const { data: currentWeekData, error: fetchError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('id', weekId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error: updateError } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', weekId);
      
      if (updateError) throw updateError;
      
      const baseSpecialNumber = currentWeekData.week_number * 100;
      const { data: existingSpecialWeeks } = await supabase
        .from('student_progress_weeks')
        .select('week_number')
        .eq('student_id', studentId)
        .gte('week_number', baseSpecialNumber)
        .lt('week_number', baseSpecialNumber + 100);
      
      const specialCount = (existingSpecialWeeks?.length || 0) + 1;
      const specialWeekNumber = baseSpecialNumber + specialCount;
      
      const { error: insertError } = await supabase
        .from('student_progress_weeks')
        .insert({
          student_id: studentId,
          week_number: specialWeekNumber,
          week_theme: `Semana ${currentWeekData.week_number}-${specialCount}+`,
          week_objectives: `Objetivos de refuerzo para semana ${currentWeekData.week_number}`,
          is_completed: false
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks-for-grid', studentId] });
      queryClient.invalidateQueries({ queryKey: ['special-weeks', studentId] });
      toast.success('Semana especial creada');
    },
    onError: () => {
      toast.error('Error al crear semana especial');
    }
  });

  const deleteWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      // Obtener datos de la semana antes de eliminar
      const { data: weekToDelete, error: fetchError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('id', weekId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Eliminar notas
      const { error: notesError } = await supabase
        .from('student_progress_notes')
        .delete()
        .eq('week_id', weekId);
      
      if (notesError) throw notesError;
      
      // Eliminar la semana
      const { error } = await supabase
        .from('student_progress_weeks')
        .delete()
        .eq('id', weekId);
      
      if (error) throw error;
      
      // Si era semana especial, verificar si la base necesita reabrirse
      if (weekToDelete && weekToDelete.week_number >= 100) {
        const baseWeekNumber = Math.floor(weekToDelete.week_number / 100);
        
        // Verificar si hay otras semanas especiales de la misma base
        const { data: otherSpecials } = await supabase
          .from('student_progress_weeks')
          .select('id')
          .eq('student_id', studentId)
          .gte('week_number', baseWeekNumber * 100)
          .lt('week_number', (baseWeekNumber + 1) * 100);
        
        // Si no hay más especiales, reabrir la semana base
        if (!otherSpecials || otherSpecials.length === 0) {
          await supabase
            .from('student_progress_weeks')
            .update({ 
              is_completed: false, 
              completed_at: null, 
              completed_by: null 
            })
            .eq('student_id', studentId)
            .eq('week_number', baseWeekNumber);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks-for-grid', studentId] });
      queryClient.invalidateQueries({ queryKey: ['special-weeks', studentId] });
      toast.success('Semana eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la semana');
    }
  });

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

  // Hook to check and award badges
  const checkAndAwardBadges = useCheckAndAwardBadges();

  const completeWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      const { data: currentWeekData, error: fetchError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('id', weekId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error: updateError } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', weekId);
      
      if (updateError) throw updateError;
      
      const nextWeekNumber = currentWeekData.week_number + 1;
      if (nextWeekNumber <= 12) {
        const { data: existingWeek } = await supabase
          .from('student_progress_weeks')
          .select('id')
          .eq('student_id', studentId)
          .eq('week_number', nextWeekNumber)
          .maybeSingle();
        
        if (!existingWeek) {
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
          
          await supabase
            .from('student_progress_weeks')
            .insert({
              student_id: studentId,
              week_number: nextWeekNumber,
              week_theme: `${nextLevel} - Semana ${nextWeekNumber}`,
              week_objectives: `Objetivos para la semana ${nextWeekNumber} del nivel ${nextLevel}`,
              is_completed: false
            });
        }
      }
      
      return currentWeekData.student_id;
    },
    onSuccess: (completedStudentId) => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks-for-grid', studentId] });
      queryClient.invalidateQueries({ queryKey: ['special-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['completed-weeks-count', studentId] });
      toast.success('Semana marcada como completada');
      
      // Check and award badges for the student after completing a week
      if (completedStudentId) {
        checkAndAwardBadges.mutate(completedStudentId);
      }
    },
    onError: () => {
      toast.error('Error al completar la semana');
    }
  });

  // Reopen completed week mutation
  const reopenWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      const { error } = await supabase
        .from('student_progress_weeks')
        .update({
          is_completed: false,
          completed_at: null,
          completed_by: null
        })
        .eq('id', weekId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['completed-weeks-count', studentId] });
      toast.success('Semana reabierta');
    },
    onError: () => {
      toast.error('Error al reabrir la semana');
    }
  });

  // Determine user role for the modal
  const getUserRole = (): 'teacher' | 'tutor' | 'student' | 'admin' => {
    if (currentUser?.roles?.includes('admin')) return 'admin';
    if (currentUser?.roles?.includes('coordinator')) return 'admin'; // Coordinador actua como admin
    if (currentUser?.roles?.includes('teacher')) return 'teacher';
    if (currentUser?.roles?.includes('tutor')) return 'tutor';
    return 'student';
  };

  const getNoteForDay = (weekId: string, dayType: string) => {
    return notes?.find(n => n.week_id === weekId && n.day_type === dayType);
  };

  const hasNoteContent = (weekId: string, dayType: string) => {
    const note = getNoteForDay(weekId, dayType);
    if (!note) return false;
    return !!(note.class_topics || note.tutoring_topics || note.vocabulary || note.achievements || note.challenges);
  };

  // Get who filled the notes for visual indicators
  const getNoteFilledBy = (weekId: string, dayType: string): { hasTeacher: boolean; hasTutor: boolean } => {
    const note = getNoteForDay(weekId, dayType);
    if (!note) return { hasTeacher: false, hasTutor: false };
    
    // Check if teacher filled (class_topics)
    const hasTeacher = !!(note.class_topics);
    // Check if tutor filled (tutoring_topics)
    const hasTutor = !!(note.tutoring_topics);
    
    return { hasTeacher, hasTutor };
  };

  // Get uncalibrated topics for a given week number
  const getUncalibratedTopicsForWeek = (weekNumber: number) => {
    // Find the program week that matches this week number
    const matchingProgramWeek = programWeeks.find(pw => pw.week_number === weekNumber);
    if (!matchingProgramWeek) return [];
    
    // Get topics for this program week
    const weekTopics = allCurriculumTopics.filter(t => t.week_id === matchingProgramWeek.id);
    
    // Create a map of topic progress with colors
    const progressMap = new Map(
      studentTopicProgress
        .filter(p => p.color)
        .map(p => [p.topic_id, p.color])
    );
    
    // Return topics that don't have a color assigned
    return weekTopics.filter(t => !progressMap.get(t.id));
  };

  // Memoized uncalibrated topics for the week being completed
  const uncalibratedTopics = useMemo(() => {
    if (!weekToComplete) return [];
    return getUncalibratedTopicsForWeek(weekToComplete.weekNumber);
  }, [weekToComplete, programWeeks, allCurriculumTopics, studentTopicProgress]);
  const exportWeekToPDF = async (week: typeof weeks[0]) => {
    const weekNotes = notes?.filter(n => n.week_id === week.id) || [];
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Semana ${week.week_number} - ${week.week_theme}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Objectives
    if (week.week_objectives) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Objetivos: ${week.week_objectives}`, 14, yPos);
      yPos += 10;
    }
    
    // Status
    doc.setFontSize(10);
    doc.text(`Estado: ${week.is_completed ? 'Completada' : 'En progreso'}`, 14, yPos);
    yPos += 15;
    
    // Days
    const dayOrder = ['tuesday', 'wednesday', 'thursday', 'friday'];
    
    for (const day of dayOrder) {
      const note = weekNotes.find(n => n.day_type === day);
      const dayLabel = DAY_LABELS[day];
      
      // Day header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(dayLabel, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (note) {
        if (note.class_topics) {
          doc.text(`Temas de clase: ${note.class_topics}`, 18, yPos);
          yPos += 6;
        }
        if (note.tutoring_topics) {
          doc.text(`Temas de tutoría: ${note.tutoring_topics}`, 18, yPos);
          yPos += 6;
        }
        if (note.vocabulary) {
          doc.text(`Vocabulario: ${note.vocabulary}`, 18, yPos);
          yPos += 6;
        }
        if (note.achievements) {
          doc.text(`Logros: ${note.achievements}`, 18, yPos);
          yPos += 6;
        }
        if (note.challenges) {
          doc.text(`Retos: ${note.challenges}`, 18, yPos);
          yPos += 6;
        }
        if (!note.class_topics && !note.tutoring_topics && !note.vocabulary && !note.achievements && !note.challenges) {
          doc.text('Sin notas registradas', 18, yPos);
          yPos += 6;
        }
      } else {
        doc.text('Sin notas registradas', 18, yPos);
        yPos += 6;
      }
      
      yPos += 8;
      
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    }
    
    // Save
    doc.save(`progreso_semana_${week.week_number}.pdf`);
    toast.success('PDF exportado correctamente');
  };

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
  const currentWeek = weeks.find(w => !w.is_completed);
  const currentWeekNumber = currentWeek?.week_number || (weeks[weeks.length - 1]?.week_number || 0);

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
                    Semana actual: {currentWeek.week_number} | Nivel: {studentProfile?.level || 'Sin asignar'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-secondary">{Math.round(progressPercentage)}%</p>
                <p className="text-xs text-muted-foreground">Completado</p>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            {/* Reassign Level and Alumni Buttons - Only for editable views */}
            {isEditable && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowReassignDialog(true)}
                  className="flex-1"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Reasignar Nivel y Semana
                </Button>
                {!studentProfile?.is_alumni && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAlumniDialog(true)}
                    className="flex-1"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Marcar como Alumni
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible defaultValue={`week-${currentWeekNumber}`} className="space-y-4">
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
          const canViewNotes = isEditable || week.is_completed || isCurrent;

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
              <AccordionTrigger className="px-4 hover:no-underline">
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
                          ? week.week_theme 
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

              {renamingWeekId === week.id && (
                <div className="px-4 py-3 bg-muted/50 border-b">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newWeekTheme}
                      onChange={(e) => setNewWeekTheme(e.target.value)}
                      placeholder={isSpecialWeek(week.week_number) 
                        ? "Ej: Semana 7-1+ Refuerzo" 
                        : "Nuevo tema de la semana"}
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

                  {/* Daily Notes Grid - Clickable cards */}
                  {canViewNotes && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Notas diarias</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportWeekToPDF(week)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Exportar PDF
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DAYS.map((day) => {
                          const hasContent = hasNoteContent(week.id, day);
                          const { hasTeacher, hasTutor } = getNoteFilledBy(week.id, day);
                          const canInteract = isEditable || week.is_completed || isCurrent;
                          
                          return (
                            <div
                              key={day}
                              onClick={() => canInteract && setSelectedDay({ weekId: week.id, weekNumber: week.week_number, dayType: day, dayLabel: DAY_LABELS[day] })}
                              className={`p-4 rounded-lg border transition-all ${
                                canInteract 
                                  ? 'cursor-pointer hover:border-primary hover:shadow-md' 
                                  : 'opacity-50'
                              } ${
                                hasContent 
                                  ? 'bg-primary/5 border-primary/30' 
                                  : 'bg-muted/30 border-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">{DAY_LABELS[day]}</span>
                              </div>
                              <div className={`text-xs ${hasContent ? 'text-primary' : 'text-muted-foreground'}`}>
                                {hasContent ? '✓ Con notas' : 'Sin notas aún'}
                              </div>
                              {/* Visual indicators for who filled */}
                              {hasContent && (
                                <div className="flex items-center gap-1 mt-2">
                                  {hasTeacher && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                                      <GraduationCap className="h-3 w-3" />
                                      Profesor
                                    </span>
                                  )}
                                  {hasTutor && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                                      <Users className="h-3 w-3" />
                                      Tutor
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
                        onClick={() => setWeekToComplete({ id: week.id, weekNumber: week.week_number })}
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
                  
                  {/* Reopen completed week button */}
                  {isEditable && week.is_completed && (
                    <div className="flex flex-col gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reopenWeekMutation.mutate(week.id)}
                        disabled={reopenWeekMutation.isPending}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {reopenWeekMutation.isPending ? 'Reabriendo...' : 'Reabrir Semana'}
                      </Button>
                      {(week as any).completed_by_profile?.full_name && (
                        <p className="text-sm text-muted-foreground text-center">
                          Completada por: {(week as any).completed_by_profile.full_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Day Progress Modal */}
      {selectedDay && (() => {
        // Find the matching program week based on week_number to get its topics
        const matchingProgramWeek = programWeeks.find(pw => pw.week_number === selectedDay.weekNumber);
        const weekTopicsForModal = matchingProgramWeek 
          ? allCurriculumTopics
              .filter(t => t.week_id === matchingProgramWeek.id)
              .map(t => ({ id: t.id, name: t.name }))
          : [];
        
        return (
          <DayProgressModal
            open={!!selectedDay}
            onClose={() => setSelectedDay(null)}
            weekId={selectedDay.weekId}
            studentId={studentId}
            dayType={selectedDay.dayType}
            dayLabel={selectedDay.dayLabel}
            isEditable={isEditable}
            existingNote={getNoteForDay(selectedDay.weekId, selectedDay.dayType)}
            userRole={getUserRole()}
            weekTopics={weekTopicsForModal}
          />
        );
      })()}

      {/* Week Completion Validation Modal */}
      <Dialog open={!!weekToComplete} onOpenChange={(open) => !open && setWeekToComplete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Completar Semana {weekToComplete?.weekNumber}
            </DialogTitle>
            <DialogDescription>
              {uncalibratedTopics.length > 0 
                ? 'Hay temas sin calificar. Puedes completar la semana de todos modos o crear una semana especial para cubrirlos después.'
                : '¿Estás seguro de marcar esta semana como completada?'
              }
            </DialogDescription>
          </DialogHeader>
          
          {uncalibratedTopics.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Temas sin calificar (se pueden cubrir en una semana especial)
                </p>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uncalibratedTopics.map(topic => (
                  <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{topic.name}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Puedes crear una <strong>Semana Especial</strong> para cubrir estos temas después si el estudiante tiene dificultades.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Todos los temas han sido calificados
              </p>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setWeekToComplete(null)}>
              Cancelar
            </Button>
            {weekToComplete && (
              <Button 
                onClick={() => {
                  completeWeekMutation.mutate(weekToComplete.id);
                  setWeekToComplete(null);
                }}
                disabled={completeWeekMutation.isPending}
                variant={uncalibratedTopics.length > 0 ? "secondary" : "default"}
              >
                {completeWeekMutation.isPending ? 'Completando...' : 
                  uncalibratedTopics.length > 0 ? 'Completar de todos modos' : 'Confirmar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Level Dialog */}
      <ReassignLevelDialog
        open={showReassignDialog}
        onOpenChange={setShowReassignDialog}
        studentId={studentId}
        currentLevel={studentProfile?.level || null}
        currentWeekNumber={currentWeekNumber}
      />

      {/* Mark as Alumni Dialog */}
      <MarkAsAlumniDialog
        open={showAlumniDialog}
        onOpenChange={setShowAlumniDialog}
        studentId={studentId}
        studentName={studentName || 'Estudiante'}
      />
    </div>
  );
};
