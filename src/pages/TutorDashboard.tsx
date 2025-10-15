import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, GraduationCap, Clock, MessageSquare, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import logo from '@/assets/logo.png';

const TutorDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ 
    student_id: '', 
    topic: '', 
    duration_minutes: '', 
    session_date: '',
    notes: '' 
  });
  const [feedbackForm, setFeedbackForm] = useState({ student_id: '', content: '' });

  const { data: myStudents } = useQuery({
    queryKey: ['tutor-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          profiles!student_profiles_user_id_fkey(full_name, email)
        `)
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: mySessions } = useQuery({
    queryKey: ['tutor-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select(`
          *,
          profiles!tutor_sessions_student_id_fkey(full_name)
        `)
        .eq('tutor_id', user.id)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: typeof sessionForm) => {
      const { error } = await supabase.from('tutor_sessions').insert({
        ...session,
        duration_minutes: parseInt(session.duration_minutes),
        tutor_id: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      setIsSessionDialogOpen(false);
      setSessionForm({ student_id: '', topic: '', duration_minutes: '', session_date: '', notes: '' });
      toast({ title: 'Session recorded successfully' });
    },
    onError: () => {
      toast({ title: 'Error recording session', variant: 'destructive' });
    }
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (feedback: typeof feedbackForm) => {
      const { error } = await supabase.from('feedback').insert({
        ...feedback,
        author_id: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setIsFeedbackDialogOpen(false);
      setFeedbackForm({ student_id: '', content: '' });
      toast({ title: 'Feedback sent successfully' });
    },
    onError: () => {
      toast({ title: 'Error sending feedback', variant: 'destructive' });
    }
  });

  const totalMinutes = mySessions?.reduce((acc: number, session: any) => acc + session.duration_minutes, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-12" />
            <div>
              <h1 className="text-xl font-bold">Spanish Adventure</h1>
              <p className="text-sm text-white/80">Tutor Dashboard</p>
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
          <h2 className="text-3xl font-bold mb-2">Tutor Overview</h2>
          <p className="text-muted-foreground">
            Manage your tutoring sessions and provide personalized support
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{myStudents?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned students</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{mySessions?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {(totalMinutes / 60).toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tutoring time</p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Students</CardTitle>
                <CardDescription>Students assigned to you for tutoring</CardDescription>
              </div>
              <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                    <DialogDescription>Provide feedback to your students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={feedbackForm.student_id}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, student_id: e.target.value })}
                      >
                        <option value="">Select student</option>
                        {myStudents?.map((student: any) => (
                          <option key={student.user_id} value={student.user_id}>
                            {student.profiles?.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Feedback</Label>
                      <Textarea
                        value={feedbackForm.content}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                        placeholder="Write your feedback..."
                      />
                    </div>
                    <Button onClick={() => createFeedbackMutation.mutate(feedbackForm)} className="w-full">
                      Send Feedback
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {myStudents && myStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.profiles?.full_name}</TableCell>
                      <TableCell>{student.profiles?.email}</TableCell>
                      <TableCell>{student.level || 'Not Set'}</TableCell>
                      <TableCell>{student.room || 'Not Assigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No students assigned yet</p>
            )}
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tutoring Sessions</CardTitle>
                <CardDescription>Record and track your tutoring sessions</CardDescription>
              </div>
              <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Tutoring Session</DialogTitle>
                    <DialogDescription>Log a completed tutoring session</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={sessionForm.student_id}
                        onChange={(e) => setSessionForm({ ...sessionForm, student_id: e.target.value })}
                      >
                        <option value="">Select student</option>
                        {myStudents?.map((student: any) => (
                          <option key={student.user_id} value={student.user_id}>
                            {student.profiles?.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Topic</Label>
                      <Input
                        value={sessionForm.topic}
                        onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                        placeholder="Session topic"
                      />
                    </div>
                    <div>
                      <Label>Session Date</Label>
                      <Input
                        type="date"
                        value={sessionForm.session_date}
                        onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={sessionForm.duration_minutes}
                        onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                        placeholder="Session notes..."
                      />
                    </div>
                    <Button onClick={() => createSessionMutation.mutate(sessionForm)} className="w-full">
                      Record Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {mySessions && mySessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mySessions.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.profiles?.full_name}</TableCell>
                      <TableCell>{session.topic}</TableCell>
                      <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                      <TableCell>{session.duration_minutes} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sessions recorded yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TutorDashboard;
