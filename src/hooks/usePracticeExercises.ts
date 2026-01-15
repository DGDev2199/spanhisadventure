import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FlashcardContent {
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
  }>;
}

export interface ConjugationContent {
  exercises: Array<{
    verb: string;
    tense: string;
    subject: string;
    correct_answer: string;
    options: string[];
  }>;
}

export interface VocabularyContent {
  exercises: Array<{
    word: string;
    definition: string;
    sentence_blank: string;
    correct_answer: string;
    context_hint?: string;
  }>;
}

export type ExerciseContent = FlashcardContent | ConjugationContent | VocabularyContent;

export interface PracticeExercise {
  id: string;
  title: string;
  exercise_type: 'flashcard' | 'conjugation' | 'vocabulary';
  topic_context: string | null;
  vocabulary_context: string | null;
  level: string | null;
  content: ExerciseContent;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PracticeAssignment {
  id: string;
  exercise_id: string;
  student_id: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  created_at: string;
  exercise?: PracticeExercise;
}

export const usePracticeExercises = (creatorId?: string) => {
  return useQuery({
    queryKey: ['practice-exercises', creatorId],
    queryFn: async () => {
      let query = supabase
        .from('practice_exercises')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (creatorId) {
        query = query.eq('created_by', creatorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PracticeExercise[];
    },
    enabled: true,
  });
};

export const useStudentAssignments = (studentId?: string) => {
  return useQuery({
    queryKey: ['practice-assignments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('practice_assignments')
        .select(`
          *,
          exercise:practice_exercises(*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as (PracticeAssignment & { exercise: PracticeExercise })[];
    },
    enabled: !!studentId,
  });
};

export const useGenerateExercises = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: {
      exercise_type: 'flashcard' | 'conjugation' | 'vocabulary';
      topic: string;
      vocabulary?: string[];
      count: number;
      level: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-exercises', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate exercises');
      
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al generar ejercicios',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useSaveExercise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      exercise_type: 'flashcard' | 'conjugation' | 'vocabulary';
      topic_context: string;
      vocabulary_context?: string;
      level: string;
      content: ExerciseContent;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('practice_exercises')
        .insert({
          title: params.title,
          exercise_type: params.exercise_type,
          topic_context: params.topic_context,
          vocabulary_context: params.vocabulary_context,
          level: params.level,
          content: params.content as unknown as Record<string, unknown>,
          created_by: params.created_by,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      toast({
        title: 'Ejercicio guardado',
        description: 'El ejercicio se ha guardado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAssignExercise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      exercise_id: string;
      student_id: string;
      assigned_by: string;
    }) => {
      const { data, error } = await supabase
        .from('practice_assignments')
        .insert(params)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-assignments'] });
      toast({
        title: 'Ejercicio asignado',
        description: 'El ejercicio se ha asignado al estudiante.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al asignar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: 'pending' | 'in_progress' | 'completed';
      score?: number;
      started_at?: string;
      completed_at?: string;
    }) => {
      const { id, ...updateData } = params;
      const { data, error } = await supabase
        .from('practice_assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-assignments'] });
    },
  });
};

export const useSaveAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      assignment_id: string;
      answers: Record<string, unknown>;
      score: number;
      time_spent_seconds: number;
    }) => {
      const { data, error } = await supabase
        .from('practice_attempts')
        .insert({
          assignment_id: params.assignment_id,
          answers: params.answers as unknown as Record<string, unknown>,
          score: params.score,
          time_spent_seconds: params.time_spent_seconds,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-attempts'] });
    },
  });
};
