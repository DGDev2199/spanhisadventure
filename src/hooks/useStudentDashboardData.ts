import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tasks'] });
      toast.success('Tarea completada!');
    },
    onError: () => {
      toast.error('Error al completar la tarea');
    }
  });
};
