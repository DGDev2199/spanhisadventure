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
        .in('status', ['pending', 'submitted'])
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

// Student submits a task (moves to submitted status, no points yet)
export const useSubmitTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ taskId, studentNotes }: { taskId: string; studentNotes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if task is already submitted
      const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();
      
      if (task?.status !== 'pending') {
        throw new Error('Esta tarea ya fue enviada');
      }
      
      // Update task as submitted
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'submitted',
          student_notes: studentNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('student_id', user.id);
      
      if (taskError) throw taskError;

      // Notify teacher about submitted task
      const { data: taskData } = await supabase
        .from('tasks')
        .select('teacher_id, title')
        .eq('id', taskId)
        .single();
      
      if (taskData?.teacher_id) {
        await supabase.rpc('create_notification', {
          p_user_id: taskData.teacher_id,
          p_title: 'Tarea Enviada para Revisión',
          p_message: `Un estudiante ha enviado la tarea: ${taskData.title}`,
          p_type: 'task',
          p_related_id: taskId
        });
      }

      return { taskId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tasks'] });
      toast.success('📤 Tarea enviada para revisión');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar la tarea');
    }
  });
};

// Teacher reviews and grades a task
export const useReviewTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      score, 
      feedback 
    }: { 
      taskId: string; 
      score: number; 
      feedback?: string 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get task details
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('student_id, title')
        .eq('id', taskId)
        .single();
      
      if (fetchError || !task) throw new Error('Tarea no encontrada');
      
      // Update task as reviewed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'reviewed',
          score,
          teacher_feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
          completed: true
        })
        .eq('id', taskId);
      
      if (taskError) throw taskError;

      // Award points to student if score > 0
      if (score > 0) {
        await supabase
          .from('user_points')
          .insert({
            user_id: task.student_id,
            points: score,
            reason: 'task_graded',
            related_id: taskId,
          });
      }

      // Notify student about the grade
      await supabase.rpc('create_notification', {
        p_user_id: task.student_id,
        p_title: 'Tarea Calificada',
        p_message: `Tu tarea "${task.title}" ha sido calificada: ${score} puntos`,
        p_type: 'task',
        p_related_id: taskId
      });

      // Check for first task badge
      try {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', task.student_id)
          .eq('status', 'reviewed');

        if (count === 1) {
          const { data: badge } = await supabase
            .from('badges')
            .select('id, points_reward')
            .eq('name', 'Primera Tarea')
            .maybeSingle();

          if (badge) {
            const { data: existingBadge } = await supabase
              .from('user_badges')
              .select('id')
              .eq('user_id', task.student_id)
              .eq('badge_id', badge.id)
              .maybeSingle();

            if (!existingBadge) {
              await supabase.from('user_badges').insert({
                user_id: task.student_id,
                badge_id: badge.id,
              });

              if (badge.points_reward) {
                await supabase.from('user_points').insert({
                  user_id: task.student_id,
                  points: badge.points_reward,
                  reason: 'badge_earned',
                  related_id: badge.id,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error in badge logic:', err);
      }

      return { taskId, score };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submitted-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['student-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-total-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings'] });
      toast.success(`✅ Tarea calificada: ${result.score} puntos`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al calificar la tarea');
    }
  });
};

// Hook for teacher to get submitted tasks from their students
export const useTeacherSubmittedTasks = (teacherId: string | undefined) => {
  return useQuery({
    queryKey: ['teacher-submitted-tasks', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      // Fetch tasks without join
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'submitted')
        .order('updated_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      if (!tasksData || tasksData.length === 0) return [];
      
      // Get unique student IDs
      const studentIds = [...new Set(tasksData.map(t => t.student_id).filter(Boolean))];
      
      // Fetch student profiles separately
      const { data: profilesData } = await supabase
        .from('safe_profiles_view')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);
      
      // Merge data
      return tasksData.map(task => ({
        ...task,
        student: profilesData?.find(p => p.id === task.student_id) || null
      }));
    },
    enabled: !!teacherId,
    staleTime: 1 * 60 * 1000,
  });
};
