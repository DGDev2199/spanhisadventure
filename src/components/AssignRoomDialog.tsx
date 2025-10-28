import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Assign Room</DialogTitle>
          <DialogDescription className="text-sm">
            Assign a room to {studentName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
            Cancel
          </Button>
          <Button onClick={() => assignRoomMutation.mutate()} disabled={assignRoomMutation.isPending || !room} className="w-full sm:w-auto">
            {assignRoomMutation.isPending ? 'Assigning...' : 'Assign Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
