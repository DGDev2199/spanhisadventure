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

export interface SentenceOrderContent {
  exercises: Array<{
    scrambled_words: string[];
    correct_sentence: string;
    hint?: string;
  }>;
}

export interface MultipleChoiceContent {
  exercises: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }>;
}

export interface FillGapsContent {
  exercises: Array<{
    sentence_with_gap: string;
    options: string[];
    correct_answer: string;
    context?: string;
  }>;
}

export interface ReadingContent {
  exercises: Array<{
    title: string;
    text: string;
    questions: Array<{
      question: string;
      options: string[];
      correct_answer: string;
    }>;
  }>;
}

export type ExerciseType = 'flashcard' | 'conjugation' | 'vocabulary' | 'sentence_order' | 'multiple_choice' | 'fill_gaps' | 'reading';

export type ExerciseContent = 
  | FlashcardContent 
  | ConjugationContent 
  | VocabularyContent 
  | SentenceOrderContent 
  | MultipleChoiceContent 
  | FillGapsContent 
  | ReadingContent;

export interface PracticeExercise {
  id: string;
  title: string;
  exercise_type: ExerciseType;
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

export interface RecommendedPackResult {
  pack_name: string;
  exercises: Array<{
    type: ExerciseType;
    content: ExerciseContent;
  }>;
  total_exercises: number;
  estimated_time_minutes: number;
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
      exercise_type: ExerciseType;
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

export const useGenerateRecommendedPack = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: {
      student_id: string;
      week_number: number;
      class_topics: string;
      vocabulary: string;
      level: string;
    }): Promise<RecommendedPackResult> => {
      const { data, error } = await supabase.functions.invoke('generate-exercises', {
        body: {
          ...params,
          generate_pack: true,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate recommended pack');
      
      return data.pack;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al generar pack recomendado',
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
      exercise_type: ExerciseType;
      topic_context: string;
      vocabulary_context?: string;
      level: string;
      content: ExerciseContent;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('practice_exercises')
        .insert([{
          title: params.title,
          exercise_type: params.exercise_type,
          topic_context: params.topic_context,
          vocabulary_context: params.vocabulary_context,
          level: params.level,
          content: JSON.parse(JSON.stringify(params.content)),
          created_by: params.created_by,
        }])
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
        .insert([{
          assignment_id: params.assignment_id,
          answers: JSON.parse(JSON.stringify(params.answers)),
          score: params.score,
          time_spent_seconds: params.time_spent_seconds,
        }])
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

export interface PackExercise {
  type: ExerciseType;
  content: ExerciseContent;
}

export const useSaveExercisePack = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      pack_name: string;
      exercises: PackExercise[];
      topic_context: string;
      vocabulary_context?: string;
      level: string;
      created_by: string;
    }): Promise<string[]> => {
      const savedIds: string[] = [];

      // Count total individual exercises
      let totalIndividualExercises = 0;
      for (const ex of params.exercises) {
        if (ex.content && 'cards' in ex.content && Array.isArray((ex.content as any).cards)) {
          totalIndividualExercises += (ex.content as any).cards.length;
        } else if (ex.content && 'exercises' in ex.content && Array.isArray((ex.content as any).exercises)) {
          totalIndividualExercises += (ex.content as any).exercises.length;
        }
      }

      for (let i = 0; i < params.exercises.length; i++) {
        const ex = params.exercises[i];
        
        // Skip exercises with invalid content
        if (!ex || !ex.type || !ex.content) {
          console.warn(`Skipping invalid exercise at index ${i}:`, ex);
          continue;
        }

        const { data, error } = await supabase
          .from('practice_exercises')
          .insert({
            title: `${params.pack_name} - ${ex.type} (${i + 1})`,
            exercise_type: ex.type,
            content: JSON.parse(JSON.stringify(ex.content)),
            topic_context: params.topic_context,
            vocabulary_context: params.vocabulary_context,
            level: params.level,
            created_by: params.created_by,
          })
          .select()
          .single();

        if (error) {
          console.error(`Error saving exercise ${i}:`, error);
          throw error;
        }
        
        if (data) {
          savedIds.push(data.id);
        }
      }

      return savedIds;
    },
    onSuccess: (savedIds, variables) => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      
      // Count total individual exercises saved
      let totalItems = 0;
      for (const ex of variables.exercises) {
        if (ex.content && 'cards' in ex.content && Array.isArray((ex.content as any).cards)) {
          totalItems += (ex.content as any).cards.length;
        } else if (ex.content && 'exercises' in ex.content && Array.isArray((ex.content as any).exercises)) {
          totalItems += (ex.content as any).exercises.length;
        }
      }
      
      toast({
        title: 'Pack guardado',
        description: `Se han guardado ${savedIds.length} tipos de ejercicios (${totalItems} ejercicios individuales en total).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al guardar pack',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      // First delete any assignments for this exercise
      await supabase
        .from('practice_assignments')
        .delete()
        .eq('exercise_id', exerciseId);

      // Then delete the exercise itself
      const { error } = await supabase
        .from('practice_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      toast({
        title: 'Ejercicio eliminado',
        description: 'El ejercicio se ha eliminado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
