import { Step } from 'react-joyride';

export const tutorSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Tutor! 🎓',
    content: 'Este tutorial te guiará por las funciones principales de tu panel. ¡Vamos a conocerlo juntos!',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tus Estudiantes',
    content: 'Aquí verás la lista de todos los estudiantes que tienes asignados. Puedes ver su nivel, profesor y acciones disponibles.',
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Ver Progreso',
    content: 'Haz clic aquí para ver y editar el progreso semanal del estudiante. Puedes agregar notas sobre temas de tutoría, vocabulario y logros.',
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Tus Horas',
    content: 'Aquí puedes ver el resumen de tus horas trabajadas esta semana. También puedes solicitar horas extra si es necesario.',
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Ejercicios de Práctica',
    content: 'Genera ejercicios personalizados con IA para tus estudiantes. Elige el tipo, nivel y tema, ¡y la IA creará ejercicios automáticamente!',
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Materiales del Currículo',
    content: 'Accede a todas las guías y materiales del currículo organizados por semana y tema. Los PDFs están protegidos con marca de agua.',
  },
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Tu Horario',
    content: 'Haz clic aquí para ver tu horario personal con todas las clases y tutorías asignadas.',
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones',
    content: 'Aquí recibirás alertas sobre nuevas tareas, mensajes de estudiantes y actualizaciones importantes.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Listo para comenzar! 🚀',
    content: 'Ya conoces las funciones principales. Si necesitas ver este tutorial de nuevo, puedes reiniciarlo desde el menú. ¡Éxito con tus tutorías!',
  },
];
