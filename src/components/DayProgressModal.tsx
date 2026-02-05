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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookOpen, MessageSquare, BookMarked, Trophy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeekTopic {
  id: string;
  name: string;
}

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
    class_topics_by?: string | null;
    tutoring_topics_by?: string | null;
    vocabulary_by?: string | null;
    achievements_by?: string | null;
    challenges_by?: string | null;
  };
  userRole: 'teacher' | 'tutor' | 'student' | 'admin';
  weekTopics?: WeekTopic[];
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
  weekTopics = [],
}: DayProgressModalProps) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
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

  // Both teachers and tutors can edit all fields
  const canEditClassTopics = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditTutoringTopics = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditVocabulary = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditAchievements = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';
  const canEditChallenges = userRole === 'teacher' || userRole === 'tutor' || userRole === 'admin';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Track who filled each field
      const updateData: Record<string, unknown> = {
        week_id: weekId,
        day_type: dayType,
        created_by: userId,
        notes: null,
      };

      // Only update fields the user can edit, and track who filled them
      if (canEditClassTopics) {
        updateData.class_topics = classTopics || null;
        if (classTopics && classTopics !== existingNote?.class_topics) {
          updateData.class_topics_by = userId;
        }
      }
      if (canEditTutoringTopics) {
        updateData.tutoring_topics = tutoringTopics || null;
        if (tutoringTopics && tutoringTopics !== existingNote?.tutoring_topics) {
          updateData.tutoring_topics_by = userId;
        }
      }
      if (canEditVocabulary) {
        updateData.vocabulary = vocabulary || null;
        if (vocabulary && vocabulary !== existingNote?.vocabulary) {
          updateData.vocabulary_by = userId;
        }
      }
      if (canEditAchievements) {
        updateData.achievements = achievements || null;
        if (achievements && achievements !== existingNote?.achievements) {
          updateData.achievements_by = userId;
        }
      }
      if (canEditChallenges) {
        updateData.challenges = challenges || null;
        if (challenges && challenges !== existingNote?.challenges) {
          updateData.challenges_by = userId;
        }
      }
      
      const { error } = await supabase
        .from('student_progress_notes')
        .upsert(updateData as any, {
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

  const canSave = isEditable && (canEditClassTopics || canEditTutoringTopics || canEditVocabulary || canEditAchievements || canEditChallenges);

  // Shared form content
  const formContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Class Topics - Both can edit */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-green-600" />
          Temas aprendidos en clase
          <span className="text-xs text-muted-foreground font-normal">(Profesor/Tutor)</span>
        </Label>
        {isEditable && canEditClassTopics ? (
          <>
            {/* Topic suggestions */}
            {weekTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-xs text-muted-foreground mr-1">Sugerencias:</span>
                {weekTopics.map(topic => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 touch-target"
                    onClick={() => {
                      setClassTopics(prev => 
                        prev ? `${prev}, ${topic.name}` : topic.name
                      );
                    }}
                  >
                    + {topic.name}
                  </Button>
                ))}
              </div>
            )}
            <Textarea
              value={classTopics}
              onChange={(e) => setClassTopics(e.target.value)}
              placeholder="Describe los temas que se enseñaron en clase..."
              rows={3}
              className="resize-none text-base"
            />
          </>
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

      {/* Tutoring Topics - Both can edit */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          Temas practicados en tutorías
          <span className="text-xs text-muted-foreground font-normal">(Profesor/Tutor)</span>
        </Label>
        {isEditable && canEditTutoringTopics ? (
          <Textarea
            value={tutoringTopics}
            onChange={(e) => setTutoringTopics(e.target.value)}
            placeholder="Describe los temas que se practicaron en la tutoría..."
            rows={3}
            className="resize-none text-base"
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
            className="resize-none text-base"
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
            className="resize-none text-base"
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
            className="resize-none text-base"
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
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left px-4 pt-4 pb-2 border-b">
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {dayLabel}
            </DrawerTitle>
            <DrawerDescription>
              {isEditable 
                ? 'Registra el progreso del estudiante para este día' 
                : 'Resumen del progreso del día'}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {formContent}
          </div>
          
          <div className="flex gap-2 p-4 border-t bg-background">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11 touch-target">
              {canSave ? 'Cancelar' : 'Cerrar'}
            </Button>
            {canSave && (
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 h-11 touch-target"
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
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

        <div className="py-4">
          {formContent}
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
