import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      toast.success('User role updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update user role');
      console.error(error);
    }
  });

  // Determine which roles can be assigned based on current user's role
  const canAssignAdmin = currentUserRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Change User Role</DialogTitle>
          <DialogDescription className="text-sm">
            Change the role for {userName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {canAssignAdmin && (
                  <SelectItem value="admin">Admin</SelectItem>
                )}
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={() => changeRoleMutation.mutate()} disabled={changeRoleMutation.isPending || !role} className="w-full sm:w-auto">
            {changeRoleMutation.isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
