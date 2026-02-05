import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { PDFWatermarkOverlay } from '@/components/curriculum/PDFWatermarkOverlay';
import { usePdfObjectUrl } from '@/components/curriculum/usePdfObjectUrl';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  
  // Mobile PDF state
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { objectUrl, isLoading, error } = usePdfObjectUrl(pdfUrl, open);

  // Reset page when opening
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setScale(1);
    }
  }, [open]);

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
    
    toast.warning(t('curriculum.screenshotsNotAllowed', 'Capturas de pantalla no permitidas'), {
      description: t('curriculum.protectedContent', 'Este contenido está protegido.')
    });
    
    // Unblur after 2 seconds
    setTimeout(() => setIsBlurred(false), 2000);
  }, [t]);

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
      if (e.key?.toLowerCase() === 's' && e.shiftKey && e.metaKey) {
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

  // Detect tab visibility changes (some capture tools trigger visibility changes)
  useEffect(() => {
    if (!open) return;

    const onVis = () => {
      if (document.hidden) setIsBlurred(true);
    };

    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [open]);

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

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(2, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25));

  // Calculate page width for mobile
  const getPageWidth = () => {
    if (containerRef.current) {
      return (containerRef.current.clientWidth - 32) * scale;
    }
    return (window.innerWidth - 32) * scale;
  };

  // Build PDF URL with parameters to hide toolbar (desktop only)
  const securePdfUrl = objectUrl ? `${objectUrl}#toolbar=0&navpanes=0&scrollbar=1` : '';

  // Mobile: Render PDF with react-pdf
  const renderMobilePDFContent = () => (
    <div 
      ref={containerRef}
      className={cn(
        'flex-1 overflow-auto relative select-none transition-all duration-300',
        isBlurred && 'blur-xl pointer-events-none'
      )}
      onContextMenu={handleContextMenu}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-sm text-muted-foreground">
            {t('curriculum.loadingPdf', 'Cargando PDF…')}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <p className="text-base font-semibold mb-1">
              {t('curriculum.pdfLoadError', 'No se pudo cargar el PDF')}
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {objectUrl && !error && (
        <div className="flex flex-col items-center py-4">
          <Document
            file={objectUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="p-8 text-center text-muted-foreground">
                {t('curriculum.loadingDocument', 'Cargando documento...')}
              </div>
            }
            error={
              <div className="p-8 text-center text-destructive">
                {t('curriculum.pdfLoadError', 'Error al cargar el PDF')}
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={getPageWidth()}
              className="shadow-lg"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      )}

      {/* Watermark */}
      <PDFWatermarkOverlay userName={userName} currentTime={currentTime} />
    </div>
  );

  // Mobile navigation controls
  const renderMobileControls = () => (
    <div className="flex items-center justify-between gap-2 p-3 border-t bg-background/95 backdrop-blur-sm">
      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="h-9 w-9 touch-target"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
        <Button
          size="icon"
          variant="outline"
          onClick={zoomIn}
          disabled={scale >= 2}
          className="h-9 w-9 touch-target"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="h-10 w-10 touch-target"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {currentPage} / {numPages || '...'}
        </span>
        <Button
          size="icon"
          variant="outline"
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="h-10 w-10 touch-target"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // Desktop: Render PDF with iframe
  const renderDesktopPDFContent = (heightClass: string) => (
    <div
      className={cn(
        'relative flex-1 select-none transition-all duration-300 overflow-hidden',
        isBlurred && 'blur-xl pointer-events-none'
      )}
      style={{ minHeight: 0 }}
      onContextMenu={handleContextMenu}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">
            {t('curriculum.loadingPdf', 'Cargando PDF…')}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <p className="text-base font-semibold mb-1">
              {t('curriculum.pdfLoadError', 'No se pudo cargar el PDF')}
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {!!securePdfUrl && !error && (
        <iframe
          src={securePdfUrl}
          className={cn("w-full border-0", heightClass)}
          style={{
            pointerEvents: isBlurred ? 'none' : 'auto',
          }}
          title={title}
        />
      )}

      {/* Dynamic watermark overlay (logo + user/time) */}
      <PDFWatermarkOverlay userName={userName} currentTime={currentTime} />
    </div>
  );

  // Blur warning overlay
  const renderBlurOverlay = () => (
    isBlurred && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="text-center p-6 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">
            {t('curriculum.protectedContentTitle', 'Contenido Protegido')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('curriculum.returnToWindow', 'Regresa a esta ventana para continuar visualizando el documento.')}
          </p>
        </div>
      </div>
    )
  );

  // Mobile: Use Drawer from bottom with react-pdf
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
          <DrawerHeader className="p-3 pb-2 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <span className="inline-flex items-center gap-1 text-purple-600">
                <Shield className="h-3 w-3" />
                {t('curriculum.protectedContent', 'Contenido protegido')}
              </span>
              <span className="mx-1">•</span>
              {t('curriculum.readOnly', 'Solo lectura')}
            </p>
          </DrawerHeader>

          {renderMobilePDFContent()}
          {renderMobileControls()}
          {renderBlurOverlay()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog with iframe
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
              {t('curriculum.protectedContent', 'Contenido protegido')}
            </span>
            <span className="mx-1">•</span>
            {t('curriculum.readOnly', 'Solo lectura')}
          </p>
        </DialogHeader>

        {renderDesktopPDFContent("h-[calc(90vh-80px)]")}
        {renderBlurOverlay()}
      </DialogContent>
    </Dialog>
  );
}
