import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, BookOpen, Calendar, MessageSquare, Award, CheckCircle, ClipboardList, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { RoleBasedEditProfileDialog } from '@/components/RoleBasedEditProfileDialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { StudentProgressView } from '@/components/StudentProgressView';
import { ClassScheduleDialog } from '@/components/ClassScheduleDialog';
import { TutoringScheduleDialog } from '@/components/TutoringScheduleDialog';
import { NotificationBell } from '@/components/NotificationBell';

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [classScheduleOpen, setClassScheduleOpen] = useState(false);
  const [tutoringScheduleOpen, setTutoringScheduleOpen] = useState(false);

  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error loading student profile:', error);
        throw error;
      }
      console.log('Student profile loaded:', data);
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

  const { data: assignedTests, isLoading: testsLoading } = useQuery({
    queryKey: ['student-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('test_assignments')
        .select(`
          *,
          custom_tests (
            id,
            title,
            description,
            due_date,
            time_limit_minutes
          )
        `)
        .eq('student_id', user.id)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: teacherProfile, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher-profile', studentProfile?.teacher_id],
    queryFn: async () => {
      if (!studentProfile?.teacher_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', studentProfile.teacher_id)
        .maybeSingle();
      if (error) {
        console.error('Error loading teacher profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!studentProfile?.teacher_id
  });

  const { data: tutorProfile, isLoading: tutorLoading } = useQuery({
    queryKey: ['tutor-profile', studentProfile?.tutor_id],
    queryFn: async () => {
      if (!studentProfile?.tutor_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', studentProfile.tutor_id)
        .maybeSingle();
      if (error) {
        console.error('Error loading tutor profile:', error);
        return null;
      }
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
      <header className="border-b bg-gradient-primary shadow-md safe-top">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10 sm:h-12 lg:h-14" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">Spanish Adventure</h1>
              <p className="text-xs sm:text-sm text-white/90 capitalize">{userRole || 'Student'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell />
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 safe-bottom">
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">¡Bienvenido de vuelta!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Continúa tu viaje de aprendizaje del español
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Mi Cuarto</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-primary truncate">
                {profileLoading ? '...' : studentProfile?.room || 'Sin Asignar'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {studentProfile?.room ? 'Tu cuarto asignado' : 'Contacta a tu profesor'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Nivel Actual</CardTitle>
              <Award className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-secondary">
                {profileLoading ? '...' : studentProfile?.level || 'Sin Nivel'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {studentProfile?.level ? 'Nivel actual' : 'Completa el examen'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mi Profesor</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {profileLoading || teacherLoading ? (
                  '...'
                ) : teacherProfile?.full_name || (
                  <span className="text-muted-foreground text-base">No asignado</span>
                )}
              </div>
              {teacherProfile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Profesor Asignado
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {teacherProfile ? 'Tu profesor' : 'Contacta al admin'}
              </p>
              {teacherProfile && user?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setClassScheduleOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Horario de Clases
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mi Tutor</CardTitle>
              <User className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {profileLoading || tutorLoading ? (
                  '...'
                ) : tutorProfile?.full_name || (
                  <span className="text-muted-foreground text-base">No asignado</span>
                )}
              </div>
              {tutorProfile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tutor Asignado
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {tutorProfile ? 'Tu tutor' : 'Contacta al admin'}
              </p>
              {tutorProfile && user?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setTutoringScheduleOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Horario de Tutorías
                </Button>
              )}
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
                Examen de Nivelación
              </CardTitle>
              <CardDescription>
                {studentProfile?.placement_test_status === 'not_started' 
                  ? 'Completa tu examen de nivelación para determinar tu nivel'
                  : studentProfile?.placement_test_status === 'pending'
                  ? 'Tu examen está siendo revisado por el profesor'
                  : 'Examen completado y nivel asignado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentProfile?.placement_test_status === 'not_started' ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Realiza el examen automatizado para comenzar. Tu profesor luego realizará una evaluación oral
                    para finalizar tu nivel.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/placement-test')}
                  >
                    Iniciar Examen de Nivelación
                  </Button>
                </>
              ) : studentProfile?.placement_test_status === 'pending' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Examen enviado exitosamente</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Puntuación Escrita:</span>
                      <span className="font-bold text-lg">{studentProfile?.placement_test_written_score || 0}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tu profesor revisará tus respuestas y programará una evaluación oral pronto.
                    </p>
                  </div>
                  <Button 
                    className="w-full"
                    disabled
                    variant="outline"
                  >
                    Esperando Revisión del Profesor
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Examen completado</span>
                  </div>
                  <div className="space-y-2 bg-accent/10 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Puntuación Escrita:</span>
                      <span className="font-bold text-lg">{studentProfile?.placement_test_written_score || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nivel Asignado:</span>
                      <span className="font-bold text-2xl text-primary">{studentProfile?.level || 'N/A'}</span>
                    </div>
                    {studentProfile?.placement_test_oral_completed && (
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        ✓ Evaluación oral completada
                      </p>
                    )}
                  </div>
                  <Button 
                    className="w-full"
                    disabled
                    variant="secondary"
                  >
                    Test Finalizado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Horario Semanal
              </CardTitle>
              <CardDescription>
                Ve tu horario de clases y actividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta el horario completo más abajo o en la sección de horarios.
              </p>
              <Button variant="outline" className="w-full" onClick={() => {
                document.getElementById('weekly-calendar')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Ver Horario Completo
              </Button>
            </CardContent>
          </Card>

          {/* Student Progress Section */}
          <Card className="shadow-md lg:col-span-2">
            <CardContent className="pt-6">
              {user?.id && (
                <StudentProgressView studentId={user.id} isEditable={false} />
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
                      {task.attachment_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(task.attachment_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Archivo Adjunto
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Tests Section */}
        {assignedTests && assignedTests.length > 0 && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-secondary" />
                Tests Asignados
              </CardTitle>
              <CardDescription>
                Tests creados por tu profesor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedTests.map((assignment: any) => (
                  <div key={assignment.id} className="p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{assignment.custom_tests?.title}</h4>
                        {assignment.custom_tests?.description && (
                          <p className="text-sm text-muted-foreground mt-1">{assignment.custom_tests.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {assignment.custom_tests?.due_date && (
                            <span>Entrega: {new Date(assignment.custom_tests.due_date).toLocaleDateString()}</span>
                          )}
                          {assignment.custom_tests?.time_limit_minutes && (
                            <span>Tiempo: {assignment.custom_tests.time_limit_minutes} min</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {assignment.status === 'assigned' && (
                          <Button size="sm" onClick={() => navigate(`/test/${assignment.id}`)}>
                            Empezar Test
                          </Button>
                        )}
                        {assignment.status === 'in_progress' && (
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/test/${assignment.id}`)}>
                            Continuar
                          </Button>
                        )}
                        {assignment.status === 'submitted' && (
                          <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Pendiente revisión
                            </span>
                            {assignment.score !== null && (
                              <p className="text-2xl font-bold text-primary mt-2">{assignment.score}%</p>
                            )}
                          </div>
                        )}
                        {assignment.status === 'graded' && (
                          <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Calificado
                            </span>
                            <p className="text-3xl font-bold text-primary mt-2">{assignment.score}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Puntos obtenidos</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Calendar */}
        <div id="weekly-calendar" className="mt-6">
          <WeeklyCalendar />
        </div>
      </main>

      <RoleBasedEditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      
      {user?.id && (
        <>
          <ClassScheduleDialog 
            open={classScheduleOpen} 
            onOpenChange={setClassScheduleOpen}
            studentId={user.id}
          />
          <TutoringScheduleDialog 
            open={tutoringScheduleOpen} 
            onOpenChange={setTutoringScheduleOpen}
            studentId={user.id}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;