import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, Trash2, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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

interface StaffToStudentChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const StaffToStudentChatDialog = ({ open, onOpenChange, studentId, studentName }: StaffToStudentChatDialogProps) => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch direct messages between staff and student
  const { data: messages } = useQuery({
    queryKey: ['staff-student-messages', user?.id, studentId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url),
          receiver:profiles!direct_messages_receiver_id_fkey(full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${studentId}),and(sender_id.eq.${studentId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!open || !user?.id || !studentId) return;

    const channel = supabase
      .channel(`staff-student-chat-${user.id}-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload: any) => {
          const newRecord = payload.new;
          const oldRecord = payload.old;
          
          // Only refresh if this message involves this conversation
          if (
            (newRecord?.sender_id === user.id && newRecord?.receiver_id === studentId) ||
            (newRecord?.sender_id === studentId && newRecord?.receiver_id === user.id) ||
            (oldRecord?.sender_id === user.id && oldRecord?.receiver_id === studentId) ||
            (oldRecord?.sender_id === studentId && oldRecord?.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ['staff-student-messages', user.id, studentId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, user?.id, studentId, queryClient]);

  // Mark messages as read when opening
  useEffect(() => {
    if (!open || !user?.id || !studentId) return;

    const markAsRead = async () => {
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('sender_id', studentId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    };

    markAsRead();
  }, [open, user?.id, studentId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if present
      if (selectedFile) {
        setIsUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }
      
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: studentId,
          message: message.trim() || (fileName ? `Archivo: ${fileName}` : ''),
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      setSelectedFile(null);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['staff-student-messages', user?.id, studentId] });
    },
    onError: () => {
      setIsUploading(false);
      toast.error('Error al enviar mensaje');
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mensaje eliminado');
      setDeleteMessageId(null);
      queryClient.invalidateQueries({ queryKey: ['staff-student-messages', user?.id, studentId] });
    },
    onError: () => {
      toast.error('Error al eliminar mensaje');
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;
    sendMessageMutation.mutate();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa imágenes, PDFs o documentos.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const isImageFile = (fileType: string | null) => {
    return fileType?.startsWith('image/');
  };

  const roleLabel = userRole === 'teacher' ? 'Profesor' : 'Tutor';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Chat con {studentName}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay mensajes aún. ¡Inicia la conversación!
              </p>
            )}
            {messages?.map((msg: any) => (
              <Card 
                key={msg.id} 
                className={`p-3 group relative ${msg.sender_id === user?.id ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted'} max-w-[80%]`}
              >
                {msg.sender_id === user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
                    onClick={() => setDeleteMessageId(msg.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <div className="text-xs opacity-80 mb-1">
                  {msg.sender_id === user?.id ? roleLabel : studentName}
                </div>
                
                {/* File attachment */}
                {msg.file_url && (
                  <div className="mb-2">
                    {isImageFile(msg.file_type) ? (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={msg.file_url} 
                          alt={msg.file_name || 'Imagen adjunta'} 
                          className="max-w-full max-h-48 rounded-md object-cover"
                        />
                      </a>
                    ) : (
                      <a 
                        href={msg.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded-md ${
                          msg.sender_id === user?.id ? 'bg-primary-foreground/20' : 'bg-background'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate">{msg.file_name || 'Archivo adjunto'}</span>
                      </a>
                    )}
                  </div>
                )}
                
                {msg.message && !msg.message.startsWith('Archivo:') && (
                  <div className="text-sm">{msg.message}</div>
                )}
                <div className="text-xs opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Escribe un mensaje a ${studentName}...`}
            className="flex-1"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend} 
            disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
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