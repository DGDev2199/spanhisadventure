import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Edit } from 'lucide-react';
import { EditScheduleEventDialog } from '@/components/EditScheduleEventDialog';
import { Button } from '@/components/ui/button';

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

export const WeeklyCalendar = () => {
  const { user, userRole } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const isAdmin = userRole === 'admin';

  const { data: events, isLoading } = useQuery({
    queryKey: ['schedule-events', user?.id, userRole],
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horario Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
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
                            } ${isAdmin ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                            style={{
                              minHeight: `${Math.max(height - 8, 40)}px`,
                              zIndex: 10,
                            }}
                            onClick={() => {
                              if (isAdmin) {
                                setSelectedEvent(event);
                                setIsEditDialogOpen(true);
                              }
                            }}
                          >
                            {isAdmin && (
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
