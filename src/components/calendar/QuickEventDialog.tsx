import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDay: number;
  initialStartTime: string;
  initialEndTime: string;
}

// Sin Domingo
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const EVENT_TYPES = [
  { value: 'class', label: 'Clase', emoji: '📚' },
  { value: 'tutoring', label: 'Práctica', emoji: '👨‍🏫' },
  { value: 'breakfast', label: 'Desayuno', emoji: '🍳' },
  { value: 'lunch', label: 'Almuerzo', emoji: '🍽️' },
  { value: 'break', label: 'Descanso', emoji: '☕' },
  { value: 'cultural', label: 'Cultural', emoji: '🎭' },
  { value: 'sports', label: 'Deportiva', emoji: '⚽' },
  { value: 'adventure', label: 'Aventura', emoji: '🏔️' },
  { value: 'exchange', label: 'Intercambio', emoji: '🌎' },
  { value: 'dance', label: 'Baile', emoji: '💃' },
  { value: 'elective', label: 'Electiva', emoji: '📖' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const QuickEventDialog = ({
  open,
  onOpenChange,
  initialDay,
  initialStartTime,
  initialEndTime,
}: QuickEventDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('class');
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [level, setLevel] = useState('none');
  const [roomId, setRoomId] = useState('none');
  const [teacherId, setTeacherId] = useState('none');
  const [tutorId, setTutorId] = useState('none');

  useEffect(() => {
    if (open) {
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setTitle('');
      setEventType('class');
      setLevel('none');
      setRoomId('none');
      setTeacherId('none');
      setTutorId('none');
    }
  }, [open, initialStartTime, initialEndTime]);

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
      if (!title) throw new Error('Ingresa un título');

      const { error } = await supabase.from('schedule_events').insert({
        title,
        event_type: eventType,
        day_of_week: initialDay,
        start_time: startTime,
        end_time: endTime,
        level: (level === 'none' ? null : level) as any,
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
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear evento');
    },
  });

  const selectedEventType = EVENT_TYPES.find(t => t.value === eventType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Crear Evento Rápido
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <span className="font-medium">{DAYS[initialDay]}</span>
            <span>•</span>
            <Clock className="h-3.5 w-3.5" />
            <span>{startTime} - {endTime}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Grid de tipos de evento con emojis */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Evento</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                    eventType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <span className="text-lg">{type.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ej: ${selectedEventType?.label} de Gramática`}
              autoFocus
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime" className="text-xs">Inicio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="1800"
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-xs">Fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="1800"
              />
            </div>
          </div>

          {/* Nivel y Habitación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nivel</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Nivel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Habitación</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Habitación..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profesor y Tutor (ambos opcionales) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Profesor (opcional)</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Profesor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tutor (opcional)</Label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tutor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {tutors?.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>{tutor.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!title || createEventMutation.isPending}
              className="flex-1"
            >
              {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
