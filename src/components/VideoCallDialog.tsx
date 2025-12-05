import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Copy, Check, PhoneOff, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantName: string;
  participantAvatar?: string | null;
  participantRole: 'teacher' | 'tutor' | 'student';
  roomId?: string;
  studentId?: string;
}

export const VideoCallDialog = ({
  open,
  onOpenChange,
  participantName,
  participantAvatar,
  participantRole,
  roomId,
  studentId
}: VideoCallDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const callStartTime = useRef<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique room name based on participants
  const generateRoomName = () => {
    if (roomId) return roomId;
    const baseRoom = `spanish-adventure-${user?.id?.slice(0, 8)}`;
    return baseRoom;
  };

  const jitsiRoomName = generateRoomName();
  const jitsiUrl = `https://meet.jit.si/${jitsiRoomName}`;

  // Start timer when call is active
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callActive]);

  // Format duration as mm:ss or hh:mm:ss
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mutation to start video call
  const startCallMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !studentId) return null;
      const { data, error } = await supabase.from('video_calls').insert({
        caller_id: user.id,
        student_id: studentId,
        room_id: jitsiRoomName,
        started_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentCallId(data.id);
        queryClient.invalidateQueries({ queryKey: ['video-calls'] });
      }
    }
  });

  // Mutation to end video call
  const endCallMutation = useMutation({
    mutationFn: async () => {
      if (!currentCallId || !callStartTime.current) return;
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - callStartTime.current.getTime()) / 60000);
      
      const { error } = await supabase.from('video_calls').update({
        ended_at: endTime.toISOString(),
        duration_minutes: Math.max(1, durationMinutes)
      }).eq('id', currentCallId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-calls'] });
      toast.success(`Llamada finalizada. Duración: ${formatDuration(callDuration)}`);
      resetCallState();
    }
  });

  const resetCallState = () => {
    setCallActive(false);
    setCallDuration(0);
    setCurrentCallId(null);
    callStartTime.current = null;
  };

  const handleJoinCall = () => {
    setIsJoining(true);
    callStartTime.current = new Date();
    
    // Log the call if studentId is provided (staff calling student)
    if (studentId && participantRole === 'student') {
      startCallMutation.mutate();
    }
    
    setCallActive(true);
    window.open(jitsiUrl, '_blank', 'width=1200,height=800');
    setTimeout(() => setIsJoining(false), 2000);
  };

  const handleEndCall = () => {
    if (currentCallId) {
      endCallMutation.mutate();
    } else {
      resetCallState();
      toast.info('Llamada finalizada');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(jitsiUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar enlace');
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && callActive && currentCallId) {
      // Auto-end call when closing dialog
      endCallMutation.mutate();
    } else if (!newOpen) {
      resetCallState();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Videollamada
          </DialogTitle>
          <DialogDescription>
            {callActive ? 'Llamada en curso' : `Inicia una videollamada con ${participantName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Participant Info */}
          <div className="flex items-center justify-center">
            <div className="text-center space-y-3">
              <Avatar className={`h-24 w-24 mx-auto border-4 ${callActive ? 'border-green-500 animate-pulse' : 'border-primary/20'}`}>
                <AvatarImage src={participantAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {participantName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{participantName}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {participantRole === 'teacher' ? 'Profesor' : participantRole === 'tutor' ? 'Tutor' : 'Estudiante'}
                </p>
              </div>
            </div>
          </div>

          {/* Call Duration Display */}
          {callActive && (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 animate-pulse" />
              <span className="text-2xl font-mono font-bold text-green-600">
                {formatDuration(callDuration)}
              </span>
            </div>
          )}

          {/* Call Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plataforma:</span>
              <span className="font-medium">Jitsi Meet</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sala:</span>
              <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                {jitsiRoomName}
              </span>
            </div>
            {callActive && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  En curso
                </span>
              </div>
            )}
          </div>

          {/* Instructions */}
          {!callActive && (
            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>La videollamada se abrirá en una nueva ventana.</p>
              <p>Comparte el enlace con tu {participantRole === 'student' ? 'estudiante' : 'profesor/tutor'} para que pueda unirse.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!callActive ? (
              <>
                <Button 
                  onClick={handleJoinCall} 
                  className="w-full gap-2"
                  disabled={isJoining}
                >
                  <Video className="h-4 w-4" />
                  {isJoining ? 'Abriendo...' : 'Iniciar Videollamada'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="w-full gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Enlace de Invitación
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleEndCall}
                  className="w-full gap-2"
                  disabled={endCallMutation.isPending}
                >
                  <PhoneOff className="h-4 w-4" />
                  {endCallMutation.isPending ? 'Finalizando...' : 'Finalizar Llamada'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="w-full gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Enlace de Invitación
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Tips */}
          {!callActive && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Consejos para una mejor experiencia:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Asegúrate de tener buena conexión a internet</li>
                <li>Usa auriculares para mejor calidad de audio</li>
                <li>Busca un lugar tranquilo y bien iluminado</li>
                <li>Permite el acceso a cámara y micrófono cuando se solicite</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
