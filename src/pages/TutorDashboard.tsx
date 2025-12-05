import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, GraduationCap, MessageSquare, TrendingUp, CalendarClock, Users, Settings, UsersRound, Video } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { StaffHoursCard } from '@/components/StaffHoursCard';
import { TeacherTutorChatDialog } from '@/components/TeacherTutorChatDialog';
import { StudentProgressView } from '@/components/StudentProgressView';
import { MyScheduleDialog } from '@/components/MyScheduleDialog';
import { AssignMultipleStudentsDialog } from '@/components/AssignMultipleStudentsDialog';
import { NotificationBell } from '@/components/NotificationBell';
import { RoleBasedEditProfileDialog } from '@/components/RoleBasedEditProfileDialog';
import { ClassRequestsPanel } from '@/components/ClassRequestsPanel';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { StaffBookingsPanel } from '@/components/StaffBookingsPanel';
import { VideoCallDialog } from '@/components/VideoCallDialog';
import { VideoCallHistoryPanel } from '@/components/VideoCallHistoryPanel';
import { StaffEarningsPanel } from '@/components/StaffEarningsPanel';
import { StaffMessagesPanel } from '@/components/StaffMessagesPanel';
import { useNavigate } from 'react-router-dom';

const TutorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Feature flags
  const isCommunityEnabled = useFeatureFlag('community_feed');
  const isOnlineEnabled = useFeatureFlag('online_students');
  const isBookingEnabled = useFeatureFlag('booking_system');
  const isAvailabilityEnabled = useFeatureFlag('availability_calendar');
  const isVideoCallsEnabled = useFeatureFlag('video_calls');
  const isEarningsEnabled = useFeatureFlag('earnings_panel');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressStudent, setProgressStudent] = useState<{ id: string; name: string } | null>(null);
  const [myScheduleOpen, setMyScheduleOpen] = useState(false);
  const [assignMultipleOpen, setAssignMultipleOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [videoCallStudent, setVideoCallStudent] = useState<{ id: string; name: string } | null>(null);

  const { data: myStudents } = useQuery({
    queryKey: ['tutor-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get student profiles
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false });
      
      if (studentError) {
        console.error('Error loading student profiles:', studentError);
        throw studentError;
      }
      
      if (!studentData || studentData.length === 0) return [];
      
      // Get all user IDs (students, teachers, tutors)
      const userIds = studentData.map(s => s.user_id);
      const teacherIds = studentData.map(s => s.teacher_id).filter(Boolean);
      const tutorIds = studentData.map(s => s.tutor_id).filter(Boolean);
      const allIds = [...new Set([...userIds, ...teacherIds, ...tutorIds])];
      
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allIds);
      
      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }
      
      // Merge data
      return studentData.map(student => ({
        ...student,
        profiles: profilesData?.find(p => p.id === student.user_id),
        teacher: profilesData?.find(p => p.id === student.teacher_id),
        tutor: profilesData?.find(p => p.id === student.tutor_id)
      }));
    }
  });

  const openChat = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-primary shadow-md safe-top">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10 sm:h-12 lg:h-14" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">Spanish Adventure</h1>
              <p className="text-xs sm:text-sm text-white/90">Tutor</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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
              onClick={() => setAssignMultipleOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
            >
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Grupo</span>
            </Button>
            <Button
              onClick={() => setMyScheduleOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
            >
              <CalendarClock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Horario</span>
            </Button>
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
              <span className="hidden sm:inline">Cerrar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Tutor Overview</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your tutoring sessions and provide personalized support
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Estudiantes</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{myStudents?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Estudiantes asignados</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mensajes sin leer</CardTitle>
              <MessageSquare className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">0</div>
              <p className="text-xs text-muted-foreground mt-1">Conversaciones activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Hours Card */}
        {user?.id && (
          <div className="mb-8">
            <StaffHoursCard userId={user.id} />
          </div>
        )}

        {/* Class Requests from Online Students */}
        {isOnlineEnabled && (
          <div className="mb-8">
            <ClassRequestsPanel />
          </div>
        )}

        {/* Class Bookings from Online Students */}
        {isOnlineEnabled && isBookingEnabled && (
          <div className="mb-8">
            <StaffBookingsPanel />
          </div>
        )}

        {/* Unified Messages Panel */}
        <div className="mb-8">
          <StaffMessagesPanel />
        </div>

        {/* Availability Calendar */}
        {isOnlineEnabled && isAvailabilityEnabled && (
          <div className="mb-8">
            <AvailabilityCalendar />
          </div>
        )}

        {/* Video Call History */}
        {isVideoCallsEnabled && (
          <div className="mb-8">
            <VideoCallHistoryPanel />
          </div>
        )}

        {/* Staff Earnings Panel */}
        {isEarningsEnabled && (
          <div className="mb-8">
            <StaffEarningsPanel />
          </div>
        )}

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div>
              <CardTitle>Mis Estudiantes</CardTitle>
              <CardDescription>Estudiantes asignados para tutoría</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {myStudents && myStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Profesor Asignado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.profiles?.full_name || 'Sin nombre'}</TableCell>
                      <TableCell>{student.level || 'No asignado'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.student_type === 'online' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {student.student_type === 'online' ? '🌐 Online' : '📍 Presencial'}
                        </span>
                      </TableCell>
                      <TableCell>{student.room || 'No asignado'}</TableCell>
                      <TableCell>
                        {student.teacher?.full_name || (
                          <span className="text-muted-foreground">No asignado</span>
                        )}
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
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Progreso
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openChat(student.user_id, student.profiles?.full_name)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                          {student.student_type === 'online' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setVideoCallStudent({ id: student.user_id, name: student.profiles?.full_name });
                                setVideoCallOpen(true);
                              }}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Llamar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay estudiantes asignados</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <div className="mt-6">
          <WeeklyCalendar />
        </div>
      </main>

      {/* Chat Dialog */}
      {selectedStudent && (
        <TeacherTutorChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
        />
      )}

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

      {/* My Schedule Dialog */}
      {user?.id && (
        <MyScheduleDialog
          open={myScheduleOpen}
          onOpenChange={setMyScheduleOpen}
          userId={user.id}
          userRole="tutor"
        />
      )}

      {user?.id && (
        <AssignMultipleStudentsDialog
          open={assignMultipleOpen}
          onOpenChange={setAssignMultipleOpen}
          teacherId={user.id}
        />
      )}

      {/* Edit Profile Dialog */}
      <RoleBasedEditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />

      {/* Video Call Dialog */}
      {videoCallStudent && (
        <VideoCallDialog
          open={videoCallOpen}
          onOpenChange={setVideoCallOpen}
          participantName={videoCallStudent.name}
          participantAvatar={null}
          participantRole="student"
          roomId={`tutor-${user?.id}-student-${videoCallStudent.id}`}
          studentId={videoCallStudent.id}
        />
      )}
    </div>
  );
};

export default TutorDashboard;
