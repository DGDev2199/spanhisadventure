import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Edit, ChevronLeft, ChevronRight, FileImage, FileText, Plus, Info } from 'lucide-react';
import { EditScheduleEventDialog } from '@/components/EditScheduleEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
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
  teacher_id_2: string | null;
  tutor_id: string | null;
  tutor_id_2: string | null;
  teacher?: { full_name: string } | null;
  teacher2?: { full_name: string } | null;
  tutor?: { full_name: string } | null;
  tutor2?: { full_name: string } | null;
  // New detail fields
  details_info?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  elective_option_1?: string | null;
  elective_option_2?: string | null;
}

// Sin Domingo - Solo Lunes a Sábado
const DAYS_CONFIG = [
  { value: 0, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: 1, label: "Mar", fullLabel: "Martes", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: 2, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: 3, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: 4, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: 5, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Slots de 30 minutos (8:00 - 21:00)
const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  return { hour, minutes, label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` };
});

// Configuración de colores por tipo de evento
const EVENT_TYPE_CONFIG: Record<string, { label: string; emoji: string; bg: string; border: string; text: string }> = {
  class: { 
    label: 'Clase', 
    emoji: '📚', 
    bg: 'bg-blue-100 dark:bg-blue-900/40', 
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-200' 
  },
  tutoring: { 
    label: 'Práctica', 
    emoji: '👨‍🏫', 
    bg: 'bg-green-100 dark:bg-green-900/40', 
    border: 'border-green-500',
    text: 'text-green-900 dark:text-green-200' 
  },
  project: { 
    label: 'Proyecto', 
    emoji: '🎯', 
    bg: 'bg-violet-100 dark:bg-violet-900/40', 
    border: 'border-violet-500',
    text: 'text-violet-900 dark:text-violet-200' 
  },
  welcome: { 
    label: 'Bienvenida', 
    emoji: '👋', 
    bg: 'bg-amber-100 dark:bg-amber-900/40', 
    border: 'border-amber-500',
    text: 'text-amber-900 dark:text-amber-200' 
  },
  breakfast: { 
    label: 'Desayuno', 
    emoji: '🍳', 
    bg: 'bg-yellow-100 dark:bg-yellow-900/40', 
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-200' 
  },
  lunch: { 
    label: 'Almuerzo', 
    emoji: '🍽️', 
    bg: 'bg-orange-100 dark:bg-orange-900/40', 
    border: 'border-orange-500',
    text: 'text-orange-900 dark:text-orange-200' 
  },
  break: { 
    label: 'Descanso', 
    emoji: '☕', 
    bg: 'bg-gray-100 dark:bg-gray-800/40', 
    border: 'border-gray-400',
    text: 'text-gray-800 dark:text-gray-200' 
  },
  cultural: { 
    label: 'Act. Cultural', 
    emoji: '🎭', 
    bg: 'bg-purple-100 dark:bg-purple-900/40', 
    border: 'border-purple-500',
    text: 'text-purple-900 dark:text-purple-200' 
  },
  sports: { 
    label: 'Act. Deportiva', 
    emoji: '⚽', 
    bg: 'bg-red-100 dark:bg-red-900/40', 
    border: 'border-red-500',
    text: 'text-red-900 dark:text-red-200' 
  },
  adventure: { 
    label: 'Aventura', 
    emoji: '🏔️', 
    bg: 'bg-cyan-100 dark:bg-cyan-900/40', 
    border: 'border-cyan-500',
    text: 'text-cyan-900 dark:text-cyan-200' 
  },
  exchange: { 
    label: 'Intercambio', 
    emoji: '🌎', 
    bg: 'bg-pink-100 dark:bg-pink-900/40', 
    border: 'border-pink-500',
    text: 'text-pink-900 dark:text-pink-200' 
  },
  dance: { 
    label: 'Baile', 
    emoji: '💃', 
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', 
    border: 'border-fuchsia-500',
    text: 'text-fuchsia-900 dark:text-fuchsia-200' 
  },
  elective: { 
    label: 'Electiva', 
    emoji: '📖', 
    bg: 'bg-indigo-100 dark:bg-indigo-900/40', 
    border: 'border-indigo-500',
    text: 'text-indigo-900 dark:text-indigo-200' 
  },
};

// Helper para obtener posición vertical del evento (basado en slots de 30 min)
const getEventTopPosition = (startTime: string) => {
  const [h, m] = startTime.split(':').map(Number);
  const slotsFromStart = (h - 8) * 2 + Math.floor(m / 30);
  return slotsFromStart * 30; // 30px por slot de 30 min
};

// Helper para obtener altura del evento
const getEventHeight = (startTime: string, endTime: string) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const durationSlots = (endMinutes - startMinutes) / 30;
  return Math.max(durationSlots * 30, 30); // Mínimo 30px
};

interface WeeklyCalendarProps {
  canEdit?: boolean;
}

export const WeeklyCalendar = ({ canEdit = false }: WeeklyCalendarProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<ScheduleEvent | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMobileDay, setSelectedMobileDay] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const [isQuickEventOpen, setIsQuickEventOpen] = useState(false);
  const [quickEventData, setQuickEventData] = useState({ 
    startDay: 0, 
    endDay: 0, 
    startTime: '09:00', 
    endTime: '10:00' 
  });

  const handleDragCreate = useCallback((startDay: number, endDay: number, startTime: string, endTime: string) => {
    setQuickEventData({ startDay, endDay, startTime, endTime });
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
          rooms (name),
          teacher:profiles!schedule_events_teacher_id_fkey(full_name),
          teacher2:profiles!schedule_events_teacher_id_2_fkey(full_name),
          tutor:profiles!schedule_events_tutor_id_fkey(full_name),
          tutor2:profiles!schedule_events_tutor_id_2_fkey(full_name)
        `)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ScheduleEvent[];
    },
    enabled: !!user?.id,
  });

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

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    return events.filter((event) => event.day_of_week === day);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getEventTypeStyles = (eventType: string) => {
    const config = EVENT_TYPE_CONFIG[eventType];
    if (config) {
      return `${config.bg} ${config.border} ${config.text}`;
    }
    return EVENT_TYPE_CONFIG.class.bg + ' ' + EVENT_TYPE_CONFIG.class.border + ' ' + EVENT_TYPE_CONFIG.class.text;
  };

  const getEventTypeInfo = (eventType: string) => {
    return EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.class;
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
    const dayEvents = getEventsForDay(selectedMobileDay);

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

        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay eventos este día
            </div>
          ) : (
            dayEvents.map((event) => {
              const typeInfo = getEventTypeInfo(event.event_type);
              const hasDetails = event.details_info || event.attachment_url;
              
              return (
                <div
                  key={event.id}
                  className={cn(
                    "border-l-4 rounded-lg px-3 py-2 text-sm",
                    getEventTypeStyles(event.event_type),
                    "cursor-pointer active:scale-[0.98] transition-transform"
                  )}
                  onClick={() => {
                    if (canEdit) {
                      setSelectedEvent(event);
                      setIsEditDialogOpen(true);
                    } else {
                      // Students see details dialog
                      setDetailsEvent(event);
                      setIsDetailsDialogOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeInfo.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                    </div>
                  </div>
                  {event.rooms && (
                    <div className="text-xs opacity-75 mt-1">📍 {event.rooms.name}</div>
                  )}
                  {event.level && (
                    <div className="text-xs font-medium mt-1">Nivel: {event.level}</div>
                  )}
                  {(event.teacher || event.teacher2 || event.tutor || event.tutor2) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {event.teacher && (
                        <span className="text-[10px] bg-blue-200/50 dark:bg-blue-800/30 px-1.5 py-0.5 rounded">
                          👨‍🏫 {event.teacher.full_name?.split(' ')[0]}
                        </span>
                      )}
                      {event.teacher2 && (
                        <span className="text-[10px] bg-blue-200/50 dark:bg-blue-800/30 px-1.5 py-0.5 rounded">
                          👨‍🏫 {event.teacher2.full_name?.split(' ')[0]}
                        </span>
                      )}
                      {event.tutor && (
                        <span className="text-[10px] bg-green-200/50 dark:bg-green-800/30 px-1.5 py-0.5 rounded">
                          🎓 {event.tutor.full_name?.split(' ')[0]}
                        </span>
                      )}
                      {event.tutor2 && (
                        <span className="text-[10px] bg-green-200/50 dark:bg-green-800/30 px-1.5 py-0.5 rounded">
                          🎓 {event.tutor2.full_name?.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Desktop full calendar view con slots de 30 min
  const renderDesktopCalendar = () => (
    <div ref={calendarRef} className="bg-background">
      {/* Header - 7 columnas (hora + 6 días) */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        <div className="text-xs font-medium text-muted-foreground p-2">Hora</div>
        {DAYS.map((day, index) => (
          <div key={index} className="text-center text-sm font-semibold p-2 bg-primary/5 rounded-t-md">
            <span className="hidden lg:inline">{day}</span>
            <span className="lg:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Time slots - ahora cada slot es 30 min */}
      <div className="relative">
        {TIME_SLOTS.map((slot, slotIndex) => {
          const isHourMark = slot.minutes === 0;
          
          return (
            <div key={slotIndex} className="grid grid-cols-7 gap-1" style={{ height: '30px' }}>
              {/* Time label - solo mostrar en horas completas */}
              <div className="text-xs text-muted-foreground px-2 flex items-start">
                {isHourMark && (
                  <span className="text-[11px]">{slot.label}</span>
                )}
              </div>

              {/* Days - 6 columnas para Lun-Sáb */}
              {[0, 1, 2, 3, 4, 5].map((day) => {
                // Detectar selección rectangular (multi-día)
                const isInSelection = () => {
                  if (!selectionStart || !selectionEnd) return false;
                  const minDay = Math.min(selectionStart.day, selectionEnd.day);
                  const maxDay = Math.max(selectionStart.day, selectionEnd.day);
                  const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
                  const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
                  return day >= minDay && day <= maxDay && slot.hour >= minHour && slot.hour <= maxHour;
                };
                
                const inSelection = canEdit && isInSelection();
                const isSelectionStart = selectionStart?.day === day && selectionStart?.hour === slot.hour && slot.minutes === 0;
                
                return (
                  <div
                    key={day}
                    className={cn(
                      "border-t border-border/30 relative",
                      isHourMark && "border-t-border/60",
                      canEdit && "cursor-crosshair hover:bg-primary/5",
                      inSelection && "bg-primary/20"
                    )}
                    onMouseDown={(e) => {
                      if (canEdit && e.button === 0) {
                        e.preventDefault();
                        handleMouseDown(day, slot.hour);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isSelecting && canEdit) {
                        handleMouseEnter(day, slot.hour);
                      }
                    }}
                  >
                    {inSelection && isSelectionStart && (
                      <div className="absolute inset-0 bg-primary/30 border-2 border-dashed border-primary flex items-center justify-center z-20">
                        <div className="text-xs font-medium text-primary bg-background/80 px-2 py-0.5 rounded">
                          <Plus className="h-3 w-3 inline mr-1" />
                          {slot.label}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Overlay de eventos con posicionamiento absoluto */}
        {[0, 1, 2, 3, 4, 5].map((day) => {
          const dayEvents = getEventsForDay(day);
          
          return dayEvents.map((event) => {
            const top = getEventTopPosition(event.start_time);
            const height = getEventHeight(event.start_time, event.end_time);
            const typeInfo = getEventTypeInfo(event.event_type);
            // Calcular posición horizontal: columna 1 + ancho de columna * día
            // El grid tiene 7 columnas, la primera es la hora
            const leftPercent = ((day + 1) / 7) * 100;
            const widthPercent = (1 / 7) * 100;
            
            return (
              <div
                key={event.id}
                className={cn(
                  "absolute border-l-4 rounded px-1.5 py-1 text-xs group overflow-hidden",
                  getEventTypeStyles(event.event_type),
                  'cursor-pointer hover:shadow-lg transition-shadow hover:z-30'
                )}
                style={{
                  top: `${top}px`,
                  height: `${height - 2}px`,
                  left: `calc(${leftPercent}% + 2px)`,
                  width: `calc(${widthPercent}% - 6px)`,
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit) {
                    setSelectedEvent(event);
                    setIsEditDialogOpen(true);
                  } else {
                    // Students see details dialog
                    setDetailsEvent(event);
                    setIsDetailsDialogOpen(true);
                  }
                }}
              >
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-0 right-0 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-sm">{typeInfo.emoji}</span>
                  <span className="font-semibold truncate text-[11px]">{event.title}</span>
                </div>
                {height > 40 && (
                  <div className="text-[10px] opacity-75 truncate">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </div>
                )}
                {height > 60 && event.rooms && (
                  <div className="text-[10px] opacity-75 truncate">
                    📍 {event.rooms.name}
                  </div>
                )}
                {height > 75 && event.level && (
                  <div className="text-[10px] font-medium">
                    {event.level}
                  </div>
                )}
                {height > 90 && (event.teacher || event.teacher2 || event.tutor || event.tutor2) && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {event.teacher && (
                      <span className="text-[9px] bg-blue-200/50 dark:bg-blue-800/30 px-1 py-0.5 rounded truncate max-w-[60px]">
                        👨‍🏫 {event.teacher.full_name?.split(' ')[0]}
                      </span>
                    )}
                    {event.teacher2 && (
                      <span className="text-[9px] bg-blue-200/50 dark:bg-blue-800/30 px-1 py-0.5 rounded truncate max-w-[60px]">
                        👨‍🏫 {event.teacher2.full_name?.split(' ')[0]}
                      </span>
                    )}
                    {event.tutor && (
                      <span className="text-[9px] bg-green-200/50 dark:bg-green-800/30 px-1 py-0.5 rounded truncate max-w-[60px]">
                        🎓 {event.tutor.full_name?.split(' ')[0]}
                      </span>
                    )}
                    {event.tutor2 && (
                      <span className="text-[9px] bg-green-200/50 dark:bg-green-800/30 px-1 py-0.5 rounded truncate max-w-[60px]">
                        🎓 {event.tutor2.full_name?.split(' ')[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded border-l-2", config.bg, config.border)} />
              <span>{config.emoji} {config.label}</span>
            </div>
          ))}
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

      <QuickEventDialog
        open={isQuickEventOpen}
        onOpenChange={setIsQuickEventOpen}
        initialStartDay={quickEventData.startDay}
        initialEndDay={quickEventData.endDay}
        initialStartTime={quickEventData.startTime}
        initialEndTime={quickEventData.endTime}
      />

      <EventDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        event={detailsEvent}
      />
    </Card>
  );
};
