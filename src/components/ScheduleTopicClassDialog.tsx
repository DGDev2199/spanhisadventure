import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Clock, Calendar as CalendarIcon, User } from 'lucide-react';

interface ScheduleTopicClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
];

export const ScheduleTopicClassDialog = ({
  open,
  onOpenChange,
  topicId,
  topicTitle,
  studentId,
  studentName,
  teacherId
}: ScheduleTopicClassDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const [notes, setNotes] = useState('');

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error('Selecciona fecha y hora');
      }

      const dayOfWeek = selectedDate.getDay();
      const durationMinutes = parseInt(duration);
      
      // Calculate end time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Create schedule event with topic reference
      const { data: event, error: eventError } = await supabase
        .from('schedule_events')
        .insert({
          title: `Clase: ${topicTitle}`,
          description: notes || `Clase sobre ${topicTitle} con ${studentName}`,
          day_of_week: dayOfWeek,
          start_time: selectedTime,
          end_time: endTime,
          event_type: 'class',
          teacher_id: teacherId,
          topic_id: topicId,
          created_by: teacherId,
          is_active: true
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Also assign the student to this event
      const { error: assignError } = await supabase
        .from('student_schedule_assignments')
        .insert({
          schedule_event_id: event.id,
          student_id: studentId,
          assigned_by: teacherId
        });

      if (assignError) {
        console.error('Error assigning student:', assignError);
      }

      // Create a notification for the student
      const formattedDate = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
      await supabase.rpc('create_notification', {
        p_user_id: studentId,
        p_title: 'Nueva Clase Programada',
        p_message: `Tu profesor ha programado una clase sobre "${topicTitle}" para el ${formattedDate} a las ${selectedTime}`,
        p_type: 'schedule',
        p_related_id: event.id
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      queryClient.invalidateQueries({ queryKey: ['student-schedule-assignments'] });
      toast.success('Clase programada exitosamente');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al programar la clase');
    }
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setDuration('60');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error('Selecciona una fecha');
      return;
    }
    if (!selectedTime) {
      toast.error('Selecciona una hora');
      return;
    }
    createEventMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Programar Clase
          </DialogTitle>
          <DialogDescription>
            Programa una clase sobre el tema seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Topic Info */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium">Tema: {topicTitle}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3" /> {studentName}
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4" />
              Fecha
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Hora
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Duración</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-2 block">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones o notas para el estudiante..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? 'Programando...' : 'Programar Clase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
