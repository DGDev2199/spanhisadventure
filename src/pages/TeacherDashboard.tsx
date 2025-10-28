import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, GraduationCap, BookOpen, MessageSquare, Plus, Home, FileCheck, ClipboardList, Calendar, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { AssignRoomDialog } from '@/components/AssignRoomDialog';
import { ReviewPlacementTestDialog } from '@/components/ReviewPlacementTestDialog';
import { CreateTestDialog } from '@/components/CreateTestDialog';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { TestDetailsDialog } from '@/components/TestDetailsDialog';
import { FinalTestReviewDialog } from '@/components/FinalTestReviewDialog';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isReviewTestDialogOpen, setIsReviewTestDialogOpen] = useState(false);
  const [isCreateTestDialogOpen, setIsCreateTestDialogOpen] = useState(false);
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [isFinalReviewOpen, setIsFinalReviewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [finalReviewData, setFinalReviewData] = useState<{ studentId: string; studentName: string; score: number } | null>(null);
  const [taskForm, setTaskForm] = useState({ student_id: '', title: '', description: '', due_date: '' });
  const [feedbackForm, setFeedbackForm] = useState({ student_id: '', content: '' });
  const [taskAttachment, setTaskAttachment] = useState<File | null>(null);
  const [isUploadingTask, setIsUploadingTask] = useState(false);

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

  const { data: myTests } = useQuery({
    queryKey: ['teacher-tests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('custom_tests')
        .select(`
          *,
          test_assignments (
            id,
            student_id,
            status,
            score
          )
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: typeof taskForm) => {
      let attachmentUrl = null;

      // Upload attachment if present
      if (taskAttachment && user?.id) {
        setIsUploadingTask(true);
        const fileExt = taskAttachment.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, taskAttachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
      }

      const { error } = await supabase.from('tasks').insert({
        ...task,
        teacher_id: user?.id,
        attachment_url: attachmentUrl
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tasks'] });
      setIsTaskDialogOpen(false);
      setTaskForm({ student_id: '', title: '', description: '', due_date: '' });
      setTaskAttachment(null);
      setIsUploadingTask(false);
      toast({ title: 'Tarea creada exitosamente' });
    },
    onError: () => {
      setIsUploadingTask(false);
      toast({ title: 'Error al crear la tarea', variant: 'destructive' });
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
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10 sm:h-12" />
            <div>
              <h1 className="text-base sm:text-xl font-bold">Spanish Adventure</h1>
              <p className="text-xs sm:text-sm text-white/80">Teacher Dashboard</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Panel del Profesor</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
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
                    <div>
                      <Label>Archivo Adjunto (Opcional)</Label>
                      <Input
                        type="file"
                        onChange={(e) => setTaskAttachment(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                      {taskAttachment && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Archivo seleccionado: {taskAttachment.name}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => createTaskMutation.mutate(taskForm)} 
                      className="w-full"
                      disabled={isUploadingTask || createTaskMutation.isPending}
                    >
                      {isUploadingTask ? 'Subiendo archivo...' : 'Create Task'}
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

        {/* Custom Tests Table */}
        <Card className="shadow-md mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tests Personalizados</CardTitle>
                <CardDescription>Tests creados y asignados a tus estudiantes</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsCreateTestDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myTests && myTests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Asignado a</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTests.map((test: any) => {
                    const totalAssigned = test.test_assignments?.length || 0;
                    const submitted = test.test_assignments?.filter((a: any) => a.status === 'submitted' || a.status === 'graded').length || 0;
                    const scores = test.test_assignments?.filter((a: any) => a.score !== null).map((a: any) => a.score) || [];
                    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>
                          {test.test_type === 'final' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Final
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Regular
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{test.due_date ? new Date(test.due_date).toLocaleDateString() : 'Sin fecha'}</TableCell>
                        <TableCell>{totalAssigned} estudiante(s)</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            submitted === totalAssigned 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {submitted}/{totalAssigned}
                          </span>
                        </TableCell>
                        <TableCell>
                          {scores.length > 0 ? `${avgScore}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTest(test);
                              setIsTestDetailsOpen(true);
                            }}
                          >
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No has creado tests aún. Haz clic en "Crear Test" para comenzar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <div className="mt-6">
          <WeeklyCalendar />
        </div>
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

      {/* Create Test Dialog */}
      <CreateTestDialog
        open={isCreateTestDialogOpen}
        onOpenChange={setIsCreateTestDialogOpen}
        students={myStudents || []}
      />

      {/* Test Details Dialog */}
      {selectedTest && (
        <TestDetailsDialog
          open={isTestDetailsOpen}
          onOpenChange={setIsTestDetailsOpen}
          testId={selectedTest.id}
          testTitle={selectedTest.title}
          testType={selectedTest.test_type}
          onOpenFinalReview={(studentId, studentName, score) => {
            setFinalReviewData({ studentId, studentName, score });
            setIsTestDetailsOpen(false);
            setIsFinalReviewOpen(true);
          }}
        />
      )}

      {/* Final Test Review Dialog */}
      {finalReviewData && (
        <FinalTestReviewDialog
          open={isFinalReviewOpen}
          onOpenChange={setIsFinalReviewOpen}
          studentId={finalReviewData.studentId}
          studentName={finalReviewData.studentName}
          testScore={finalReviewData.score}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
