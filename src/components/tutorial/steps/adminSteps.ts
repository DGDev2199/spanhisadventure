import { Step } from 'react-joyride';

export const adminSteps: Step[] = [
  // === BIENVENIDA ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Administrador! 🛡️',
    content: `Este es el centro de control completo de la escuela.

Como administrador, tienes acceso a todas las funciones:
• Aprobar y gestionar usuarios
• Asignar profesores y tutores
• Gestionar calendario y horarios
• Administrar currículo y materiales

¡Vamos a explorar cada herramienta!`,
    disableBeacon: true,
  },

  // === PANEL DE APROBACIÓN ===
  {
    target: '[data-tutorial="approval-panel"]',
    title: 'Panel de Aprobación 👤',
    content: `Gestiona las solicitudes de registro pendientes.

📌 **Usuarios que verás**:
   - Nuevos estudiantes
   - Profesores solicitando acceso
   - Tutores pendientes

📌 **Acciones**: Aprobar o rechazar cada solicitud.

💡 Tip: Verifica los datos antes de aprobar.`,
    disableBeacon: true,
  },

  // === TABLA DE ESTUDIANTES ===
  {
    target: '[data-tutorial="students-table"]',
    title: 'Gestión de Estudiantes 👥',
    content: `Lista completa de todos los estudiantes.

📌 **Columnas**: Nombre, nivel, modalidad, profesor, tutor, sala.
📌 **Acciones por fila**: Asignar staff, ver progreso, cambiar modalidad.

💡 Tip: Mantén actualizadas las asignaciones.`,
    disableBeacon: true,
  },

  // === BOTÓN CREAR EVENTO ===
  {
    target: '[data-tutorial="create-event-btn"]',
    title: 'Crear Evento ➕📅',
    content: `Agrega actividades al calendario.

📌 **Datos requeridos**:
   - Tipo (clase, tutoría, aventura, etc.)
   - Título y horario
   - Nivel de estudiantes
   - Staff asignado

📌 **Creación rápida**: También puedes arrastrar en el calendario.

💡 Tip: Usa colores consistentes por tipo.`,
    disableBeacon: true,
  },

  // === BOTÓN GESTIONAR HABITACIONES ===
  {
    target: '[data-tutorial="manage-rooms-btn"]',
    title: 'Gestión de Salas 🏠',
    content: `Administra las habitaciones de la escuela.

📌 **Funciones**:
   - Crear nuevas salas
   - Asignar estudiantes
   - Ver ocupación actual
   - Activar/desactivar salas

💡 Tip: Mantén actualizada la capacidad.`,
    disableBeacon: true,
  },

  // === BOTÓN HORAS DEL PERSONAL ===
  {
    target: '[data-tutorial="staff-hours-btn"]',
    title: 'Horas del Personal 🕐',
    content: `Revisa y aprueba horas trabajadas.

📌 **Información**:
   - Horas por profesor/tutor
   - Límite semanal asignado
   - Solicitudes de horas extra

📌 **Acciones**: Aprobar o rechazar solicitudes.

💡 Tip: Revisa las solicitudes semanalmente.`,
    disableBeacon: true,
  },

  // === BOTÓN CURRÍCULO ===
  {
    target: '[data-tutorial="curriculum-btn"]',
    title: 'Gestión del Currículo 📚',
    content: `Administra semanas, temas y materiales.

📌 **Estructura**:
   - Niveles (A1-C2)
   - Semanas por nivel
   - Temas por semana

📌 **Puedes**:
   - Crear/editar semanas
   - Subir PDFs y materiales
   - Organizar contenido

💡 Tip: Mantén los materiales actualizados.`,
    disableBeacon: true,
  },

  // === BOTÓN EXAMEN DE NIVELACIÓN ===
  {
    target: '[data-tutorial="placement-test-btn"]',
    title: 'Examen de Nivelación 📝',
    content: `Configura el examen para nuevos estudiantes.

📌 **Configuración**:
   - Preguntas por nivel
   - Tipos de pregunta
   - Respuestas correctas
   - Audio para listening

📌 **Proceso**: El estudiante lo toma y el profesor confirma con evaluación oral.

💡 Tip: Revisa las preguntas periódicamente.`,
    disableBeacon: true,
  },

  // === NOTIFICACIONES ===
  {
    target: '[data-tutorial="notifications"]',
    title: 'Notificaciones 🔔',
    content: `Centro de alertas importantes.

📌 **Te notifica sobre**:
   - Nuevos usuarios pendientes
   - Solicitudes de horas extra
   - Cambios importantes
   - Mensajes del sistema

💡 Tip: Revisa al iniciar sesión.`,
    disableBeacon: true,
  },

  // === CIERRE ===
  {
    target: 'body',
    placement: 'center',
    title: '¡Panel dominado! 🏆',
    content: `Ya conoces las herramientas administrativas.

📌 **Tareas frecuentes**:
   - Aprobar nuevos usuarios
   - Ajustar calendario semanal
   - Verificar asignaciones de staff
   - Aprobar solicitudes de horas extra
   - Actualizar materiales

📌 **Ver de nuevo**: Icono ❓ en el menú.

¡Éxito gestionando la escuela! 🛡️`,
    disableBeacon: true,
  },
];
