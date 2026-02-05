import { Step } from 'react-joyride';

export const teacherSteps: Step[] = [
  // === BIENVENIDA ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Profesor! 👨‍🏫',
    content: `Este tutorial te guiará paso a paso por cada botón y función de tu panel.

Como profesor, tienes acceso a herramientas completas para gestionar clases, tareas y exámenes.

¡Vamos a explorarlo juntos!`,
    disableBeacon: true,
  },

  // === TABLA DE ESTUDIANTES ===
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Lista de todos tus estudiantes asignados.

📌 **Columnas**: Nombre, rol, nivel, tipo, sala, tutor.
📌 **Acciones**: Cada fila tiene botones a la derecha.

Vamos a ver cada botón de acción...`,
    disableBeacon: true,
  },

  // === BOTÓN VER PROGRESO ===
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Abre el panel completo de progreso del estudiante.

📌 **Pestaña Currículo**: Semanas y temas completados.
📌 **Pestaña Notas**: Registro diario (clase, tutoría, vocabulario).
📌 **Pestaña Logros**: Insignias otorgadas y por otorgar.

💡 Tip: Revisa el progreso antes de cada clase.`,
    disableBeacon: true,
  },

  // === BOTÓN CREAR TAREA ===
  {
    target: '[data-tutorial="create-task-btn"]',
    title: 'Botón Crear Tarea ➕📝',
    content: `Abre el formulario para asignar una nueva tarea.

📌 **Campos**:
   - Título y descripción
   - Fecha de entrega
   - Archivo PDF adjunto (opcional)
   - Seleccionar estudiante(s)

📌 **Puntos**: El estudiante gana +5 pts al entregar.

💡 Tip: Sé específico en la descripción.`,
    disableBeacon: true,
  },

  // === PANEL REVISIÓN TAREAS ===
  {
    target: '[data-tutorial="task-review-panel"]',
    title: 'Panel de Tareas Enviadas 📬',
    content: `Lista de tareas que estudiantes han entregado.

📌 **Ver entrega**: Abre el trabajo del estudiante.
📌 **Calificar**: Asigna 0, 5 o 10 puntos extra.
📌 **Feedback**: Escribe comentarios.

💡 Tip: Revisa las entregas pronto para mantener motivación.`,
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

📌 **Configuración**: Tiempo límite, fecha, estudiantes.

💡 Tip: Mezcla tipos de preguntas para evaluar mejor.`,
    disableBeacon: true,
  },

  // === TARJETA DE HORAS ===
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas 🕐',
    content: `Resumen de tus horas trabajadas.

📌 **Visualización**:
   - Horas de hoy
   - Total de la semana
   - Límite asignado
   - Gráfico por día

💡 Tip: Las horas se calculan automáticamente del calendario.`,
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

📌 **Acciones**: Confirmar, reagendar, iniciar videollamada.

💡 Tip: Revisa las reservaciones cada mañana.`,
    disableBeacon: true,
  },

  // === PANEL DE EJERCICIOS ===
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Panel de Ejercicios 🎯',
    content: `Aquí generas y gestionas ejercicios con IA.

Vamos a ver cada botón del panel...`,
    disableBeacon: true,
  },

  // === BOTÓN GENERAR CON IA ===
  {
    target: '[data-tutorial="generate-ai-btn"]',
    title: 'Botón "Generar con IA" 🤖',
    content: `Crea ejercicios personalizados con inteligencia artificial.

📌 **Pasos**:
   1. Selecciona tipo (flashcard, conjugación, etc.)
   2. Elige nivel (A1-C2)
   3. Escribe el tema o vocabulario
   4. Haz clic en "Generar"

📌 **Tiempo**: 10-30 segundos.

💡 Tip: Sé específico con el tema.`,
    disableBeacon: true,
  },

  // === PESTAÑAS DE TIPOS ===
  {
    target: '[data-tutorial="exercise-tabs"]',
    title: 'Pestañas de Tipos 📚',
    content: `Filtra ejercicios creados por tipo:

📌 **Flashcards**: Tarjetas de vocabulario
📌 **Conjugación**: Verbos en tiempos
📌 **Vocabulario**: Definiciones
📌 **Ordenar**: Palabras en orden
📌 **Opción Múltiple**: Preguntas
📌 **Huecos**: Completar espacios
📌 **Lectura**: Comprensión lectora

💡 Tip: Usa "Todos" para ver todo junto.`,
    disableBeacon: true,
  },

  // === BOTÓN ASIGNAR ===
  {
    target: '[data-tutorial="assign-exercise-btn"]',
    title: 'Botón Asignar 👥',
    content: `Asigna el ejercicio a uno o varios estudiantes.

📌 **Pasos**:
   1. Haz clic en el icono de personas
   2. Selecciona los estudiantes
   3. Confirma la asignación

💡 Tip: Puedes asignar el mismo ejercicio a múltiples estudiantes.`,
    disableBeacon: true,
  },

  // === BOTÓN PRACTICAR ===
  {
    target: '[data-tutorial="practice-exercise-btn"]',
    title: 'Botón Practicar ▶️',
    content: `Abre el ejercicio para verlo o probarlo.

📌 **Uso**:
   - Revisa cómo se ve
   - Verifica las respuestas
   - Prueba la experiencia del estudiante

💡 Tip: Siempre prueba antes de asignar.`,
    disableBeacon: true,
  },

  // === PANEL DE MATERIALES ===
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Panel de Materiales 📚',
    content: `Accede a guías y recursos del currículo.

Haz clic para expandirlo y ver las semanas...`,
    disableBeacon: true,
  },

  // === EXPANDIR MATERIALES ===
  {
    target: '[data-tutorial="materials-expand-btn"]',
    title: 'Expandir Materiales 📂',
    content: `Haz clic aquí para ver materiales por semana.

📌 **Contenido**: Guías del profesor y material extra.
📌 **Protección**: PDFs con marca de agua.

💡 Tip: Revisa antes de cada clase.`,
    disableBeacon: true,
  },

  // === EXPANDIR SEMANA ===
  {
    target: '[data-tutorial="week-expand-btn"]',
    title: 'Expandir Semana 📂',
    content: `Haz clic en una semana para ver sus temas.

📌 **Guías del profesor**: Marcadas con 🎓
📌 **Material extra**: Recursos adicionales

💡 Tip: Las guías tienen instrucciones detalladas.`,
    disableBeacon: true,
  },

  // === BOTÓN MI HORARIO ===
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Botón Horario 🗓️',
    content: `Abre tu calendario personal.

📌 **Contenido**:
   - Clases programadas
   - Tutorías (si también eres tutor)
   - Eventos de la escuela

💡 Tip: Consulta tu horario cada día.`,
    disableBeacon: true,
  },

  // === NOTIFICACIONES ===
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones 🔔',
    content: `Centro de alertas importantes.

📌 **Te notifica sobre**:
   - Mensajes de estudiantes
   - Tareas enviadas para revisar
   - Cambios de horario
   - Avisos administrativos

💡 Tip: Revisa al iniciar sesión.`,
    disableBeacon: true,
  },

  // === CIERRE ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Tutorial Completado! 🎉',
    content: `Ya conoces cada botón de tu panel.

📌 **Resumen de acciones**:
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
