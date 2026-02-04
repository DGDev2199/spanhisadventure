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
import { cn } from '@/lib/utils';
import { FileText, X, Upload } from 'lucide-react';

interface EditScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
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
  const [level, setLevel] = useState('');
  
  // 4 campos de staff
  const [teacher1, setTeacher1] = useState('');
  const [teacher2, setTeacher2] = useState('');
  const [tutor1, setTutor1] = useState('');
  const [tutor2, setTutor2] = useState('');

  // New fields for event details
  const [detailsInfo, setDetailsInfo] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [electiveOption1, setElectiveOption1] = useState('');
  const [electiveOption2, setElectiveOption2] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setEventType(event.event_type || 'class');
      setDayOfWeek(event.day_of_week?.toString() || '');
      setStartTime(event.start_time || '');
      setEndTime(event.end_time || '');
      setRoomId(event.room_id || 'none');
      setTeacher1(event.teacher_id || 'none');
      setTeacher2(event.teacher_id_2 || 'none');
      setTutor1(event.tutor_id || 'none');
      setTutor2(event.tutor_id_2 || 'none');
      setLevel(event.level || 'none');
      // New fields
      setDetailsInfo(event.details_info || '');
      setAttachmentUrl(event.attachment_url || '');
      setAttachmentName(event.attachment_name || '');
      setElectiveOption1(event.elective_option_1 || '');
      setElectiveOption2(event.elective_option_2 || '');
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
    }
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
    }
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!event?.id) return;
    
    setIsUploading(true);
    try {
      const filePath = `event-attachments/${event.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);
      
      if (error) throw error;
      
      setAttachmentUrl(`materials/${filePath}`);
      setAttachmentName(file.name);
      toast({ title: 'Archivo subido exitosamente' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error al subir archivo', variant: 'destructive' });
    }
    setIsUploading(false);
  };

  const handleRemoveAttachment = async () => {
    if (attachmentUrl) {
      try {
        const path = attachmentUrl.replace('materials/', '');
        await supabase.storage.from('materials').remove([path]);
      } catch (e) {
        // Ignore removal errors
      }
    }
    setAttachmentUrl('');
    setAttachmentName('');
  };

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
          teacher_id: teacher1 === 'none' ? null : teacher1,
          teacher_id_2: teacher2 === 'none' ? null : teacher2,
          tutor_id: tutor1 === 'none' ? null : tutor1,
          tutor_id_2: tutor2 === 'none' ? null : tutor2,
          level: (level === 'none' ? null : level) as any,
          // New fields
          details_info: detailsInfo || null,
          attachment_url: attachmentUrl || null,
          attachment_name: attachmentName || null,
          elective_option_1: electiveOption1 || null,
          elective_option_2: electiveOption2 || null,
        })
        .eq('id', event.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] });
      queryClient.invalidateQueries({ queryKey: ['today-events'] });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento del Calendario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Día de la Semana *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora de Inicio *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step="1800" />
            </div>
            <div>
              <Label>Hora de Fin *</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} step="1800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nivel</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin nivel específico</SelectItem>
                  {LEVELS.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          {/* Staff - 2 Profesores */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Profesores (opcional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] text-muted-foreground">Profesor 1</Label>
                <Select value={teacher1} onValueChange={setTeacher1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin profesor</SelectItem>
                    {teachers?.map((teacher: any) => (
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
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin profesor</SelectItem>
                    {teachers?.filter((t: any) => t.id !== teacher1 || teacher1 === 'none').map((teacher: any) => (
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
                    <SelectValue placeholder="Seleccionar tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tutor</SelectItem>
                    {tutors?.map((tutor: any) => (
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
                    <SelectValue placeholder="Seleccionar tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tutor</SelectItem>
                    {tutors?.filter((t: any) => t.id !== tutor1 || tutor1 === 'none').map((tutor: any) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditional sections based on event type */}
          {/* Details for adventure/cultural/sports events */}
          {['adventure', 'cultural', 'sports', 'exchange'].includes(eventType) && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                📋 Información Detallada
              </h4>
              <div>
                <Label className="text-xs text-muted-foreground">Instrucciones y Detalles</Label>
                <Textarea 
                  value={detailsInfo} 
                  onChange={(e) => setDetailsInfo(e.target.value)}
                  placeholder="Instrucciones, punto de encuentro, qué traer, horarios especiales..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              {/* PDF upload */}
              <div>
                <Label className="text-xs text-muted-foreground">Archivo Adjunto (PDF)</Label>
                {attachmentUrl ? (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1 truncate">{attachmentName}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleRemoveAttachment}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Input 
                      type="file" 
                      accept=".pdf" 
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    {isUploading && (
                      <p className="text-xs text-muted-foreground mt-1">Subiendo...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Elective options */}
          {eventType === 'elective' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                📖 Opciones de Electiva
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Opción 1</Label>
                  <Input 
                    value={electiveOption1} 
                    onChange={(e) => setElectiveOption1(e.target.value)}
                    placeholder="Ej: Cultural - Cocina Costarricense"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Opción 2</Label>
                  <Input 
                    value={electiveOption2} 
                    onChange={(e) => setElectiveOption2(e.target.value)}
                    placeholder="Ej: Gramática - Subjuntivo"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={!title || !eventType || !dayOfWeek || !startTime || !endTime || updateMutation.isPending || isUploading}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
