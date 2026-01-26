import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Play, RefreshCw, Sparkles, CheckCircle, Target } from 'lucide-react';
import { toast } from 'sonner';
import { DailyExerciseView } from './DailyExerciseView';

interface DailyExercisePanelProps {
  studentId: string;
}

interface ExercisePack {
  id: string;
  student_id: string;
  exercises_data: {
    analysis_summary?: string;
    exercises?: Array<{
      type: string;
      content: any;
    }>;
  };
  analysis_summary: string;
  completed_count: number;
  is_completed: boolean;
  completed_at: string | null;
  score: number | null;
  expires_at: string;
  streak_count: number;
  generated_at: string;
}

export function DailyExercisePanel({ studentId }: DailyExercisePanelProps) {
  const queryClient = useQueryClient();
  const [showExercises, setShowExercises] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Fetch or create today's pack
  const { data: packData, isLoading, refetch } = useQuery({
    queryKey: ['daily-exercise-pack', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-daily-exercises', {
        body: {
          student_id: studentId,
          action: 'get_or_create',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as { pack: ExercisePack; is_new: boolean };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const pack = packData?.pack;
  const exercises = pack?.exercises_data?.exercises || [];
  const totalExercises = exercises.length || 10;
  const completedCount = pack?.completed_count || 0;
  const progressPercentage = (completedCount / totalExercises) * 100;

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ completedCount, score, isCompleted }: { 
      completedCount: number; 
      score?: number; 
      isCompleted?: boolean 
    }) => {
      const { data, error } = await supabase
        .from('daily_exercise_packs')
        .update({
          completed_count: completedCount,
          score: score,
          is_completed: isCompleted || false,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', pack?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-exercise-pack', studentId] });
    },
  });

  const handleExerciseComplete = (index: number, correct: boolean) => {
    const newCompletedCount = Math.max(completedCount, index + 1);
    const isLastExercise = index === totalExercises - 1;
    
    updateProgressMutation.mutate({
      completedCount: newCompletedCount,
      isCompleted: isLastExercise,
    });

    if (isLastExercise) {
      toast.success('¡Felicidades! Completaste todos los ejercicios de hoy');
      setShowExercises(false);
    } else {
      setCurrentExerciseIndex(index + 1);
    }
  };

  const handleStartExercises = () => {
    setCurrentExerciseIndex(completedCount);
    setShowExercises(true);
  };

  if (showExercises && pack) {
    return (
      <DailyExerciseView
        pack={pack}
        currentIndex={currentExerciseIndex}
        onExerciseComplete={handleExerciseComplete}
        onClose={() => setShowExercises(false)}
      />
    );
  }

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Ejercicios de Hoy
          {pack?.is_completed && (
            <span className="ml-auto text-sm font-normal text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Completados
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {pack?.analysis_summary || 'Ejercicios personalizados basados en tu progreso'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generando tus ejercicios personalizados...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{completedCount}/{totalExercises} ejercicios</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {pack?.streak_count > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  ¡Racha de {pack.streak_count} días! Sigue así 🔥
                </span>
              </div>
            )}

            {pack?.is_completed ? (
              <div className="text-center py-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <p className="text-sm text-muted-foreground">
                  ¡Excelente trabajo! Vuelve mañana para nuevos ejercicios.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleStartExercises()}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Repasar ejercicios
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartExercises}
                className="w-full"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                {completedCount > 0 ? 'Continuar Ejercicios' : 'Comenzar Ejercicios'}
              </Button>
            )}

            {exercises.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                      index < completedCount
                        ? 'bg-green-500 text-white'
                        : index === completedCount
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
