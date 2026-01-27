import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Edit, ChevronLeft, ChevronRight, FileImage, FileText, Plus } from 'lucide-react';
import { EditScheduleEventDialog } from '@/components/EditScheduleEventDialog';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { DaySelector } from '@/components/ui/day-selector';
import { cn } from '@/lib/utils';
import { useCalendarDrag, QuickEventDialog } from '@/components/calendar';

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

const DAYS_CONFIG = [
  { value: 0, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: 1, label: "Mar", fullLabel: "Martes", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: 2, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: 3, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: 4, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: 5, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: 6, label: "Dom", fullLabel: "Domingo", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const EVENT_TYPE_COLORS = {
  class: 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
  tutoring: 'bg-green-100 border-green-500 text-green-900 dark:bg-green-900/30 dark:text-green-300',
  activity: 'bg-purple-100 border-purple-500 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300',
  exam: 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900/30 dark:text-red-300',
  break: 'bg-gray-100 border-gray-500 text-gray-900 dark:bg-gray-900/30 dark:text-gray-300',
};

interface WeeklyCalendarProps {
  canEdit?: boolean;
}

export const WeeklyCalendar = ({ canEdit = false }: WeeklyCalendarProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMobileDay, setSelectedMobileDay] = useState(0); // Monday
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Quick event creation state
  const [isQuickEventOpen, setIsQuickEventOpen] = useState(false);
  const [quickEventData, setQuickEventData] = useState({ day: 0, startTime: '09:00', endTime: '10:00' });

  // Drag-to-create hook
  const handleDragCreate = useCallback((day: number, startTime: string, endTime: string) => {
    setQuickEventData({ day, startTime, endTime });
    setIsQuickEventOpen(true);
  }, []);

  const {
    isSelecting,
    selectionStart,
    selectionEnd,
    handleMouseDown,
    handleMouseEnter,
  } = useCalendarDrag({ onCreateEvent: handleDragCreate });

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

  const weekHandlers = useSwipeable({
    onSwipedLeft: () => setWeekOffset(prev => prev + 1),
    onSwipedRight: () => setWeekOffset(prev => Math.max(0, prev - 1)),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  const dayHandlers = useSwipeable({
    onSwipedLeft: () => {
      setSelectedMobileDay(prev => prev < DAYS_CONFIG.length - 1 ? prev + 1 : 0);
    },
    onSwipedRight: () => {
      setSelectedMobileDay(prev => prev > 0 ? prev - 1 : DAYS_CONFIG.length - 1);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  const { data: events, isLoading, refetch } = useQuery({
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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const getEventsForDayAndTime = (day: number, hour: number) => {
    if (!events) return [];
    
    return events.filter((event) => {
      const eventStart = parseInt(event.start_time.split(':')[0]);
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

  // Mobile single-day view
  const renderMobileCalendar = () => {
    const currentDayInfo = DAYS_CONFIG[selectedMobileDay];

    return (
      <div {...dayHandlers} className="space-y-4 px-1">
        <DaySelector
          days={DAYS_CONFIG}
          selectedDay={selectedMobileDay}
          onSelectDay={setSelectedMobileDay}
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Desliza para cambiar de día
        </p>

        <div className="space-y-1">
          {HOURS.map((hour) => {
            const dayEvents = getEventsForDayAndTime(selectedMobileDay, hour);
            
            return (
              <div key={hour} className="flex gap-2 items-stretch">
                <div className="w-12 text-xs text-muted-foreground py-2 flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[50px] border rounded-md p-1 bg-background relative">
                  {dayEvents.map((event) => {
                    const duration = getEventDuration(event.start_time, event.end_time);
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "border-l-4 rounded px-2 py-1.5 text-xs group",
                          EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.class,
                          canEdit ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
                        )}
                        onClick={() => {
                          if (canEdit) {
                            setSelectedEvent(event);
                            setIsEditDialogOpen(true);
                          }
                        }}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-xs opacity-75">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </div>
                        {event.rooms && (
                          <div className="text-xs opacity-75">
                            📍 {event.rooms.name}
                          </div>
                        )}
                        {event.level && (
                          <div className="text-xs font-medium">
                            Nivel: {event.level}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Desktop full calendar view
  const renderDesktopCalendar = () => (
    <div ref={calendarRef} className="bg-background">
      {/* Header with days */}
      <div className="grid grid-cols-8 gap-2 mb-2">
        <div className="text-xs font-medium text-muted-foreground p-2">Hora</div>
        {DAYS.map((day, index) => (
          <div key={index} className="text-center text-sm font-semibold p-2 bg-primary/5 rounded-t-md">
            <span className="hidden lg:inline">{day}</span>
            <span className="lg:hidden">{day.slice(0, 3)}</span>
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
              
              // Check if this cell is part of the current selection
              const isInSelection = () => {
                if (!selectionStart || !selectionEnd) return false;
                if (selectionStart.day !== day || selectionEnd.day !== day) return false;
                const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
                const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
                return hour >= minHour && hour <= maxHour;
              };
              
              const inSelection = canEdit && isInSelection();
              const isSelectionStart = selectionStart?.day === day && selectionStart?.hour === hour;
              
              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[60px] border rounded-md p-1 bg-background relative transition-colors duration-100",
                    canEdit && !dayEvents.length && "cursor-crosshair hover:bg-primary/5",
                    inSelection && "bg-primary/20 border-primary"
                  )}
                  onMouseDown={(e) => {
                    if (canEdit && e.button === 0 && !dayEvents.length) {
                      e.preventDefault();
                      handleMouseDown(day, hour);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isSelecting && canEdit) {
                      handleMouseEnter(day, hour);
                    }
                  }}
                >
                  {/* Selection preview overlay */}
                  {inSelection && !dayEvents.length && (
                    <div className="absolute inset-1 bg-primary/30 rounded border-2 border-dashed border-primary flex items-center justify-center z-20">
                      {isSelectionStart && (
                        <div className="text-xs font-medium text-primary bg-background/80 px-2 py-0.5 rounded">
                          <Plus className="h-3 w-3 inline mr-1" />
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      )}
                    </div>
                  )}
                  
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
                        onClick={(e) => {
                          e.stopPropagation();
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

      {/* Legend and Instructions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs">
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
        
        {canEdit && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full flex items-center gap-2">
            <Plus className="h-3 w-3" />
            <span>Arrastra sobre celdas vacías para crear eventos</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-5 w-5" />
            Calendario Semanal
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {!isMobile && (
              <>
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
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto" {...(isMobile ? {} : weekHandlers)}>
        {isMobile ? renderMobileCalendar() : renderDesktopCalendar()}

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

      {/* Quick Event Dialog for drag-to-create */}
      <QuickEventDialog
        open={isQuickEventOpen}
        onOpenChange={setIsQuickEventOpen}
        initialDay={quickEventData.day}
        initialStartTime={quickEventData.startTime}
        initialEndTime={quickEventData.endTime}
      />
    </Card>
  );
};
