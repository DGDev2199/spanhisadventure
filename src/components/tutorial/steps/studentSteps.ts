import { Step } from 'react-joyride';

export const studentSteps: Step[] = [
  // === BIENVENIDA ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido a Spanish Adventure! 🌟',
    content: `Este tutorial te guiará paso a paso por cada función de tu panel de estudiante.

Aprenderás a comunicarte con tu profesor y tutor, ver tu progreso, completar tareas y ejercicios.

¡Vamos a explorar juntos!`,
    disableBeacon: true,
  },

  // === TARJETA DE NIVEL ===
  {
    target: '[data-tutorial="level-card"]',
    title: 'Tu Nivel de Español 📊',
    content: `Esta tarjeta muestra tu nivel actual (A1, A2, B1, B2, C1, C2).

📌 **Sin nivel**: Debes completar el Examen de Nivelación primero.
📌 **Con nivel**: Aquí ves tu progreso actual.

💡 Tip: Tu nivel determina el contenido de tus clases.`,
    disableBeacon: true,
  },

  // === TARJETA DEL PROFESOR ===
  {
    target: '[data-tutorial="teacher-card"]',
    title: 'Tu Profesor Asignado 👨‍🏫',
    content: `Información de tu profesor de español.

📌 **Haz clic en el nombre** para ver su perfil completo.
📌 Los botones de acción aparecen debajo si tienes profesor asignado.

💡 Tip: Si no tienes profesor, contacta al administrador.`,
    disableBeacon: true,
  },

  // === BOTÓN CHAT PROFESOR ===
  {
    target: '[data-tutorial="staff-chat-btn"]',
    title: 'Botón Chat 💬',
    content: `Abre una conversación directa con tu profesor o tutor.

📌 **Uso**: Envía mensajes para resolver dudas.
📌 **Notificación**: Recibirás alerta cuando respondan.

💡 Tip: No dudes en escribir si tienes preguntas sobre tareas o clases.`,
    disableBeacon: true,
  },

  // === BOTÓN RESERVAR/HORARIO ===
  {
    target: '[data-tutorial="staff-booking-btn"]',
    title: 'Botón Reservar Clase 📅',
    content: `Programa una clase con tu profesor (solo estudiantes online).

📌 **Pasos**:
   1. Haz clic en "Reservar"
   2. Selecciona fecha y hora disponible
   3. Confirma la reservación

💡 Tip: Revisa los horarios disponibles con anticipación.`,
    disableBeacon: true,
  },

  // === TARJETA DEL TUTOR ===
  {
    target: '[data-tutorial="tutor-card"]',
    title: 'Tu Tutor de Apoyo 🎓',
    content: `Tu tutor te ayuda con práctica adicional y conversación.

📌 **Diferencia con el profesor**: El tutor refuerza lo aprendido y practica vocabulario contigo.
📌 **Mismos botones**: Chat, reserva y perfil disponibles.

💡 Tip: Aprovecha las tutorías para ganar confianza al hablar.`,
    disableBeacon: true,
  },

  // === TARJETA DE TAREAS ===
  {
    target: '[data-tutorial="tasks-card"]',
    title: 'Tus Tareas Pendientes 📝',
    content: `Contador de tareas por entregar.

📌 **Ver tareas**: Más abajo encuentras la lista completa.
📌 **Entregar**: Haz clic en una tarea para subir tu trabajo.
📌 **Puntos**: Ganas +5 puntos al entregar a tiempo.

💡 Tip: Revisa las fechas de entrega para organizarte.`,
    disableBeacon: true,
  },

  // === GRID DE PROGRESO ===
  {
    target: '[data-tutorial="progress-grid"]',
    title: 'Tu Progreso Semanal 📈',
    content: `Visualización de tu avance en el currículo.

📌 **Colores**:
   🟢 Verde = Semana completada
   🟡 Amarillo = En progreso
   ⚪ Gris = Pendiente

📌 **Clic en semana**: Ve los temas específicos.

💡 Tip: Completa todos los temas para avanzar de semana.`,
    disableBeacon: true,
  },

  // === PANEL DE PRÁCTICA ===
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Ejercicios de Práctica 🎯',
    content: `Ejercicios asignados por tu profesor o tutor.

📌 **Tipos disponibles**:
   - Flashcards de vocabulario
   - Conjugación de verbos
   - Completar oraciones
   - Comprensión lectora

📌 **Puntos**: Cada ejercicio completado suma puntos.

💡 Tip: Practica un poco cada día para mejores resultados.`,
    disableBeacon: true,
  },

  // === PANEL DE GAMIFICACIÓN ===
  {
    target: '[data-tutorial="gamification-panel"]',
    title: 'Puntos y Logros 🏆',
    content: `Sistema de gamificación para motivarte.

📌 **Ganas puntos por**:
   - Completar ejercicios
   - Entregar tareas (+5 pts)
   - Logros especiales

📌 **Ranking**: Compite amigablemente con otros estudiantes.

💡 Tip: ¡Los puntos se acumulan! Intenta subir cada semana.`,
    disableBeacon: true,
  },

  // === CALENDARIO SEMANAL ===
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario Semanal 📅',
    content: `Tu horario de actividades (estudiantes presenciales).

📌 **Eventos**:
   📚 Clases de español
   🎓 Tutorías
   🎨 Electivas
   🌄 Aventuras

📌 **Clic en evento**: Ver detalles y materiales.

💡 Tip: Revisa el calendario cada mañana.`,
    disableBeacon: true,
  },

  // === NOTIFICACIONES ===
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones 🔔',
    content: `Centro de alertas importantes.

📌 **Te avisa cuando**:
   - Nueva tarea asignada
   - Mensaje recibido
   - Logro otorgado
   - Cambios de horario

📌 **Número rojo**: Notificaciones sin leer.

💡 Tip: Revisa las notificaciones regularmente.`,
    disableBeacon: true,
  },

  // === CIERRE ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Listo para aprender! 🚀',
    content: `Ya conoces tu panel de estudiante.

📌 **Resumen**:
   - 💬 Chat con profesor y tutor
   - 📊 Ver tu progreso y nivel
   - 📝 Completar tareas y ejercicios
   - 🏆 Ganar puntos y logros
   - 📅 Consultar calendario

📌 **Ver de nuevo**: Icono ❓ en el menú.

¡Mucho éxito aprendiendo español! 🇪🇸`,
    disableBeacon: true,
  },
];
