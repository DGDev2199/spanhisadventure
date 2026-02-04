
# Plan: Selección Multi-Día + Múltiple Staff en Eventos

## Problemas Identificados

### 1. Error en QuickEventDialog
El dialog no puede crear eventos porque hay un problema con la validación o datos. Necesito agregar manejo de errores mejorado.

### 2. Solo permite 1 profesor + 1 tutor
La tabla `schedule_events` actualmente tiene:
- `teacher_id` (UUID) - Solo 1 profesor
- `tutor_id` (UUID) - Solo 1 tutor

Pero el usuario necesita poder asignar:
- 2 profesores
- 2 tutores  
- 1 profesor + 1 tutor
- O cualquier combinación

### 3. Selección solo vertical (mismo día)
En `CalendarDragCreate.tsx` línea 102:
```typescript
if (day === selectionStart.day) {
  setSelectionEnd({ day, hour });
}
```
Esta condición impide la selección horizontal (multi-día).

---

## Solución Completa

### Parte 1: Migración SQL - Agregar campos para segundo staff

```sql
-- Agregar columnas para segundo profesor y segundo tutor
ALTER TABLE public.schedule_events 
ADD COLUMN teacher_id_2 UUID REFERENCES profiles(id),
ADD COLUMN tutor_id_2 UUID REFERENCES profiles(id);

-- Comentarios descriptivos
COMMENT ON COLUMN schedule_events.teacher_id_2 IS 'Optional second teacher assigned to the event';
COMMENT ON COLUMN schedule_events.tutor_id_2 IS 'Optional second tutor assigned to the event';
```

### Parte 2: Actualizar CalendarDragCreate.tsx

**Eliminar restricción de mismo día:**

```typescript
// ANTES (línea 99-106)
const handleMouseEnter = useCallback((day: number, hour: number) => {
  if (isSelecting && selectionStart) {
    if (day === selectionStart.day) { // <-- Esta línea causa el problema
      setSelectionEnd({ day, hour });
    }
  }
}, [isSelecting, selectionStart]);

// DESPUÉS - Permitir cualquier día
const handleMouseEnter = useCallback((day: number, hour: number) => {
  if (isSelecting && selectionStart) {
    setSelectionEnd({ day, hour }); // Sin restricción de día
  }
}, [isSelecting, selectionStart]);
```

**Actualizar isInSelection para rectángulo:**

```typescript
// ANTES (línea 34-42)
const isInSelection = useCallback(() => {
  if (!selectionStart || !selectionEnd) return false;
  if (selectionStart.day !== day || selectionEnd.day !== day) return false;
  // ...
}, [...]);

// DESPUÉS - Detectar rectángulo completo
const isInSelection = useCallback(() => {
  if (!selectionStart || !selectionEnd) return false;
  
  const minDay = Math.min(selectionStart.day, selectionEnd.day);
  const maxDay = Math.max(selectionStart.day, selectionEnd.day);
  const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
  const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
  
  return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
}, [selectionStart, selectionEnd, day, hour]);
```

**Actualizar callback para incluir rango de días:**

```typescript
// ANTES
onCreateEvent: (day: number, startTime: string, endTime: string) => void;

// DESPUÉS
onCreateEvent: (startDay: number, endDay: number, startTime: string, endTime: string) => void;

// En handleMouseUp
onCreateEvent(
  Math.min(selectionStart.day, selectionEnd.day),
  Math.max(selectionStart.day, selectionEnd.day),
  startTime,
  endTime
);
```

### Parte 3: Actualizar WeeklyCalendar.tsx

**Cambiar handleDragCreate y quickEventData:**

```typescript
// Nuevo estado
const [quickEventData, setQuickEventData] = useState({ 
  startDay: 0, 
  endDay: 0, 
  startTime: '09:00', 
  endTime: '10:00' 
});

// Nuevo handler
const handleDragCreate = useCallback((startDay: number, endDay: number, startTime: string, endTime: string) => {
  setQuickEventData({ startDay, endDay, startTime, endTime });
  setIsQuickEventOpen(true);
}, []);
```

### Parte 4: Actualizar QuickEventDialog.tsx

**Nuevas props y estados:**

```typescript
interface QuickEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStartDay: number;  // Nuevo
  initialEndDay: number;    // Nuevo
  initialStartTime: string;
  initialEndTime: string;
}

// Estados para múltiple staff
const [teacher1, setTeacher1] = useState('none');
const [teacher2, setTeacher2] = useState('none');
const [tutor1, setTutor1] = useState('none');
const [tutor2, setTutor2] = useState('none');
```

**Crear eventos en múltiples días:**

```typescript
const createEventMutation = useMutation({
  mutationFn: async () => {
    if (!user?.id) throw new Error('No user');
    if (!title.trim()) throw new Error('Ingresa un título');

    const minDay = Math.min(initialStartDay, initialEndDay);
    const maxDay = Math.max(initialStartDay, initialEndDay);
    
    // Crear un evento por cada día seleccionado
    const events = [];
    for (let day = minDay; day <= maxDay; day++) {
      events.push({
        title,
        event_type: eventType,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        level: level === 'none' ? null : level,
        room_id: roomId === 'none' ? null : roomId,
        teacher_id: teacher1 === 'none' ? null : teacher1,
        teacher_id_2: teacher2 === 'none' ? null : teacher2,
        tutor_id: tutor1 === 'none' ? null : tutor1,
        tutor_id_2: tutor2 === 'none' ? null : tutor2,
        created_by: user.id,
      });
    }

    const { error } = await supabase.from('schedule_events').insert(events);
    if (error) throw error;
  },
  // ...
});
```

**Nueva UI para selección de staff:**

```tsx
{/* Sección de Staff */}
<div className="space-y-3">
  <Label className="text-xs text-muted-foreground">Staff Asignado (opcional)</Label>
  
  {/* Profesores */}
  <div className="grid grid-cols-2 gap-2">
    <div>
      <Label className="text-[10px] text-muted-foreground">Profesor 1</Label>
      <Select value={teacher1} onValueChange={setTeacher1}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Profesor..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin asignar</SelectItem>
          {teachers?.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label className="text-[10px] text-muted-foreground">Profesor 2</Label>
      <Select value={teacher2} onValueChange={setTeacher2}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Profesor..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin asignar</SelectItem>
          {teachers?.filter(t => t.id !== teacher1).map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
  
  {/* Tutores */}
  <div className="grid grid-cols-2 gap-2">
    <div>
      <Label className="text-[10px] text-muted-foreground">Tutor 1</Label>
      <Select value={tutor1} onValueChange={setTutor1}>
        ...
      </Select>
    </div>
    <div>
      <Label className="text-[10px] text-muted-foreground">Tutor 2</Label>
      <Select value={tutor2} onValueChange={setTutor2}>
        ...
      </Select>
    </div>
  </div>
</div>
```

**Mostrar rango de días en header:**

```tsx
<DialogDescription>
  {initialStartDay === initialEndDay ? (
    <span className="font-medium">{DAYS[initialStartDay]}</span>
  ) : (
    <span className="font-medium">
      {DAYS[Math.min(initialStartDay, initialEndDay)]} - {DAYS[Math.max(initialStartDay, initialEndDay)]}
    </span>
  )}
  <span className="mx-1">•</span>
  <Clock className="h-3.5 w-3.5 inline" />
  <span className="ml-1">{startTime} - {endTime}</span>
</DialogDescription>
```

### Parte 5: Actualizar visualización en WeeklyCalendar

**Query con múltiple staff:**

```typescript
const { data: events } = useQuery({
  queryKey: ['schedule-events'],
  queryFn: async () => {
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
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },
});
```

**Mostrar múltiple staff en evento:**

```tsx
{/* Staff badges */}
<div className="flex flex-wrap gap-0.5 mt-1">
  {event.teacher && (
    <span className="text-[9px] bg-blue-200/50 px-1 rounded">
      👨‍🏫 {event.teacher.full_name?.split(' ')[0]}
    </span>
  )}
  {event.teacher2 && (
    <span className="text-[9px] bg-blue-200/50 px-1 rounded">
      👨‍🏫 {event.teacher2.full_name?.split(' ')[0]}
    </span>
  )}
  {event.tutor && (
    <span className="text-[9px] bg-green-200/50 px-1 rounded">
      🎓 {event.tutor.full_name?.split(' ')[0]}
    </span>
  )}
  {event.tutor2 && (
    <span className="text-[9px] bg-green-200/50 px-1 rounded">
      🎓 {event.tutor2.full_name?.split(' ')[0]}
    </span>
  )}
</div>
```

### Parte 6: Actualizar EditScheduleEventDialog

Agregar los mismos campos para teacher_id_2 y tutor_id_2 en el diálogo de edición.

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| **Migración SQL** | +teacher_id_2, +tutor_id_2 en schedule_events |
| `CalendarDragCreate.tsx` | Permitir selección multi-día, actualizar callback |
| `WeeklyCalendar.tsx` | Actualizar quickEventData, handleDragCreate, query, visualización |
| `QuickEventDialog.tsx` | +startDay/endDay props, +4 campos de staff, crear múltiples eventos |
| `CreateScheduleEventDialog.tsx` | +4 campos de staff |
| `EditScheduleEventDialog.tsx` | +4 campos de staff |

---

## Flujo de Usuario

```text
1. Admin arrastra en calendario de Martes 8:00 a Sábado 12:00
         ↓
2. Se resalta rectángulo completo (Mar-Sáb, 8:00-12:00)
         ↓
3. Suelta mouse → QuickEventDialog se abre
   Header: "Martes - Sábado • 08:00 - 12:00"
         ↓
4. Usuario selecciona:
   - Tipo: 📚 Clase
   - Título: "Gramática Avanzada"
   - Profesor 1: María
   - Profesor 2: Pedro
   - Tutor 1: (ninguno)
   - Tutor 2: (ninguno)
         ↓
5. Click "Crear Evento"
         ↓
6. Se crean 5 eventos idénticos (Mar, Mié, Jue, Vie, Sáb)
   Cada uno con 2 profesores asignados
```

---

## Beneficios

1. **Selección rectangular**: Arrastrar en cualquier dirección
2. **Múltiple staff**: 2 profesores + 2 tutores por evento
3. **Creación masiva**: Un arrastre crea eventos en múltiples días
4. **Flexibilidad**: Cualquier combinación de staff es válida
5. **Horas contables**: Cada staff asignado recibirá crédito por sus horas
