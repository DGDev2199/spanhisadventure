import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, BookOpen, Calendar, Users, Search, Globe, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { RoleBasedEditProfileDialog } from '@/components/RoleBasedEditProfileDialog';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { StudentProgressView } from '@/components/StudentProgressView';
import { ClassScheduleDialog } from '@/components/ClassScheduleDialog';
import { TutoringScheduleDialog } from '@/components/TutoringScheduleDialog';
import { NotificationBell } from '@/components/NotificationBell';
import { Badge } from '@/components/ui/badge';
import { StudentChatDialog } from '@/components/StudentChatDialog';
import { BookingDialog } from '@/components/BookingDialog';
import { VideoCallDialog } from '@/components/VideoCallDialog';
import { MyBookingsPanel } from '@/components/MyBookingsPanel';
import { StaffProfileDialog } from '@/components/StaffProfileDialog';

// Optimized hooks and components
import { 
  useStudentProfile, 
  useStudentTasks, 
  useStudentAssignments, 
  useStaffProfile, 
  useCompleteTask 
} from '@/hooks/useStudentDashboardData';
import { StaffCard } from '@/components/dashboard/StaffCard';
import { QuickStatCard } from '@/components/dashboard/QuickStatCard';
import { TasksList } from '@/components/dashboard/TasksList';
import { AssignedTestsList } from '@/components/dashboard/AssignedTestsList';
import { PlacementTestCard } from '@/components/dashboard/PlacementTestCard';

type StaffInfo = { id: string; name: string; avatar?: string | null; role: 'teacher' | 'tutor' } | null;

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Feature flags - memoized
  const isCommunityEnabled = useFeatureFlag('community_feed');
  const isOnlineEnabled = useFeatureFlag('online_students');
  const isBrowseTeachersEnabled = useFeatureFlag('browse_teachers');
  const isBookingEnabled = useFeatureFlag('booking_system');
  const isVideoCallsEnabled = useFeatureFlag('video_calls');
  const isBasicChatEnabled = useFeatureFlag('basic_chat');

  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [classScheduleOpen, setClassScheduleOpen] = useState(false);
  const [tutoringScheduleOpen, setTutoringScheduleOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStaff, setChatStaff] = useState<StaffInfo>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStaff, setBookingStaff] = useState<StaffInfo>(null);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoCallStaff, setVideoCallStaff] = useState<StaffInfo>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileStaff, setProfileStaff] = useState<{ id: string; role: 'teacher' | 'tutor' } | null>(null);

  // Optimized data fetching with custom hooks
  const { data: studentProfile, isLoading: profileLoading } = useStudentProfile(user?.id);
  const { data: tasks, isLoading: tasksLoading } = useStudentTasks(user?.id);
  const { data: assignedTests } = useStudentAssignments(user?.id);
  const { data: teacherProfile, isLoading: teacherLoading } = useStaffProfile(studentProfile?.teacher_id, 'teacher');
  const { data: tutorProfile, isLoading: tutorLoading } = useStaffProfile(studentProfile?.tutor_id, 'tutor');
  const completeTaskMutation = useCompleteTask();

  // Memoized values
  const isOnlineStudent = useMemo(() => studentProfile?.student_type === 'online', [studentProfile?.student_type]);
  const showBookingOptions = useMemo(() => isBookingEnabled && isOnlineStudent, [isBookingEnabled, isOnlineStudent]);
  const showVideoCallOptions = useMemo(() => isVideoCallsEnabled && isOnlineStudent, [isVideoCallsEnabled, isOnlineStudent]);

  // Memoized callbacks
  const handleTeacherChat = useCallback(() => {
    if (teacherProfile) {
      setChatStaff({ id: teacherProfile.id, name: teacherProfile.full_name, avatar: teacherProfile.avatar_url, role: 'teacher' });
      setChatOpen(true);
    }
  }, [teacherProfile]);

  const handleTeacherVideoCall = useCallback(() => {
    if (teacherProfile) {
      setVideoCallStaff({ id: teacherProfile.id, name: teacherProfile.full_name, avatar: teacherProfile.avatar_url, role: 'teacher' });
      setVideoCallOpen(true);
    }
  }, [teacherProfile]);

  const handleTeacherBooking = useCallback(() => {
    if (teacherProfile) {
      setBookingStaff({ id: teacherProfile.id, name: teacherProfile.full_name, avatar: teacherProfile.avatar_url, role: 'teacher' });
      setBookingOpen(true);
    }
  }, [teacherProfile]);

  const handleTutorChat = useCallback(() => {
    if (tutorProfile) {
      setChatStaff({ id: tutorProfile.id, name: tutorProfile.full_name, avatar: tutorProfile.avatar_url, role: 'tutor' });
      setChatOpen(true);
    }
  }, [tutorProfile]);

  const handleTutorVideoCall = useCallback(() => {
    if (tutorProfile) {
      setVideoCallStaff({ id: tutorProfile.id, name: tutorProfile.full_name, avatar: tutorProfile.avatar_url, role: 'tutor' });
      setVideoCallOpen(true);
    }
  }, [tutorProfile]);

  const handleTutorBooking = useCallback(() => {
    if (tutorProfile) {
      setBookingStaff({ id: tutorProfile.id, name: tutorProfile.full_name, avatar: tutorProfile.avatar_url, role: 'tutor' });
      setBookingOpen(true);
    }
  }, [tutorProfile]);

  const handleCompleteTask = useCallback((taskId: string) => {
    completeTaskMutation.mutate(taskId);
  }, [completeTaskMutation]);

  const handleScrollToCalendar = useCallback(() => {
    document.getElementById('weekly-calendar')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleViewTeacherProfile = useCallback(() => {
    if (teacherProfile) {
      setProfileStaff({ id: teacherProfile.id, role: 'teacher' });
      setProfileDialogOpen(true);
    }
  }, [teacherProfile]);

  const handleViewTutorProfile = useCallback(() => {
    if (tutorProfile) {
      setProfileStaff({ id: tutorProfile.id, role: 'tutor' });
      setProfileDialogOpen(true);
    }
  }, [tutorProfile]);

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
            {isCommunityEnabled && (
              <Button
                onClick={() => navigate('/feed')}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
              >
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Comunidad</span>
              </Button>
            )}
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
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">¡Bienvenido de vuelta!</h2>
            {studentProfile?.student_type && (
              <Badge variant={isOnlineStudent ? 'secondary' : 'default'}>
                {isOnlineStudent ? '🌐 Online' : '📍 Presencial'}
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isOnlineStudent 
              ? 'Gestiona tus clases online y conecta con profesores' 
              : 'Continúa tu viaje de aprendizaje del español'}
          </p>
        </div>

        {/* Browse Teachers Button - Online Students */}
        {isOnlineEnabled && isBrowseTeachersEnabled && isOnlineStudent && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Encuentra tu Profesor o Tutor</h3>
                    <p className="text-sm text-muted-foreground">
                      {teacherProfile && tutorProfile 
                        ? 'Ya tienes profesor y tutor asignados'
                        : 'Explora perfiles y solicita clases'}
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/browse-teachers')}>
                  <Globe className="h-4 w-4 mr-2" />
                  Buscar Profesores
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className={`grid gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 ${
          isOnlineStudent ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
        }`}>
          {/* Room - Only for Presencial */}
          {!isOnlineStudent && (
            <QuickStatCard
              title="Mi Cuarto"
              value={studentProfile?.room || 'Sin Asignar'}
              subtitle={studentProfile?.room ? 'Tu cuarto asignado' : 'Contacta a tu profesor'}
              icon={<Award className="h-4 w-4 text-accent" />}
              isLoading={profileLoading}
            />
          )}

          <QuickStatCard
            title="Nivel Actual"
            value={studentProfile?.level || 'Sin Nivel'}
            subtitle={studentProfile?.level ? 'Nivel actual' : 'Completa el examen'}
            icon={<Award className="h-4 w-4 text-secondary" />}
            isLoading={profileLoading}
          />

          {/* Teacher Card */}
          <StaffCard
            title="Mi Profesor"
            staffName={teacherProfile?.full_name}
            isLoading={profileLoading || teacherLoading}
            iconColor="text-primary"
            staffId={teacherProfile?.id}
            showChat={isBasicChatEnabled}
            showVideoCall={showVideoCallOptions}
            showBooking={showBookingOptions}
            showSchedule={!isOnlineStudent}
            onChat={handleTeacherChat}
            onVideoCall={handleTeacherVideoCall}
            onBooking={handleTeacherBooking}
            onViewSchedule={() => setClassScheduleOpen(true)}
            onViewProfile={handleViewTeacherProfile}
            bookingLabel="Reservar Clase"
            scheduleLabel="Ver Horario de Clases"
          />

          {/* Tutor Card */}
          <StaffCard
            title="Mi Tutor"
            staffName={tutorProfile?.full_name}
            isLoading={profileLoading || tutorLoading}
            iconColor="text-secondary"
            staffId={tutorProfile?.id}
            showChat={isBasicChatEnabled}
            showVideoCall={showVideoCallOptions}
            showBooking={showBookingOptions}
            showSchedule={!isOnlineStudent}
            onChat={handleTutorChat}
            onVideoCall={handleTutorVideoCall}
            onBooking={handleTutorBooking}
            onViewSchedule={() => setTutoringScheduleOpen(true)}
            onViewProfile={handleViewTutorProfile}
            bookingLabel="Reservar Tutoría"
            scheduleLabel="Ver Horario de Tutorías"
          />

          <QuickStatCard
            title="Tareas"
            value={tasks?.length || 0}
            subtitle={tasks && tasks.length > 0 ? 'Tareas pendientes' : 'Sin tareas pendientes'}
            icon={<BookOpen className="h-4 w-4 text-accent" />}
            isLoading={tasksLoading}
          />
        </div>

        {/* Main Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlacementTestCard
            status={studentProfile?.placement_test_status || 'not_started'}
            writtenScore={studentProfile?.placement_test_written_score}
            level={studentProfile?.level}
            oralCompleted={studentProfile?.placement_test_oral_completed}
          />

          {!isOnlineStudent && (
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
                <Button variant="outline" className="w-full" onClick={handleScrollToCalendar}>
                  Ver Horario Completo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Student Progress Section */}
          <Card className="shadow-md lg:col-span-2">
            <CardContent className="pt-6">
              {user?.id && (
                <StudentProgressView studentId={user.id} isEditable={false} />
              )}
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Mi Perfil
              </CardTitle>
              <CardDescription>
                Ver y actualizar tu información
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="text-green-600 font-medium">Activo</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setEditProfileOpen(true)}>
                Editar Perfil
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <TasksList 
          tasks={tasks || []} 
          onCompleteTask={handleCompleteTask}
        />

        {/* Assigned Tests Section */}
        <AssignedTestsList assignments={assignedTests || []} />

        {/* My Bookings Panel - Online Students Only */}
        {showBookingOptions && (
          <div className="mt-6">
            <MyBookingsPanel />
          </div>
        )}

        {/* Weekly Calendar - Presencial Students Only */}
        {!isOnlineStudent && (
          <div id="weekly-calendar" className="mt-6">
            <WeeklyCalendar />
          </div>
        )}
      </main>

      {/* Dialogs */}
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

      {chatStaff && (
        <StudentChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          staffId={chatStaff.id}
          staffName={chatStaff.name}
          staffAvatar={chatStaff.avatar}
          staffRole={chatStaff.role}
          onStartVideoCall={() => {
            setChatOpen(false);
            setVideoCallStaff(chatStaff);
            setVideoCallOpen(true);
          }}
          onBookClass={() => {
            setChatOpen(false);
            setBookingStaff(chatStaff);
            setBookingOpen(true);
          }}
        />
      )}

      {bookingStaff && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          staffId={bookingStaff.id}
          staffName={bookingStaff.name}
          staffAvatar={bookingStaff.avatar}
          staffRole={bookingStaff.role}
        />
      )}

      {videoCallStaff && (
        <VideoCallDialog
          open={videoCallOpen}
          onOpenChange={setVideoCallOpen}
          participantName={videoCallStaff.name}
          participantAvatar={videoCallStaff.avatar}
          participantRole={videoCallStaff.role}
        />
      )}

      {profileStaff && (
        <StaffProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          staffId={profileStaff.id}
          staffRole={profileStaff.role}
        />
      )}
    </div>
  );
};

export default Dashboard;
