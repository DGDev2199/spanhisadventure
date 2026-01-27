
# Plan: Corregir Errores de RLS y Permisos

## Resumen

Se han identificado 4 errores relacionados con políticas de seguridad (RLS) que impiden a profesores y staff realizar acciones legítimas en el sistema. Este plan corrige cada uno de ellos.

---

## Error 1: Marcar como Alumni

**Causa**: La política actual solo permite a profesores actualizar `is_alumni` si son el `teacher_id` asignado. No funciona para:
- Admins/Coordinadores
- Profesores que son asignados como `tutor_id`

**Solución**: Crear una nueva política RLS que permita a admin, coordinador y profesores (que sean teacher_id O tutor_id) actualizar el estado de alumni.

```sql
-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Teachers can update student alumni status" ON public.student_profiles;

-- Nueva política más completa
CREATE POLICY "Staff can update student alumni status" 
ON public.student_profiles FOR UPDATE 
USING (
  -- Admin/Coordinator puede actualizar cualquier estudiante
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  -- Teacher puede actualizar si es teacher_id O tutor_id del estudiante
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
)
WITH CHECK (
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
);
```

---

## Error 2: Asignar Horarios (schedule_events)

**Causa**: Solo admins pueden insertar en `schedule_events`. Los profesores no tienen permisos INSERT.

**Solución**: Agregar política que permita a profesores y tutores crear eventos para sus estudiantes.

```sql
-- Permitir a profesores crear eventos de clase
CREATE POLICY "Teachers can create schedule events for their students"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

-- Permitir a profesores actualizar eventos que crearon
CREATE POLICY "Teachers can update own schedule events"
ON public.schedule_events FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

-- Permitir a tutores crear eventos de tutoría
CREATE POLICY "Tutors can create schedule events"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);
```

---

## Error 3: Asignar Estudiantes a Eventos (student_schedule_assignments)

**Causa**: Solo admins pueden insertar en `student_schedule_assignments`.

**Solución**: Permitir a profesores y tutores asignar estudiantes a eventos que ellos crearon.

```sql
-- Permitir a profesores asignar estudiantes a eventos
CREATE POLICY "Teachers can assign students to schedule events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND assigned_by = auth.uid()
);

-- Permitir a tutores asignar estudiantes a eventos
CREATE POLICY "Tutors can assign students to schedule events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND assigned_by = auth.uid()
);
```

---

## Error 4: Asignar Ejercicios IA a Estudiantes

**Causa**: El filtro de estudiantes en `AssignExerciseDialog` usa `status = 'active'`, pero podría haber estudiantes sin status o con status diferente. También hay que verificar que los estudiantes Alumni no aparezcan.

**Solución**: Modificar el query en `AssignExerciseDialog.tsx`:

```typescript
// Filtrar estudiantes activos Y que no sean alumni
let studentProfilesQuery = supabase
  .from('student_profiles')
  .select('user_id, teacher_id, tutor_id')
  .eq('status', 'active')
  .eq('is_alumni', false); // Excluir alumni
```

Además, para tutores, asegurarse de que también puedan ver estudiantes donde son el tutor:

```typescript
} else if (userRoles.includes('tutor')) {
  // Tutor puede asignar a estudiantes donde es tutor O teacher
  studentProfilesQuery = studentProfilesQuery.or(`tutor_id.eq.${user.id},teacher_id.eq.${user.id}`);
}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| Nueva migración SQL | Agregar políticas RLS para schedule_events, student_schedule_assignments, y actualizar la de student_profiles |
| `src/components/practice/AssignExerciseDialog.tsx` | Agregar filtro `is_alumni = false` y mejorar lógica de OR para tutores |

---

## Migración SQL Completa

```sql
-- ===========================================
-- Fix RLS policies for staff operations
-- ===========================================

-- 1. FIX: Mark as Alumni - Allow admin/coordinator and teachers (as teacher OR tutor)
DROP POLICY IF EXISTS "Teachers can update student alumni status" ON public.student_profiles;

CREATE POLICY "Staff can update student alumni status" 
ON public.student_profiles FOR UPDATE 
USING (
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
)
WITH CHECK (
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
);

-- 2. FIX: Schedule Events - Allow teachers and tutors to create and update their own events
CREATE POLICY "Teachers can create schedule events"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

CREATE POLICY "Tutors can create schedule events"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);

CREATE POLICY "Teachers can update own schedule events"
ON public.schedule_events FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

CREATE POLICY "Tutors can update own schedule events"
ON public.schedule_events FOR UPDATE
USING (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);

CREATE POLICY "Coordinators can manage schedule events"
ON public.schedule_events FOR ALL
USING (public.has_role(auth.uid(), 'coordinator'));

-- 3. FIX: Student Schedule Assignments - Allow teachers and tutors to assign students
CREATE POLICY "Teachers can assign students to events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND assigned_by = auth.uid()
);

CREATE POLICY "Tutors can assign students to events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND assigned_by = auth.uid()
);

CREATE POLICY "Coordinators can manage student schedule assignments"
ON public.student_schedule_assignments FOR ALL
USING (public.has_role(auth.uid(), 'coordinator'));
```

---

## Cambios en AssignExerciseDialog.tsx

```typescript
// Línea ~57-68: Agregar filtro is_alumni
let studentProfilesQuery = supabase
  .from('student_profiles')
  .select('user_id, teacher_id, tutor_id')
  .eq('status', 'active')
  .eq('is_alumni', false); // Excluir estudiantes alumni

if (userRoles.includes('admin') || userRoles.includes('coordinator')) {
  // Admin/coordinator sees all active non-alumni students
} else if (userRoles.includes('teacher')) {
  // Teachers see students where they are teacher OR tutor
  studentProfilesQuery = studentProfilesQuery.or(`teacher_id.eq.${user.id},tutor_id.eq.${user.id}`);
} else if (userRoles.includes('tutor')) {
  // Tutors see students where they are tutor OR teacher
  studentProfilesQuery = studentProfilesQuery.or(`tutor_id.eq.${user.id},teacher_id.eq.${user.id}`);
} else {
  return [];
}
```

---

## Resumen de Correcciones

| Error | Causa | Solución |
|-------|-------|----------|
| Marcar como Alumni | Política solo permitía `teacher_id` | Nueva política incluye admin, coordinator, y teacher como teacher_id O tutor_id |
| Asignar horarios | Solo admin podía INSERT en schedule_events | Nuevas políticas INSERT para teachers/tutors |
| Eventos en calendario | Solo admin podía INSERT en student_schedule_assignments | Nuevas políticas INSERT para teachers/tutors |
| Asignar ejercicios IA | Query no excluía alumni; tutors no veían todos sus estudiantes | Agregar filtro `is_alumni = false` y OR para teacher_id/tutor_id |
