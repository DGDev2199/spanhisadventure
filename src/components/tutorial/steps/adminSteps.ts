import { Step } from 'react-joyride';

export const adminSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Administrador! 🛡️',
    content: `Este es el centro de control completo de la escuela.

Como administrador/coordinador, tienes acceso a todas las funciones:
• Aprobar y gestionar usuarios
• Asignar profesores y tutores
• Gestionar el calendario de la escuela
• Administrar el currículo y materiales

¡Vamos a explorar cada herramienta!`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="approval-panel"]',
    title: 'Panel de Aprobación de Usuarios 👤',
    content: `Aquí gestionas las solicitudes de registro pendientes.

📌 Usuarios que verás:
   • Nuevos estudiantes registrados
   • Profesores que solicitan acceso
   • Tutores pendientes de aprobación

📌 Acciones disponibles:
   • Aprobar: El usuario obtiene acceso completo
   • Rechazar: El usuario no puede acceder
   • Ver perfil: Revisar información antes de decidir

📌 Notificación: Los usuarios reciben email cuando son aprobados.

💡 Tip: Verifica que los datos del perfil estén completos antes de aprobar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Gestión de Estudiantes 👥',
    content: `Lista completa de todos los estudiantes de la escuela.

📌 Columnas disponibles:
   • Nombre y foto del estudiante
   • Nivel actual (A1-C2)
   • Modalidad (Online/Presencial)
   • Profesor asignado
   • Tutor asignado
   • Sala (para presenciales)

📌 Filtros: Puedes filtrar por nivel, modalidad o búsqueda por nombre.

📌 Acciones por estudiante: Asignar staff, ver progreso, cambiar modalidad, gestionar sala.

💡 Tip: Mantén actualizadas las asignaciones de profesor/tutor para cada estudiante.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="assign-teacher-btn"]',
    title: 'Asignar Profesor y Tutor 👨‍🏫',
    content: `Gestiona las asignaciones de staff para cada estudiante.

📌 Opciones disponibles:
   • Asignar profesor principal
   • Asignar tutor de apoyo
   • Cambiar asignaciones existentes
   • Ver disponibilidad del staff

📌 Consideraciones:
   • Un estudiante puede tener el mismo profesor y tutor
   • Verifica la modalidad del staff (online/presencial)
   • Considera la carga de trabajo actual

💡 Tip: Balancea la carga de estudiantes entre el staff para mejor atención.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="manage-progress-btn"]',
    title: 'Ver Progreso de Estudiantes 📊',
    content: `Accede al historial completo de progreso de cualquier estudiante.

📌 Información disponible:
   • Semanas del currículo completadas
   • Notas diarias de clases y tutorías
   • Logros y puntos acumulados
   • Historial de tareas y exámenes

📌 Puedes:
   • Reasignar nivel si es necesario
   • Otorgar logros especiales
   • Revisar el desempeño general
   • Exportar reportes

💡 Tip: Usa esta vista para reuniones con padres o reportes de progreso.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario Semanal de la Escuela 📅',
    content: `Gestiona el horario completo de actividades de la escuela.

📌 Tipos de eventos:
   📚 Clases grupales por nivel
   🎓 Tutorías individuales o grupales
   🎨 Electivas (arte, música, cocina, etc.)
   ⚽ Deportes y actividades físicas
   🌄 Aventuras y excursiones
   💃 Clases de baile
   🌍 Intercambio cultural

📌 Navegación: Usa las flechas para ver otras semanas.

📌 Vista: Lunes a Sábado, de 7:00 a 22:00.

💡 Tip: Planifica la semana completa para optimizar horarios del staff.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="create-event-btn"]',
    title: 'Crear Nuevos Eventos ➕',
    content: `Agrega actividades al calendario de la escuela.

📌 Datos requeridos:
   • Tipo de evento (clase, tutoría, aventura, etc.)
   • Título descriptivo
   • Día y horario (inicio/fin)
   • Nivel de estudiantes (opcional)
   • Staff asignado (hasta 2 profesores y 2 tutores)

📌 Opciones adicionales:
   • Adjuntar PDFs o materiales
   • Agregar instrucciones detalladas
   • Configurar electivas con opciones
   • Asignar sala específica

📌 Creación rápida: Arrastra en el calendario para crear eventos.

💡 Tip: Usa colores consistentes para cada tipo de evento.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="manage-rooms-btn"]',
    title: 'Gestión de Salas/Cuartos 🏠',
    content: `Administra las habitaciones de la escuela y asignación de estudiantes.

📌 Funciones:
   • Crear nuevas salas con nombre y capacidad
   • Asignar estudiantes a cada sala
   • Ver ocupación actual
   • Activar/desactivar salas

📌 Para estudiantes presenciales:
   • Cada estudiante debe tener sala asignada
   • La sala aparece en su perfil y horario
   • Útil para organización diaria

💡 Tip: Mantén actualizada la capacidad para evitar sobrepoblación.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="staff-hours-btn"]',
    title: 'Horas del Personal 🕐',
    content: `Revisa y aprueba las horas trabajadas del staff.

📌 Información disponible:
   • Horas trabajadas por profesor/tutor
   • Límite semanal asignado a cada uno
   • Solicitudes de horas extra pendientes
   • Historial de aprobaciones

📌 Solicitudes de horas extra:
   • Ver justificación del staff
   • Aprobar o rechazar solicitud
   • Las horas aprobadas se suman al límite

💡 Tip: Revisa las solicitudes semanalmente para mantener el control de costos.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-btn"]',
    title: 'Gestión del Currículo 📚',
    content: `Administra las semanas, temas y materiales del programa.

📌 Estructura:
   • Niveles (A1, A2, B1, B2, C1, C2)
   • Semanas por nivel (contenido semanal)
   • Temas por semana (lecciones específicas)

📌 Puedes:
   • Crear/editar semanas y temas
   • Subir PDFs y materiales
   • Organizar el orden del contenido
   • Activar/desactivar semanas

📌 Materiales: Guías de profesor, guías de estudiante, ejercicios, recursos multimedia.

💡 Tip: Mantén los materiales actualizados y organizados por nivel.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="placement-test-btn"]',
    title: 'Examen de Nivelación 📝',
    content: `Configura y gestiona el examen que toman los nuevos estudiantes.

📌 Configuración:
   • Preguntas por nivel (A1-C2)
   • Tipos de pregunta (opción múltiple, completar, etc.)
   • Respuestas correctas
   • Audio para preguntas de listening

📌 Proceso del estudiante:
   1. Estudiante nuevo inicia el examen
   2. Responde preguntas de todos los niveles
   3. Sistema calcula nivel recomendado
   4. Profesor confirma con evaluación oral

💡 Tip: Revisa periódicamente las preguntas para mantenerlas actualizadas.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Panel dominado! 🏆',
    content: `Ya conoces todas las herramientas administrativas.

📌 Tareas frecuentes:
   • Aprobar nuevos usuarios cada día
   • Revisar y ajustar el calendario semanal
   • Verificar asignaciones de staff
   • Aprobar solicitudes de horas extra
   • Actualizar materiales del currículo

📌 Ver tutorial de nuevo: Haz clic en el icono ❓ en el menú superior.

¡Éxito gestionando la escuela! 🛡️`,
    disableBeacon: true,
  },
];
