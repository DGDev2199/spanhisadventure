import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useStudentProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('Error loading student profile:', error);
        throw error;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentTasks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', userId)
        .eq('completed', false)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStudentFeedback = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-feedback', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles!feedback_author_id_fkey(full_name)
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudentAssignments = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('test_assignments')
        .select(`
          *,
          custom_tests (
            id,
            title,
            description,
            due_date,
            time_limit_minutes
          )
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

interface StaffProfileData {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export const useStaffProfile = (staffId: string | null | undefined, type: 'teacher' | 'tutor') => {
  return useQuery({
    queryKey: [`${type}-profile`, staffId],
    queryFn: async (): Promise<StaffProfileData | null> => {
      if (!staffId) return null;
      // Use secure view - email will be null for non-authorized viewers
      const { data, error } = await supabase
        .from('safe_profiles_view' as any)
        .select('id, full_name, email, avatar_url')
        .eq('id', staffId)
        .maybeSingle();
      if (error) {
        console.error(`Error loading ${type} profile:`, error);
        return null;
      }
      return data as unknown as StaffProfileData | null;
    },
    enabled: !!staffId,
    staleTime: 10 * 60 * 1000, // 10 minutes - staff profiles rarely change
  });
};

// Hook to check if student has any completed weeks
export const useHasCompletedWeeks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-completed-weeks', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .select('id')
        .eq('student_id', userId)
        .eq('is_completed', true)
        .limit(1);
      if (error) {
        console.error('Error checking completed weeks:', error);
        return false;
      }
      return data && data.length > 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Update task as completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      
      if (taskError) throw taskError;

      // Award 5 points for completing the task
      const { error: pointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          points: 5,
          reason: 'task_completed',
          related_id: taskId,
        });
      
      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't throw - task was completed, points are bonus
      }

      // Check for first task badge
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('completed', true);

      // If this is the first completed task, award "Primera Tarea" badge
      if (count === 1) {
        // Check if "Primera Tarea" badge exists
        const { data: badge } = await supabase
          .from('badges')
          .select('id, points_reward')
          .eq('name', 'Primera Tarea')
          .single();

        if (badge) {
          // Award the badge
          await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id,
            });

          // Award bonus points for badge
          if (badge.points_reward) {
            await supabase
              .from('user_points')
              .insert({
                user_id: user.id,
                points: badge.points_reward,
                reason: 'badge_earned',
                related_id: badge.id,
              });
          }
        }
      }

      return { taskId, pointsEarned: 5, isFirstTask: count === 1 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['student-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-total-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      
      if (result.isFirstTask) {
        toast.success('🎉 ¡Tarea completada! +5 puntos + Insignia "Primera Tarea"');
      } else {
        toast.success(`✅ ¡Tarea completada! +${result.pointsEarned} puntos`);
      }
    },
    onError: () => {
      toast.error('Error al completar la tarea');
    }
  });
};
