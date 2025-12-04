import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, VideoOff, Mic, MicOff, PhoneOff, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantName: string;
  participantAvatar?: string | null;
  participantRole: 'teacher' | 'tutor' | 'student';
  roomId?: string;
}

export const VideoCallDialog = ({
  open,
  onOpenChange,
  participantName,
  participantAvatar,
  participantRole,
  roomId
}: VideoCallDialogProps) => {
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a unique room name based on participants
  const generateRoomName = () => {
    if (roomId) return roomId;
    // Create a deterministic room name based on user IDs
    const baseRoom = `spanish-adventure-${user?.id?.slice(0, 8)}`;
    return baseRoom;
  };

  const jitsiRoomName = generateRoomName();
  const jitsiUrl = `https://meet.jit.si/${jitsiRoomName}`;

  const handleJoinCall = () => {
    setIsJoining(true);
    // Open Jitsi in a new window
    window.open(jitsiUrl, '_blank', 'width=1200,height=800');
    setTimeout(() => setIsJoining(false), 2000);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Videollamada
          </DialogTitle>
          <DialogDescription>
            Inicia una videollamada con {participantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Participant Info */}
          <div className="flex items-center justify-center">
            <div className="text-center space-y-3">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
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
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>La videollamada se abrirá en una nueva ventana.</p>
            <p>Comparte el enlace con tu {participantRole === 'student' ? 'estudiante' : 'profesor/tutor'} para que pueda unirse.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
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
          </div>

          {/* Tips */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Consejos para una mejor experiencia:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Asegúrate de tener buena conexión a internet</li>
              <li>Usa auriculares para mejor calidad de audio</li>
              <li>Busca un lugar tranquilo y bien iluminado</li>
              <li>Permite el acceso a cámara y micrófono cuando se solicite</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
