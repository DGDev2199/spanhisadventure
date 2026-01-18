import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignExercise } from '@/hooks/usePracticeExercises';
import { useToast } from '@/hooks/use-toast';

interface AssignExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseIds?: string[]; // Support for multiple exercises (pack)
  defaultStudentId?: string;
}

export default function AssignExerciseDialog({
  open,
  onClose,
  exerciseId,
  exerciseIds,
  defaultStudentId,
}: AssignExerciseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || '');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const assignMutation = useAssignExercise();

  // Reset selection when dialog opens with a new default
  useEffect(() => {
    if (open && defaultStudentId) {
      setSelectedStudentId(defaultStudentId);
    }
  }, [open, defaultStudentId]);

  // Fetch students that the current user can assign to - FIXED QUERY
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['assignable-students-fixed', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];

      // Build the student profiles query based on role
      let studentProfilesQuery = supabase
        .from('student_profiles')
        .select('user_id, teacher_id, tutor_id')
        .eq('status', 'active');

      if (userRoles.includes('admin') || userRoles.includes('coordinator')) {
        // Admin/coordinator sees all active students
      } else if (userRoles.includes('teacher')) {
        studentProfilesQuery = studentProfilesQuery.eq('teacher_id', user.id);
      } else if (userRoles.includes('tutor')) {
        studentProfilesQuery = studentProfilesQuery.eq('tutor_id', user.id);
      } else {
        return [];
      }

      const { data: studentProfiles, error: spError } = await studentProfilesQuery;

      if (spError) {
        console.error('Error fetching student profiles:', spError);
        return [];
      }

      if (!studentProfiles || studentProfiles.length === 0) {
        return [];
      }

      // Get profiles for these students separately
      const userIds = studentProfiles.map(sp => sp.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Combine the results
      return profiles?.map(p => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
      })) || [];
    },
    enabled: open && !!user,
  });

  const handleAssign = async () => {
    if (!selectedStudentId || !user) return;

    setIsAssigning(true);

    try {
      // Determine which exercise IDs to assign
      const idsToAssign = exerciseIds && exerciseIds.length > 0 
        ? exerciseIds 
        : [exerciseId];

      // Assign all exercises
      for (const id of idsToAssign) {
        await assignMutation.mutateAsync({
          exercise_id: id,
          student_id: selectedStudentId,
          assigned_by: user.id,
        });
      }

      const studentName = students?.find(s => s.id === selectedStudentId)?.name || 'estudiante';
      toast({
        title: 'Ejercicios asignados',
        description: `Se han asignado ${idsToAssign.length} ejercicio(s) a ${studentName}.`,
      });

      onClose();
    } catch (error) {
      console.error('Error assigning exercise:', error);
      toast({
        title: 'Error al asignar',
        description: 'No se pudieron asignar los ejercicios. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const exerciseCount = exerciseIds?.length || 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Asignar {exerciseCount > 1 ? `${exerciseCount} Ejercicios` : 'Ejercicio'}
          </DialogTitle>
          <DialogDescription>
            Selecciona un estudiante para asignarle {exerciseCount > 1 ? 'estos ejercicios' : 'este ejercicio'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Estudiante</Label>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : students && students.length > 0 ? (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No hay estudiantes disponibles para asignar.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedStudentId || isAssigning || !students?.length}
            >
              {isAssigning ? (
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
