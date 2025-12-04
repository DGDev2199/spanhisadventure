import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Edit, ChevronLeft, ChevronRight, Download, FileImage, FileText } from 'lucide-react';
import { EditScheduleEventDialog } from '@/components/EditScheduleEventDialog';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  level: string | null;
  color: string;
  room_id: string | null;
  rooms?: { name: string } | null;
  teacher_id: string | null;
  tutor_id: string | null;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const EVENT_TYPE_COLORS = {
  class: 'bg-blue-100 border-blue-500 text-blue-900',
  tutoring: 'bg-green-100 border-green-500 text-green-900',
  activity: 'bg-purple-100 border-purple-500 text-purple-900',
  exam: 'bg-red-100 border-red-500 text-red-900',
  break: 'bg-gray-100 border-gray-500 text-gray-900',
};

interface WeeklyCalendarProps {
  canEdit?: boolean;
}

export const WeeklyCalendar = ({ canEdit = false }: WeeklyCalendarProps) => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `horario-semanal-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Horario exportado como PNG');
    } catch (error) {
      toast.error('Error al exportar horario');
    }
    setIsExporting(false);
  };

  const exportToPDF = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`horario-semanal-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Horario exportado como PDF');
    } catch (error) {
      toast.error('Error al exportar horario');
    }
    setIsExporting(false);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => setWeekOffset(prev => prev + 1),
    onSwipedRight: () => setWeekOffset(prev => Math.max(0, prev - 1)),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['schedule-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('schedule_events')
        .select(`
          *,
          rooms (name)
        `)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ScheduleEvent[];
    },
    enabled: !!user?.id,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('schedule-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_events',
        },
        () => {
          // Refetch events when changes occur
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getEventsForDayAndTime = (day: number, hour: number) => {
    if (!events) return [];
    
    return events.filter((event) => {
      const eventStart = parseInt(event.start_time.split(':')[0]);
      const eventEnd = parseInt(event.end_time.split(':')[0]);
      const eventMinutes = parseInt(event.start_time.split(':')[1]);
      
      return event.day_of_week === day && eventStart === hour;
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getEventDuration = (startTime: string, endTime: string) => {
    const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
    const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60;
    return end - start;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const getWeekLabel = () => {
    if (weekOffset === 0) return "Semana Actual";
    return `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendario Semanal
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPNG}
              disabled={isExporting}
              className="gap-1"
            >
              <FileImage className="h-4 w-4" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={isExporting}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
              disabled={weekOffset === 0}
              className="hidden md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              {getWeekLabel()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="hidden md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground md:hidden mt-2">
          Desliza para ver otras semanas
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto" {...handlers}>
        <div className="min-w-[800px]" ref={calendarRef}>
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-xs font-medium text-muted-foreground p-2">Hora</div>
            {DAYS.map((day, index) => (
              <div key={index} className="text-center text-sm font-semibold p-2 bg-primary/5 rounded-t-md">
                {day}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="space-y-1">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2">
                {/* Time label */}
                <div className="text-xs text-muted-foreground p-2 flex items-start">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Days */}
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const dayEvents = getEventsForDayAndTime(day, hour);
                  
                  return (
                    <div key={day} className="min-h-[60px] border rounded-md p-1 bg-white relative">
                      {dayEvents.map((event) => {
                        const duration = getEventDuration(event.start_time, event.end_time);
                        const height = duration * 60; // 60px per hour
                        
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 border-l-4 rounded px-2 py-1 text-xs group ${
                              EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.class
                            } ${canEdit ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                            style={{
                              minHeight: `${Math.max(height - 8, 40)}px`,
                              zIndex: 10,
                            }}
                            onClick={() => {
                              if (canEdit) {
                                setSelectedEvent(event);
                                setIsEditDialogOpen(true);
                              }
                            }}
                          >
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            <div className="font-semibold text-xs truncate">{event.title}</div>
                            <div className="text-xs opacity-75 truncate">
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </div>
                            {event.rooms && (
                              <div className="text-xs opacity-75 truncate">
                                📍 {event.rooms.name}
                              </div>
                            )}
                            {event.level && (
                              <div className="text-xs font-medium mt-1">
                                Nivel: {event.level}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
              <span>Clase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
              <span>Tutoría</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
              <span>Actividad</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-l-4 border-red-500 rounded"></div>
              <span>Examen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-l-4 border-gray-500 rounded"></div>
              <span>Descanso</span>
            </div>
          </div>
        </div>

        {events && events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay eventos programados para esta semana.
          </div>
        )}
      </CardContent>

      {selectedEvent && (
        <EditScheduleEventDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={selectedEvent}
        />
      )}
    </Card>
  );
};
