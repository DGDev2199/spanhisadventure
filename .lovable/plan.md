

# Plan: Información Detallada en Eventos + Sistema de Electivas

## Resumen

Implementar un sistema que permita:
1. **Staff puede agregar información y PDFs a eventos** (ej: Aventura con instrucciones)
2. **Estudiantes pueden ver detalles expandidos** al hacer clic en un evento del calendario
3. **Sistema de recordatorios para Electivas** con selección entre opciones
4. **Modal de recordatorio en la mañana** para tareas pendientes y selección de electiva

---

## Parte 1: Base de Datos

### Nuevas columnas en `schedule_events`
```sql
ALTER TABLE public.schedule_events
ADD COLUMN details_info TEXT,                    -- Información detallada del evento
ADD COLUMN attachment_url TEXT,                  -- URL del PDF/archivo adjunto
ADD COLUMN attachment_name TEXT,                 -- Nombre del archivo para mostrar
ADD COLUMN elective_option_1 TEXT,               -- Opción 1 de electiva (ej: "Cultural - Cocina")
ADD COLUMN elective_option_2 TEXT;               -- Opción 2 de electiva (ej: "Gramática - Verbos")
```

### Nueva tabla `student_elective_selections`
```sql
CREATE TABLE public.student_elective_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,                      -- Fecha específica de la electiva
  selected_option INTEGER NOT NULL CHECK (selected_option IN (1, 2)),
  selected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, event_id, event_date)       -- Un estudiante, una selección por día
);

-- RLS
ALTER TABLE public.student_elective_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own selections"
  ON public.student_elective_selections
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Staff can view all selections"
  ON public.student_elective_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coordinator', 'teacher', 'tutor')
    )
  );
```

---

## Parte 2: Actualizar Diálogos de Edición de Eventos

### Archivo: `EditScheduleEventDialog.tsx`

Agregar nuevos campos para que el staff asignado pueda editar:

```tsx
// Nuevos estados
const [detailsInfo, setDetailsInfo] = useState('');
const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
const [attachmentUrl, setAttachmentUrl] = useState('');
const [attachmentName, setAttachmentName] = useState('');
const [electiveOption1, setElectiveOption1] = useState('');
const [electiveOption2, setElectiveOption2] = useState('');

// Verificar si el usuario actual es el staff asignado
const isAssignedStaff = useMemo(() => {
  if (!user?.id || !event) return false;
  return [event.teacher_id, event.teacher_id_2, event.tutor_id, event.tutor_id_2]
    .includes(user.id);
}, [user?.id, event]);

// UI condicional para tipos específicos
{(eventType === 'adventure' || eventType === 'cultural' || eventType === 'sports') && (
  <div className="space-y-4 border-t pt-4">
    <h4 className="font-medium text-sm">Información Detallada</h4>
    <Textarea 
      value={detailsInfo} 
      onChange={(e) => setDetailsInfo(e.target.value)}
      placeholder="Instrucciones, punto de encuentro, qué traer..."
      rows={4}
    />
    
    {/* Upload de PDF */}
    <div>
      <Label>Archivo Adjunto (PDF)</Label>
      <Input type="file" accept=".pdf" onChange={handleFileChange} />
      {attachmentUrl && (
        <div className="flex items-center gap-2 mt-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm">{attachmentName}</span>
          <Button size="sm" variant="ghost" onClick={removeAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  </div>
)}

{eventType === 'elective' && (
  <div className="space-y-4 border-t pt-4">
    <h4 className="font-medium text-sm">Opciones de Electiva</h4>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Opción 1</Label>
        <Input 
          value={electiveOption1} 
          onChange={(e) => setElectiveOption1(e.target.value)}
          placeholder="Ej: Cultural - Cocina Costarricense"
        />
      </div>
      <div>
        <Label>Opción 2</Label>
        <Input 
          value={electiveOption2} 
          onChange={(e) => setElectiveOption2(e.target.value)}
          placeholder="Ej: Gramática - Subjuntivo"
        />
      </div>
    </div>
  </div>
)}
```

### Función para subir PDF al bucket `materials`:
```tsx
const handleFileUpload = async (file: File) => {
  const filePath = `event-attachments/${event.id}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('materials')
    .upload(filePath, file);
  
  if (!error) {
    setAttachmentUrl(`materials/${filePath}`);
    setAttachmentName(file.name);
  }
};
```

---

## Parte 3: Nuevo Componente - EventDetailsDialog

### Archivo: `src/components/EventDetailsDialog.tsx`

Diálogo que los estudiantes ven al hacer clic en un evento:

```tsx
interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent;
}

export const EventDetailsDialog = ({ open, onOpenChange, event }: EventDetailsDialogProps) => {
  const { user } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  
  const typeInfo = EVENT_TYPE_CONFIG[event.event_type];
  
  const handleViewPdf = async () => {
    if (event.attachment_url?.startsWith('materials/')) {
      const path = event.attachment_url.replace('materials/', '');
      const { data } = await supabase.storage
        .from('materials')
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) setSelectedPdf(data.signedUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{typeInfo.emoji}</span>
            {event.title}
          </DialogTitle>
          <DialogDescription>
            {DAYS[event.day_of_week]} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descripción básica */}
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          {/* Información detallada */}
          {event.details_info && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Información Importante
              </h4>
              <p className="text-sm whitespace-pre-wrap">{event.details_info}</p>
            </div>
          )}

          {/* PDF adjunto */}
          {event.attachment_url && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleViewPdf}
            >
              <FileText className="h-4 w-4 mr-2" />
              {event.attachment_name || 'Ver documento'}
              <Shield className="h-4 w-4 ml-auto text-purple-600" />
            </Button>
          )}

          {/* Staff asignado */}
          {(event.teacher || event.tutor) && (
            <div className="flex flex-wrap gap-2">
              {event.teacher && (
                <Badge variant="secondary">
                  👨‍🏫 {event.teacher.full_name}
                </Badge>
              )}
              {event.tutor && (
                <Badge variant="secondary">
                  🎓 {event.tutor.full_name}
                </Badge>
              )}
            </div>
          )}

          {/* Sala */}
          {event.rooms && (
            <p className="text-sm">📍 {event.rooms.name}</p>
          )}
        </div>
      </DialogContent>

      {/* SecurePDFViewer para el adjunto */}
      <SecurePDFViewer
        open={!!selectedPdf}
        onClose={() => setSelectedPdf(null)}
        pdfUrl={selectedPdf || ''}
        title={event.attachment_name || event.title}
        userName={user?.email || 'Estudiante'}
      />
    </Dialog>
  );
};
```

---

## Parte 4: Modal de Selección de Electiva

### Archivo: `src/components/ElectiveSelectionModal.tsx`

Modal que aparece 1 hora antes de la electiva:

```tsx
interface ElectiveSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent;
  eventDate: string; // Fecha del día actual
}

export const ElectiveSelectionModal = ({ 
  open, onOpenChange, event, eventDate 
}: ElectiveSelectionModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<1 | 2 | null>(null);

  // Verificar si ya seleccionó
  const { data: existingSelection } = useQuery({
    queryKey: ['elective-selection', event.id, eventDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_elective_selections')
        .select('selected_option')
        .eq('student_id', user!.id)
        .eq('event_id', event.id)
        .eq('event_date', eventDate)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const selectMutation = useMutation({
    mutationFn: async (option: 1 | 2) => {
      const { error } = await supabase
        .from('student_elective_selections')
        .upsert({
          student_id: user!.id,
          event_id: event.id,
          event_date: eventDate,
          selected_option: option,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elective-selection'] });
      toast.success('Electiva seleccionada');
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📖 Selecciona tu Electiva
          </DialogTitle>
          <DialogDescription>
            La electiva comienza a las {formatTime(event.start_time)}. 
            Elige tu opción:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 my-4">
          <button
            onClick={() => setSelectedOption(1)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all",
              selectedOption === 1 
                ? "border-primary bg-primary/10" 
                : "border-muted hover:border-primary/50"
            )}
          >
            <div className="font-medium">Opción 1</div>
            <div className="text-sm text-muted-foreground">
              {event.elective_option_1 || 'Cultural'}
            </div>
          </button>

          <button
            onClick={() => setSelectedOption(2)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all",
              selectedOption === 2 
                ? "border-primary bg-primary/10" 
                : "border-muted hover:border-primary/50"
            )}
          >
            <div className="font-medium">Opción 2</div>
            <div className="text-sm text-muted-foreground">
              {event.elective_option_2 || 'Gramática'}
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button
            onClick={() => selectedOption && selectMutation.mutate(selectedOption)}
            disabled={!selectedOption || selectMutation.isPending}
          >
            {selectMutation.isPending ? 'Guardando...' : 'Confirmar Selección'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Parte 5: Sistema de Recordatorios en Dashboard

### Archivo: `src/components/DailyRemindersModal.tsx`

Modal que aparece al cargar el dashboard con recordatorios del día:

```tsx
export const DailyRemindersModal = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showElectiveModal, setShowElectiveModal] = useState(false);
  const [electiveEvent, setElectiveEvent] = useState<ScheduleEvent | null>(null);

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Ajustar a Lun=0
  const currentTime = `${today.getHours()}:${today.getMinutes().toString().padStart(2, '0')}`;

  // Fetch eventos de hoy
  const { data: todayEvents } = useQuery({
    queryKey: ['today-events', dayOfWeek],
    queryFn: async () => {
      const { data } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);
      return data;
    },
  });

  // Verificar si hay electiva próxima (menos de 1 hora)
  useEffect(() => {
    if (!todayEvents) return;
    
    const electiveToday = todayEvents.find(e => e.event_type === 'elective');
    if (!electiveToday) return;

    const [eventHour, eventMin] = electiveToday.start_time.split(':').map(Number);
    const eventMinutes = eventHour * 60 + eventMin;
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    
    // Si la electiva es en menos de 60 min y no ha pasado
    if (eventMinutes - nowMinutes <= 60 && eventMinutes > nowMinutes) {
      setElectiveEvent(electiveToday);
      setShowElectiveModal(true);
    }
  }, [todayEvents]);

  // Verificar si mostrar recordatorio matutino (8-10 AM)
  useEffect(() => {
    const hour = today.getHours();
    if (hour >= 8 && hour <= 10) {
      const hasSeenToday = localStorage.getItem(`reminder-${today.toDateString()}`);
      if (!hasSeenToday) {
        setShowModal(true);
        localStorage.setItem(`reminder-${today.toDateString()}`, 'true');
      }
    }
  }, []);

  // Pendientes del día
  const { data: pendingTasks } = useQuery({
    queryKey: ['pending-tasks', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('student_id', user!.id)
        .eq('status', 'pending');
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <>
      {/* Modal de recordatorio matutino */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>☀️ Buenos días!</DialogTitle>
            <DialogDescription>
              Aquí tienes un resumen de tu día
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tareas pendientes */}
            {pendingTasks && pendingTasks.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  ⚠️ Tienes {pendingTasks.length} tarea(s) pendiente(s)
                </h4>
                <ul className="mt-2 text-sm space-y-1">
                  {pendingTasks.slice(0, 3).map(task => (
                    <li key={task.id}>• {task.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Electiva del día */}
            {electiveEvent && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  📖 Electiva hoy a las {formatTime(electiveEvent.start_time)}
                </h4>
                <p className="text-sm mt-1">
                  Recuerda seleccionar tu opción antes de que comience
                </p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setShowModal(false);
                    setShowElectiveModal(true);
                  }}
                >
                  Seleccionar Electiva
                </Button>
              </div>
            )}

            {/* Eventos especiales del día */}
            {todayEvents?.filter(e => 
              ['adventure', 'cultural', 'sports', 'exchange'].includes(e.event_type) &&
              e.details_info
            ).map(event => (
              <div key={event.id} className="bg-cyan-50 dark:bg-cyan-950/30 p-4 rounded-lg">
                <h4 className="font-medium">
                  {EVENT_TYPE_CONFIG[event.event_type]?.emoji} {event.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.details_info?.slice(0, 100)}...
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowModal(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de selección de electiva */}
      {electiveEvent && (
        <ElectiveSelectionModal
          open={showElectiveModal}
          onOpenChange={setShowElectiveModal}
          event={electiveEvent}
          eventDate={today.toISOString().split('T')[0]}
        />
      )}
    </>
  );
};
```

---

## Parte 6: Integrar en WeeklyCalendar

### Actualizar `WeeklyCalendar.tsx`

Agregar diálogo de detalles para estudiantes:

```tsx
// Nuevo estado
const [detailsEvent, setDetailsEvent] = useState<ScheduleEvent | null>(null);
const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

// Modificar click handler en eventos
onClick={() => {
  if (canEdit) {
    // Admin/Staff - abrir editor
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  } else {
    // Estudiante - abrir detalles
    setDetailsEvent(event);
    setIsDetailsDialogOpen(true);
  }
}}

// Al final del componente
<EventDetailsDialog
  open={isDetailsDialogOpen}
  onOpenChange={setIsDetailsDialogOpen}
  event={detailsEvent}
/>
```

---

## Parte 7: Integrar Recordatorios en Dashboard

### Actualizar `Dashboard.tsx`

```tsx
import { DailyRemindersModal } from '@/components/DailyRemindersModal';

// En el return, al inicio del componente
return (
  <div className="min-h-screen bg-background">
    {/* Recordatorios del día - solo para estudiantes presenciales */}
    {!isOnlineStudent && <DailyRemindersModal />}
    
    {/* resto del dashboard... */}
  </div>
);
```

---

## Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| **Migración SQL** | +5 columnas en schedule_events, +tabla student_elective_selections |
| `EditScheduleEventDialog.tsx` | +Campos para detalles, PDF, opciones electiva |
| `EventDetailsDialog.tsx` | **Nuevo** - Vista de detalles para estudiantes |
| `ElectiveSelectionModal.tsx` | **Nuevo** - Modal para seleccionar electiva |
| `DailyRemindersModal.tsx` | **Nuevo** - Recordatorios matutinos |
| `WeeklyCalendar.tsx` | +Click handler para estudiantes |
| `Dashboard.tsx` | +Integrar DailyRemindersModal |

---

## Flujo de Usuario

```
STAFF (Profesor/Tutor asignado a Aventura):
1. Entra al calendario del Admin
2. Click en evento "Aventura - Río Celeste"
3. Edita: Agrega instrucciones + PDF con mapa
4. Guarda

ESTUDIANTE:
1. Entra a su Dashboard (8:30 AM)
2. Modal de recordatorio aparece:
   - "Tienes 2 tareas pendientes"
   - "Aventura a las 14:00 - Ver instrucciones"
   - "Electiva a las 16:00 - Selecciona tu opción"
3. Click en "Seleccionar Electiva" → Modal con 2 opciones
4. Selecciona "Cultural - Cocina"
5. Click en Aventura en calendario → Ve instrucciones + PDF con SecurePDFViewer
6. 1 hora antes de electiva → Aparece modal recordatorio con sus 2 opciones
```

---

## Beneficios

1. **Información centralizada** - Todo sobre el evento en un solo lugar
2. **PDFs protegidos** - Usando el SecurePDFViewer existente
3. **Recordatorios automáticos** - Sin olvidar tareas ni electivas
4. **Flexibilidad** - Staff asignado puede editar sus propios eventos
5. **Trazabilidad** - Saber qué electiva eligió cada estudiante

