import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: string;
  criteria_value: number;
  points_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  related_id: string | null;
  created_at: string;
}

export interface UserRanking {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  badge_count: number;
  rank: number;
}

export interface ProgramWeek {
  id: string;
  week_number: number;
  level: string;
  title: string;
  description: string | null;
  is_active: boolean;
}

export interface WeekTopic {
  id: string;
  week_id: string;
  name: string;
  description: string | null;
  order_number: number;
}

export interface TopicMaterial {
  id: string;
  topic_id: string;
  title: string;
  material_type: string;
  content_url: string | null;
  content_text: string | null;
}

export interface StudentTopicProgress {
  id: string;
  student_id: string;
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'needs_review' | 'completed';
  updated_at: string;
}

export const useAllBadges = () => {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('criteria_value');
      if (error) throw error;
      return data as Badge[];
    },
  });
};

export const useUserBadges = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId);
      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!userId,
  });
};

export const useUserTotalPoints = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-total-points', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', userId);
      if (error) throw error;
      return data.reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!userId,
  });
};

export const useUserRankings = () => {
  return useQuery({
    queryKey: ['user-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .order('rank')
        .limit(20);
      if (error) throw error;
      return data as UserRanking[];
    },
  });
};

export const useProgramWeeks = () => {
  return useQuery({
    queryKey: ['program-weeks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_weeks')
        .select('*')
        .order('week_number');
      if (error) throw error;
      return data as ProgramWeek[];
    },
  });
};

export const useWeekTopics = (weekId: string | undefined) => {
  return useQuery({
    queryKey: ['week-topics', weekId],
    queryFn: async () => {
      if (!weekId) return [];
      const { data, error } = await supabase
        .from('week_topics')
        .select('*')
        .eq('week_id', weekId)
        .order('order_number');
      if (error) throw error;
      return data as WeekTopic[];
    },
    enabled: !!weekId,
  });
};

export const useAllWeekTopics = () => {
  return useQuery({
    queryKey: ['all-week-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('week_topics')
        .select('*')
        .order('order_number');
      if (error) throw error;
      return data as WeekTopic[];
    },
  });
};

export const useTopicMaterials = (topicId: string | undefined) => {
  return useQuery({
    queryKey: ['topic-materials', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('topic_materials')
        .select('*')
        .eq('topic_id', topicId);
      if (error) throw error;
      return data as TopicMaterial[];
    },
    enabled: !!topicId,
  });
};

export const useStudentTopicProgress = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-topic-progress', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_topic_progress')
        .select('*')
        .eq('student_id', studentId);
      if (error) throw error;
      return data as StudentTopicProgress[];
    },
    enabled: !!studentId,
  });
};

export const useAddPoints = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, points, reason, relatedId }: { 
      userId: string; 
      points: number; 
      reason: string; 
      relatedId?: string;
    }) => {
      const { error } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          points,
          reason,
          related_id: relatedId || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-total-points', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings'] });
    },
  });
};

export const useAwardBadge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, badgeId }: { userId: string; badgeId: string }) => {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
        });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-badges', variables.userId] });
    },
  });
};

export const useUpdateTopicProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, topicId, status, updatedBy }: { 
      studentId: string; 
      topicId: string; 
      status: 'not_started' | 'in_progress' | 'needs_review' | 'completed';
      updatedBy: string;
    }) => {
      const { error } = await supabase
        .from('student_topic_progress')
        .upsert({
          student_id: studentId,
          topic_id: topicId,
          status,
          updated_by: updatedBy,
        }, {
          onConflict: 'student_id,topic_id',
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-topic-progress', variables.studentId] });
    },
  });
};

// Helper to determine student's current week based on level
export const getCurrentWeekForLevel = (level: string | null): number => {
  if (!level) return 1;
  const levelMap: Record<string, number> = {
    'A1': 1,
    'A2': 3,
    'B1': 5,
    'B2': 7,
    'C1': 9,
    'C2': 11,
  };
  return levelMap[level] || 1;
};

export const getWeekStatus = (
  weekNumber: number, 
  currentWeek: number, 
  completedWeeks: number[]
): 'completed' | 'current' | 'locked' => {
  if (completedWeeks.includes(weekNumber)) return 'completed';
  if (weekNumber === currentWeek) return 'current';
  if (weekNumber < currentWeek) return 'completed';
  return 'locked';
};
