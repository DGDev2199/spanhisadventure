import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface EditScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
}

export const EditScheduleEventDialog = ({ open, onOpenChange, event }: EditScheduleEventDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [level, setLevel] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setEventType(event.event_type || '');
      setDayOfWeek(event.day_of_week?.toString() || '');
      setStartTime(event.start_time || '');
      setEndTime(event.end_time || '');
      setRoomId(event.room_id || 'none');
      setTeacherId(event.teacher_id || 'none');
      setTutorId(event.tutor_id || 'none');
      setLevel(event.level || 'none');
      setColor(event.color || '#3b82f6');
    }
  }, [event]);

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles:user_id(full_name)')
        .eq('role', 'teacher');
      if (error) throw error;
      return data;
    }
  });

  const { data: tutors } = useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles:user_id(full_name)')
        .eq('role', 'tutor');
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('schedule_events')
        .update({
          title,
          description,
          event_type: eventType,
          day_of_week: parseInt(dayOfWeek),
          start_time: startTime,
          end_time: endTime,
          room_id: roomId === 'none' ? null : roomId,
          teacher_id: teacherId === 'none' ? null : teacherId,
          tutor_id: tutorId === 'none' ? null : tutorId,
          level: level === 'none' ? null : level,
          color
        })
        .eq('id', event.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      toast({ title: 'Evento actualizado exitosamente' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error al actualizar evento', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', event.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      toast({ title: 'Evento eliminado exitosamente' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error al eliminar evento', variant: 'destructive' });
    }
  });

  const days = [
    { value: '0', label: 'Lunes' },
    { value: '1', label: 'Martes' },
    { value: '2', label: 'Miércoles' },
    { value: '3', label: 'Jueves' },
    { value: '4', label: 'Viernes' },
    { value: '5', label: 'Sábado' },
    { value: '6', label: 'Domingo' }
  ];

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento del Calendario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Tipo de Evento *</Label>
              <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Ej: Clase, Tutoría" />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Día de la Semana *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nivel</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin nivel específico</SelectItem>
                  {levels.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora de Inicio *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Hora de Fin *</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Sala</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sala</SelectItem>
                {rooms?.map((room: any) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Profesor</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin profesor</SelectItem>
                  {teachers?.map((teacher: any) => (
                    <SelectItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tutor</Label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tutor</SelectItem>
                  {tutors?.map((tutor: any) => (
                    <SelectItem key={tutor.user_id} value={tutor.user_id}>
                      {tutor.profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={!title || !eventType || !dayOfWeek || !startTime || !endTime || updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
