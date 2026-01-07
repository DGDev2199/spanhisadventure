import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmitTaskPayload {
  taskId: string;
  studentNotes?: string;
}

export const useSubmitTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, studentNotes }: SubmitTaskPayload) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Update task status
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'submitted',
          student_notes: studentNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // Award 5 points for submitting task
      await supabase.from('user_points').insert({
        user_id: user.id,
        points: 5,
        reason: 'task_submitted',
        related_id: taskId,
      });

      // Check and award badges
      await checkAndAwardBadges(user.id);

      return { userId: user.id };
    },

    onSuccess: (data) => {
      toast.success('Tarea enviada correctamente (+5 pts)');

      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-submitted-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-total-points', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges', data.userId] });
    },

    onError: (error: any) => {
      toast.error('Error al enviar la tarea');
      console.error(error);
    },
  });
};

// Helper function to check and award badges
async function checkAndAwardBadges(userId: string) {
  // Get user's submitted tasks count
  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId)
    .eq('status', 'submitted');

  // Get user's current badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(userBadges?.map(b => b.badge_id) || []);

  // Get all badges
  const { data: allBadges } = await supabase
    .from('badges')
    .select('*');

  if (!allBadges) return;

  // Check each badge criteria
  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.criteria_type) {
      case 'tasks_completed':
        shouldAward = (taskCount || 0) >= badge.criteria_value;
        break;
      case 'first_task':
        shouldAward = (taskCount || 0) >= 1;
        break;
    }

    if (shouldAward) {
      // Award the badge
      const { error: badgeError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });

      if (!badgeError && badge.points_reward) {
        // Award points for the badge
        await supabase.from('user_points').insert({
          user_id: userId,
          points: badge.points_reward,
          reason: 'badge_earned',
          related_id: badge.id,
        });
        
        toast.success(`¡Insignia desbloqueada: ${badge.name}! (+${badge.points_reward} pts)`);
      }
    }
  }
}
