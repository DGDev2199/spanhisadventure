import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  // 🧩 Perfil del estudiante (corregido)
  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          user_id,
          teacher_id,
          tutor_id,
          room,
          level,
          status,
          placement_test_status,
          profiles!student_profiles_user_id_profiles_fkey(full_name, email)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // 🧑‍🏫 Perfil del profesor asignado
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile', studentProfile?.teacher_id],
    queryFn: async () => {
      if (!studentProfile?.teacher_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentProfile.teacher_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentProfile?.teacher_id,
  });

  // 🧑‍💼 Perfil del tutor asignado
  const { data: tutorProfile } = useQuery({
    queryKey: ['tutor-profile', studentProfile?.tutor_id],
    queryFn: async () => {
      if (!studentProfile?.tutor_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentProfile.tutor_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentProfile?.tutor_id,
  });

  if (profileLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );

  if (!studentProfile)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <h2 className="text-xl font-semibold">Profile not found</h2>
        <p>Please contact the administration for assistance.</p>
      </div>
    );

  const { profiles } = studentProfile;

  return (
    <div className="p-6 space-y-6">
      {/* 🧍 Información del estudiante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Welcome, {profiles?.full_name || 'Student'}!</CardTitle>
          <CardDescription>Your personal dashboard overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong> {profiles?.email || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {studentProfile.status || 'Pending'}
            </p>
            <p>
              <strong>Level:</strong> {studentProfile.level || 'Not assigned'}
            </p>
            <p>
              <strong>Room:</strong> {studentProfile.room || 'Not assigned'}
            </p>
            <p>
              <strong>Placement Test:</strong> {studentProfile.placement_test_status || 'Not taken'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 👨‍🏫 Profesor asignado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">My Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {profileLoading ? '...' : teacherProfile?.full_name || 'Not Assigned'}
          </div>
        </CardContent>
      </Card>

      {/* 🧑‍💼 Tutor asignado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">My Tutor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {profileLoading ? '...' : tutorProfile?.full_name || 'Not Assigned'}
          </div>
        </CardContent>
      </Card>

      {/* 📋 Acciones */}
      <div className="flex gap-4 pt-4">
        <Button variant="outline">View Progress</Button>
        <Button>Contact Support</Button>
      </div>
    </div>
  );
}
