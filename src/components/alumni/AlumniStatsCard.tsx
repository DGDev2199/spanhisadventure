import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Flame, Target, Trophy } from 'lucide-react';

interface AlumniStatsCardProps {
  studentId: string;
  level: string;
}

export function AlumniStatsCard({ studentId, level }: AlumniStatsCardProps) {
  // Fetch stats from daily exercise packs
  const { data: stats } = useQuery({
    queryKey: ['alumni-stats', studentId],
    queryFn: async () => {
      const { data: packs, error } = await supabase
        .from('daily_exercise_packs')
        .select('*')
        .eq('student_id', studentId)
        .order('expires_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalPacks = packs?.length || 0;
      const completedPacks = packs?.filter(p => p.is_completed).length || 0;
      const totalExercises = packs?.reduce((sum, p) => sum + (p.completed_count || 0), 0) || 0;
      
      // Calculate current streak
      let currentStreak = 0;
      const sortedPacks = (packs || []).sort((a, b) => 
        new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
      );
      
      for (const pack of sortedPacks) {
        if (pack.is_completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalPacks,
        completedPacks,
        totalExercises,
        currentStreak,
        latestStreak: sortedPacks[0]?.streak_count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const statCards = [
    {
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      label: 'Mi Nivel',
      value: level || 'A1',
      bgColor: 'bg-primary/10',
    },
    {
      icon: <Flame className="h-6 w-6 text-orange-500" />,
      label: 'Racha',
      value: `${stats?.currentStreak || 0} días`,
      bgColor: 'bg-orange-100 dark:bg-orange-950/30',
    },
    {
      icon: <Target className="h-6 w-6 text-green-500" />,
      label: 'Ejercicios',
      value: stats?.totalExercises || 0,
      bgColor: 'bg-green-100 dark:bg-green-950/30',
    },
    {
      icon: <Trophy className="h-6 w-6 text-amber-500" />,
      label: 'Días completados',
      value: stats?.completedPacks || 0,
      bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={stat.bgColor}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            {stat.icon}
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
