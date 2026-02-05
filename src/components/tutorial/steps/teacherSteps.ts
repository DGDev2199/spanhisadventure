import { Step } from 'react-joyride';

export const teacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Profesor! 👨‍🏫',
    content: `Este es tu centro de control para gestionar clases y estudiantes.

Como profesor, tienes acceso a herramientas completas para:
• Gestionar tareas y exámenes
• Evaluar el progreso de estudiantes
• Generar ejercicios con IA
• Revisar entregas y dar feedback

¡Vamos a explorar cada función!`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Lista completa de todos tus estudiantes asignados.

📌 Columnas disponibles:
   • Nombre del estudiante
   • Tu rol (Profesor, Tutor o ambos)
   • Nivel actual (A1-C2)
   • Modalidad (Online/Presencial)
   • Sala asignada
   • Tutor del estudiante

📌 Acciones rápidas: Cada fila tiene botones para chat, progreso y más.

💡 Tip: Si eres profesor Y tutor del mismo estudiante, verás ambas etiquetas y tendrás acceso completo.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="create-task-btn"]',
    title: 'Crear Nueva Tarea 📝',
    content: `Asigna tareas a uno o varios estudiantes.

📌 Opciones al crear tarea:
   • Título y descripción detallada
   • Fecha de entrega
   • Adjuntar archivos PDF o materiales
   • Seleccionar estudiantes (individual o grupal)

📌 Notificación automática: Los estudiantes reciben alerta cuando les asignas una tarea.

📌 Puntos: Los estudiantes ganan +5 puntos al entregar y hasta +10 puntos extra según tu calificación.

💡 Tip: Sé específico en las instrucciones para que los estudiantes entiendan qué esperas.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="task-review-panel"]',
    title: 'Panel de Revisión de Tareas ✅',
    content: `Aquí verás todas las tareas que los estudiantes han enviado para revisión.

📌 Información disponible:
   • Nombre del estudiante
   • Tarea entregada con fecha
   • Archivo adjunto (si lo hay)
   • Estado de revisión

📌 Calificar tarea:
   • Revisar el trabajo enviado
   • Asignar puntuación (0, 5 o 10 puntos extra)
   • Dar feedback escrito al estudiante
   • Marcar como revisada

💡 Tip: El feedback constructivo ayuda a los estudiantes a mejorar. Sé específico sobre qué hicieron bien y qué pueden mejorar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="create-test-btn"]',
    title: 'Crear Exámenes Personalizados 📋',
    content: `Diseña exámenes completos con diferentes tipos de preguntas.

📌 Tipos de preguntas:
   • Opción múltiple (A, B, C, D)
   • Completar espacios en blanco
   • Verdadero/Falso
   • Respuesta corta

📌 Configuración:
   • Establecer tiempo límite
   • Fecha de disponibilidad
   • Asignar a estudiantes específicos
   • Puntuación por pregunta

📌 Corrección: Algunas preguntas se corrigen automáticamente, otras requieren tu revisión.

💡 Tip: Combina diferentes tipos de preguntas para evaluar distintas habilidades.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Ver Progreso del Estudiante 📊',
    content: `Accede al panel completo de progreso de cada estudiante.

📌 Pestañas disponibles:
   • Progreso del Currículo: Semanas y temas completados con colores
   • Notas Semanales: Registro diario de clases, tutorías y vocabulario
   • Logros: Insignias otorgadas y por otorgar

📌 Evaluar temas: Marca los temas como dominados (verde), en progreso (amarillo) o pendientes.

📌 Otorgar logros: Crea y asigna insignias personalizadas por buen desempeño.

💡 Tip: Usa las notas semanales para comunicarte con el tutor sobre el progreso del estudiante.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas Trabajadas 🕐',
    content: `Gestiona y monitorea tus horas de trabajo.

📌 Información visible:
   • Horas trabajadas hoy
   • Total de horas esta semana
   • Límite semanal asignado
   • Distribución por día (gráfico)

📌 Horas extra: Si necesitas trabajar más del límite, puedes solicitar autorización al administrador con justificación.

💡 Tip: Las horas se calculan automáticamente de las clases y eventos asignados en el calendario.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Generador de Ejercicios con IA 🤖',
    content: `Crea ejercicios personalizados usando inteligencia artificial.

📌 Tipos de ejercicios:
   📚 Flashcards de vocabulario
   🔤 Conjugación de verbos (regulares e irregulares)
   ✏️ Completar espacios en blanco
   📖 Comprensión lectora con preguntas
   🔀 Ordenar palabras para formar oraciones

📌 Proceso:
   1. Elige tipo de ejercicio y nivel
   2. Especifica el tema o vocabulario
   3. La IA genera ejercicios automáticamente
   4. Revisa y edita si es necesario
   5. Asigna a estudiantes seleccionados

💡 Tip: Guarda los ejercicios que funcionan bien para reutilizarlos.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Materiales y Guías del Currículo 📚',
    content: `Accede a todos los recursos pedagógicos organizados por nivel y semana.

📌 Contenido disponible:
   • Guías del profesor (instrucciones detalladas)
   • Guías del estudiante (material para compartir)
   • PDFs de apoyo y ejercicios
   • Recursos multimedia

📌 Seguridad: Todos los PDFs tienen marca de agua con tu nombre.

📌 Navegación: Filtra por nivel (A1-C2) y selecciona la semana deseada.

💡 Tip: Revisa los materiales antes de cada clase para planificar mejor la sesión.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="scheduled-classes"]',
    title: 'Clases Programadas (Online) 📅',
    content: `Panel de reservaciones de clases para estudiantes online.

📌 Información disponible:
   • Estudiantes que han reservado clase
   • Fecha y hora de cada reservación
   • Estado (pendiente, confirmada, completada)
   • Link de videollamada

📌 Acciones:
   • Confirmar o reagendar reservaciones
   • Iniciar videollamada cuando llegue la hora
   • Marcar clase como completada

💡 Tip: Revisa las reservaciones cada día para preparar el material de cada estudiante.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Todo listo para enseñar! 🎉',
    content: `Ya conoces todas las herramientas de tu panel de profesor.

📌 Flujo de trabajo recomendado:
   1. Revisa tu horario y reservaciones del día
   2. Prepara materiales para cada clase
   3. Registra el progreso después de cada sesión
   4. Revisa y califica tareas pendientes
   5. Genera ejercicios para refuerzo

📌 Ver tutorial de nuevo: Haz clic en el icono ❓ en el menú superior.

¡Éxito con tus clases! 👨‍🏫`,
    disableBeacon: true,
  },
];
