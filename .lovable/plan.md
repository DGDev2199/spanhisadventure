
# Plan: Permisos del Coordinador y Funciones de Admin para Asignar Nivel

## Problemas Identificados

### 1. Coordinador no puede aprobar estudiantes
**Causa**: La tabla `profiles` solo tiene politica UPDATE para admin, no para coordinador.

Politicas actuales de `profiles`:
- `Admins can update all profiles` - Solo admin puede UPDATE
- `Coordinators can view all profiles` - Coordinador solo puede SELECT

### 2. Falta boton "Asignar sin Test" en AdminDashboard
El componente `ManualLevelAssignDialog` solo esta en `TeacherDashboard`, pero admin y coordinador deberian poder asignar nivel manualmente.

### 3. Admin/Coordinador no pueden editar progreso semanal sin ser profesor asignado
Las politicas de `student_progress_weeks` y `student_progress_notes` requieren ser teacher/tutor asignado al estudiante, pero admin y coordinador deberian poder hacerlo tambien.

---

## Solucion

### Parte 1: Migracion SQL para RLS

```sql
-- 1. Permitir a coordinadores UPDATE en profiles (para aprobar usuarios)
CREATE POLICY "Coordinators can update profiles for approval"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));

-- 2. Permitir a coordinadores gestionar student_progress_weeks
CREATE POLICY "Coordinators can manage all progress weeks"
ON public.student_progress_weeks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));

-- 3. Permitir a coordinadores gestionar student_progress_notes
CREATE POLICY "Coordinators can manage all progress notes"
ON public.student_progress_notes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));
```

### Parte 2: Agregar ManualLevelAssignDialog a AdminDashboard

**Archivo:** `src/pages/AdminDashboard.tsx`

Cambios:
1. Importar `ManualLevelAssignDialog` 
2. Agregar estado `manualLevelDialogOpen` y `manualLevelStudent`
3. Agregar boton "Asignar Nivel" en la tabla de estudiantes (junto a Progreso, Horario, Assign)
4. Renderizar el dialogo al final del componente

```typescript
// Nuevos estados
const [manualLevelDialogOpen, setManualLevelDialogOpen] = useState(false);
const [manualLevelStudent, setManualLevelStudent] = useState<any>(null);

// En la tabla de estudiantes, agregar boton
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    setManualLevelStudent(student);
    setManualLevelDialogOpen(true);
  }}
>
  <GraduationCap className="h-4 w-4 sm:mr-1" />
  <span className="hidden sm:inline">Nivel</span>
</Button>

// Dialogo al final
{manualLevelStudent && (
  <ManualLevelAssignDialog
    open={manualLevelDialogOpen}
    onOpenChange={setManualLevelDialogOpen}
    studentId={manualLevelStudent.user_id}
    studentName={manualLevelStudent.profiles?.full_name || 'Estudiante'}
    currentLevel={manualLevelStudent.level}
  />
)}
```

### Parte 3: Actualizar StudentProgressView para detectar rol admin/coordinator

**Archivo:** `src/components/StudentProgressView.tsx`

Actualmente la funcion `getUserRole()` devuelve `'admin'` si el usuario tiene rol admin. Pero necesita incluir `'coordinator'` tambien para que pueda editar.

```typescript
const getUserRole = (): 'teacher' | 'tutor' | 'student' | 'admin' => {
  if (currentUser?.roles?.includes('admin')) return 'admin';
  if (currentUser?.roles?.includes('coordinator')) return 'admin'; // Coordinador actua como admin
  if (currentUser?.roles?.includes('teacher')) return 'teacher';
  if (currentUser?.roles?.includes('tutor')) return 'tutor';
  return 'student';
};
```

---

## Resumen de Cambios

| Archivo | Cambios |
|---------|---------|
| **Migracion SQL** | 3 nuevas politicas RLS para coordinador |
| `AdminDashboard.tsx` | +Import ManualLevelAssignDialog, +estados, +boton "Nivel", +dialogo |
| `StudentProgressView.tsx` | Actualizar `getUserRole()` para incluir coordinator |

---

## Comportamiento Esperado

1. **Coordinador aprueba estudiante**: Click en "Aprobar" → Solicitud desaparece de la lista
2. **Admin/Coordinador asigna nivel**: Boton "Nivel" en tabla de estudiantes → Dialog para seleccionar nivel y semana
3. **Admin/Coordinador edita progreso**: Modal de progreso con todos los campos editables
4. **Mismos permisos**: Coordinador tiene los mismos permisos que admin excepto funciones especificas ya definidas

---

## Flujo de Usuario

```text
Admin/Coordinador Dashboard
    |
    +-- Panel de Aprobaciones
    |       |-- Aprobar ✓ (ahora funciona para coordinador)
    |       +-- Rechazar ✓
    |
    +-- Tabla de Estudiantes
            |-- [Progreso] → Modal con edicion completa
            |-- [Horario] → Dialog de horario
            |-- [Nivel] (NUEVO) → ManualLevelAssignDialog
            +-- [Assign] → Asignar profesor/tutor
```
