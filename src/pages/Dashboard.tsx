import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, BookOpen, Calendar, MessageSquare, Award, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['student-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['student-feedback', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles!feedback_author_id_fkey(full_name)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

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
    enabled: !!studentProfile?.teacher_id
  });

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
    enabled: !!studentProfile?.tutor_id
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tasks'] });
      toast.success('Task completed!');
    },
    onError: () => {
      toast.error('Failed to complete task');
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-12" />
            <div>
              <h1 className="text-xl font-bold">Spanish Adventure</h1>
              <p className="text-sm text-white/80 capitalize">{userRole || 'Student'} Dashboard</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's what's happening with your Spanish learning journey.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Level</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {profileLoading ? '...' : studentProfile?.level || 'Not Set'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {studentProfile?.level ? 'Current level' : 'Complete placement test'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Teacher</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profileLoading ? '...' : teacherProfile?.full_name || 'Not Assigned'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {teacherProfile ? 'Your teacher' : 'Contact admin'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Tutor</CardTitle>
              <User className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profileLoading ? '...' : tutorProfile?.full_name || 'Not Assigned'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tutorProfile ? 'Your tutor' : 'Contact admin'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <BookOpen className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasksLoading ? '...' : tasks?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tasks && tasks.length > 0 ? 'Pending tasks' : 'No pending tasks'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Placement Test
              </CardTitle>
              <CardDescription>
                Complete your placement test to determine your level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Take the automated test to get started. Your teacher will then conduct an oral assessment
                to finalize your level.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/placement-test')}
                disabled={studentProfile?.placement_test_status !== 'not_started'}
              >
                {studentProfile?.placement_test_status === 'not_started' 
                  ? 'Start Placement Test' 
                  : studentProfile?.placement_test_status === 'pending'
                  ? 'Test Pending Review'
                  : 'Test Completed'}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                View your class schedule and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                No schedule available yet. Check back later or contact your administrator.
              </p>
              <Button variant="outline" disabled className="w-full">
                No Schedule Available
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                Recent Feedback
              </CardTitle>
              <CardDescription>
                See what your teachers and tutors are saying
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : feedback && feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((item: any) => (
                    <div key={item.id} className="border-l-2 border-primary pl-3">
                      <p className="text-sm font-medium">{item.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No feedback yet. Keep up the good work!
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                My Profile
              </CardTitle>
              <CardDescription>
                View and update your information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setEditProfileOpen(true)}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        {tasks && tasks.length > 0 && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Tasks
              </CardTitle>
              <CardDescription>
                Complete your assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => completeTaskMutation.mutate(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </div>
  );
};

export default Dashboard;