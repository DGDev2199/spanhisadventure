import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Users, GraduationCap, UserCheck, BookOpen, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { AssignTeacherTutorDialog } from '@/components/AssignTeacherTutorDialog';
import { ChangeRoleDialog } from '@/components/ChangeRoleDialog';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // 📊 Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [students, teachers, tutors, tasks] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ]);
      return {
        students: students.count || 0,
        teachers: teachers.count || 0,
        tutors: tutors.count || 0,
        tasks: tasks.count || 0,
      };
    },
  });

  // 👩‍🎓 Students sin join (manual merge)
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-simple'],
    queryFn: async () => {
      const { data: studentProfiles, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentError) throw studentError;
      if (!studentProfiles || studentProfiles.length === 0) return [];

      const userIds = studentProfiles.map((s) => s.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Unir manualmente
      return studentProfiles.map((student) => ({
        ...student,
        profile: profiles.find((p) => p.id === student.user_id) || {},
      }));
    },
  });

  // 👥 Todos los usuarios
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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
              <p className="text-sm text-white/80">Admin Dashboard</p>
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

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Overview</h2>
          <p className="text-muted-foreground">Manage students, teachers, tutors, and all platform activities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Students', icon: GraduationCap, value: stats?.students || 0 },
            { title: 'Teachers', icon: Users, value: stats?.teachers || 0 },
            { title: 'Tutors', icon: UserCheck, value: stats?.tutors || 0 },
            { title: 'Total Tasks', icon: BookOpen, value: stats?.tasks || 0 },
          ].map((item, idx) => (
            <Card key={idx} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {statsLoading ? '...' : item.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Students Table */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage student profiles and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : students && students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.profile.full_name || 'Unknown'}</TableCell>
                      <TableCell>{student.profile.email || 'N/A'}</TableCell>
                      <TableCell>{student.level || 'Not Set'}</TableCell>
                      <TableCell>{student.room || 'Not Assigned'}</TableCell>
                      <TableCell>{student.status}</TableCell>
                      <TableCell>{student.placement_test_status}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No students found</p>
            )}
          </CardContent>
        </Card>

        {/* All Users Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View all platform users and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {user.user_roles?.[0]?.role || 'No Role'}
                        </span>
                      </TableCell>
                      <TableCell>{user.nationality || 'N/A'}</TableCell>
                      <TableCell>{user.age || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setRoleDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Change Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      {selectedStudent && (
        <AssignTeacherTutorDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          studentId={selectedStudent.user_id}
          studentName={selectedStudent.profile?.full_name}
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
    </div>
  );
};

export default AdminDashboard;
