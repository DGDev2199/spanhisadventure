
# Plan: Sistema de Alumni con Ejercicios Diarios Personalizados

## Resumen

Cuando un estudiante deja la escuela físicamente pero desea continuar practicando español, se le marcará como "Alumni". Estos estudiantes tendrán acceso a un dashboard simplificado con:
- **10 ejercicios diarios personalizados** generados por IA basados en sus debilidades
- **Historial de progreso semanal** (solo lectura)
- **Su progreso del estudiante** (solo lectura)
- **Ranking y logros** basados en ejercicios completados

---

## Cambios en la Base de Datos

### 1. Agregar columna `is_alumni` a `student_profiles`

```sql
ALTER TABLE student_profiles 
ADD COLUMN is_alumni BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN alumni_since TIMESTAMP WITH TIME ZONE;
```

### 2. Crear tabla `daily_exercise_packs`

```sql
CREATE TABLE daily_exercise_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exercises_data JSONB NOT NULL,           -- Los 10 ejercicios generados
  analysis_summary TEXT,                   -- Resumen del análisis de la IA
  completed_count INTEGER DEFAULT 0,       -- Cuántos ha completado
  is_completed BOOLEAN DEFAULT false,      -- Si completó los 10
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,                           -- Puntuación promedio
  expires_at DATE NOT NULL,                -- Fecha de expiración (día siguiente)
  UNIQUE(student_id, expires_at)           -- Un pack por día
);

ALTER TABLE daily_exercise_packs ENABLE ROW LEVEL SECURITY;

-- Los estudiantes pueden ver y actualizar sus propios packs
CREATE POLICY "Students can view own packs" 
ON daily_exercise_packs FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update own packs" 
ON daily_exercise_packs FOR UPDATE 
USING (student_id = auth.uid());

-- Solo el sistema (via edge function) puede insertar
CREATE POLICY "System can insert packs" 
ON daily_exercise_packs FOR INSERT 
WITH CHECK (true);
```

---

## Nueva Edge Function: `generate-daily-exercises`

Esta función analizará el progreso del estudiante y generará 10 ejercicios personalizados.

### Flujo de la función:

```
┌────────────────────────────────────────────────────────────────────┐
│                  generate-daily-exercises                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Recibe: student_id                                             │
│                                                                    │
│  2. Obtiene datos del estudiante:                                  │
│     ├── student_profiles (level)                                   │
│     ├── student_progress_weeks (últimas semanas)                   │
│     ├── student_progress_notes (challenges, vocabulary, topics)    │
│     └── student_topic_progress (colores: rojo/amarillo = debil)    │
│                                                                    │
│  3. Construye prompt para Lovable AI:                              │
│     "Basándote en este análisis del estudiante:                    │
│      - Nivel: A2                                                   │
│      - Desafíos: [challenges de las notas]                         │
│      - Temas con dificultad (rojo): [lista]                        │
│      - Temas en práctica (amarillo): [lista]                       │
│      - Vocabulario reciente: [vocabulary]                          │
│                                                                    │
│      Genera 10 ejercicios variados enfocados en sus debilidades"   │
│                                                                    │
│  4. La IA genera un pack de 10 ejercicios variados:                │
│     ├── 3 vocabulary (palabras problemáticas)                      │
│     ├── 2 conjugation (tiempos verbales con dificultad)            │
│     ├── 2 fill_gaps (contexto gramatical)                          │
│     ├── 2 multiple_choice (comprensión)                            │
│     └── 1 sentence_order (estructura)                              │
│                                                                    │
│  5. Guarda en daily_exercise_packs y retorna                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Nuevos Componentes Frontend

### 1. `AlumniDashboard.tsx` - Dashboard para estudiantes Alumni

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Spanish Adventure                            [🔔] [Logout]  │
│         Alumni                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ¡Hola [Nombre]! 👋                                                 │
│  Continúa practicando tu español con ejercicios personalizados     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📅 Ejercicios de Hoy                                   [10]  │   │
│  │                                                              │   │
│  │  Basado en tu progreso, hemos preparado ejercicios          │   │
│  │  enfocados en: conjugación pretérito, vocabulario viajes    │   │
│  │                                                              │   │
│  │  ⬛⬛⬛⬛⬛⬜⬜⬜⬜⬜  5/10 completados                    │   │
│  │                                                              │   │
│  │  [▶️ Continuar Ejercicios]                                   │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────┐ ┌──────────────────────┐                 │
│  │ 📊 Mi Nivel: A2      │ │ 🔥 Racha: 5 días     │                 │
│  │ Ejercicios hoy: 5/10 │ │ Total ejercicios: 87 │                 │
│  └──────────────────────┘ └──────────────────────┘                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📅 Ejercicios Anteriores (últimos 7 días)                    │   │
│  │                                                              │   │
│  │  Lun 22: ✅ 10/10 - 92%                                      │   │
│  │  Dom 21: ✅ 10/10 - 88%                                      │   │
│  │  Sab 20: ⚠️ 7/10 - 85% [Repetir]                             │   │
│  │  Vie 19: ✅ 10/10 - 95%                                      │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🏆 Mi Ranking            │ 📈 Mi Progreso Semanal           │   │
│  │ #15 de 48 estudiantes    │ [Semana 1] [Semana 2] ...        │   │
│  │                          │                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📖 Mi Progreso del Estudiante (solo lectura)                 │   │
│  │ [Vista colapsada de las semanas y notas de progreso]         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. `DailyExercisePanel.tsx` - Panel de ejercicios diarios

Componente que muestra el pack de ejercicios del día:
- Genera automáticamente si no existe uno para hoy
- Muestra progreso (X/10)
- Permite continuar donde lo dejó
- Muestra resumen del análisis de IA ("Enfocados en tus retos con...")

### 3. `PastExercisesPanel.tsx` - Historial de ejercicios anteriores

- Lista de packs anteriores (últimos 7-14 días)
- Opción de repetir packs incompletos o para practicar más
- Estadísticas de puntuación

### 4. Modificación de `MarkAsAlumniDialog.tsx`

Nuevo diálogo que se abre desde StudentProgressView:

```
┌────────────────────────────────────────────────────────┐
│ Marcar como Alumni                                  ✕  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ⚠️ Esta acción marcará a [Nombre] como estudiante     │
│ Alumni (ya no está en la escuela físicamente).        │
│                                                        │
│ El estudiante:                                         │
│ ✓ Podrá seguir practicando con ejercicios diarios     │
│ ✓ Mantendrá acceso a su historial de progreso         │
│ ✓ Participará en el ranking con sus ejercicios        │
│                                                        │
│ ✗ No tendrá acceso a chat, tareas, o profesor         │
│ ✗ No aparecerá en listas de estudiantes activos       │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ La IA analizará sus notas de progreso y          │  │
│ │ calificaciones de temas para generar ejercicios  │  │
│ │ personalizados enfocados en sus debilidades.     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│        [Cancelar]        [Marcar como Alumni]          │
└────────────────────────────────────────────────────────┘
```

---

## Modificación del Routing

### `DashboardRouter.tsx`

```typescript
// Agregar verificación de alumni
if (userRole === 'student') {
  // Verificar si es alumni
  if (studentProfile?.is_alumni) {
    return <AlumniDashboard />;
  }
  return <Dashboard />;
}
```

---

## Lógica de Generación de Ejercicios

### Análisis del estudiante por la IA:

1. **Obtener datos del estudiante:**
   - `level` de student_profiles
   - `challenges` de student_progress_notes (últimas 3-4 semanas)
   - `vocabulary` de student_progress_notes
   - Temas con color `red` o `yellow` en student_topic_progress

2. **Construir contexto para la IA:**
   ```
   "Estudiante nivel A2.
   Desafíos identificados: 'Dificultad con pretérito indefinido, confunde ser/estar'
   Vocabulario practicado: 'viajes, comida, familia'
   Temas con dificultad (rojo): 'Pretérito Indefinido - Irregulares'
   Temas en práctica (amarillo): 'Ser vs Estar', 'Vocabulario de viajes'
   
   Genera 10 ejercicios variados enfocados en estas debilidades..."
   ```

3. **La IA genera ejercicios personalizados** enfocados en las áreas problemáticas

---

## Sistema de Puntos para Alumni

- Completar un ejercicio: +1 punto
- Completar los 10 ejercicios del día: +5 puntos bonus
- Respuesta correcta: +1 punto adicional
- Racha de 7 días consecutivos: +25 puntos bonus

Esto les permite seguir compitiendo en el leaderboard.

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/pages/AlumniDashboard.tsx` | CREAR | Dashboard simplificado para alumni |
| `src/components/alumni/DailyExercisePanel.tsx` | CREAR | Panel de ejercicios diarios |
| `src/components/alumni/PastExercisesPanel.tsx` | CREAR | Historial de ejercicios anteriores |
| `src/components/alumni/DailyExerciseView.tsx` | CREAR | Vista para realizar los ejercicios |
| `src/components/MarkAsAlumniDialog.tsx` | CREAR | Diálogo de confirmación |
| `src/components/StudentProgressView.tsx` | MODIFICAR | Agregar botón "Marcar como Alumni" |
| `src/components/DashboardRouter.tsx` | MODIFICAR | Redirigir alumni a su dashboard |
| `supabase/functions/generate-daily-exercises/index.ts` | CREAR | Edge function para generar ejercicios |
| Migración SQL | CREAR | Agregar columnas y tabla nueva |

---

## Detalles Técnicos

### Generación automática vs bajo demanda

Los ejercicios se generan **bajo demanda** cuando el estudiante abre el dashboard:
1. Si no hay pack para hoy → Generar nuevo pack
2. Si hay pack incompleto → Continuar
3. Si hay pack completo de hoy → Mostrar como completado, ofrecer repetir

### Expiración de packs

- Cada pack tiene `expires_at` = fecha del día siguiente
- Los packs anteriores se mantienen para poder repetirlos
- Después de 30 días se pueden archivar/eliminar

### RLS Considerations

- Los alumni no tendrán acceso a tablas como `direct_messages`, `tasks`, etc.
- Solo tendrán acceso a: `daily_exercise_packs`, `profiles`, `student_progress_weeks/notes` (lectura), `user_rankings`
