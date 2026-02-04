
# Plan: Rediseño Completo del Horario Semanal

## Resumen de Cambios Solicitados

1. **Quitar Domingo** - No trabajan ese día
2. **Colores funcionales** - Que los colores de eventos funcionen correctamente
3. **Intervalos de 30 minutos** - Poder marcar 5:30, no solo horas completas
4. **Asignar 2 staff** - Profesor + Tutor opcionales a cualquier actividad
5. **Horas contables** - Las horas se cuentan para el staff asignado
6. **Nuevos tipos de evento** - Reemplazar los actuales con los correctos

---

## Nuevos Tipos de Evento

| Tipo | Código | Color | Emoji |
|------|--------|-------|-------|
| Clase | `class` | Azul | 📚 |
| Práctica/Tutoría | `tutoring` | Verde | 👨‍🏫 |
| Desayuno | `breakfast` | Amarillo | 🍳 |
| Almuerzo | `lunch` | Naranja | 🍽️ |
| Descanso | `break` | Gris | ☕ |
| Actividad Cultural | `cultural` | Morado | 🎭 |
| Actividad Deportiva | `sports` | Rojo | ⚽ |
| Aventura | `adventure` | Cyan | 🏔️ |
| Intercambio | `exchange` | Rosa | 🌎 |
| Clase de Baile | `dance` | Fucsia | 💃 |
| Electiva | `elective` | Índigo | 📖 |

---

## Parte 1: Actualizar Configuración de Días (Sin Domingo)

**Archivo:** `src/components/WeeklyCalendar.tsx`

```typescript
// ANTES
const DAYS_CONFIG = [
  { value: 0, label: "Lun", fullLabel: "Lunes", ... },
  // ... hasta
  { value: 6, label: "Dom", fullLabel: "Domingo", ... },
];
const DAYS = ['Lunes', ..., 'Domingo'];

// DESPUÉS
const DAYS_CONFIG = [
  { value: 0, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 ..." },
  { value: 1, label: "Mar", fullLabel: "Martes", color: "bg-green-100 ..." },
  { value: 2, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 ..." },
  { value: 3, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 ..." },
  { value: 4, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 ..." },
  { value: 5, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 ..." },
];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
```

Cambiar grid de 8 columnas a 7:
```typescript
// Desktop calendar
<div className="grid grid-cols-7 gap-2"> // Era grid-cols-8
```

---

## Parte 2: Intervalos de 30 Minutos

**Archivo:** `src/components/WeeklyCalendar.tsx`

```typescript
// ANTES
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

// DESPUÉS - Slots de 30 min
const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  return { hour, minutes, label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` };
}); // 8:00, 8:30, 9:00, ... hasta 20:30

// Altura de cada slot: 30px (antes era 60px por hora)
// Esto permite que un evento de 30 min ocupe 1 slot
// Un evento de 1 hora ocupa 2 slots
```

**Posicionamiento dinámico de eventos:**
```typescript
const getEventPosition = (startTime: string) => {
  const [h, m] = startTime.split(':').map(Number);
  const slotsFromStart = (h - 8) * 2 + Math.floor(m / 30);
  return slotsFromStart * 30; // 30px por slot
};

const getEventHeight = (startTime: string, endTime: string) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return ((endMinutes - startMinutes) / 30) * 30; // 30px por cada 30 min
};
```

---

## Parte 3: Sistema de Colores por Tipo de Evento

**Archivo:** `src/components/WeeklyCalendar.tsx`

```typescript
const EVENT_TYPE_CONFIG = {
  class: { 
    label: 'Clase', 
    emoji: '📚', 
    bg: 'bg-blue-100 dark:bg-blue-900/40', 
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-200' 
  },
  tutoring: { 
    label: 'Práctica', 
    emoji: '👨‍🏫', 
    bg: 'bg-green-100 dark:bg-green-900/40', 
    border: 'border-green-500',
    text: 'text-green-900 dark:text-green-200' 
  },
  breakfast: { 
    label: 'Desayuno', 
    emoji: '🍳', 
    bg: 'bg-yellow-100 dark:bg-yellow-900/40', 
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-200' 
  },
  lunch: { 
    label: 'Almuerzo', 
    emoji: '🍽️', 
    bg: 'bg-orange-100 dark:bg-orange-900/40', 
    border: 'border-orange-500',
    text: 'text-orange-900 dark:text-orange-200' 
  },
  break: { 
    label: 'Descanso', 
    emoji: '☕', 
    bg: 'bg-gray-100 dark:bg-gray-800/40', 
    border: 'border-gray-400',
    text: 'text-gray-800 dark:text-gray-200' 
  },
  cultural: { 
    label: 'Act. Cultural', 
    emoji: '🎭', 
    bg: 'bg-purple-100 dark:bg-purple-900/40', 
    border: 'border-purple-500',
    text: 'text-purple-900 dark:text-purple-200' 
  },
  sports: { 
    label: 'Act. Deportiva', 
    emoji: '⚽', 
    bg: 'bg-red-100 dark:bg-red-900/40', 
    border: 'border-red-500',
    text: 'text-red-900 dark:text-red-200' 
  },
  adventure: { 
    label: 'Aventura', 
    emoji: '🏔️', 
    bg: 'bg-cyan-100 dark:bg-cyan-900/40', 
    border: 'border-cyan-500',
    text: 'text-cyan-900 dark:text-cyan-200' 
  },
  exchange: { 
    label: 'Intercambio', 
    emoji: '🌎', 
    bg: 'bg-pink-100 dark:bg-pink-900/40', 
    border: 'border-pink-500',
    text: 'text-pink-900 dark:text-pink-200' 
  },
  dance: { 
    label: 'Baile', 
    emoji: '💃', 
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', 
    border: 'border-fuchsia-500',
    text: 'text-fuchsia-900 dark:text-fuchsia-200' 
  },
  elective: { 
    label: 'Electiva', 
    emoji: '📖', 
    bg: 'bg-indigo-100 dark:bg-indigo-900/40', 
    border: 'border-indigo-500',
    text: 'text-indigo-900 dark:text-indigo-200' 
  },
};
```

---

## Parte 4: Actualizar Diálogos de Creación/Edición

**Archivos:**
- `src/components/calendar/QuickEventDialog.tsx`
- `src/components/CreateScheduleEventDialog.tsx`
- `src/components/EditScheduleEventDialog.tsx`

### Cambios en todos:

1. **Quitar Domingo de la lista de días**
2. **Actualizar EVENT_TYPES con los nuevos tipos**
3. **Mejorar selector de tipo con grid de emojis**

```typescript
const DAYS = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  // Sin Domingo
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
```

### Selector de tipo con grid visual:

```tsx
<div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
  {EVENT_TYPES.map((type) => (
    <button
      key={type.value}
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
```

---

## Parte 5: Mostrar Staff Asignado en Eventos

**Archivo:** `src/components/WeeklyCalendar.tsx`

Actualizar la query para incluir nombres de profesor y tutor:

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
        tutor:profiles!schedule_events_tutor_id_fkey(full_name)
      `)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');
    
    if (error) throw error;
    return data;
  },
});
```

En la visualización del evento:
```tsx
<div className="event-card">
  <div className="font-semibold">{event.title}</div>
  <div className="text-xs">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
  
  {/* Staff asignado */}
  {(event.teacher || event.tutor) && (
    <div className="flex gap-1 mt-1 flex-wrap">
      {event.teacher && (
        <span className="text-[10px] bg-blue-200/50 px-1.5 py-0.5 rounded">
          👨‍🏫 {event.teacher.full_name?.split(' ')[0]}
        </span>
      )}
      {event.tutor && (
        <span className="text-[10px] bg-green-200/50 px-1.5 py-0.5 rounded">
          🎓 {event.tutor.full_name?.split(' ')[0]}
        </span>
      )}
    </div>
  )}
</div>
```

---

## Parte 6: Leyenda Actualizada

```tsx
const renderLegend = () => (
  <div className="mt-4 flex flex-wrap gap-2 text-xs">
    {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
      <div key={key} className="flex items-center gap-1.5">
        <div className={cn("w-3 h-3 rounded border-l-2", config.bg, config.border)} />
        <span>{config.emoji} {config.label}</span>
      </div>
    ))}
  </div>
);
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `WeeklyCalendar.tsx` | -Domingo, +30min slots, +nuevos colores, +leyenda, +staff badges |
| `QuickEventDialog.tsx` | -Domingo, +nuevos tipos, +grid selector |
| `CreateScheduleEventDialog.tsx` | -Domingo, +nuevos tipos, +grid selector |
| `EditScheduleEventDialog.tsx` | -Domingo, +nuevos tipos, +selector tipo, +color automático |

---

## Diseño Visual Final

```text
┌─────────────────────────────────────────────────────────────────┐
│  📅 Calendario Semanal                    [PNG] [PDF] [◀ ▶]    │
├─────────────────────────────────────────────────────────────────┤
│ Hora  │  Lun   │  Mar   │  Mié   │  Jue   │  Vie   │  Sáb    │
├───────┼────────┼────────┼────────┼────────┼────────┼─────────┤
│ 08:00 │ ┌────────────┐                                        │
│ 08:30 │ │ 📚 Clase   │                                        │
│ 09:00 │ │ A1-A2      │ ┌────────────┐                         │
│ 09:30 │ │ 👨‍🏫 María  │ │ 🍳 Desayuno │                         │
│ 10:00 │ └────────────┘ └────────────┘                         │
│ 10:30 │                                                        │
│ ...   │                                                        │
│ 14:00 │         ┌──────────────────────────────┐              │
│ 14:30 │         │ 🏔️ Aventura - Río Celeste     │              │
│ 15:00 │         │ 👨‍🏫 Pedro  🎓 Ana             │              │
│ 15:30 │         └──────────────────────────────┘              │
├───────┴────────────────────────────────────────────────────────┤
│ Leyenda:                                                       │
│ 📚 Clase  👨‍🏫 Práctica  🍳 Desayuno  🍽️ Almuerzo  ☕ Descanso   │
│ 🎭 Cultural  ⚽ Deportiva  🏔️ Aventura  🌎 Intercambio          │
│ 💃 Baile  📖 Electiva                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Creación de Evento

```text
1. Usuario arrastra en calendario
         ↓
2. QuickEventDialog se abre
   - Grid de 11 tipos con emojis
   - Selector de hora con :00 y :30
   - Selector de profesor (opcional)
   - Selector de tutor (opcional)
         ↓
3. Evento creado con color automático por tipo
         ↓
4. Evento visible con:
   - Color de fondo según tipo
   - Emoji del tipo
   - Badges de staff asignado
   - Altura proporcional a duración
```

---

## Beneficios

1. **Más espacio** - Sin domingo, 6 columnas más anchas
2. **Precisión** - Eventos de 30min, 45min, 1.5h bien representados
3. **Claridad visual** - Colores únicos por tipo de actividad
4. **Transparencia** - Staff asignado visible en cada evento
5. **Tipos correctos** - 11 tipos que reflejan actividades reales de la escuela
6. **Diseño limpio** - Grid con emojis para selección rápida de tipo
