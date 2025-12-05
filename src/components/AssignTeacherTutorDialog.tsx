import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AssignTeacherTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  currentTeacherId?: string;
  currentTutorId?: string;
  currentRoom?: string;
  currentStudentType?: 'presencial' | 'online';
}

export const AssignTeacherTutorDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentTeacherId,
  currentTutorId,
  currentRoom,
  currentStudentType
}: AssignTeacherTutorDialogProps) => {
  const [teacherId, setTeacherId] = useState(currentTeacherId || '');
  const [tutorId, setTutorId] = useState(currentTutorId || '');
  const [room, setRoom] = useState(currentRoom || '');
  const [studentType, setStudentType] = useState<'presencial' | 'online'>(currentStudentType || 'presencial');
  const queryClient = useQueryClient();

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');
      
      if (!teacherRoles || teacherRoles.length === 0) return [];
      
      const teacherIds = teacherRoles.map(r => r.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds);
      
      return data || [];
    }
  });

  const { data: tutors } = useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const { data: tutorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tutor');
      
      if (!tutorRoles || tutorRoles.length === 0) return [];
      
      const tutorIds = tutorRoles.map(r => r.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', tutorIds);
      
      return data || [];
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          teacher_id: teacherId || null,
          tutor_id: tutorId || null,
          room: room || null,
          student_type: studentType
        })
        .eq('user_id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Información del estudiante actualizada exitosamente');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Error al actualizar información del estudiante');
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Manage Student</DialogTitle>
          <DialogDescription className="text-sm">
            Assign teacher, tutor, room and type to {studentName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Tipo de Estudiante</Label>
            <Select value={studentType} onValueChange={(v) => setStudentType(v as 'presencial' | 'online')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">📍 Presencial</SelectItem>
                <SelectItem value="online">🌐 Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tutor</Label>
            <Select value={tutorId} onValueChange={setTutorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tutor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tutors?.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {rooms?.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name} (Capacity: {r.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending} className="w-full sm:w-auto">
            {assignMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};