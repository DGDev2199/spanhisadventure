import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, FileText, Shield, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SecurePDFViewer from '@/components/curriculum/SecurePDFViewer';
import { useTranslation } from 'react-i18next';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  level: string | null;
  details_info?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  elective_option_1?: string | null;
  elective_option_2?: string | null;
  rooms?: { name: string } | null;
  teacher?: { full_name: string } | null;
  teacher2?: { full_name: string } | null;
  tutor?: { full_name: string } | null;
  tutor2?: { full_name: string } | null;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const EVENT_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  class: { label: 'Clase', emoji: '📚' },
  tutoring: { label: 'Práctica', emoji: '👨‍🏫' },
  project: { label: 'Proyecto', emoji: '🎯' },
  welcome: { label: 'Bienvenida', emoji: '👋' },
  breakfast: { label: 'Desayuno', emoji: '🍳' },
  lunch: { label: 'Almuerzo', emoji: '🍽️' },
  break: { label: 'Descanso', emoji: '☕' },
  cultural: { label: 'Act. Cultural', emoji: '🎭' },
  sports: { label: 'Act. Deportiva', emoji: '⚽' },
  adventure: { label: 'Aventura', emoji: '🏔️' },
  exchange: { label: 'Intercambio', emoji: '🌎' },
  dance: { label: 'Baile', emoji: '💃' },
  elective: { label: 'Electiva', emoji: '📖' },
};

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent | null;
}

export const EventDetailsDialog = ({ open, onOpenChange, event }: EventDetailsDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  if (!event) return null;

  const typeInfo = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.class;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const handleViewPdf = async () => {
    if (!event.attachment_url) return;
    
    setIsPdfLoading(true);
    try {
      // Get signed URL from materials bucket
      const path = event.attachment_url.replace('materials/', '');
      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(path, 3600);
      
      if (error) throw error;
      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
    setIsPdfLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{typeInfo.emoji}</span>
              {event.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm">
              <span className="font-medium">{DAYS[event.day_of_week]}</span>
              <span>•</span>
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Basic description */}
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}

            {/* Detailed information */}
            {event.details_info && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Información Importante
                </h4>
                <p className="text-sm whitespace-pre-wrap">{event.details_info}</p>
              </div>
            )}

            {/* PDF attachment */}
            {event.attachment_url && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewPdf}
                disabled={isPdfLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isPdfLoading ? 'Cargando...' : (event.attachment_name || 'Ver documento')}
                <Shield className="h-4 w-4 ml-auto text-purple-600" />
              </Button>
            )}

            {/* Level badge */}
            {event.level && (
              <Badge variant="secondary" className="text-xs">
                Nivel: {event.level}
              </Badge>
            )}

            {/* Staff assigned */}
            {(event.teacher || event.teacher2 || event.tutor || event.tutor2) && (
              <div className="flex flex-wrap gap-2">
                {event.teacher && (
                  <Badge variant="secondary">
                    👨‍🏫 {event.teacher.full_name}
                  </Badge>
                )}
                {event.teacher2 && (
                  <Badge variant="secondary">
                    👨‍🏫 {event.teacher2.full_name}
                  </Badge>
                )}
                {event.tutor && (
                  <Badge variant="secondary">
                    🎓 {event.tutor.full_name}
                  </Badge>
                )}
                {event.tutor2 && (
                  <Badge variant="secondary">
                    🎓 {event.tutor2.full_name}
                  </Badge>
                )}
              </div>
            )}

            {/* Room */}
            {event.rooms && (
              <p className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {event.rooms.name}
              </p>
            )}

            {/* Elective options display */}
            {event.event_type === 'elective' && (event.elective_option_1 || event.elective_option_2) && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Opciones de Electiva</h4>
                <div className="space-y-2 text-sm">
                  {event.elective_option_1 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">1.</span>
                      <span>{event.elective_option_1}</span>
                    </div>
                  )}
                  {event.elective_option_2 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">2.</span>
                      <span>{event.elective_option_2}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Secure PDF Viewer */}
      <SecurePDFViewer
        open={!!pdfUrl}
        onClose={() => setPdfUrl(null)}
        pdfUrl={pdfUrl || ''}
        title={event.attachment_name || event.title}
        userName={user?.email || 'Estudiante'}
      />
    </>
  );
};
