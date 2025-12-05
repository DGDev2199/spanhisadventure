import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { StaffToStudentChatDialog } from './StaffToStudentChatDialog';
import { TeacherTutorChatDialog } from './TeacherTutorChatDialog';

interface StudentConversation {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount?: number;
}

interface StaffConversation {
  studentId: string;
  studentName: string;
  lastMessage?: string;
  lastMessageDate?: string;
}

export const StaffMessagesPanel = () => {
  const { user, userRole } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<StudentConversation | null>(null);
  const [selectedStaffChat, setSelectedStaffChat] = useState<StaffConversation | null>(null);
  const [studentChatOpen, setStudentChatOpen] = useState(false);
  const [staffChatOpen, setStaffChatOpen] = useState(false);

  // Fetch students assigned to this staff member
  const { data: assignedStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ['staff-assigned-students', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const column = userRole === 'teacher' ? 'teacher_id' : 'tutor_id';
      const { data: studentProfiles, error: spError } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq(column, user.id);
      
      if (spError) throw spError;
      if (!studentProfiles?.length) return [];
      
      const userIds = studentProfiles.map(sp => sp.user_id);
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      if (pError) throw pError;
      return profiles as StudentConversation[];
    },
    enabled: !!user?.id && (userRole === 'teacher' || userRole === 'tutor')
  });

  // Fetch direct message conversations with students
  const { data: studentConversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['staff-student-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id || !assignedStudents?.length) return [];
      
      // Get last message for each student
      const conversations: StudentConversation[] = [];
      
      for (const student of assignedStudents) {
        const { data: messages } = await supabase
          .from('direct_messages')
          .select('message, created_at, read, sender_id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${student.id}),and(sender_id.eq.${student.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1);
        
        // Count unread messages
        const { count } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', student.id)
          .eq('receiver_id', user.id)
          .eq('read', false);
        
        conversations.push({
          ...student,
          lastMessage: messages?.[0]?.message,
          lastMessageDate: messages?.[0]?.created_at,
          unreadCount: count || 0
        });
      }
      
      // Sort by last message date
      return conversations.sort((a, b) => {
        if (!a.lastMessageDate) return 1;
        if (!b.lastMessageDate) return -1;
        return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
      });
    },
    enabled: !!user?.id && !!assignedStudents?.length
  });

  // Fetch teacher-tutor conversations
  const { data: staffConversations, isLoading: loadingStaffChats } = useQuery({
    queryKey: ['staff-staff-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id || !assignedStudents?.length) return [];
      
      const conversations: StaffConversation[] = [];
      
      for (const student of assignedStudents) {
        const { data: messages } = await supabase
          .from('teacher_tutor_messages')
          .select('message, created_at')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (messages && messages.length > 0) {
          conversations.push({
            studentId: student.id,
            studentName: student.full_name,
            lastMessage: messages[0]?.message || 'Test/Tarea compartida',
            lastMessageDate: messages[0]?.created_at
          });
        }
      }
      
      return conversations.sort((a, b) => {
        if (!a.lastMessageDate) return 1;
        if (!b.lastMessageDate) return -1;
        return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
      });
    },
    enabled: !!user?.id && !!assignedStudents?.length
  });

  const handleOpenStudentChat = (student: StudentConversation) => {
    setSelectedStudent(student);
    setStudentChatOpen(true);
  };

  const handleOpenStaffChat = (conv: StaffConversation) => {
    setSelectedStaffChat(conv);
    setStaffChatOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString('es', { weekday: 'short' });
    }
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  };

  const isLoading = loadingStudents || loadingConversations || loadingStaffChats;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Mensajes
          </CardTitle>
          <CardDescription>
            Todas tus conversaciones en un solo lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Estudiantes
                  {studentConversations?.some(c => (c.unreadCount || 0) > 0) && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {studentConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {userRole === 'teacher' ? 'Con Tutores' : 'Con Profesores'}
                </TabsTrigger>
              </TabsList>

              {/* Student Conversations */}
              <TabsContent value="students" className="mt-4">
                {!studentConversations?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes estudiantes asignados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentConversations.map((student) => (
                      <Button
                        key={student.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-3 px-3"
                        onClick={() => handleOpenStudentChat(student)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={student.avatar_url || undefined} />
                              <AvatarFallback>
                                {student.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {(student.unreadCount || 0) > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                              >
                                {student.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{student.full_name}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(student.lastMessageDate)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.lastMessage || 'Sin mensajes'}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Staff Conversations */}
              <TabsContent value="staff" className="mt-4">
                {!staffConversations?.length ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No hay conversaciones con {userRole === 'teacher' ? 'tutores' : 'profesores'} aún
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Las conversaciones aparecerán cuando discutas sobre un estudiante compartido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffConversations.map((conv) => (
                      <Button
                        key={conv.studentId}
                        variant="ghost"
                        className="w-full justify-start h-auto py-3 px-3"
                        onClick={() => handleOpenStaffChat(conv)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                Sobre: {conv.studentName}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(conv.lastMessageDate)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Student Chat Dialog */}
      {selectedStudent && (
        <StaffToStudentChatDialog
          open={studentChatOpen}
          onOpenChange={setStudentChatOpen}
          studentId={selectedStudent.id}
          studentName={selectedStudent.full_name}
        />
      )}

      {/* Staff Chat Dialog */}
      {selectedStaffChat && (
        <TeacherTutorChatDialog
          open={staffChatOpen}
          onOpenChange={setStaffChatOpen}
          studentId={selectedStaffChat.studentId}
          studentName={selectedStaffChat.studentName}
        />
      )}
    </>
  );
};
