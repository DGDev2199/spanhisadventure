import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, GraduationCap, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { StaffHoursCard } from '@/components/StaffHoursCard';
import { TeacherTutorChatDialog } from '@/components/TeacherTutorChatDialog';

const TutorDashboard = () => {
  const { user, signOut } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

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
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10 sm:h-12" />
            <div>
              <h1 className="text-base sm:text-xl font-bold">Spanish Adventure</h1>
              <p className="text-xs sm:text-sm text-white/80">Tutor Dashboard</p>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Profesor</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.profiles?.full_name}</TableCell>
                      <TableCell>{student.profiles?.email}</TableCell>
                      <TableCell>{student.level || 'No asignado'}</TableCell>
                      <TableCell>{student.room || 'No asignado'}</TableCell>
                      <TableCell>{student.teacher?.full_name || 'No asignado'}</TableCell>
                      <TableCell>{student.tutor?.full_name || 'No asignado'}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openChat(student.user_id, student.profiles?.full_name)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
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
    </div>
  );
};

export default TutorDashboard;
