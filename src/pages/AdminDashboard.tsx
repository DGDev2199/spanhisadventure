import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LogOut, Users, GraduationCap, UserCheck, BookOpen, Settings, Home, Calendar, Plus, FileCheck, Clock, TrendingUp, Trash2, RotateCcw, UsersRound } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { AssignTeacherTutorDialog } from '@/components/AssignTeacherTutorDialog';
import { ChangeRoleDialog } from '@/components/ChangeRoleDialog';
import { ManageRoomsDialog } from '@/components/ManageRoomsDialog';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { CreateScheduleEventDialog } from '@/components/CreateScheduleEventDialog';
import { ManagePlacementTestDialog } from '@/components/ManagePlacementTestDialog';
import { ManageStaffHoursDialog } from '@/components/ManageStaffHoursDialog';
import { StudentProgressView } from '@/components/StudentProgressView';
import { ManageStudentScheduleDialog } from '@/components/ManageStudentScheduleDialog';
import { AdminAssignMultipleSchedulesDialog } from '@/components/AdminAssignMultipleSchedulesDialog';
import { NotificationBell } from '@/components/NotificationBell';
import { RoleBasedEditProfileDialog } from '@/components/RoleBasedEditProfileDialog';
import { AdminApprovalPanel } from '@/components/AdminApprovalPanel';
import { VideoCallHistoryAdmin } from '@/components/VideoCallHistoryAdmin';
import { EarningsPanel } from '@/components/EarningsPanel';
import { ModalityRequestsPanel } from '@/components/ModalityRequestsPanel';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { signOut, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Feature flags
  const isCommunityEnabled = useFeatureFlag('community_feed');
  const isEarningsEnabled = useFeatureFlag('earnings_panel');
  const isModalityRequestsEnabled = useFeatureFlag('modality_requests');
  const isVideoCallsEnabled = useFeatureFlag('video_calls');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [placementTestDialogOpen, setPlacementTestDialogOpen] = useState(false);
  const [staffHoursDialogOpen, setStaffHoursDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressStudent, setProgressStudent] = useState<{ id: string; name: string } | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleStudent, setScheduleStudent] = useState<{ id: string; name: string } | null>(null);
  const [resetScheduleDialogOpen, setResetScheduleDialogOpen] = useState(false);
  const [assignMultipleSchedulesOpen, setAssignMultipleSchedulesOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [students, teachers, tutors, tasks] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
        supabase.from('tasks').select('*', { count: 'exact', head: true })
      ]);
      return {
        students: students.count || 0,
        teachers: teachers.count || 0,
        tutors: tutors.count || 0,
        tasks: tasks.count || 0
      };
    }
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      // Get student profiles
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (studentError) {
        console.error('Error loading students:', studentError);
        throw studentError;
      }

      // Get profiles for these students
      const userIds = studentData?.map(s => s.user_id) || [];
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

      console.log('Students loaded:', studentsWithProfiles);
      return studentsWithProfiles;
    }
  });

  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Error loading users:', profilesError);
        throw profilesError;
      }

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        throw rolesError;
      }

      // Merge the data
      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(r => r.user_id === profile.id) || []
      }));

      console.log('Users loaded:', usersWithRoles);
      return usersWithRoles;
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🗑️ Starting user deletion for:', userId);
      
      // Delete in order: student_class_schedules, student_progress_notes, student_progress_weeks, student_profiles, user_roles, profiles
      
      // 1. Delete student class schedules
      await supabase
        .from('student_class_schedules')
        .delete()
        .eq('student_id', userId);
      
      // 2. Delete student progress notes (via weeks)
      const { data: weeks } = await supabase
        .from('student_progress_weeks')
        .select('id')
        .eq('student_id', userId);
      
      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id);
        await supabase
          .from('student_progress_notes')
          .delete()
          .in('week_id', weekIds);
      }
      
      // 3. Delete student progress weeks
      await supabase
        .from('student_progress_weeks')
        .delete()
        .eq('student_id', userId);
      
      // 4. Delete student profile
      await supabase
        .from('student_profiles')
        .delete()
        .eq('user_id', userId);
      
      // 5. Delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      
      // 6. Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // 7. Delete from auth.users using edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error deleting user from auth');
      }
      
      console.log('✅ User deleted successfully from all tables including auth');
      return userId;
    },
    onSuccess: (userId) => {
      toast.success('Usuario eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      console.error('❌ Error deleting user:', error);
      toast.error('Error al eliminar usuario: ' + error.message);
    }
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Reset schedules mutation
  const resetSchedulesMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Resetting all schedules...');
      
      // Delete all schedule events
      const { error: eventsError } = await supabase
        .from('schedule_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (eventsError) throw eventsError;
      
      // Delete all student class schedules
      const { error: classError } = await supabase
        .from('student_class_schedules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (classError) throw classError;
      
      console.log('✅ All schedules reset successfully');
    },
    onSuccess: () => {
      toast.success('Todos los horarios han sido reiniciados');
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      queryClient.invalidateQueries({ queryKey: ['student-class-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['tutoring-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours'] });
      setResetScheduleDialogOpen(false);
    },
    onError: (error) => {
      console.error('❌ Error resetting schedules:', error);
      toast.error('Error al reiniciar horarios: ' + error.message);
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
              <p className="text-xs sm:text-sm text-white/90">{userRole === 'coordinator' ? 'Coordinador' : 'Administrador'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isCommunityEnabled && (
              <Button
                onClick={() => navigate('/feed')}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
              >
                <UsersRound className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Comunidad</span>
              </Button>
            )}
            <NotificationBell />
            <Button
              onClick={() => setEditProfileOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
            >
              <Settings className="h-4 w-4" />
            </Button>
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
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Admin Overview</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage students, teachers, tutors, and all platform activities
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setAssignMultipleSchedulesOpen(true)} variant="default" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Asignar Horarios Múltiples</span>
              <span className="sm:hidden">Horarios</span>
            </Button>
            <Button onClick={() => setPlacementTestDialogOpen(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <FileCheck className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gestionar Test</span>
              <span className="sm:hidden">Test</span>
            </Button>
            <Button onClick={() => setRoomsDialogOpen(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gestionar Habitaciones</span>
              <span className="sm:hidden">Habitaciones</span>
            </Button>
            <Button onClick={() => setStaffHoursDialogOpen(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Clock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gestionar Horas</span>
              <span className="sm:hidden">Horas</span>
            </Button>
            {userRole === 'admin' && (
              <Button onClick={() => setResetScheduleDialogOpen(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm border-destructive text-destructive hover:bg-destructive/10">
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reiniciar Horarios</span>
                <span className="sm:hidden">Reiniciar</span>
              </Button>
            )}
            <Button onClick={() => setCreateEventDialogOpen(true)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Crear Evento</span>
              <span className="sm:hidden">Evento</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {statsLoading ? '...' : stats?.students || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active learners
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {statsLoading ? '...' : stats?.teachers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active teachers
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tutors</CardTitle>
              <UserCheck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {statsLoading ? '...' : stats?.tutors || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active tutors
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.tasks || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned tasks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Panel */}
        <div className="mb-8">
          <AdminApprovalPanel />
        </div>

        {/* Modality Requests Panel */}
        <div className="mb-8">
          <ModalityRequestsPanel />
        </div>

        {/* Video Call History */}
        <div className="mb-8">
          <VideoCallHistoryAdmin />
        </div>

        {/* Earnings Panel */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Ingresos de la Plataforma
              </CardTitle>
              <CardDescription>
                Resumen de pagos de clases online (15% comisión)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EarningsPanel />
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Students</CardTitle>
            <CardDescription className="text-sm">Manage student profiles and assignments</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : studentsError ? (
              <div className="text-center text-destructive py-8">
                Error loading students. Please check console for details.
              </div>
            ) : students && students.length > 0 ? (
              <>
                {/* Mobile: Card View */}
                {isMobile ? (
                  <div className="space-y-4 px-4">
                    {students.map((student: any) => (
                      <Card key={student.id} className="shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-base">{student.profiles?.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{student.profiles?.email}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Nivel:</span>
                              <p className="font-medium">{student.level || 'Not Set'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                student.student_type === 'online' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {student.student_type === 'online' ? '🌐 Online' : '📍 Presencial'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Habitación:</span>
                              <p className="font-medium">{student.room || 'Not Assigned'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {student.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Test:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                student.placement_test_status === 'completed' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : student.placement_test_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {student.placement_test_status}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setProgressStudent({ id: student.user_id, name: student.profiles?.full_name });
                                setProgressDialogOpen(true);
                              }}
                              className="flex-1 min-w-[100px]"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Progreso
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setScheduleStudent({ id: student.user_id, name: student.profiles?.full_name });
                                setScheduleDialogOpen(true);
                              }}
                              className="flex-1 min-w-[100px]"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Horario
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student);
                                setAssignDialogOpen(true);
                              }}
                              className="flex-1 min-w-[100px]"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Desktop: Table View */
                  <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Level</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Room</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Test Status</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-sm">{student.profiles?.full_name}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{student.profiles?.email}</TableCell>
                        <TableCell className="text-sm">{student.level || 'Not Set'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.student_type === 'online' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {student.student_type === 'online' ? '🌐 Online' : '📍 Presencial'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{student.room || 'Not Assigned'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.placement_test_status === 'completed' 
                              ? 'bg-blue-100 text-blue-700' 
                              : student.placement_test_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {student.placement_test_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setProgressStudent({ id: student.user_id, name: student.profiles?.full_name });
                                setProgressDialogOpen(true);
                              }}
                            >
                              <TrendingUp className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Progreso</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setScheduleStudent({ id: student.user_id, name: student.profiles?.full_name });
                                setScheduleDialogOpen(true);
                              }}
                            >
                              <Calendar className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Horario</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student);
                                setAssignDialogOpen(true);
                              }}
                            >
                              <Settings className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Assign</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No students found</p>
            )}
          </CardContent>
        </Card>

        {/* All Users Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">All Users</CardTitle>
            <CardDescription className="text-sm">View all platform users and their roles</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : usersError ? (
              <div className="text-center text-destructive py-8">
                Error loading users. Please check console for details.
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Nationality</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Age</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: any) => {
                      const userCurrentRole = user.user_roles?.[0]?.role;
                      const isStaff = userCurrentRole === 'teacher' || userCurrentRole === 'tutor';
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm">{user.full_name}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">{user.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                              {userCurrentRole || 'No Role'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isStaff ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.staff_type === 'online' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {user.staff_type === 'online' ? '🌐 Online' : '📍 Presencial'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm hidden md:table-cell">{user.nationality || 'N/A'}</TableCell>
                          <TableCell className="text-sm hidden lg:table-cell">{user.age || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRoleDialogOpen(true);
                                }}
                              >
                                <Settings className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Change</span>
                              </Button>
                              {userRole === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (window.confirm(`¿Estás seguro de eliminar a ${user.full_name}? Esta acción no se puede deshacer y eliminará:\n\n- Perfil del usuario\n- Todos sus roles\n- Datos de estudiante (si aplica)\n- Todas sus asignaciones\n\n¿Continuar?`)) {
                                      handleDeleteUser(user.id, user.full_name);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <div className="mt-6">
          <WeeklyCalendar canEdit={true} />
        </div>
      </main>

      {/* Dialogs */}
      {selectedStudent && (
        <AssignTeacherTutorDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          studentId={selectedStudent.user_id}
          studentName={selectedStudent.profiles?.full_name}
          currentTeacherId={selectedStudent.teacher_id}
          currentTutorId={selectedStudent.tutor_id}
          currentRoom={selectedStudent.room}
          currentStudentType={selectedStudent.student_type}
        />
      )}

      {selectedUser && (
        <ChangeRoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          currentRole={selectedUser.user_roles?.[0]?.role}
          currentUserRole={userRole}
          currentStaffType={selectedUser.staff_type}
        />
      )}

      <ManageRoomsDialog
        open={roomsDialogOpen}
        onOpenChange={setRoomsDialogOpen}
      />

      <CreateScheduleEventDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
      />

      <ManagePlacementTestDialog
        open={placementTestDialogOpen}
        onOpenChange={setPlacementTestDialogOpen}
      />

      <ManageStaffHoursDialog
        open={staffHoursDialogOpen}
        onOpenChange={setStaffHoursDialogOpen}
      />

      {/* Progress Dialog */}
      {progressStudent && (
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Progreso del Estudiante - {progressStudent.name}</DialogTitle>
              <DialogDescription>
                Seguimiento semanal del aprendizaje y desarrollo
              </DialogDescription>
            </DialogHeader>
            <StudentProgressView studentId={progressStudent.id} isEditable={true} />
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule Dialog */}
      {scheduleStudent && (
        <ManageStudentScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          studentId={scheduleStudent.id}
          studentName={scheduleStudent.name}
        />
      )}

      {/* Reset Schedules Confirmation Dialog */}
      <AlertDialog open={resetScheduleDialogOpen} onOpenChange={setResetScheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar todos los horarios?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará TODOS los eventos del horario semanal y TODOS los horarios de clases y tutorías asignados a estudiantes.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetSchedulesMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resetSchedulesMutation.isPending}
            >
              {resetSchedulesMutation.isPending ? 'Reiniciando...' : 'Sí, reiniciar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Assign Multiple Schedules Dialog */}
      <AdminAssignMultipleSchedulesDialog
        open={assignMultipleSchedulesOpen}
        onOpenChange={setAssignMultipleSchedulesOpen}
      />

      {/* Edit Profile Dialog */}
      <RoleBasedEditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />
    </div>
  );
};

export default AdminDashboard;
