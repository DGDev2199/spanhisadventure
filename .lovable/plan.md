
# Plan: Corregir Permisos de Grupo y Cálculo de Horas

## Problemas Identificados

### 1. Botón "Grupo" en Dashboard de Profesor
El botón de "Grupo" para asignar horarios múltiples está disponible para profesores y tutores, pero según las reglas del sistema, esta funcionalidad debería ser **exclusiva de Admin y Coordinator**.

**Ubicación:** `TeacherDashboard.tsx` líneas 394-401 y `TutorDashboard.tsx`

### 2. Falta `group_session_id` en Asignaciones
El componente `AssignMultipleStudentsDialog` (usado por profesores) **NO genera `group_session_id`**, lo que causa que el cálculo de horas sea incorrecto.

**Ejemplo del problema actual:**
- Profesor asigna 3 estudiantes a clase de 2 horas → Sistema suma 6 horas (incorrecto)
- Debería sumar solo 2 horas (es la misma clase grupal)

**Comparación:**
| Componente | Usa `group_session_id` |
|------------|------------------------|
| `AdminAssignMultipleSchedulesDialog` | ✅ Sí (línea 120) |
| `AssignMultipleStudentsDialog` | ❌ No |

---

## Solución Propuesta

### Opción A: Remover botón de Profesor/Tutor (Recomendada)
Eliminar el botón "Grupo" del dashboard de profesores y tutores, dejando esta funcionalidad solo para administradores.

### Opción B: Agregar `group_session_id` al componente
Si quieres mantener la funcionalidad para profesores, agregar la lógica de `group_session_id`.

---

## Cambios Técnicos (Opción A)

### Archivo: `src/pages/TeacherDashboard.tsx`

**Eliminar líneas 392-401:**
```tsx
// ELIMINAR este bloque
<Button
  onClick={() => setAssignMultipleOpen(true)}
  variant="outline"
  size="sm"
  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
>
  <Users className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Grupo</span>
</Button>
```

**Eliminar estado y diálogo:**
- Línea 173: `const [assignMultipleOpen, setAssignMultipleOpen] = useState(false);`
- Líneas 1287-1292: El componente `<AssignMultipleStudentsDialog />`
- Línea 35: El import de `AssignMultipleStudentsDialog`

### Archivo: `src/pages/TutorDashboard.tsx`
Aplicar los mismos cambios (eliminar botón, estado, import y diálogo).

---

## Resumen

| Cambio | Impacto |
|--------|---------|
| Remover botón "Grupo" de profesores | Permisos correctos según arquitectura |
| Remover botón "Grupo" de tutores | Permisos correctos según arquitectura |
| Admin mantiene funcionalidad completa | ✅ Ya usa `group_session_id` |
| Cálculo de horas | ✅ Funciona correctamente con admin |

---

## Verificación Post-Cambio

1. El botón "Grupo" solo aparecerá en **AdminDashboard**
2. Las clases grupales asignadas por admin usarán `group_session_id`
3. El cálculo de horas sumará 2 horas por clase (no 2 × número de estudiantes)
4. La función SQL `calculate_staff_hours()` ya está lista para manejar esto correctamente
