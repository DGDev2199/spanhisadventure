import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignScheduleEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  teacherId?: string;
  tutorId?: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function AssignScheduleEventsDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  teacherId,
  tutorId,
}: AssignScheduleEventsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  // Fetch current assignments
  const { data: currentAssignments } = useQuery({
    queryKey: ['student-schedule-assignments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_schedule_assignments')
        .select('schedule_event_id')
        .eq('student_id', studentId);

      if (error) throw error;
      return data?.map(a => a.schedule_event_id) || [];
    },
    enabled: open,
  });

  // Fetch available schedule events for the student's teacher and tutor
  const { data: availableEvents, isLoading } = useQuery({
    queryKey: ['available-schedule-events', teacherId, tutorId],
    queryFn: async () => {
      let query = supabase
        .from('schedule_events')
        .select(`
          *,
          rooms(name)
        `)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      // Filter by teacher or tutor
      if (teacherId || tutorId) {
        const conditions = [];
        if (teacherId) conditions.push(`teacher_id.eq.${teacherId}`);
        if (tutorId) conditions.push(`tutor_id.eq.${tutorId}`);
        
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && (!!teacherId || !!tutorId),
  });

  // Initialize selected events with current assignments
  useState(() => {
    if (currentAssignments) {
      setSelectedEvents(new Set(currentAssignments));
    }
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Delete existing assignments
      await supabase
        .from('student_schedule_assignments')
        .delete()
        .eq('student_id', studentId);

      // Insert new assignments
      if (selectedEvents.size > 0) {
        const assignments = Array.from(selectedEvents).map(eventId => ({
          student_id: studentId,
          schedule_event_id: eventId,
          assigned_by: user.id,
        }));

        const { error } = await supabase
          .from('student_schedule_assignments')
          .insert(assignments);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-schedule-assignments', studentId] });
      toast.success('Horarios asignados exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const toggleEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Asignar Horarios a {studentName}
          </DialogTitle>
          <DialogDescription>
            Selecciona los eventos del horario semanal que corresponden a este estudiante
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : availableEvents && availableEvents.length > 0 ? (
            <div className="space-y-4">
              {DAYS.map((day, dayIndex) => {
                const dayEvents = availableEvents.filter(e => e.day_of_week === dayIndex);
                if (dayEvents.length === 0) return null;

                return (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{day}</h3>
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={event.id}
                            checked={selectedEvents.has(event.id)}
                            onCheckedChange={() => toggleEvent(event.id)}
                          />
                          <Label
                            htmlFor={event.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                              </span>
                              {event.rooms && (
                                <span>📍 {event.rooms.name}</span>
                              )}
                              {event.level && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                                  {event.level}
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {!teacherId && !tutorId
                ? 'Primero debes asignar un profesor o tutor al estudiante.'
                : 'No hay eventos disponibles en el horario para el profesor/tutor asignado.'}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending || (!teacherId && !tutorId)}
          >
            {assignMutation.isPending ? 'Guardando...' : 'Guardar Asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}