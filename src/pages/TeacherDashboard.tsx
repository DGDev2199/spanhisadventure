import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Plus,
  Home
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { AssignRoomDialog } from '@/components/AssignRoomDialog';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    student_id: '',
    title: '',
    description: '',
    due_date: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    student_id: '',
    content: ''
  });

  // 🔹 Obtener los estudiantes asignados a este profesor
  const { data: myStudents } = useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          profiles!student_profiles_user_id_profiles_fkey(full_name, email)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      return data;
    }
  });

  // 🔹 Obtener tareas creadas por este profesor
  const { data: myTasks } = useQuery({
    queryKey: ['teacher-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_student_id_fkey(full_name)
        `)
        .eq('teacher_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      return data;
    }
  });

  // 🔹 Crear una nueva tarea
  const createTaskMutation = useMutation({
    mutationFn: async (task: typeof taskForm) => {
      const { error } = await supabase.from('tasks').insert({
        ...task,
        teacher_id: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tasks'] });
      setIsTaskDialogOpen(false);
      setTaskForm({ student_id: '', title: '', description: '', due_date: '' });
      toast({ title: 'Task created successfully' });
    },
    onError: () => {
      toast({ title: 'Error creating task', variant: 'destructive' });
    }
  });

  // 🔹 Crear feedback
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-12" />
            <div>
              <h1 className="text-xl font-bold">Spanish Adventure</h1>
              <p className="text-sm text-white/80">Teacher Dashboard</p>
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
          <h2 className="text-3xl font-bold mb-2">Teacher Overview</h2>
          <p className="text-muted-foreground">
            Manage your students, assign tasks, and provide feedback
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
              <div className="text-2xl font-bold text-primary">
                {myStudents?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned students
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <BookOpen className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {myTasks?.filter((t: any) => !t.completed).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending completion
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {myTasks?.filter((t: any) => t.completed).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tasks done</p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Students</CardTitle>
                <CardDescription>Students assigned to you</CardDescription>
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
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            student_id: e.target.value
                          })
                        }
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
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            content: e.target.value
                          })
                        }
                        placeholder="Write your feedback..."
                      />
                    </div>
                    <Button
                      onClick={() => createFeedbackMutation.mutate(feedbackForm)}
                      className="w-full"
                    >
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
                    <TableHead>Test Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.profiles?.full_name}
                      </TableCell>
                      <TableCell>{student.profiles?.email}</TableCell>
                      <TableCell>{student.level || 'Not Set'}</TableCell>
                      <TableCell>{student.room || 'Not Assigned'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.placement_test_status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {student.placement_test_status || 'not_started'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsRoomDialogOpen(true);
                          }}
                        >
                          <Home className="h-4 w-4 mr-1" />
                          {student.room ? 'Change Room' : 'Assign Room'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No students assigned yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Tasks assigned to your students
                </CardDescription>
              </div>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Assign a task to your students
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={taskForm.student_id}
                        onChange={(e) =>
                          setTaskForm({
                            ...taskForm,
                            student_id: e.target.value
                          })
                        }
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
                      <Label>Title</Label>
                      <Input
                        value={taskForm.title}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, title: e.target.value })
                        }
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={taskForm.description}
                        onChange={(e) =>
                          setTaskForm({
                            ...taskForm,
                            description: e.target.value
                          })
                        }
                        placeholder="Task description"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) =>
                          setTaskForm({
                            ...taskForm,
                            due_date: e.target.value
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={() => createTaskMutation.mutate(taskForm)}
                      className="w-full"
                    >
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks && myTasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTasks.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>{task.profiles?.full_name}</TableCell>
                      <TableCell>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : 'No due date'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            task.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {task.completed ? 'Completed' : 'Pending'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tasks created yet
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Assign Room Dialog */}
      {selectedStudent && (
        <AssignRoomDialog
          open={isRoomDialogOpen}
          onOpenChange={setIsRoomDialogOpen}
          studentId={selectedStudent.user_id}
          studentName={selectedStudent.profiles?.full_name}
          currentRoom={selectedStudent.room}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
