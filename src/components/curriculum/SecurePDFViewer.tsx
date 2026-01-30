import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SecurePDFViewerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  userName: string;
}

export default function SecurePDFViewer({
  open,
  onClose,
  pdfUrl,
  title,
  userName,
}: SecurePDFViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  // Update timestamp every minute
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 60000);

    return () => clearInterval(interval);
  }, [open]);

  // Handle screenshot attempts - intercept PrintScreen key
  const handleScreenshotAttempt = useCallback(() => {
    setIsBlurred(true);
    
    // Try to clear clipboard
    navigator.clipboard.writeText('Contenido protegido').catch(() => {});
    
    toast.warning('Capturas de pantalla no permitidas', {
      description: 'Este contenido está protegido.'
    });
    
    // Unblur after 2 seconds
    setTimeout(() => setIsBlurred(false), 2000);
  }, []);

  // Detect PrintScreen key and other screenshot shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key (keyCode 44 or key 'PrintScreen')
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotAttempt();
        return false;
      }
      
      // Windows Snipping Tool (Win + Shift + S)
      if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotAttempt();
        return false;
      }
      
      // Mac screenshot (Cmd + Shift + 3 or 4)
      if ((e.key === '3' || e.key === '4') && e.shiftKey && e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotAttempt();
        return false;
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyDown, true);
    };
  }, [open, handleScreenshotAttempt]);

  // Detect window blur (possible screenshot attempt via external tool)
  useEffect(() => {
    if (!open) return;

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [open]);

  // Prevent right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Build PDF URL with parameters to hide toolbar
  const securePdfUrl = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-5xl w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden print:hidden"
        onContextMenu={handleContextMenu}
      >
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </DialogTitle>
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-flex items-center gap-1 text-purple-600">
              <Shield className="h-3 w-3" />
              Contenido protegido
            </span>
            <span className="mx-1">•</span>
            Solo lectura
          </p>
        </DialogHeader>

        <div
          className={cn(
            'relative flex-1 select-none transition-all duration-300 overflow-hidden',
            isBlurred && 'blur-xl pointer-events-none'
          )}
          style={{ minHeight: 0 }}
        >
          {/* PDF iframe */}
          <iframe
            src={securePdfUrl}
            className="w-full h-full border-0"
            style={{ 
              height: 'calc(90vh - 80px)',
              pointerEvents: isBlurred ? 'none' : 'auto' 
            }}
            title={title}
          />

          {/* Dynamic watermark overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div 
              className="text-center opacity-[0.08] select-none"
              style={{ transform: 'rotate(-30deg)' }}
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
                {userName}
              </p>
              <p className="text-sm sm:text-base md:text-lg text-foreground mt-1">
                {currentTime}
              </p>
              <p className="text-xs sm:text-sm text-foreground mt-1">
                Solo lectura - Contenido protegido
              </p>
            </div>
          </div>

          {/* Secondary watermarks for better coverage */}
          <div className="absolute top-8 left-8 pointer-events-none opacity-[0.05] select-none">
            <p className="text-lg font-semibold text-foreground">{userName}</p>
          </div>
          <div className="absolute bottom-8 right-8 pointer-events-none opacity-[0.05] select-none">
            <p className="text-lg font-semibold text-foreground">{userName}</p>
          </div>
        </div>

        {/* Blur warning overlay */}
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="text-center p-6 max-w-sm">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Contenido Protegido</p>
              <p className="text-sm text-muted-foreground">
                Regresa a esta ventana para continuar visualizando el documento.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
