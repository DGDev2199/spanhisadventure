# Plan: Selección Multi-Día + Múltiple Staff - COMPLETADO ✅

## Cambios Implementados

### 1. Migración SQL
- ✅ Agregadas columnas `teacher_id_2` y `tutor_id_2` a `schedule_events`

### 2. CalendarDragCreate.tsx
- ✅ Eliminada restricción de mismo día (selección rectangular)
- ✅ Actualizada lógica `isInSelection` para detectar rectángulo
- ✅ Callback actualizado para incluir rango de días

### 3. WeeklyCalendar.tsx
- ✅ Estado `quickEventData` con `startDay` y `endDay`
- ✅ Handler `handleDragCreate` acepta rango de días
- ✅ Query actualizada para traer 4 staff members
- ✅ Visualización de 4 badges de staff en eventos

### 4. QuickEventDialog.tsx
- ✅ Props actualizadas: `initialStartDay`, `initialEndDay`
- ✅ 4 campos de staff (2 profesores + 2 tutores)
- ✅ Creación masiva en múltiples días
- ✅ Header muestra rango de días

### 5. CreateScheduleEventDialog.tsx
- ✅ 4 campos de staff

### 6. EditScheduleEventDialog.tsx
- ✅ 4 campos de staff
- ✅ Carga valores existentes de `teacher_id_2` y `tutor_id_2`

## Funcionalidades

1. **Selección rectangular**: Arrastrar en cualquier dirección (vertical y horizontal)
2. **Múltiple staff**: 2 profesores + 2 tutores por evento
3. **Creación masiva**: Un arrastre crea eventos idénticos en múltiples días
4. **Flexibilidad**: Cualquier combinación de staff es válida
