import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookOpen, MessageSquare, BookMarked, Trophy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DayProgressModalProps {
  open: boolean;
  onClose: () => void;
  weekId: string;
  studentId: string;
  dayType: string;
  dayLabel: string;
  isEditable: boolean;
  existingNote?: {
    id?: string;
    class_topics?: string | null;
    tutoring_topics?: string | null;
    vocabulary?: string | null;
    achievements?: string | null;
    challenges?: string | null;
  };
  userRole: 'teacher' | 'tutor' | 'student' | 'admin';
}

export const DayProgressModal = ({
  open,
  onClose,
  weekId,
  studentId,
  dayType,
  dayLabel,
  isEditable,
  existingNote,
  userRole,
}: DayProgressModalProps) => {
  const queryClient = useQueryClient();
  
  const [classTopics, setClassTopics] = useState(existingNote?.class_topics || '');
  const [tutoringTopics, setTutoringTopics] = useState(existingNote?.tutoring_topics || '');
  const [vocabulary, setVocabulary] = useState(existingNote?.vocabulary || '');
  const [achievements, setAchievements] = useState(existingNote?.achievements || '');
  const [challenges, setChallenges] = useState(existingNote?.challenges || '');

  // Update state when existingNote changes
  useEffect(() => {
    setClassTopics(existingNote?.class_topics || '');
    setTutoringTopics(existingNote?.tutoring_topics || '');
    setVocabulary(existingNote?.vocabulary || '');
    setAchievements(existingNote?.achievements || '');
    setChallenges(existingNote?.challenges || '');
  }, [existingNote]);

  const canEditClassTopics = userRole === 'teacher' || userRole === 'admin';
  const canEditTutoringTopics = userRole === 'tutor' || userRole === 'admin';
  const canEditVocabulary = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditAchievements = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditChallenges = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('student_progress_notes')
        .upsert({
          week_id: weekId,
          day_type: dayType,
          created_by: userId,
          class_topics: classTopics || null,
          tutoring_topics: tutoringTopics || null,
          vocabulary: vocabulary || null,
          achievements: achievements || null,
          challenges: challenges || null,
          notes: null, // Keep legacy field null
        }, {
          onConflict: 'week_id,day_type'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-notes', studentId] });
      toast.success('Notas guardadas correctamente');
      onClose();
    },
    onError: () => {
      toast.error('Error al guardar las notas');
    }
  });

  const hasAnyContent = classTopics || tutoringTopics || vocabulary || achievements || challenges;
  const canSave = isEditable && (canEditClassTopics || canEditTutoringTopics || canEditVocabulary || canEditAchievements || canEditChallenges);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {dayLabel}
          </DialogTitle>
          <DialogDescription>
            {isEditable 
              ? 'Registra el progreso del estudiante para este día' 
              : 'Resumen del progreso del día'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Class Topics - Teacher edits */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-green-600" />
              Temas aprendidos en clase
              <span className="text-xs text-muted-foreground font-normal">(Profesor)</span>
            </Label>
            {isEditable && canEditClassTopics ? (
              <Textarea
                value={classTopics}
                onChange={(e) => setClassTopics(e.target.value)}
                placeholder="Describe los temas que se enseñaron en clase..."
                rows={3}
                className="resize-none"
              />
            ) : (
              <div className={`min-h-[60px] p-3 rounded-md text-sm border-l-4 ${
                classTopics 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                  : 'border-muted bg-muted/30'
              }`}>
                {classTopics || <span className="text-muted-foreground italic">Sin información</span>}
              </div>
            )}
          </div>

          {/* Tutoring Topics - Tutor edits */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Temas practicados en tutorías
              <span className="text-xs text-muted-foreground font-normal">(Tutor)</span>
            </Label>
            {isEditable && canEditTutoringTopics ? (
              <Textarea
                value={tutoringTopics}
                onChange={(e) => setTutoringTopics(e.target.value)}
                placeholder="Describe los temas que se practicaron en la tutoría..."
                rows={3}
                className="resize-none"
              />
            ) : (
              <div className={`min-h-[60px] p-3 rounded-md text-sm border-l-4 ${
                tutoringTopics 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-muted bg-muted/30'
              }`}>
                {tutoringTopics || <span className="text-muted-foreground italic">Sin información</span>}
              </div>
            )}
          </div>

          {/* Vocabulary - Both can edit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <BookMarked className="h-4 w-4 text-purple-600" />
              Vocabulario
              <span className="text-xs text-muted-foreground font-normal">(Profesor/Tutor)</span>
            </Label>
            {isEditable && canEditVocabulary ? (
              <Textarea
                value={vocabulary}
                onChange={(e) => setVocabulary(e.target.value)}
                placeholder="Lista el vocabulario nuevo aprendido..."
                rows={2}
                className="resize-none"
              />
            ) : (
              <div className={`min-h-[50px] p-3 rounded-md text-sm border-l-4 ${
                vocabulary 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                  : 'border-muted bg-muted/30'
              }`}>
                {vocabulary || <span className="text-muted-foreground italic">Sin información</span>}
              </div>
            )}
          </div>

          {/* Achievements - Both can edit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-yellow-600" />
              Logros
              <span className="text-xs text-muted-foreground font-normal">(Profesor/Tutor)</span>
            </Label>
            {isEditable && canEditAchievements ? (
              <Textarea
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Describe los logros del estudiante..."
                rows={2}
                className="resize-none"
              />
            ) : (
              <div className={`min-h-[50px] p-3 rounded-md text-sm border-l-4 ${
                achievements 
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' 
                  : 'border-muted bg-muted/30'
              }`}>
                {achievements || <span className="text-muted-foreground italic">Sin información</span>}
              </div>
            )}
          </div>

          {/* Challenges - Both can edit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Retos
              <span className="text-xs text-muted-foreground font-normal">(Profesor/Tutor)</span>
            </Label>
            {isEditable && canEditChallenges ? (
              <Textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Describe los retos o dificultades identificadas..."
                rows={2}
                className="resize-none"
              />
            ) : (
              <div className={`min-h-[50px] p-3 rounded-md text-sm border-l-4 ${
                challenges 
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                  : 'border-muted bg-muted/30'
              }`}>
                {challenges || <span className="text-muted-foreground italic">Sin información</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {canSave ? 'Cancelar' : 'Cerrar'}
          </Button>
          {canSave && (
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
