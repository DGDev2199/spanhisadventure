import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, GraduationCap, UserCheck, BookOpen, Settings, Home, Calendar, Plus, FileCheck, Clock, TrendingUp, Trash2, RotateCcw, UsersRound, Trophy } from 'lucide-react';
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
import { ManageCurriculumDialog } from '@/components/ManageCurriculumDialog';
import { ManageAchievementsDialog } from '@/components/ManageAchievementsDialog';
import { ManualLevelAssignDialog } from '@/components/ManualLevelAssignDialog';
import { WeeklyProgressGrid } from '@/components/gamification/WeeklyProgressGrid';
import { CreateAchievementDialog } from '@/components/CreateAchievementDialog';
import { AwardAchievementDialog } from '@/components/AwardAchievementDialog';
import { useStudentAchievements } from '@/hooks/useGamification';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { TutorialLauncher } from '@/components/tutorial';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Student Achievements Tab Component
const StudentAchievementsTab = ({ 
  studentId, 
  onCreateAchievement,
  onAwardAchievement 
}: { 
  studentId: string; 
  onCreateAchievement: () => void;
  onAwardAchievement: () => void;
}) => {
  const { data: achievements = [], isLoading } = useStudentAchievements(studentId);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Logros del estudiante
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCreateAchievement}>
            <Plus className="h-4 w-4 mr-1" />
            Crear
          </Button>
          <Button size="sm" onClick={onAwardAchievement}>
            <Trophy className="h-4 w-4 mr-1" />
            Otorgar
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
      ) : achievements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>Este estudiante aún no tiene logros</p>
          <p className="text-sm mt-1">Otorga un logro para motivarlo</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((sa) => sa.achievement && (
            <div 
              key={sa.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
            >
              <span className="text-2xl">{sa.achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{sa.achievement.name}</span>
                  {sa.achievement.points_reward > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{sa.achievement.points_reward} pts
                    </Badge>
                  )}
                </div>
                {sa.notes && (
                  <p className="text-sm text-muted-foreground mt-1">"{sa.notes}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Por: {(sa.awarder as any)?.full_name || 'Staff'} • {new Date(sa.awarded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
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
  const [progressStudent, setProgressStudent] = useState<{ id: string; name: string; level: string | null } | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleStudent, setScheduleStudent] = useState<{ id: string; name: string } | null>(null);
  const [resetScheduleDialogOpen, setResetScheduleDialogOpen] = useState(false);
  const [assignMultipleSchedulesOpen, setAssignMultipleSchedulesOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [curriculumDialogOpen, setCurriculumDialogOpen] = useState(false);
  const [achievementsDialogOpen, setAchievementsDialogOpen] = useState(false);
  const [manualLevelDialogOpen, setManualLevelDialogOpen] = useState(false);
  const [manualLevelStudent, setManualLevelStudent] = useState<any>(null);
  const [createAchievementOpen, setCreateAchievementOpen] = useState(false);
  const [awardAchievementOpen, setAwardAchievementOpen] = useState(false);

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
                <span className="hidden sm:inline">{t('navigation.community')}</span>
              </Button>
            )}
            <TutorialLauncher />
            <LanguageSwitcher />
            <NotificationBell data-tutorial="notifications" />
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
              <span className="hidden sm:inline">{t('navigation.logout')}</span>
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
          {/* Admin Action Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 w-full">
            <Button 
              onClick={() => setAssignMultipleSchedulesOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="assign-schedules-btn"
            >
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-primary">
                Asignar Horarios
              </span>
            </Button>
            
            <Button 
              onClick={() => setPlacementTestDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-secondary/30 hover:bg-secondary/50 border-secondary/40 hover:border-secondary/60 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="placement-test-btn"
            >
              <FileCheck className="h-6 w-6 sm:h-7 sm:w-7 text-secondary-foreground group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-secondary-foreground">
                Gestionar Test
              </span>
            </Button>
            
            <Button 
              onClick={() => setRoomsDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="manage-rooms-btn"
            >
              <Home className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-amber-700 dark:text-amber-300">
                Habitaciones
              </span>
            </Button>
            
            <Button 
              onClick={() => setStaffHoursDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="staff-hours-btn"
            >
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-orange-700 dark:text-orange-300">
                Gestionar Horas
              </span>
            </Button>
            
            <Button 
              onClick={() => setCurriculumDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="curriculum-btn"
            >
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-emerald-700 dark:text-emerald-300">
                Currículo
              </span>
            </Button>
            
            <Button 
              onClick={() => setAchievementsDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-purple-700 dark:text-purple-300">
                Gestionar Logros
              </span>
            </Button>
            
            <Button 
              onClick={() => setCreateEventDialogOpen(true)} 
              variant="outline"
              className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              data-tutorial="create-event-btn"
            >
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-primary">
                Crear Evento
              </span>
            </Button>
            
            {userRole === 'admin' && (
              <Button 
                onClick={() => setResetScheduleDialogOpen(true)} 
                variant="outline"
                className="flex flex-col items-center justify-center h-20 sm:h-24 gap-1.5 sm:gap-2 bg-destructive/5 hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              >
                <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7 text-destructive group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-destructive">
                  Reiniciar
                </span>
              </Button>
            )}
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
        <div className="mb-8" data-tutorial="approval-panel">
          <AdminApprovalPanel />
        </div>

        {/* Modality Requests Panel */}
        {isModalityRequestsEnabled && (
          <div className="mb-8">
            <ModalityRequestsPanel />
          </div>
        )}

        {/* Video Call History */}
        {isVideoCallsEnabled && (
          <div className="mb-8">
            <VideoCallHistoryAdmin />
          </div>
        )}

        {/* Earnings Panel */}
        {isEarningsEnabled && (
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
        )}

        {/* Students Table */}
        <Card className="shadow-md mb-6" data-tutorial="students-table">
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
                              data-tutorial="student-progress-btn"
                              onClick={() => {
                                setProgressStudent({ 
                                  id: student.user_id, 
                                  name: student.profiles?.full_name || 'Estudiante',
                                  level: student.level 
                                });
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
                              data-tutorial="student-schedule-btn"
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
                              data-tutorial="student-level-btn"
                              onClick={() => {
                                setManualLevelStudent(student);
                                setManualLevelDialogOpen(true);
                              }}
                              className="flex-1 min-w-[100px]"
                            >
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Nivel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              data-tutorial="student-assign-btn"
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
                                setProgressStudent({ 
                                  id: student.user_id, 
                                  name: student.profiles?.full_name || 'Estudiante',
                                  level: student.level 
                                });
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
                                setManualLevelStudent(student);
                                setManualLevelDialogOpen(true);
                              }}
                            >
                              <GraduationCap className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Nivel</span>
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
        <div className="mt-6" data-tutorial="weekly-calendar">
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

      {/* Progress Dialog with Tabs */}
      {progressStudent && (
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Progreso del Estudiante - {progressStudent.name}</DialogTitle>
              <DialogDescription>
                Seguimiento completo del currículo, logros y notas semanales
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="curriculum" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="curriculum">📊 Currículo</TabsTrigger>
                <TabsTrigger value="achievements">🏆 Logros</TabsTrigger>
                <TabsTrigger value="notes">📝 Notas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curriculum" className="flex-1 overflow-y-auto mt-4">
                <WeeklyProgressGrid 
                  studentId={progressStudent.id} 
                  studentLevel={progressStudent.level}
                  isEditable={true}
                />
              </TabsContent>
              
              <TabsContent value="achievements" className="flex-1 overflow-y-auto mt-4">
                <StudentAchievementsTab 
                  studentId={progressStudent.id}
                  onCreateAchievement={() => setCreateAchievementOpen(true)}
                  onAwardAchievement={() => setAwardAchievementOpen(true)}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="flex-1 overflow-y-auto mt-4">
                <StudentProgressView studentId={progressStudent.id} isEditable={true} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Achievement Dialogs */}
      {progressStudent && (
        <>
          <CreateAchievementDialog
            open={createAchievementOpen}
            onOpenChange={setCreateAchievementOpen}
          />
          <AwardAchievementDialog
            open={awardAchievementOpen}
            onOpenChange={setAwardAchievementOpen}
            studentId={progressStudent.id}
            studentName={progressStudent.name}
          />
        </>
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

      {/* Manage Curriculum Dialog */}
      <ManageCurriculumDialog
        open={curriculumDialogOpen}
        onOpenChange={setCurriculumDialogOpen}
      />

      {/* Manage Achievements Dialog */}
      <ManageAchievementsDialog
        open={achievementsDialogOpen}
        onOpenChange={setAchievementsDialogOpen}
      />

      {/* Manual Level Assignment Dialog */}
      {manualLevelStudent && (
        <ManualLevelAssignDialog
          open={manualLevelDialogOpen}
          onOpenChange={setManualLevelDialogOpen}
          studentId={manualLevelStudent.user_id}
          studentName={manualLevelStudent.profiles?.full_name || 'Estudiante'}
          currentLevel={manualLevelStudent.level}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
