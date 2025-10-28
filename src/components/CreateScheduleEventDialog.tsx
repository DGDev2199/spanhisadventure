import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  { value: '6', label: 'Domingo' },
];

const EVENT_TYPES = [
  { value: 'class', label: 'Clase' },
  { value: 'tutoring', label: 'Tutoría' },
  { value: 'activity', label: 'Actividad' },
  { value: 'exam', label: 'Examen' },
  { value: 'break', label: 'Descanso' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CreateScheduleEventDialog = ({ open, onOpenChange }: CreateScheduleEventDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('class');
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [level, setLevel] = useState('none');
  const [roomId, setRoomId] = useState('none');
  const [teacherId, setTeacherId] = useState('none');
  const [tutorId, setTutorId] = useState('none');

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
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');
      
      if (rolesError) throw rolesError;
      
      const userIds = rolesData.map(r => r.user_id);
      if (userIds.length === 0) return [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const { data: tutors } = useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tutor');
      
      if (rolesError) throw rolesError;
      
      const userIds = rolesData.map(r => r.user_id);
      if (userIds.length === 0) return [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      if (!title || !eventType) throw new Error('Fill required fields');

      const { error } = await supabase.from('schedule_events').insert({
        title,
        description: description || null,
        event_type: eventType,
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        level: level === 'none' ? null : level,
        room_id: roomId === 'none' ? null : roomId,
        teacher_id: teacherId === 'none' ? null : teacherId,
        tutor_id: tutorId === 'none' ? null : tutorId,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      toast.success('Evento creado exitosamente');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear evento');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventType('class');
    setDayOfWeek('0');
    setStartTime('09:00');
    setEndTime('10:00');
    setLevel('none');
    setRoomId('none');
    setTeacherId('none');
    setTutorId('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Crear Evento de Horario</DialogTitle>
          <DialogDescription className="text-sm">
            Agrega un nuevo evento al horario semanal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          <div>
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Clase de Gramática - A2"
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Evento *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Día de la Semana *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora de Inicio *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <Label>Hora de Fin *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nivel (opcional)</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los niveles</SelectItem>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Habitación (opcional)</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona habitación..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin habitación</SelectItem>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {eventType === 'class' && (
            <div>
              <Label>Profesor (opcional)</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona profesor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin profesor asignado</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {eventType === 'tutoring' && (
            <div>
              <Label>Tutor (opcional)</Label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tutor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tutor asignado</SelectItem>
                  {tutors?.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!title || createEventMutation.isPending}
              className="w-full sm:flex-1"
            >
              {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
