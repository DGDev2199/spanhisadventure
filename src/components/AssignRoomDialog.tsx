import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AssignRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  currentRoom?: string;
}

export const AssignRoomDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentRoom
}: AssignRoomDialogProps) => {
  const [room, setRoom] = useState(currentRoom || '');
  const queryClient = useQueryClient();

  const assignRoomMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('student_profiles')
        .update({ room })
        .eq('user_id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Room assigned successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to assign room');
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Room</DialogTitle>
          <DialogDescription>
            Assign a room to {studentName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Room Number</Label>
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
          <Button onClick={() => assignRoomMutation.mutate()} disabled={assignRoomMutation.isPending || !room}>
            {assignRoomMutation.isPending ? 'Assigning...' : 'Assign Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
