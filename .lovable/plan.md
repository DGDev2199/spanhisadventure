
# Plan: Corregir Conteo de Horas de Grupo y Diseño de Ejercicios

## Problema 1: Horas de Grupo Contadas como Individuales

### Análisis del Problema
Cuando se asigna un horario de grupo desde `AdminAssignMultipleSchedulesDialog`, se crea **una fila por cada estudiante** en la tabla `student_class_schedules`. Por ejemplo:
- 5 estudiantes × 1 hora de clase = 5 filas en la base de datos

La función `calculate_staff_hours()` suma TODAS las filas donde aparece el profesor:
```sql
SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
FROM student_class_schedules
WHERE teacher_id = staff_record.user_id
```

Resultado: El profesor aparece con 5 horas en lugar de 1 hora.

### Solución
Agregar una columna `group_session_id` a `student_class_schedules` que identifique las clases que son parte del mismo grupo. La función de cálculo usará `DISTINCT ON` para contar cada sesión de grupo una sola vez.

**Cambios en la tabla:**
```sql
ALTER TABLE student_class_schedules 
ADD COLUMN group_session_id UUID DEFAULT NULL;
```

**Cambios en AdminAssignMultipleSchedulesDialog.tsx:**
- Cuando se asignan múltiples estudiantes a la misma clase, generar un UUID único (`group_session_id`) y asignarlo a todas las filas.

**Cambios en la función SQL:**
```sql
-- Para clases de grupo, contar solo UNA vez por grupo
SELECT COALESCE(SUM(hours), 0) INTO calculated_hours FROM (
  SELECT DISTINCT ON (
    COALESCE(group_session_id, id), 
    day_of_week, 
    start_time, 
    end_time
  ) 
  EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 AS hours
  FROM student_class_schedules
  WHERE (teacher_id = staff_id OR tutor_id = staff_id)
  AND is_active = true
) AS unique_sessions;
```

---

## Problema 2: Diseño de Ejercicios Roto en Móvil y Desktop

### Análisis del Problema
Los componentes de ejercicios tienen problemas de overflow y visibilidad:
1. **Flashcards se salen del recuadro**: La altura fija no se adapta bien a todos los contenidos
2. **Ejercicios no visibles**: El contenedor del diálogo no tiene suficiente espacio
3. **Diseño inconsistente**: Algunos componentes no tienen límites de ancho/alto adecuados

### Componentes a Corregir

| Archivo | Problema | Solución |
|---------|----------|----------|
| `PracticeExerciseView.tsx` | Diálogo muy pequeño en móvil | Ajustar `max-h`, padding y scroll |
| `FlashcardExercise.tsx` | Cards se desbordan | Limitar altura máxima, usar `overflow-hidden` |
| `ConjugationExercise.tsx` | Botones muy pequeños | Aumentar `min-height` y padding |
| `VocabularyExercise.tsx` | Input difícil de usar | Mejorar tamaño y espaciado |
| `SentenceOrderExercise.tsx` | Palabras se salen | Limitar ancho y usar `flex-wrap` correctamente |
| `FillGapsExercise.tsx` | Opciones muy juntas | Aumentar gap y padding |
| `ReadingExercise.tsx` | Texto no legible | Mejorar altura de ScrollArea |
| `MultipleChoiceExercise.tsx` | Opciones cortadas | Ajustar padding y text-wrap |

### Cambios Específicos

**PracticeExerciseView.tsx:**
```tsx
<DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0">
  <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
    ...
  </DialogHeader>
  <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-4 sm:pb-6">
    {isCompleted ? renderCompletionScreen() : renderExercise()}
  </div>
</DialogContent>
```

**FlashcardExercise.tsx:**
```tsx
// Usar altura adaptativa con min/max
<div className="relative w-full max-w-md min-h-[140px] max-h-[200px] sm:min-h-[160px] sm:max-h-[240px]">
  <Card className="absolute inset-0 w-full h-full overflow-hidden">
    <CardContent className="h-full flex items-center justify-center p-4 overflow-y-auto">
      ...
    </CardContent>
  </Card>
</div>
```

**Todos los ejercicios - Mejoras generales:**
- Agregar `overflow-hidden` a contenedores principales
- Usar `break-words` para textos largos
- Implementar `min-h-[44px]` en todos los botones (estándar táctil)
- Ajustar espaciado: `gap-2` → `gap-3` en móvil donde necesario
- Usar `line-clamp-3` o similar para textos muy largos

---

## Archivos a Modificar

### Migración SQL (nueva)
1. Agregar columna `group_session_id` a `student_class_schedules`
2. Actualizar función `calculate_staff_hours()` para no duplicar horas de grupo

### Componentes React
| Archivo | Cambios |
|---------|---------|
| `AdminAssignMultipleSchedulesDialog.tsx` | Generar `group_session_id` único cuando se asignan múltiples estudiantes |
| `PracticeExerciseView.tsx` | Restructurar layout del diálogo con flex y scroll interno |
| `FlashcardExercise.tsx` | Altura adaptativa, overflow-hidden, texto responsive |
| `ConjugationExercise.tsx` | Mejorar tamaño de botones y opciones |
| `VocabularyExercise.tsx` | Mejor layout de input y espaciado |
| `SentenceOrderExercise.tsx` | Contenedor con límites de tamaño, palabras con wrap |
| `FillGapsExercise.tsx` | Grid de opciones más espaciado |
| `ReadingExercise.tsx` | ScrollArea más alta, texto más legible |
| `MultipleChoiceExercise.tsx` | Opciones con padding adecuado |

---

## Resumen de Correcciones

| Problema | Causa Raíz | Solución |
|----------|------------|----------|
| Horas de grupo multiplicadas | Cada estudiante genera una fila separada | Usar `group_session_id` + `DISTINCT` en cálculo |
| Flashcards desbordadas | Altura fija no responsive | `min-h`/`max-h` + `overflow-hidden` |
| Ejercicios no visibles | Diálogo muy pequeño | `max-h-[95vh]` + scroll interno |
| Diseño inconsistente | CSS fragmentado | Estandarizar tamaños y espaciados |

---

## Detalles Técnicos

### SQL - Nueva función de cálculo de horas

La clave es usar `DISTINCT ON` para agrupar las sesiones que comparten el mismo `group_session_id`:

```sql
-- Para clases individuales (group_session_id IS NULL): usar el id único
-- Para clases de grupo: usar group_session_id para contar UNA sola vez
SELECT COALESCE(SUM(session_hours), 0) INTO staff_schedule_hours
FROM (
  SELECT DISTINCT ON (
    COALESCE(group_session_id::text, id::text),
    day_of_week,
    start_time,
    end_time,
    teacher_id,
    tutor_id
  )
  EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 AS session_hours
  FROM student_class_schedules
  WHERE (teacher_id = staff_user_id OR tutor_id = staff_user_id)
  AND is_active = true
) AS unique_sessions;
```

### React - Layout de ejercicios

Estructura consistente para todos los ejercicios:
```tsx
<div className="h-full flex flex-col space-y-3 sm:space-y-4">
  {/* Progress - siempre visible arriba */}
  <div className="flex-shrink-0">...</div>
  
  {/* Contenido principal - con scroll si necesario */}
  <div className="flex-1 min-h-0 overflow-y-auto">
    ...
  </div>
  
  {/* Acciones - siempre visibles abajo */}
  <div className="flex-shrink-0">...</div>
</div>
```
