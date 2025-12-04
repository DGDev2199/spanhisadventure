import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRole?: string;
  currentUserRole?: string | null;
}

export const ChangeRoleDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentRole,
  currentUserRole
}: ChangeRoleDialogProps) => {
  const [role, setRole] = useState(currentRole || '');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const changeRoleMutation = useMutation({
    mutationFn: async () => {
      // First delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as any }]);
      
      if (error) throw error;

      // If role is student, create/update student profile
      if (role === 'student') {
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingProfile) {
          await supabase
            .from('student_profiles')
            .insert({ user_id: userId });
        }
      } else {
        // If role is NOT student, delete student profile and related data
        // First delete student class schedules
        await supabase
          .from('student_class_schedules')
          .delete()
          .eq('student_id', userId);

        // Delete student schedule assignments
        await supabase
          .from('student_schedule_assignments')
          .delete()
          .eq('student_id', userId);

        // Delete student progress notes (via weeks)
        const { data: weeks } = await supabase
          .from('student_progress_weeks')
          .select('id')
          .eq('student_id', userId);

        if (weeks && weeks.length > 0) {
          const weekIds = weeks.map(w => w.id);
          await supabase
            .from('student_progress_notes')
            .delete()
            .in('week_id', weekIds);
        }

        // Delete student progress weeks
        await supabase
          .from('student_progress_weeks')
          .delete()
          .eq('student_id', userId);

        // Finally delete student profile
        await supabase
          .from('student_profiles')
          .delete()
          .eq('user_id', userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Rol de usuario actualizado exitosamente');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error al actualizar el rol del usuario');
      console.error(error);
    }
  });

  // Determine which roles can be assigned based on current user's role
  const canAssignAdmin = currentUserRole === 'admin';

  // Check if changing from student to non-student role
  const isChangingFromStudent = currentRole === 'student' && role !== 'student' && role !== '';

  const handleUpdateRole = () => {
    if (isChangingFromStudent) {
      setConfirmDialogOpen(true);
    } else {
      changeRoleMutation.mutate();
    }
  };

  const handleConfirmChange = () => {
    setConfirmDialogOpen(false);
    changeRoleMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription className="text-sm">
              Cambiar el rol de {userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar un rol" />
                </SelectTrigger>
                <SelectContent>
                  {canAssignAdmin && (
                    <SelectItem value="admin">Administrador</SelectItem>
                  )}
                  <SelectItem value="coordinator">Coordinador</SelectItem>
                  <SelectItem value="teacher">Profesor</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isChangingFromStudent && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Advertencia: Al cambiar el rol de estudiante a otro rol, se eliminarán todos los datos de estudiante incluyendo:
                </p>
                <ul className="text-sm text-destructive/80 mt-2 list-disc list-inside">
                  <li>Horarios de clases y tutorías</li>
                  <li>Progreso semanal y notas</li>
                  <li>Asignaciones de eventos</li>
                  <li>Perfil de estudiante</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={changeRoleMutation.isPending || !role || role === currentRole} 
              className="w-full sm:w-auto"
              variant={isChangingFromStudent ? "destructive" : "default"}
            >
              {changeRoleMutation.isPending ? 'Actualizando...' : 'Actualizar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for changing from student */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el rol de <strong>{userName}</strong> de <strong>Estudiante</strong> a <strong>{
                role === 'admin' ? 'Administrador' :
                role === 'coordinator' ? 'Coordinador' :
                role === 'teacher' ? 'Profesor' :
                role === 'tutor' ? 'Tutor' : role
              }</strong>.
              <br /><br />
              <span className="text-destructive font-medium">
                Esta acción eliminará permanentemente todos los datos de estudiante asociados a este usuario.
              </span>
              <br /><br />
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cambiar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
