import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Users, GraduationCap, UserCheck, BookOpen, Settings, Home, Calendar, Plus, FileCheck, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { AssignTeacherTutorDialog } from '@/components/AssignTeacherTutorDialog';
import { ChangeRoleDialog } from '@/components/ChangeRoleDialog';
import { ManageRoomsDialog } from '@/components/ManageRoomsDialog';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { CreateScheduleEventDialog } from '@/components/CreateScheduleEventDialog';
import { ManagePlacementTestDialog } from '@/components/ManagePlacementTestDialog';
import { ManageStaffHoursDialog } from '@/components/ManageStaffHoursDialog';
import { StudentProgressView } from '@/components/StudentProgressView';

const AdminDashboard = () => {
  const { signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10 sm:h-12" />
            <div>
              <h1 className="text-base sm:text-xl font-bold">Spanish Adventure</h1>
              <p className="text-xs sm:text-sm text-white/80">Admin Dashboard</p>
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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Admin Overview</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage students, teachers, tutors, and all platform activities
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Level</TableHead>
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
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Nationality</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Age</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-sm">{user.full_name}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {user.user_roles?.[0]?.role || 'No Role'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{user.nationality || 'N/A'}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{user.age || 'N/A'}</TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
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
        />
      )}

      {selectedUser && (
        <ChangeRoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          currentRole={selectedUser.user_roles?.[0]?.role}
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
    </div>
  );
};

export default AdminDashboard;
