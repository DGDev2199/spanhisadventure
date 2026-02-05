import { Step } from 'react-joyride';

export const adminSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Administrador! 🛡️',
    content: 'Este tutorial te mostrará las herramientas de gestión de la escuela. Tienes acceso a todas las funciones administrativas.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="approval-panel"]',
    title: 'Aprobación de Usuarios',
    content: 'Aquí verás las solicitudes de registro pendientes. Puedes aprobar o rechazar a estudiantes, profesores y tutores.',
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Gestión de Estudiantes',
    content: 'Lista completa de estudiantes. Puedes asignar profesores, tutores, cuartos y gestionar su progreso.',
  },
  {
    target: '[data-tutorial="assign-teacher-btn"]',
    title: 'Asignar Staff',
    content: 'Asigna o cambia el profesor y tutor de cada estudiante. También puedes cambiar su modalidad (presencial/online).',
  },
  {
    target: '[data-tutorial="manage-progress-btn"]',
    title: 'Ver Progreso',
    content: 'Accede al progreso completo de cualquier estudiante: currículo, notas semanales y logros.',
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario Semanal',
    content: 'Gestiona el horario de la escuela. Crea clases, tutorías, aventuras, electivas y eventos especiales.',
  },
  {
    target: '[data-tutorial="create-event-btn"]',
    title: 'Crear Eventos',
    content: 'Agrega nuevos eventos al calendario: clases grupales, aventuras, deportes, culturales y más.',
  },
  {
    target: '[data-tutorial="manage-rooms-btn"]',
    title: 'Gestión de Cuartos',
    content: 'Administra los cuartos de la escuela y asigna estudiantes a cada uno.',
  },
  {
    target: '[data-tutorial="staff-hours-btn"]',
    title: 'Horas del Personal',
    content: 'Revisa y aprueba las horas trabajadas y solicitudes de horas extra del staff.',
  },
  {
    target: '[data-tutorial="curriculum-btn"]',
    title: 'Gestión del Currículo',
    content: 'Administra las semanas, temas y materiales del currículo. Sube PDFs y recursos para los profesores.',
  },
  {
    target: '[data-tutorial="placement-test-btn"]',
    title: 'Examen de Nivelación',
    content: 'Configura y gestiona el examen de nivelación que toman los nuevos estudiantes.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Panel dominado! 🏆',
    content: 'Ahora conoces todas las herramientas administrativas. Puedes reiniciar este tutorial cuando necesites. ¡Éxito gestionando la escuela!',
  },
];
