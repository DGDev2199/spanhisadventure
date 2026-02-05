import { Step } from 'react-joyride';

export const teacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Profesor! 👨‍🏫',
    content: 'Este tutorial te mostrará todas las herramientas disponibles para gestionar tus clases y estudiantes.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tus Estudiantes',
    content: 'Lista completa de estudiantes asignados. Verás en qué rol estás para cada uno (Profesor, Tutor o ambos).',
  },
  {
    target: '[data-tutorial="create-task-btn"]',
    title: 'Crear Tarea',
    content: 'Asigna tareas a tus estudiantes. Puedes adjuntar archivos PDF y establecer fechas de entrega.',
  },
  {
    target: '[data-tutorial="task-review-panel"]',
    title: 'Revisar Entregas',
    content: 'Aquí verás las tareas que los estudiantes han enviado. Puedes calificarlas y dar feedback.',
  },
  {
    target: '[data-tutorial="create-test-btn"]',
    title: 'Crear Exámenes',
    content: 'Crea exámenes personalizados con preguntas de opción múltiple, completar y más. Asígnalos a uno o varios estudiantes.',
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Progreso del Estudiante',
    content: 'Accede al progreso completo: semanas del currículo, notas diarias y logros otorgados.',
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas',
    content: 'Registra tus horas trabajadas y solicita horas extra cuando sea necesario.',
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Generador de Ejercicios IA',
    content: 'La inteligencia artificial te ayuda a crear ejercicios personalizados: flashcards, conjugaciones, lecturas y más.',
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Guías y Materiales',
    content: 'Todos los recursos del currículo organizados por semana. Las guías de profesor están protegidas.',
  },
  {
    target: '[data-tutorial="scheduled-classes"]',
    title: 'Clases Programadas',
    content: 'Si tienes estudiantes online, aquí verás las reservaciones de clase pendientes.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Todo listo! 🎉',
    content: 'Conoces todas las herramientas. Puedes reiniciar este tutorial cuando quieras desde el menú. ¡Buenas clases!',
  },
];
