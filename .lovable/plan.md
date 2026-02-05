
# Plan: Tutorial Ultra-Detallado con Pasos Individuales por Botón

## Entendimiento del Problema

El tutorial actual agrupa demasiada información en pocos pasos. Por ejemplo, el paso "Generador de Ejercicios IA" explica todo el panel de una vez, cuando debería:
1. Primero explicar el **botón "Generar con IA"**
2. Luego explicar las **pestañas de tipos** (Flashcards, Conjugación, etc.)
3. Luego explicar el **botón "Asignar"** en cada ejercicio
4. Luego explicar el **botón "Practicar"**

## Nueva Estructura del Tutorial

En lugar de 9-11 pasos generales, tendremos **20-30 pasos específicos** por rol, cada uno enfocado en **un solo elemento**.

---

## Cambios Necesarios

### 1. Agregar `data-tutorial` a CADA Botón Individual

**En PracticeSessionPanel.tsx:**
```tsx
// Botón generar
<Button data-tutorial="generate-ai-btn" onClick={() => setShowGenerateDialog(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Generar con IA
</Button>

// Pestañas de tipos
<TabsList data-tutorial="exercise-tabs">
  <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
  ...
</TabsList>

// Botón asignar en cada ejercicio
<Button data-tutorial="assign-exercise-btn" onClick={() => handleAssign(exercise.id)}>
  <Users className="h-4 w-4" />
</Button>

// Botón practicar
<Button data-tutorial="practice-exercise-btn" onClick={() => setSelectedExercise(exercise)}>
  <Play className="h-4 w-4" />
</Button>
```

**En TeacherMaterialsPanel.tsx:**
```tsx
// Título colapsable
<CollapsibleTrigger data-tutorial="materials-expand-btn">
  Materiales y Guías del Currículo
</CollapsibleTrigger>

// Cada semana
<CollapsibleTrigger data-tutorial="week-expand-btn">
  Semana X: Título
</CollapsibleTrigger>
```

**En TeacherDashboard.tsx:**
```tsx
// Cada botón de acción en la tabla de estudiantes
<Button data-tutorial="student-chat-btn">Chat</Button>
<Button data-tutorial="student-progress-btn">Progreso</Button>
<Button data-tutorial="student-call-btn">Llamar</Button>

// Botón crear tarea
<Button data-tutorial="create-task-btn">+ Tarea</Button>

// Botón crear examen
<Button data-tutorial="create-test-btn">+ Examen</Button>
```

---

### 2. Nuevos Pasos Detallados para PROFESORES

```typescript
export const teacherSteps: Step[] = [
  // === BIENVENIDA ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Profesor! 👨‍🏫',
    content: 'Este tutorial te guiará paso a paso por cada botón y función de tu panel. ¡Vamos a explorarlo juntos!',
    disableBeacon: true,
  },

  // === TABLA DE ESTUDIANTES - GENERAL ===
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Esta tabla muestra todos tus estudiantes asignados.

Cada fila tiene información del estudiante y **botones de acción** a la derecha. Vamos a ver cada botón...`,
    disableBeacon: true,
  },

  // === BOTÓN CHAT EN TABLA ===
  {
    target: '[data-tutorial="student-chat-btn"]',
    title: 'Botón Chat 💬',
    content: `Abre una conversación directa con este estudiante.

📌 **Uso**: Envía mensajes, responde dudas, da instrucciones.
📌 **Notificación**: El estudiante recibirá alerta de tu mensaje.

💡 Tip: Usa el chat para seguimiento personalizado fuera de clase.`,
    disableBeacon: true,
  },

  // === BOTÓN PROGRESO EN TABLA ===
  {
    target: '[data-tutorial="student-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Abre el panel completo de progreso del estudiante.

📌 **Pestaña Currículo**: Ve qué semanas y temas ha completado.
📌 **Pestaña Notas**: Registra observaciones diarias (clase, tutoría, vocabulario).
📌 **Pestaña Logros**: Otorga insignias por buen desempeño.

💡 Tip: Revisa el progreso antes de cada clase para preparar el contenido.`,
    disableBeacon: true,
  },

  // === BOTÓN VIDEOLLAMADA EN TABLA ===
  {
    target: '[data-tutorial="student-call-btn"]',
    title: 'Botón Videollamada 📹',
    content: `Inicia una videollamada con el estudiante (solo para estudiantes online).

📌 **Uso**: Haz clic para abrir la sala de video.
📌 **El estudiante**: Recibirá notificación para unirse.

💡 Tip: Prueba la conexión antes de la clase programada.`,
    disableBeacon: true,
  },

  // === BOTÓN CREAR TAREA ===
  {
    target: '[data-tutorial="create-task-btn"]',
    title: 'Botón Crear Tarea ➕📝',
    content: `Abre el formulario para asignar una nueva tarea.

📌 **Campos**:
   - Título de la tarea
   - Descripción detallada
   - Fecha de entrega
   - Archivo PDF adjunto (opcional)
   - Seleccionar estudiante(s)

📌 **Puntos**: El estudiante gana +5 pts al entregar.

💡 Tip: Sé específico en la descripción para evitar confusiones.`,
    disableBeacon: true,
  },

  // === PANEL REVISIÓN TAREAS ===
  {
    target: '[data-tutorial="task-review-panel"]',
    title: 'Panel de Tareas Enviadas 📬',
    content: `Lista de tareas que estudiantes han entregado para tu revisión.

📌 **Ver entrega**: Haz clic para abrir el trabajo del estudiante.
📌 **Calificar**: Asigna 0, 5 o 10 puntos extra.
📌 **Feedback**: Escribe comentarios para el estudiante.

💡 Tip: Revisa las entregas pronto para mantener la motivación del estudiante.`,
    disableBeacon: true,
  },

  // === BOTÓN CREAR EXAMEN ===
  {
    target: '[data-tutorial="create-test-btn"]',
    title: 'Botón Crear Examen ➕📋',
    content: `Abre el creador de exámenes personalizados.

📌 **Tipos de preguntas**:
   - Opción múltiple (A, B, C, D)
   - Completar espacios
   - Verdadero/Falso
   - Respuesta corta

📌 **Configuración**: Tiempo límite, fecha, estudiantes asignados.

💡 Tip: Mezcla tipos de preguntas para evaluar diferentes habilidades.`,
    disableBeacon: true,
  },

  // === CARD HORAS ===
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Tarjeta de Horas 🕐',
    content: `Resumen de tus horas trabajadas esta semana.

📌 **Visualización**:
   - Horas de hoy
   - Total de la semana
   - Límite asignado
   - Gráfico por día

💡 Tip: Las horas se calculan automáticamente de eventos en el calendario.`,
    disableBeacon: true,
  },

  // === PANEL EJERCICIOS - GENERAL ===
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Panel de Ejercicios Prácticos 🎯',
    content: `Aquí generas y gestionas ejercicios con IA. Vamos a ver cada parte...`,
    disableBeacon: true,
  },

  // === BOTÓN GENERAR CON IA ===
  {
    target: '[data-tutorial="generate-ai-btn"]',
    title: 'Botón "Generar con IA" 🤖',
    content: `Abre el formulario para crear ejercicios con inteligencia artificial.

📌 **Pasos**:
   1. Selecciona tipo de ejercicio
   2. Elige nivel (A1-C2)
   3. Escribe el tema o vocabulario
   4. Haz clic en "Generar"
   5. La IA crea los ejercicios automáticamente

📌 **Tiempo**: Tarda 10-30 segundos según la complejidad.

💡 Tip: Sé específico con el tema para mejores resultados.`,
    disableBeacon: true,
  },

  // === PESTAÑAS DE TIPOS ===
  {
    target: '[data-tutorial="exercise-tabs"]',
    title: 'Pestañas de Tipos de Ejercicio 📚',
    content: `Filtra los ejercicios creados por tipo:

📌 **Flashcards**: Tarjetas de vocabulario (frente/reverso)
📌 **Conjugación**: Verbos en diferentes tiempos
📌 **Vocabulario**: Definiciones y traducciones
📌 **Ordenar Frases**: Poner palabras en orden correcto
📌 **Opción Múltiple**: Preguntas con 4 opciones
📌 **Completar Huecos**: Rellenar espacios en oraciones
📌 **Lectura**: Textos con preguntas de comprensión

💡 Tip: Usa "Todos" para ver todos los ejercicios juntos.`,
    disableBeacon: true,
  },

  // === BOTÓN ASIGNAR EJERCICIO ===
  {
    target: '[data-tutorial="assign-exercise-btn"]',
    title: 'Botón Asignar 👥',
    content: `Asigna este ejercicio a uno o varios estudiantes.

📌 **Pasos**:
   1. Haz clic en el icono de personas
   2. Selecciona los estudiantes
   3. Confirma la asignación

📌 **Resultado**: El estudiante verá el ejercicio en su panel de práctica.

💡 Tip: Puedes asignar el mismo ejercicio a múltiples estudiantes.`,
    disableBeacon: true,
  },

  // === BOTÓN PRACTICAR EJERCICIO ===
  {
    target: '[data-tutorial="practice-exercise-btn"]',
    title: 'Botón Practicar ▶️',
    content: `Abre el ejercicio para verlo o probarlo tú mismo.

📌 **Uso**: 
   - Revisa cómo se ve el ejercicio
   - Verifica que las respuestas son correctas
   - Prueba la experiencia del estudiante

💡 Tip: Siempre prueba un ejercicio antes de asignarlo.`,
    disableBeacon: true,
  },

  // === PANEL MATERIALES - GENERAL ===
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Panel de Materiales 📚',
    content: `Accede a guías y recursos del currículo. Haz clic para expandirlo...`,
    disableBeacon: true,
  },

  // === BOTÓN EXPANDIR SEMANA ===
  {
    target: '[data-tutorial="week-expand-btn"]',
    title: 'Expandir Semana 📂',
    content: `Haz clic en una semana para ver sus temas y materiales.

📌 **Contenido**: Cada semana tiene múltiples temas.
📌 **Guías del profesor**: Marcadas con 🎓 (protegidas con marca de agua).
📌 **Material extra**: Recursos adicionales para compartir.

💡 Tip: Las guías del profesor tienen instrucciones detalladas para cada tema.`,
    disableBeacon: true,
  },

  // === CLASES PROGRAMADAS ===
  {
    target: '[data-tutorial="scheduled-classes"]',
    title: 'Clases Programadas 📅',
    content: `Panel de reservaciones de estudiantes online.

📌 **Información**:
   - Nombre del estudiante
   - Fecha y hora reservada
   - Estado (pendiente/confirmada)

📌 **Acciones**: Confirmar, reagendar o iniciar videollamada.

💡 Tip: Revisa las reservaciones cada mañana para estar preparado.`,
    disableBeacon: true,
  },

  // === BOTÓN MI HORARIO ===
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Botón "Horario" 🗓️',
    content: `Abre tu calendario personal con todas las actividades.

📌 **Contenido**:
   - Clases programadas
   - Tutorías (si también eres tutor)
   - Eventos de la escuela

📌 **Vista**: Calendario semanal con código de colores.

💡 Tip: Consulta tu horario cada día al comenzar.`,
    disableBeacon: true,
  },

  // === NOTIFICACIONES ===
  {
    target: '[data-tutorial="notifications"]',
    title: 'Campana de Notificaciones 🔔',
    content: `Haz clic aquí para ver alertas importantes.

📌 **Te notifica sobre**:
   - Mensajes de estudiantes
   - Tareas enviadas para revisar
   - Cambios de horario
   - Avisos administrativos

📌 **Número rojo**: Cantidad de notificaciones sin leer.

💡 Tip: Revisa las notificaciones al iniciar sesión.`,
    disableBeacon: true,
  },

  // === CIERRE ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Tutorial Completado! 🎉',
    content: `Ya conoces cada botón y función de tu panel.

📌 **Resumen de acciones principales**:
   - 💬 Chat: Mensajes con estudiantes
   - 📊 Progreso: Ver avance y notas
   - 📝 Tareas: Crear y revisar
   - 📋 Exámenes: Crear evaluaciones
   - 🤖 IA: Generar ejercicios
   - 📚 Materiales: Guías del currículo

📌 **Ver de nuevo**: Icono ❓ en el menú.

¡Éxito con tus clases! 👨‍🏫`,
    disableBeacon: true,
  },
];
```

---

### 3. Estructura Similar para TUTORES

Los tutores tienen menos funciones, así que sus pasos serían:

1. Bienvenida
2. Tabla de estudiantes (general)
3. Botón Chat en fila
4. Botón Progreso en fila
5. Botón Videollamada en fila
6. Tarjeta de horas
7. Panel ejercicios (general)
8. Botón Generar con IA
9. Pestañas de tipos
10. Botón Asignar
11. Botón Practicar
12. Panel materiales (general)
13. Expandir semana
14. Botón Mi Horario
15. Notificaciones
16. Cierre

---

### 4. Estructura para ESTUDIANTES

1. Bienvenida
2. Tarjeta nivel
3. Tarjeta profesor
4. Botón Chat en tarjeta profesor
5. Botón Reservar/Horario en tarjeta profesor
6. Botón Perfil en tarjeta profesor
7. Tarjeta tutor
8. Botón Chat en tarjeta tutor
9. Botón Reservar/Horario en tarjeta tutor
10. Tarjeta tareas
11. Cuadrícula de progreso
12. Clic en semana
13. Panel de práctica
14. Ejercicio individual
15. Panel de puntos y logros
16. Ranking
17. Calendario semanal (si presencial)
18. Notificaciones
19. Cierre

---

### 5. Estructura para ADMIN

1. Bienvenida
2. Panel de aprobación (general)
3. Botón Aprobar usuario
4. Botón Rechazar usuario
5. Tabla de estudiantes
6. Botón Asignar profesor/tutor
7. Botón Cambiar modalidad
8. Botón Ver progreso
9. Botón Asignar sala
10. Calendario semanal
11. Botón Crear evento
12. Botón Editar evento
13. Gestión de salas
14. Control de horas del staff
15. Botón aprobar horas extra
16. Gestión del currículo
17. Subir materiales
18. Examen de nivelación
19. Cierre

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/practice/PracticeSessionPanel.tsx` | Agregar `data-tutorial` a cada botón |
| `src/components/TeacherMaterialsPanel.tsx` | Agregar `data-tutorial` a expansores |
| `src/pages/TeacherDashboard.tsx` | Agregar `data-tutorial` a cada botón de acción |
| `src/pages/TutorDashboard.tsx` | Agregar `data-tutorial` a cada botón |
| `src/pages/Dashboard.tsx` | Agregar `data-tutorial` a botones en StaffCard |
| `src/pages/AdminDashboard.tsx` | Agregar `data-tutorial` a todos los botones |
| `src/components/dashboard/StaffCard.tsx` | Agregar `data-tutorial` a botones internos |
| `src/components/tutorial/steps/teacherSteps.ts` | Reescribir con 20+ pasos granulares |
| `src/components/tutorial/steps/tutorSteps.ts` | Reescribir con 16+ pasos granulares |
| `src/components/tutorial/steps/studentSteps.ts` | Reescribir con 19+ pasos granulares |
| `src/components/tutorial/steps/adminSteps.ts` | Reescribir con 20+ pasos granulares |

---

## Beneficios

1. **Cada botón tiene su explicación** - No hay ambigüedad
2. **Fácil de seguir** - Un concepto a la vez
3. **Más interactivo** - El usuario ve exactamente qué botón hacer clic
4. **Completo** - No se omite ninguna función
5. **Mejor retención** - Información en pequeñas dosis
