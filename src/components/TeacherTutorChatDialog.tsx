import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, FileText, Trash2, ClipboardList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeacherTutorChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export const TeacherTutorChatDialog = ({ open, onOpenChange, studentId, studentName }: TeacherTutorChatDialogProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Check if user is a teacher (only teachers can share tests and tasks)
  const isTeacher = userRole === 'teacher';

  // Fetch messages with realtime updates
  const { data: messages } = useQuery({
    queryKey: ['teacher-tutor-messages', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_tutor_messages')
        .select(`
          *,
          sender:profiles!teacher_tutor_messages_sender_id_fkey(full_name),
          test:custom_tests(title, test_type),
          task:tasks(title, description, due_date)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!open || !studentId) return;

    const channel = supabase
      .channel(`chat-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher_tutor_messages',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teacher-tutor-messages', studentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, studentId, queryClient]);

  // Fetch available tests (only for teachers)
  const { data: availableTests } = useQuery({
    queryKey: ['my-tests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_tests')
        .select('id, title, test_type')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && isTeacher
  });

  // Fetch available tasks (only for teachers)
  const { data: availableTasks } = useQuery({
    queryKey: ['student-tasks', studentId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, completed')
        .eq('student_id', studentId)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && isTeacher
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('teacher_tutor_messages')
        .insert({
          student_id: studentId,
          sender_id: user.id,
          message: message,
          test_id: selectedTestId,
          task_id: selectedTaskId
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      setSelectedTestId(null);
      setSelectedTaskId(null);
      toast({ title: 'Mensaje enviado' });
    },
    onError: () => {
      toast({ title: 'Error al enviar mensaje', variant: 'destructive' });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('teacher_tutor_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Mensaje eliminado' });
      setDeleteMessageId(null);
    },
    onError: () => {
      toast({ title: 'Error al eliminar mensaje', variant: 'destructive' });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() && !selectedTestId && !selectedTaskId) return;
    sendMessageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Chat sobre {studentName} {isTeacher ? '(con Tutor)' : '(con Profesor)'}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages?.map((msg: any) => (
              <Card 
                key={msg.id} 
                className={`p-3 group relative ${msg.sender_id === user?.id ? 'ml-auto bg-primary text-white' : 'mr-auto bg-muted'} max-w-[80%]`}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteMessageId(msg.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="text-xs opacity-80 mb-1">{msg.sender?.full_name}</div>
                {msg.message && <div className="text-sm">{msg.message}</div>}
                {msg.test && (
                  <Badge variant="secondary" className="mt-2">
                    <FileText className="h-3 w-3 mr-1" />
                    Test: {msg.test.title} ({msg.test.test_type === 'final' ? 'Final' : 'Regular'})
                  </Badge>
                )}
                {msg.task && (
                  <Badge variant="secondary" className="mt-2">
                    <ClipboardList className="h-3 w-3 mr-1" />
                    Tarea: {msg.task.title}
                    {msg.task.due_date && ` - Vence: ${new Date(msg.task.due_date).toLocaleDateString()}`}
                  </Badge>
                )}
                <div className="text-xs opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="space-y-2">
          {isTeacher && (selectedTestId || selectedTaskId) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedTestId && (
                <div className="flex items-center gap-2">
                  <Badge>
                    <FileText className="h-3 w-3 mr-1" />
                    {availableTests?.find(t => t.id === selectedTestId)?.title}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTestId(null)}>
                    Quitar
                  </Button>
                </div>
              )}
              {selectedTaskId && (
                <div className="flex items-center gap-2">
                  <Badge>
                    <ClipboardList className="h-3 w-3 mr-1" />
                    {availableTasks?.find(t => t.id === selectedTaskId)?.title}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTaskId(null)}>
                    Quitar
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {isTeacher && (
            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={selectedTestId || ''}
                onChange={(e) => {
                  setSelectedTestId(e.target.value || null);
                  if (e.target.value) setSelectedTaskId(null);
                }}
              >
                <option value="">Compartir test...</option>
                {availableTests?.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title} - {test.test_type === 'final' ? 'Final' : 'Regular'}
                  </option>
                ))}
              </select>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={selectedTaskId || ''}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value || null);
                  if (e.target.value) setSelectedTestId(null);
                }}
              >
                <option value="">Compartir tarea...</option>
                {availableTasks?.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} {task.completed ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isTeacher ? "Escribe un mensaje..." : "Escribe un mensaje al profesor..."}
              className="flex-1"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={(!message.trim() && !selectedTestId && !selectedTaskId) || sendMessageMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMessageId && deleteMessageMutation.mutate(deleteMessageId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
