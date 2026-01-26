import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import TutorDashboard from '@/pages/TutorDashboard';
import AlumniDashboard from '@/pages/AlumniDashboard';

const DashboardRouter = () => {
  const { user, userRole, loading } = useAuth();

  // Check if student is alumni
  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile-alumni-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('student_profiles')
        .select('is_alumni')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching student profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user && userRole === 'student',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (loading || (userRole === 'student' && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole === 'admin' || userRole === 'coordinator') {
    return <AdminDashboard />;
  }

  if (userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  if (userRole === 'tutor') {
    return <TutorDashboard />;
  }

  if (userRole === 'student') {
    // Check if student is alumni
    if (studentProfile?.is_alumni) {
      return <AlumniDashboard />;
    }
    return <Dashboard />;
  }

  return <Navigate to="/auth" replace />;
};

export default DashboardRouter;
