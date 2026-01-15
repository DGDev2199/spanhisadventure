import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignExercise } from '@/hooks/usePracticeExercises';

interface AssignExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  defaultStudentId?: string;
}

export default function AssignExerciseDialog({
  open,
  onClose,
  exerciseId,
  defaultStudentId,
}: AssignExerciseDialogProps) {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || '');
  
  const assignMutation = useAssignExercise();

  // Fetch students that the current user can assign to
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['assignable-students', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];

      // Admins and coordinators can assign to any student
      if (userRoles.includes('admin') || userRoles.includes('coordinator')) {
        const { data } = await supabase
          .from('student_profiles')
          .select('user_id, profiles!inner(id, full_name, email)')
          .eq('status', 'active');
        
        return data?.map(s => ({
          id: (s.profiles as any).id,
          name: (s.profiles as any).full_name,
          email: (s.profiles as any).email,
        })) || [];
      }

      // Teachers can assign to their students
      if (userRoles.includes('teacher')) {
        const { data } = await supabase
          .from('student_profiles')
          .select('user_id, profiles!inner(id, full_name, email)')
          .eq('teacher_id', user.id)
          .eq('status', 'active');
        
        return data?.map(s => ({
          id: (s.profiles as any).id,
          name: (s.profiles as any).full_name,
          email: (s.profiles as any).email,
        })) || [];
      }

      // Tutors can assign to their students
      if (userRoles.includes('tutor')) {
        const { data } = await supabase
          .from('student_profiles')
          .select('user_id, profiles!inner(id, full_name, email)')
          .eq('tutor_id', user.id)
          .eq('status', 'active');
        
        return data?.map(s => ({
          id: (s.profiles as any).id,
          name: (s.profiles as any).full_name,
          email: (s.profiles as any).email,
        })) || [];
      }

      return [];
    },
    enabled: open && !!user,
  });

  const handleAssign = async () => {
    if (!selectedStudentId || !user) return;

    try {
      await assignMutation.mutateAsync({
        exercise_id: exerciseId,
        student_id: selectedStudentId,
        assigned_by: user.id,
      });
      onClose();
    } catch (error) {
      console.error('Error assigning exercise:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Asignar Ejercicio
          </DialogTitle>
          <DialogDescription>
            Selecciona un estudiante para asignarle este ejercicio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Estudiante</Label>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedStudentId || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Asignar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
