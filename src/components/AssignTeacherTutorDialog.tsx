import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
}

export const AssignTeacherTutorDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentTeacherId,
  currentTutorId,
  currentRoom
}: AssignTeacherTutorDialogProps) => {
  const [teacherId, setTeacherId] = useState(currentTeacherId || '');
  const [tutorId, setTutorId] = useState(currentTutorId || '');
  const [room, setRoom] = useState(currentRoom || '');
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

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          teacher_id: teacherId || null,
          tutor_id: tutorId || null,
          room: room || null
        })
        .eq('user_id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student information updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update student information');
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Student</DialogTitle>
          <DialogDescription>
            Assign teacher, tutor, and room to {studentName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room number (e.g., 101, A-205)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
