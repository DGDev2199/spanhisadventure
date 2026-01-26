import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, LogOut, BookOpen, Trophy } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { DailyExercisePanel, PastExercisesPanel, AlumniStatsCard } from '@/components/alumni';
import { WeeklyProgressGrid } from '@/components/gamification/WeeklyProgressGrid';
import { StudentProgressView } from '@/components/StudentProgressView';
import { LeaderboardCard } from '@/components/gamification/LeaderboardCard';
import logo from '@/assets/logo.png';

const AlumniDashboard = () => {
  const { user, signOut } = useAuth();

  // Fetch student profile
  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['alumni-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user profile for name
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spanish Adventure" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Spanish Adventure</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Alumni
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">
            ¡Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className="text-muted-foreground">
            Continúa practicando tu español con ejercicios personalizados
          </p>
        </div>

        {/* Stats Cards */}
        {user && (
          <AlumniStatsCard 
            studentId={user.id} 
            level={studentProfile?.level || 'A1'} 
          />
        )}

        {/* Daily Exercises - Main Feature */}
        {user && (
          <DailyExercisePanel studentId={user.id} />
        )}

        {/* Past Exercises */}
        {user && (
          <PastExercisesPanel studentId={user.id} />
        )}

        <Separator />

        {/* Weekly Progress Grid (Read-only) */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Mi Progreso Semanal
              </CardTitle>
              <CardDescription>
                Tu historial de semanas completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyProgressGrid 
                studentId={user.id} 
                studentLevel={studentProfile?.level || 'A1'} 
              />
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Ranking
              </CardTitle>
              <CardDescription>
                Compite con otros estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardCard currentUserId={user.id} />
            </CardContent>
          </Card>
        )}

        {/* Student Progress View (Read-only) */}
        {user && (
          <StudentProgressView 
            studentId={user.id} 
            isEditable={false} 
          />
        )}
      </main>
    </div>
  );
};

export default AlumniDashboard;
