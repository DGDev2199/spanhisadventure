
# Plan: Corregir Edición de Materiales y Sistema Detallado de Horas

## Problema 1: Error Visual al Editar Material en Móvil

### Diagnóstico
Al hacer click en el lápiz para editar un material, el código cambia correctamente a `activeTab='materials'` pero el formulario puede no ser visible porque:
1. El formulario de edición está dentro del TabsContent "materials" pero puede quedar oculto por el ScrollArea
2. El estado `addingMaterial` y `materialTopicId` se establecen correctamente pero la transición visual no es clara

### Solución
Modificar el comportamiento para que en móvil se muestre el formulario de forma más prominente:

**Archivo:** `src/components/ManageCurriculumDialog.tsx`

1. Agregar un scroll automático al formulario cuando se activa la edición
2. Mejorar la visibilidad del formulario con un efecto de highlight temporal
3. Asegurar que el formulario esté al inicio del TabsContent (ya lo está)

```typescript
// En handleEditMaterial, agregar un setTimeout para scroll
const handleEditMaterial = (material: TopicMaterial) => {
  setEditingMaterial(material);
  setMaterialTitle(material.title);
  // ... resto del código ...
  setActiveTab('materials');
  
  // Scroll al formulario después del cambio de tab
  setTimeout(() => {
    document.getElementById('material-form')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
};
```

---

## Problema 2: Sistema Detallado de Horas Mensuales

### Diagnóstico Actual
- La tabla `staff_hours` solo almacena totales agregados
- No hay desglose por tipo de actividad
- Las horas no se resetean por mes
- No hay historial visible de qué generó las horas

### Estructura de Datos Necesaria

**Nueva tabla:** `staff_hours_detail`
```sql
CREATE TABLE staff_hours_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- Primer día del mes (ej: 2026-02-01)
  source_type TEXT NOT NULL, -- 'class', 'adventure', 'elective', 'event', 'booking', 'extra'
  source_id UUID, -- ID del schedule/event/booking relacionado
  source_title TEXT, -- Descripción legible
  hours DECIMAL NOT NULL,
  day_of_week INTEGER, -- 0-6 para actividades recurrentes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_staff_hours_detail_user_month ON staff_hours_detail(user_id, month_year);
CREATE INDEX idx_staff_hours_detail_source ON staff_hours_detail(source_type);
```

**Modificar tabla `staff_hours`:**
```sql
ALTER TABLE staff_hours ADD COLUMN month_year DATE;
-- Agregar constraint para que cada usuario tenga un registro por mes
```

### Nueva Función SQL para Cálculo Mensual Detallado

```sql
CREATE OR REPLACE FUNCTION calculate_staff_hours_detailed()
RETURNS void AS $$
DECLARE
  staff_record RECORD;
  schedule_record RECORD;
  event_record RECORD;
  current_month DATE := date_trunc('month', CURRENT_DATE);
BEGIN
  -- Limpiar detalles del mes actual
  DELETE FROM staff_hours_detail WHERE month_year = current_month;
  
  FOR staff_record IN 
    SELECT DISTINCT user_id FROM user_roles WHERE role IN ('teacher', 'tutor')
  LOOP
    -- Insertar detalles de clases grupales (usando DISTINCT ON group_session_id)
    INSERT INTO staff_hours_detail (user_id, month_year, source_type, source_id, source_title, hours, day_of_week)
    SELECT 
      staff_record.user_id,
      current_month,
      schedule_type, -- 'class', 'adventure', 'elective', etc.
      id,
      'Clase ' || CASE day_of_week 
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        -- etc.
      END,
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0,
      day_of_week
    FROM (
      SELECT DISTINCT ON (COALESCE(group_session_id::text, id::text))
        id, schedule_type, day_of_week, start_time, end_time
      FROM student_class_schedules
      WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
      AND is_active = true
    ) unique_schedules;
    
    -- Insertar detalles de eventos
    INSERT INTO staff_hours_detail (...)
    SELECT ... FROM schedule_events WHERE ...;
    
    -- Insertar detalles de reservas completadas del mes
    INSERT INTO staff_hours_detail (...)
    SELECT ... FROM class_bookings WHERE ...;
    
    -- Insertar horas extras aprobadas
    INSERT INTO staff_hours_detail (...)
    SELECT ... FROM extra_hours WHERE approved = true;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Componentes UI Nuevos

**1. Nuevo componente:** `StaffHoursDetailDialog.tsx`

Vista detallada de horas que muestra:
- Selector de mes (navigate entre meses)
- Resumen por tipo de actividad (gráfico de barras o pie)
- Lista detallada agrupada por tipo:
  - Clases regulares
  - Aventuras
  - Electivas
  - Eventos especiales
  - Reservas de estudiantes
  - Horas extras

```
+--------------------------------------------------+
| Horas de Febrero 2026                    [◀ ▶]   |
+--------------------------------------------------+
| RESUMEN                                          |
| ┌────────────────────────────────────────────┐   |
| │ ████████████ Clases (24h)                  │   |
| │ ████████ Aventuras (16h)                   │   |
| │ ████ Electivas (8h)                        │   |
| │ ██ Eventos (4h)                            │   |
| │ ██ Horas Extras (3h)                       │   |
| └────────────────────────────────────────────┘   |
|                                                  |
| DETALLE                                          |
| ┌────────────────────────────────────────────┐   |
| │ 📚 CLASES (24h)                            │   |
| │   • Lunes 10:00-12:00 (2h) - Clase grupal  │   |
| │   • Martes 14:00-16:00 (2h) - Clase grupal │   |
| │   • ...                                    │   |
| │                                            │   |
| │ 🏔️ AVENTURAS (16h)                         │   |
| │   • Viernes 09:00-13:00 (4h) - Hiking      │   |
| │   • ...                                    │   |
| └────────────────────────────────────────────┘   |
+--------------------------------------------------+
| Total: 55 horas                                  |
+--------------------------------------------------+
```

**2. Modificar:** `StaffHoursCard.tsx`

- Agregar botón "Ver Desglose"
- Cambiar etiqueta de "Semanal" a "Mensual"
- Mostrar el mes actual

**3. Modificar:** `ManageStaffHoursDialog.tsx`

Para admin:
- Agregar columna "Ver Detalle" con botón para abrir StaffHoursDetailDialog
- Cambiar "Recalcular Todo" para que use la nueva función

---

## Cambios de i18n

**Archivo:** `src/i18n/locales/en.json` y `es.json`

```json
"staffHours": {
  "myHours": "My Hours",
  "monthlyHours": "Monthly Hours",
  "viewBreakdown": "View Breakdown",
  "hoursSummary": "Hours Summary",
  "detailFor": "Detail for",
  "byActivityType": "By Activity Type",
  "classes": "Classes",
  "adventures": "Adventures", 
  "electives": "Electives",
  "events": "Events",
  "bookings": "Bookings",
  "extraHours": "Extra Hours",
  "totalMonth": "Total this month",
  "previousMonth": "Previous month",
  "nextMonth": "Next month",
  "noHoursThisMonth": "No hours recorded this month",
  "calculatedFrom": "Calculated from weekly schedule",
  "resetMonthly": "Hours reset monthly"
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `ManageCurriculumDialog.tsx` | Fix scroll al formulario en móvil |
| `StaffHoursCard.tsx` | Cambiar a "Mensual", agregar botón "Ver Desglose" |
| `ManageStaffHoursDialog.tsx` | Agregar columna de detalle, botón para ver desglose |
| `StaffHoursDetailDialog.tsx` (NUEVO) | Diálogo completo con desglose por tipo |
| `en.json`, `es.json` | Traducciones de staffHours |
| **Migración SQL** | Nueva tabla `staff_hours_detail`, función `calculate_staff_hours_detailed()` |

---

## Beneficios

1. **Transparencia total**: Staff y admin ven exactamente qué genera cada hora
2. **Histórico mensual**: Poder navegar meses anteriores
3. **Desglose por tipo**: Saber cuántas horas son de clases vs aventuras vs electivas
4. **Reset automático mensual**: Las horas se calculan por mes, no acumulativas
5. **Auditoría**: Cada hora tiene trazabilidad a su origen (schedule_id, event_id, etc.)
