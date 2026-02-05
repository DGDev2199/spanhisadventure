import { Step } from 'react-joyride';

export const studentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido a Spanish Adventure! 🌟',
    content: `¡Tu aventura de aprendizaje comienza aquí! 

Este tutorial te guiará por todas las funciones de tu panel de estudiante. Aprenderás cómo ver tu progreso, comunicarte con tu profesor y tutor, completar tareas, y mucho más.

Puedes avanzar con "Siguiente" o saltar el tutorial si ya lo conoces. ¡No te preocupes, siempre puedes verlo de nuevo desde el menú!`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="level-card"]',
    title: 'Tu Nivel de Español 📊',
    content: `Esta tarjeta muestra tu nivel actual de español (A1, A2, B1, B2, C1, C2).

📌 Si no tienes nivel aún: Deberás completar el Examen de Nivelación. Este examen tiene una parte escrita y una parte oral con tu profesor.

📌 Si ya tienes nivel: Aquí verás tu progreso. Tu nivel puede cambiar según tu avance en el currículo.

💡 Tip: El nivel determina qué contenido verás en tus clases y ejercicios.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="teacher-card"]',
    title: 'Tu Profesor Asignado 👨‍🏫',
    content: `Aquí aparece la información de tu profesor de español.

📌 Botón "Chat": Envía mensajes directos a tu profesor para resolver dudas o consultas.

📌 Botón "Perfil": Ve la información completa de tu profesor, su experiencia y especialidades.

📌 Botón "Reservar" (solo online): Programa clases en los horarios disponibles.

📌 Botón "Horario" (solo presencial): Ve el horario de clases asignado.

💡 Tip: No dudes en escribirle si tienes preguntas sobre las clases o tareas.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="tutor-card"]',
    title: 'Tu Tutor de Apoyo 🎓',
    content: `Tu tutor es quien te ayuda con práctica adicional y resolución de dudas.

📌 Diferencia con el profesor: El tutor se enfoca en reforzar lo que aprendes, practicar conversación y ayudarte con vocabulario.

📌 Botones disponibles: Chat para mensajes, Perfil para conocerlo, y opciones de reserva/horario según tu modalidad.

💡 Tip: Aprovecha las sesiones con tu tutor para practicar conversación y ganar confianza al hablar español.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="tasks-card"]',
    title: 'Tus Tareas Pendientes 📝',
    content: `Este contador muestra cuántas tareas tienes pendientes por entregar.

📌 Ver tareas: Más abajo encontrarás la lista completa de tareas con fechas de entrega.

📌 Entregar tarea: Haz clic en una tarea para ver los detalles y subir tu trabajo.

📌 Archivos adjuntos: Algunas tareas incluyen PDFs o materiales que tu profesor adjuntó.

💡 Tip: Revisa las fechas de entrega para organizar tu tiempo. Las tareas completadas a tiempo suman puntos extra (+5 puntos).`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="progress-grid"]',
    title: 'Tu Progreso en el Currículo 📈',
    content: `Aquí ves tu avance visual en las semanas del currículo.

📌 Semanas coloreadas: 
   🟢 Verde = Completada
   🟡 Amarillo = En progreso  
   ⚪ Gris = Pendiente

📌 Clic en una semana: Ve los temas de esa semana y cuáles has completado.

📌 Temas (Topics): Cada semana tiene varios temas. Al completar todos, la semana se marca como finalizada.

💡 Tip: Haz clic en una semana para ver exactamente qué temas te faltan por completar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Ejercicios de Práctica 🎯',
    content: `Aquí encontrarás ejercicios personalizados creados por tu profesor o tutor.

📌 Tipos de ejercicios:
   • Flashcards de vocabulario
   • Conjugación de verbos
   • Completar oraciones
   • Lectura comprensiva
   • Ordenar oraciones

📌 Ganar puntos: Cada ejercicio completado suma puntos a tu ranking.

💡 Tip: Practica un poco cada día. La constancia es clave para mejorar tu español.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="gamification-panel"]',
    title: 'Puntos, Logros y Ranking 🏆',
    content: `¡Aquí está la diversión! Sistema de gamificación para motivarte.

📌 Puntos: Ganas puntos por:
   • Completar ejercicios
   • Entregar tareas (+5 puntos)
   • Calificación de tareas (+5/10 puntos extra)
   • Logros especiales

📌 Logros: Insignias especiales que tu profesor te otorga por buen desempeño.

📌 Ranking: Compite amigablemente con otros estudiantes.

💡 Tip: ¡Los puntos se acumulan! Intenta subir en el ranking cada semana.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario de la Semana 📅',
    content: `Ve tu horario completo de actividades (solo estudiantes presenciales).

📌 Tipos de eventos:
   📚 Clases de español
   🎓 Tutorías
   🎨 Electivas (arte, música, deportes)
   🌄 Aventuras y excursiones

📌 Navegación: Usa las flechas para ver semanas anteriores o futuras.

📌 Detalles: Haz clic en un evento para ver más información y materiales.

💡 Tip: Revisa el calendario cada mañana para saber qué actividades tienes.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Centro de Notificaciones 🔔',
    content: `La campanita te avisa de novedades importantes.

📌 Recibirás alertas cuando:
   • Tu profesor te asigne una nueva tarea
   • Alguien te envíe un mensaje
   • Recibas un logro o insignia
   • Haya cambios en el horario

📌 Número rojo: Indica cuántas notificaciones sin leer tienes.

💡 Tip: Revisa las notificaciones regularmente para no perderte información importante.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Estás listo para aprender! 🚀',
    content: `¡Felicitaciones! Ya conoces todas las herramientas de tu panel.

📌 Resumen:
   • Revisa tu progreso en el currículo
   • Completa tareas y ejercicios para ganar puntos
   • Comunícate con tu profesor y tutor
   • Gana puntos y logros en el ranking
   • Consulta tu calendario de actividades

📌 Ver tutorial de nuevo: Haz clic en el icono ❓ en el menú superior.

¡Mucho éxito en tu aventura de aprender español! 🇪🇸`,
    disableBeacon: true,
  },
];
