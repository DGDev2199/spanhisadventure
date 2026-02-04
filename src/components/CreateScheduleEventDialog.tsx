import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sin Domingo
const DAYS = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
];

const EVENT_TYPES = [
  { value: 'class', label: 'Clase', emoji: '📚' },
  { value: 'tutoring', label: 'Práctica', emoji: '👨‍🏫' },
  { value: 'project', label: 'Proyecto', emoji: '🎯' },
  { value: 'welcome', label: 'Bienvenida', emoji: '👋' },
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

export const CreateScheduleEventDialog = ({ open, onOpenChange }: CreateScheduleEventDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('class');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [level, setLevel] = useState('none');
  const [roomId, setRoomId] = useState('none');
  
  // 4 campos de staff (2 profesores + 2 tutores)
  const [teacher1, setTeacher1] = useState('none');
  const [teacher2, setTeacher2] = useState('none');
  const [tutor1, setTutor1] = useState('none');
  const [tutor2, setTutor2] = useState('none');

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
      if (selectedDays.length === 0) throw new Error('Selecciona al menos un día');

      const eventsToCreate = selectedDays.map(day => ({
        title,
        description: description || null,
        event_type: eventType,
        day_of_week: parseInt(day),
        start_time: startTime,
        end_time: endTime,
        level: (level === 'none' ? null : level) as any,
        room_id: roomId === 'none' ? null : roomId,
        teacher_id: teacher1 === 'none' ? null : teacher1,
        teacher_id_2: teacher2 === 'none' ? null : teacher2,
        tutor_id: tutor1 === 'none' ? null : tutor1,
        tutor_id_2: tutor2 === 'none' ? null : tutor2,
        created_by: user.id,
      }));

      const { error } = await supabase.from('schedule_events').insert(eventsToCreate);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      toast.success(`Evento${selectedDays.length > 1 ? 's' : ''} creado${selectedDays.length > 1 ? 's' : ''} exitosamente`);
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
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setLevel('none');
    setRoomId('none');
    setTeacher1('none');
    setTeacher2('none');
    setTutor1('none');
    setTutor2('none');
  };

  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
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
          {/* Grid de tipos de evento */}
          <div>
            <Label className="mb-2 block">Tipo de Evento *</Label>
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
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <Label className="mb-3 block">Días de la Semana * (selecciona uno o varios)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-3">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedDays.length} día{selectedDays.length > 1 ? 's' : ''} seleccionado{selectedDays.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora de Inicio *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="1800"
              />
            </div>

            <div>
              <Label>Hora de Fin *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="1800"
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

          {/* Staff - 2 Profesores */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Profesores (opcional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] text-muted-foreground">Profesor 1</Label>
                <Select value={teacher1} onValueChange={setTeacher1}>
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
              <div>
                <Label className="text-[10px] text-muted-foreground">Profesor 2</Label>
                <Select value={teacher2} onValueChange={setTeacher2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona profesor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin profesor asignado</SelectItem>
                    {teachers?.filter(t => t.id !== teacher1 || teacher1 === 'none').map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Staff - 2 Tutores */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tutores (opcional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] text-muted-foreground">Tutor 1</Label>
                <Select value={tutor1} onValueChange={setTutor1}>
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
              <div>
                <Label className="text-[10px] text-muted-foreground">Tutor 2</Label>
                <Select value={tutor2} onValueChange={setTutor2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tutor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tutor asignado</SelectItem>
                    {tutors?.filter(t => t.id !== tutor1 || tutor1 === 'none').map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!title || selectedDays.length === 0 || createEventMutation.isPending}
              className="w-full sm:flex-1"
            >
              {createEventMutation.isPending ? 'Creando...' : `Crear Evento${selectedDays.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
