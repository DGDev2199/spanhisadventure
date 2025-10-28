import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, GraduationCap, BookOpen, MessageSquare, Plus, Home, FileCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { AssignRoomDialog } from '@/components/AssignRoomDialog';
import { ReviewPlacementTestDialog } from '@/components/ReviewPlacementTestDialog';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isReviewTestDialogOpen, setIsReviewTestDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ student_id: '', title: '', description: '', due_date: '' });
  const [feedbackForm, setFeedbackForm] = useState({ student_id: '', content: '' });

  const { data: myStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get student profiles for this teacher
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      
      if (studentError) {
        console.error('Error loading students:', studentError);
        throw studentError;
      }

      // Get profiles for these students
      const userIds = studentData?.map(s => s.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Merge the data
      const studentsWithProfiles = studentData?.map(student => ({
        ...student,
        profiles: profilesData?.find(p => p.id === student.user_id)
      }));

      return studentsWithProfiles;
    }
  });

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
      if (error) throw error;
      return data;
    }
  });

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
          <h2 className="text-3xl font-bold mb-2">Panel del Profesor</h2>
          <p className="text-muted-foreground">
            Gestiona tus estudiantes, asigna tareas y proporciona retroalimentación
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Estudiantes</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {studentsLoading ? '...' : myStudents?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Estudiantes asignados</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <BookOpen className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {myTasks?.filter((t: any) => !t.completed).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {myTasks?.filter((t: any) => t.completed).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Estudiantes</CardTitle>
                <CardDescription>Estudiantes asignados a ti</CardDescription>
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
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myStudents && myStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Test Status</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.profiles?.full_name || (
                          <span className="text-muted-foreground">Sin nombre</span>
                        )}
                      </TableCell>
                      <TableCell>{student.profiles?.email || '-'}</TableCell>
                      <TableCell>
                        {student.level || (
                          <span className="text-muted-foreground">No establecido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.room || (
                          <span className="text-muted-foreground">No asignado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.placement_test_status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : student.placement_test_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {student.placement_test_status === 'completed' 
                            ? 'Completado' 
                            : student.placement_test_status === 'pending'
                            ? 'Pendiente'
                            : 'No iniciado'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsRoomDialogOpen(true);
                            }}
                          >
                            <Home className="h-4 w-4 mr-1" />
                            {student.room ? 'Cambiar' : 'Asignar'}
                          </Button>
                          {student.placement_test_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Student data:', student);
                                setSelectedStudent(student);
                                setIsReviewTestDialogOpen(true);
                              }}
                            >
                              <FileCheck className="h-4 w-4 mr-1" />
                              Revisar Test
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tienes estudiantes asignados aún
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas</CardTitle>
                <CardDescription>Tareas asignadas a tus estudiantes</CardDescription>
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
                    <DialogDescription>Assign a task to your students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={taskForm.student_id}
                        onChange={(e) => setTaskForm({ ...taskForm, student_id: e.target.value })}
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
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        placeholder="Task description"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      />
                    </div>
                    <Button onClick={() => createTaskMutation.mutate(taskForm)} className="w-full">
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
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.profiles?.full_name}</TableCell>
                      <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.completed ? 'Completed' : 'Pending'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No tasks created yet</p>
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

      {/* Review Placement Test Dialog */}
      {selectedStudent && (
        <ReviewPlacementTestDialog
          open={isReviewTestDialogOpen}
          onOpenChange={setIsReviewTestDialogOpen}
          studentId={selectedStudent.user_id}
          studentName={selectedStudent.profiles?.full_name}
          writtenScore={selectedStudent.placement_test_written_score}
          currentLevel={selectedStudent.level}
          studentAnswers={selectedStudent.placement_test_answers}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
