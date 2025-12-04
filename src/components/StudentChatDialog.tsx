import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Video, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';

interface StudentChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  staffAvatar?: string | null;
  staffRole: 'teacher' | 'tutor';
  onStartVideoCall?: () => void;
  onBookClass?: () => void;
}

export const StudentChatDialog = ({ 
  open, 
  onOpenChange, 
  staffId, 
  staffName, 
  staffAvatar,
  staffRole,
  onStartVideoCall,
  onBookClass
}: StudentChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ['direct-messages', user?.id, staffId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${staffId}),and(sender_id.eq.${staffId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id
  });

  // Mark messages as read
  useEffect(() => {
    if (open && messages && user?.id) {
      const unreadIds = messages
        .filter(m => m.receiver_id === user.id && !m.read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        supabase
          .from('direct_messages')
          .update({ read: true })
          .in('id', unreadIds)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
          });
      }
    }
  }, [open, messages, user?.id, queryClient]);

  // Setup realtime subscription
  useEffect(() => {
    if (!open || !user?.id) return;

    const channel = supabase
      .channel(`dm-${user.id}-${staffId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const record = payload.new as any;
          if (
            (record?.sender_id === user.id && record?.receiver_id === staffId) ||
            (record?.sender_id === staffId && record?.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ['direct-messages', user.id, staffId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, user?.id, staffId, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !message.trim()) throw new Error('Invalid message');
      
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: staffId,
          message: message.trim()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
    },
    onError: () => {
      toast({ title: 'Error al enviar mensaje', variant: 'destructive' });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[500px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={staffAvatar || undefined} />
                <AvatarFallback>
                  {staffName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-left">{staffName}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {staffRole === 'teacher' ? 'Profesor' : 'Tutor'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {onBookClass && (
                <Button variant="outline" size="sm" onClick={onBookClass}>
                  <Calendar className="h-4 w-4" />
                </Button>
              )}
              {onStartVideoCall && (
                <Button variant="outline" size="sm" onClick={onStartVideoCall}>
                  <Video className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                No hay mensajes. ¡Inicia la conversación!
              </p>
            )}
            {messages?.map((msg) => (
              <Card 
                key={msg.id} 
                className={`p-3 max-w-[80%] ${
                  msg.sender_id === user?.id 
                    ? 'ml-auto bg-primary text-primary-foreground' 
                    : 'mr-auto bg-muted'
                }`}
              >
                <div className="text-sm">{msg.message}</div>
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0 pt-2 border-t">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 min-h-[60px] max-h-[100px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend} 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
