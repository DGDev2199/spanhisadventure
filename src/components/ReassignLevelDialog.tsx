import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ArrowRight, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReassignLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  currentLevel: string | null;
  currentWeekNumber: number | null;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ALL_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const ReassignLevelDialog = ({
  open,
  onOpenChange,
  studentId,
  currentLevel,
  currentWeekNumber,
}: ReassignLevelDialogProps) => {
  const queryClient = useQueryClient();
  const [newLevel, setNewLevel] = useState(currentLevel || 'A1');
  const [newWeek, setNewWeek] = useState<number>(currentWeekNumber || 1);
  const [deleteProgress, setDeleteProgress] = useState(false);
  const [copyNotes, setCopyNotes] = useState(true);

  // Fetch current week's notes to potentially copy them
  const { data: currentWeekData } = useQuery({
    queryKey: ['current-week-for-reassign', studentId, currentWeekNumber],
    queryFn: async () => {
      if (!currentWeekNumber) return null;
      
      const { data: weekData, error: weekError } = await supabase
        .from('student_progress_weeks')
        .select('*')
        .eq('student_id', studentId)
        .eq('week_number', currentWeekNumber)
        .maybeSingle();
      
      if (weekError) throw weekError;
      if (!weekData) return null;

      const { data: notes, error: notesError } = await supabase
        .from('student_progress_notes')
        .select('*')
        .eq('week_id', weekData.id);
      
      if (notesError) throw notesError;
      
      return { week: weekData, notes: notes || [] };
    },
    enabled: open && !!currentWeekNumber,
  });

  const reassignMutation = useMutation({
    mutationFn: async () => {
      // 1. Update student profile level
      const { error: profileError } = await supabase
        .from('student_profiles')
        .update({ level: newLevel as any })
        .eq('user_id', studentId);
      
      if (profileError) throw profileError;

      // 2. If deleteProgress is true, remove old progress
      if (deleteProgress) {
        // Get all weeks for this student
        const { data: existingWeeks } = await supabase
          .from('student_progress_weeks')
          .select('id')
          .eq('student_id', studentId);
        
        if (existingWeeks && existingWeeks.length > 0) {
          const weekIds = existingWeeks.map(w => w.id);
          
          // Delete notes for those weeks
          await supabase
            .from('student_progress_notes')
            .delete()
            .in('week_id', weekIds);
          
          // Delete the weeks
          await supabase
            .from('student_progress_weeks')
            .delete()
            .eq('student_id', studentId);
          
          // Delete topic progress
          await supabase
            .from('student_topic_progress')
            .delete()
            .eq('student_id', studentId);
        }
      }

      // 3. Check if new week already exists
      const { data: existingNewWeek } = await supabase
        .from('student_progress_weeks')
        .select('id')
        .eq('student_id', studentId)
        .eq('week_number', newWeek)
        .maybeSingle();

      let newWeekId = existingNewWeek?.id;

      // 4. Create new week if it doesn't exist
      if (!newWeekId) {
        const { data: createdWeek, error: createError } = await supabase
          .from('student_progress_weeks')
          .insert({
            student_id: studentId,
            week_number: newWeek,
            week_theme: `Nivel ${newLevel} - Semana ${newWeek}`,
            week_objectives: `Reasignación de nivel a ${newLevel}, comenzando en semana ${newWeek}`,
            is_completed: false,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        newWeekId = createdWeek.id;
      }

      // 5. Copy notes from current week if requested
      if (copyNotes && currentWeekData?.notes && currentWeekData.notes.length > 0 && newWeekId) {
        const notesToCopy = currentWeekData.notes.map(note => ({
          week_id: newWeekId,
          day_type: note.day_type,
          class_topics: note.class_topics,
          tutoring_topics: note.tutoring_topics,
          vocabulary: note.vocabulary,
          achievements: note.achievements,
          challenges: note.challenges,
          notes: note.notes,
          created_by: note.created_by,
        }));

        const { error: copyError } = await supabase
          .from('student_progress_notes')
          .insert(notesToCopy);
        
        if (copyError) {
          console.error('Error copying notes:', copyError);
          // Don't throw, just log - notes copy is optional
        }
      }

      return { newLevel, newWeek };
    },
    onSuccess: ({ newLevel, newWeek }) => {
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-topic-progress', studentId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      toast.success(`Nivel reasignado a ${newLevel}, semana ${newWeek}`);
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Reassign error:', error);
      toast.error(`Error al reasignar: ${error.message}`);
    },
  });

  const handleReassign = () => {
    reassignMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Reasignar Nivel y Semana
          </DialogTitle>
          <DialogDescription>
            Cambia el nivel y la semana inicial del estudiante de forma independiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">Estado actual:</p>
            <p className="font-medium">
              Nivel {currentLevel || 'Sin asignar'} - Semana {currentWeekNumber || 'N/A'}
            </p>
          </div>

          {/* New Level */}
          <div className="space-y-2">
            <Label>Nuevo Nivel</Label>
            <Select value={newLevel} onValueChange={setNewLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona nivel" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level} {level === currentLevel && '(actual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Week */}
          <div className="space-y-2">
            <Label>Nueva Semana Inicial</Label>
            <Select 
              value={newWeek.toString()} 
              onValueChange={(val) => setNewWeek(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona semana" />
              </SelectTrigger>
              <SelectContent>
                {ALL_WEEKS.map(week => (
                  <SelectItem key={week} value={week.toString()}>
                    Semana {week} {week === currentWeekNumber && '(actual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Copy Notes Option */}
          {currentWeekData?.notes && currentWeekData.notes.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Copiar notas</p>
                  <p className="text-xs text-muted-foreground">
                    Transferir {currentWeekData.notes.length} nota(s) a la nueva semana
                  </p>
                </div>
              </div>
              <Switch checked={copyNotes} onCheckedChange={setCopyNotes} />
            </div>
          )}

          {/* Delete Progress Option */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Eliminar progreso anterior</p>
                <p className="text-xs text-muted-foreground">
                  Borra todas las semanas, notas y calibraciones previas
                </p>
              </div>
            </div>
            <Switch checked={deleteProgress} onCheckedChange={setDeleteProgress} />
          </div>

          {deleteProgress && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              ⚠️ Esta acción eliminará permanentemente todo el progreso anterior del estudiante.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReassign} disabled={reassignMutation.isPending}>
            {reassignMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reasignando...
              </>
            ) : (
              'Reasignar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
