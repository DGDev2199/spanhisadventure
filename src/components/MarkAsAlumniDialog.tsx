import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, CheckCircle, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MarkAsAlumniDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function MarkAsAlumniDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: MarkAsAlumniDialogProps) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  const markAsAlumniMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          is_alumni: true,
          alumni_since: new Date().toISOString(),
          // Clear teacher and tutor assignments
          teacher_id: null,
          tutor_id: null,
        })
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${studentName} ha sido marcado como Alumni`);
      onOpenChange(false);
      setIsConfirming(false);
    },
    onError: (error) => {
      console.error('Error marking as alumni:', error);
      toast.error('Error al marcar como Alumni');
      setIsConfirming(false);
    },
  });

  const handleConfirm = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    markAsAlumniMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Marcar como Alumni
          </DialogTitle>
          <DialogDescription>
            Esta acción marcará a <strong>{studentName}</strong> como estudiante Alumni.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Un estudiante Alumni ya no está físicamente en la escuela pero puede seguir practicando.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">El estudiante:</p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Podrá seguir practicando con ejercicios diarios personalizados</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Mantendrá acceso a su historial de progreso</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Participará en el ranking con sus ejercicios</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>No tendrá acceso a chat, tareas, o profesor asignado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>No aparecerá en listas de estudiantes activos</span>
              </div>
            </div>
          </div>

          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription>
              La IA analizará las notas de progreso y calificaciones de temas para generar{' '}
              <strong>10 ejercicios diarios personalizados</strong> enfocados en sus debilidades.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setIsConfirming(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={markAsAlumniMutation.isPending}
            variant={isConfirming ? 'destructive' : 'default'}
          >
            {markAsAlumniMutation.isPending
              ? 'Procesando...'
              : isConfirming
              ? 'Confirmar'
              : 'Marcar como Alumni'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
