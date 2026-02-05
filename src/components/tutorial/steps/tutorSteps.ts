import { Step } from 'react-joyride';

export const tutorSteps: Step[] = [
  // === BIENVENIDA ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Tutor! 🎓',
    content: `Este tutorial te guiará paso a paso por cada botón y función de tu panel.

Como tutor, tu rol es reforzar el aprendizaje y practicar conversación con los estudiantes.

¡Vamos a explorar cada herramienta!`,
    disableBeacon: true,
  },

  // === TABLA DE ESTUDIANTES ===
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Lista de todos tus estudiantes asignados.

📌 **Columnas**: Nombre, rol, nivel, tipo, sala, profesor.
📌 **Acciones**: Cada fila tiene botones a la derecha.

💡 Tip: Si eres profesor Y tutor del mismo estudiante, verás ambas etiquetas.`,
    disableBeacon: true,
  },

  // === BOTÓN VER PROGRESO ===
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Abre el panel completo de progreso del estudiante.

📌 **Pestañas disponibles**:
   - Currículo: Semanas completadas
   - Notas: Registro diario (clase, tutoría, vocabulario)
   - Logros: Insignias otorgadas

💡 Tip: Registra notas después de cada tutoría para que el profesor las vea.`,
    disableBeacon: true,
  },

  // === TARJETA DE HORAS ===
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas 🕐',
    content: `Resumen de tus horas trabajadas.

📌 **Información**:
   - Horas de hoy
   - Total de la semana
   - Límite asignado
   - Gráfico por día

📌 **Horas extra**: Solicita aprobación si necesitas más.

💡 Tip: Las horas se calculan automáticamente del calendario.`,
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

📌 **Tiempo**: 10-30 segundos según complejidad.

💡 Tip: Sé específico con el tema para mejores resultados.`,
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
📌 **Ordenar**: Poner palabras en orden
📌 **Opción Múltiple**: Preguntas con opciones
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

📌 **Resultado**: El estudiante lo verá en su panel.

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

💡 Tip: Siempre prueba un ejercicio antes de asignarlo.`,
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
    content: `Haz clic aquí para ver los materiales organizados por semana.

📌 **Contenido**: Guías del profesor y material extra.
📌 **Protección**: Los PDFs tienen marca de agua.

💡 Tip: Revisa los materiales antes de cada tutoría.`,
    disableBeacon: true,
  },

  // === BOTÓN MI HORARIO ===
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Botón Horario 🗓️',
    content: `Abre tu calendario personal.

📌 **Contenido**:
   - Tutorías programadas
   - Clases (si también eres profesor)
   - Eventos asignados

💡 Tip: Consulta tu horario cada día al comenzar.`,
    disableBeacon: true,
  },

  // === NOTIFICACIONES ===
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones 🔔',
    content: `Centro de alertas importantes.

📌 **Te notifica sobre**:
   - Mensajes de estudiantes
   - Cambios de horario
   - Solicitudes de horas extra
   - Avisos administrativos

💡 Tip: Revisa al iniciar sesión.`,
    disableBeacon: true,
  },

  // === CIERRE ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Listo para tutorear! 🚀',
    content: `Ya conoces cada función de tu panel.

📌 **Flujo de trabajo**:
   1. Revisa tu horario del día
   2. Prepara materiales para cada tutoría
   3. Registra notas después de cada sesión
   4. Genera ejercicios de refuerzo
   5. Responde mensajes de estudiantes

📌 **Ver de nuevo**: Icono ❓ en el menú.

¡Éxito con tus tutorías! 🎓`,
    disableBeacon: true,
  },
];
