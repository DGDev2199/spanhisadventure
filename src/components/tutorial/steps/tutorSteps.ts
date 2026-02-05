import { Step } from 'react-joyride';

export const tutorSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Tutor! 🎓',
    content: `Este es tu centro de control para gestionar a tus estudiantes.

Como tutor, tu rol es apoyar el aprendizaje reforzando lo que enseña el profesor. Aquí encontrarás:
• Lista de estudiantes asignados
• Herramientas para generar ejercicios con IA
• Acceso a materiales del currículo
• Control de tus horas trabajadas

¡Vamos a explorar cada sección!`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Aquí verás todos tus estudiantes asignados en una tabla organizada.

📌 Columnas disponibles:
   • Nombre del estudiante
   • Tu rol (Profesor, Tutor o ambos)
   • Nivel actual (A1-C2)
   • Tipo (Online/Presencial)
   • Sala asignada
   • Profesor principal

📌 Ordenamiento: Los más recientes aparecen primero.

💡 Tip: Si eres profesor Y tutor del mismo estudiante, verás ambas etiquetas en la columna "Mi Rol".`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Este botón abre el panel completo de progreso del estudiante.

📌 Qué puedes hacer:
   • Ver las semanas del currículo completadas
   • Editar notas diarias (clase, tutoría, vocabulario)
   • Ver y otorgar logros personalizados
   • Consultar el historial completo de avance

📌 Notas de tutoría: Cada día puedes registrar qué temas practicaron y observaciones importantes.

💡 Tip: Registrar notas diarias ayuda al profesor a saber qué reforzar en las clases.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas 🕐',
    content: `Aquí gestionas tus horas trabajadas de la semana.

📌 Información que verás:
   • Horas trabajadas hoy
   • Horas trabajadas esta semana
   • Límite semanal asignado
   • Gráfico de distribución por día

📌 Solicitar horas extra: Si necesitas más horas, haz clic en "Solicitar" y justifica el motivo. El administrador aprobará o rechazará la solicitud.

💡 Tip: Las horas se calculan automáticamente de los eventos asignados en el calendario.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Generador de Ejercicios IA 🤖',
    content: `Herramienta potente para crear ejercicios personalizados con inteligencia artificial.

📌 Tipos de ejercicios disponibles:
   📚 Flashcards de vocabulario
   🔤 Conjugación de verbos
   ✏️ Completar espacios en blanco
   📖 Comprensión lectora
   🔀 Ordenar oraciones

📌 Cómo usarlo:
   1. Selecciona el tipo de ejercicio
   2. Elige el nivel (A1-C2)
   3. Ingresa el tema o vocabulario específico
   4. La IA genera los ejercicios automáticamente
   5. Revísalos y asígnalos a uno o varios estudiantes

💡 Tip: Los ejercicios generados quedan guardados para reutilizar con otros estudiantes.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Materiales del Currículo 📚',
    content: `Accede a todas las guías y recursos organizados por semana y nivel.

📌 Contenido disponible:
   • Guías de cada tema del currículo
   • Material de apoyo en PDF
   • Recursos multimedia
   • Ejercicios prediseñados por tema

📌 Protección: Los PDFs tienen marca de agua con tu nombre para evitar distribución no autorizada.

📌 Navegación: Selecciona un nivel y una semana para ver todos sus materiales.

💡 Tip: Revisa los materiales antes de cada tutoría para estar preparado.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Botón Mi Horario 📅',
    content: `Abre tu calendario personal con todas las actividades asignadas.

📌 Verás:
   • Tutorías programadas con cada estudiante
   • Clases (si también eres profesor)
   • Horarios organizados por día y hora
   • Eventos de la escuela donde participas

📌 Vista: Calendario semanal con código de colores por tipo de actividad.

💡 Tip: Consulta tu horario cada día para confirmar tus sesiones y prepararte.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Centro de Notificaciones 🔔',
    content: `Recibe alertas importantes en tiempo real.

📌 Te notificará sobre:
   • Mensajes nuevos de estudiantes
   • Cambios en el horario de clases
   • Estado de solicitudes de horas extra (aprobada/rechazada)
   • Avisos importantes del administrador

📌 Indicador rojo: Muestra cuántas notificaciones sin leer tienes.

💡 Tip: Revisa las notificaciones al iniciar tu jornada para estar al día.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Listo para tutorear! 🚀',
    content: `Ya conoces todas las herramientas de tu panel de tutor.

📌 Flujo de trabajo recomendado:
   1. Revisa tu horario del día
   2. Prepara los materiales para cada tutoría
   3. Registra notas después de cada sesión
   4. Genera ejercicios de práctica personalizados
   5. Responde mensajes de estudiantes

📌 Ver tutorial de nuevo: Haz clic en el icono ❓ en el menú superior.

¡Éxito con tus tutorías! 🎓`,
    disableBeacon: true,
  },
];
