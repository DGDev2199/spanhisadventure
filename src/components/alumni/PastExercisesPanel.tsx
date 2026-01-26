import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, CheckCircle, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface PastExercisesPanelProps {
  studentId: string;
  onRepeatPack?: (packId: string) => void;
}

interface ExercisePack {
  id: string;
  exercises_data: any;
  analysis_summary: string;
  completed_count: number;
  is_completed: boolean;
  completed_at: string | null;
  score: number | null;
  expires_at: string;
  streak_count: number;
  generated_at: string;
}

export function PastExercisesPanel({ studentId, onRepeatPack }: PastExercisesPanelProps) {
  const { data: packs, isLoading } = useQuery({
    queryKey: ['past-exercise-packs', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-daily-exercises', {
        body: {
          student_id: studentId,
          action: 'get_history',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.packs as ExercisePack[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter out today's pack (it's shown in DailyExercisePanel)
  const pastPacks = packs?.filter(pack => {
    const expiresAt = parseISO(pack.expires_at);
    const packDate = new Date(expiresAt);
    packDate.setDate(packDate.getDate() - 1); // Pack date is expires_at - 1
    return !isToday(packDate);
  }) || [];

  const formatPackDate = (expiresAt: string) => {
    const expiresDate = parseISO(expiresAt);
    const packDate = new Date(expiresDate);
    packDate.setDate(packDate.getDate() - 1);

    if (isYesterday(packDate)) {
      return 'Ayer';
    }

    return format(packDate, "EEEE d 'de' MMMM", { locale: es });
  };

  const getPackStatus = (pack: ExercisePack) => {
    const totalExercises = pack.exercises_data?.exercises?.length || 10;
    
    if (pack.is_completed) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        label: `${pack.completed_count}/${totalExercises}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
      };
    }
    
    if (pack.completed_count > 0) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        label: `${pack.completed_count}/${totalExercises}`,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      };
    }

    return {
      icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
      label: `0/${totalExercises}`,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    };
  };

  if (pastPacks.length === 0 && !isLoading) {
    return null; // Don't show the panel if there's no history
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Ejercicios Anteriores
        </CardTitle>
        <CardDescription>
          Tus packs de ejercicios de los últimos días
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pastPacks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aún no tienes ejercicios anteriores.
          </p>
        ) : (
          <div className="space-y-3">
            {pastPacks.slice(0, 7).map((pack) => {
              const status = getPackStatus(pack);
              
              return (
                <div
                  key={pack.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${status.bgColor}`}
                >
                  <div className="flex items-center gap-3">
                    {status.icon}
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {formatPackDate(pack.expires_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pack.analysis_summary?.slice(0, 50)}
                        {(pack.analysis_summary?.length || 0) > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {pack.score !== null && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(pack.score)}%
                      </span>
                    )}
                    {onRepeatPack && !pack.is_completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRepeatPack(pack.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
