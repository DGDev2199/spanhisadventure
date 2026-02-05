import { Step } from 'react-joyride';

export const studentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido a Spanish Adventure! 🌟',
    content: '¡Tu aventura de aprendizaje comienza aquí! Este tutorial te mostrará cómo usar tu panel de estudiante.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="level-card"]',
    title: 'Tu Nivel',
    content: 'Aquí verás tu nivel actual de español. Si aún no tienes nivel, deberás completar el examen de nivelación.',
  },
  {
    target: '[data-tutorial="teacher-card"]',
    title: 'Tu Profesor',
    content: 'Este es tu profesor asignado. Puedes enviarle mensajes, ver su perfil y (si eres online) reservar clases.',
  },
  {
    target: '[data-tutorial="tutor-card"]',
    title: 'Tu Tutor',
    content: 'Tu tutor te ayudará con práctica y dudas. También puedes contactarlo desde aquí.',
  },
  {
    target: '[data-tutorial="tasks-card"]',
    title: 'Tus Tareas',
    content: 'Las tareas pendientes aparecen aquí. Haz clic para ver los detalles y entregar tu trabajo.',
  },
  {
    target: '[data-tutorial="progress-grid"]',
    title: 'Tu Progreso',
    content: 'Mira tu avance en el currículo. Cada semana tiene temas que irás completando con tu profesor.',
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Ejercicios de Práctica',
    content: 'Aquí encontrarás ejercicios personalizados para ti. ¡Practica vocabulario, gramática y más!',
  },
  {
    target: '[data-tutorial="gamification-panel"]',
    title: 'Puntos y Logros',
    content: 'Gana puntos completando actividades y desbloquea logros. ¡Compite en el ranking con otros estudiantes!',
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario Semanal',
    content: 'Ve tu horario de clases, tutorías, aventuras y actividades de la semana.',
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones',
    content: 'Recibirás alertas sobre nuevas tareas, mensajes de tu profesor y actualizaciones de la escuela.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡A aprender! 🚀',
    content: '¡Ya estás listo para comenzar tu aventura! Si necesitas ver este tutorial de nuevo, puedes reiniciarlo. ¡Mucho éxito!',
  },
];
