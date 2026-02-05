
# Plan: Tutorial Admin Ultra-Granular con Pasos Dentro de Modales

## Entendimiento del Problema

El tutorial actual para admin/coordinator tiene solo 10 pasos generales que explican los botones principales, pero NO entra dentro de los modales para explicar:
- Cada campo del formulario de crear eventos
- Los botones dentro del panel de aprobación
- Los pasos dentro del diálogo de currículo
- Los botones de acción en la tabla de estudiantes
- Etc.

## Nueva Estructura Ultra-Granular (35+ pasos)

En lugar de 10 pasos, tendremos **35-40 pasos específicos** que incluyen:
1. Pasos en el dashboard principal
2. Pasos DENTRO de cada modal/diálogo importante

---

## Cambios Necesarios

### 1. Agregar `data-tutorial` a Elementos DENTRO de Modales

**En AdminApprovalPanel.tsx:**
```tsx
// Botón aprobar individual
<Button data-tutorial="approve-user-btn" onClick={() => approveUserMutation.mutate(pendingUser.id)}>
  Aprobar
</Button>

// Botón rechazar individual
<Button data-tutorial="reject-user-btn" onClick={() => rejectUserMutation.mutate(pendingUser.id)}>
  <X className="h-4 w-4" />
</Button>

// Lista de usuarios pendientes
<div data-tutorial="pending-users-list">
```

**En CreateScheduleEventDialog.tsx:**
```tsx
// Campo título
<Input data-tutorial="event-title-input" value={title} onChange={...} />

// Selector de tipo de evento
<Select data-tutorial="event-type-select">

// Selector de días
<div data-tutorial="event-days-select">

// Campos de hora
<Input data-tutorial="event-time-start" type="time" />
<Input data-tutorial="event-time-end" type="time" />

// Selector de nivel
<Select data-tutorial="event-level-select">

// Selector de staff
<Select data-tutorial="event-teacher-select">
<Select data-tutorial="event-tutor-select">

// Botón crear
<Button data-tutorial="event-create-btn">Crear Evento</Button>
```

**En ManageCurriculumDialog.tsx:**
```tsx
// Tabs principales
<TabsList data-tutorial="curriculum-tabs">
  <TabsTrigger data-tutorial="curriculum-weeks-tab" value="weeks">Semanas</TabsTrigger>
  <TabsTrigger data-tutorial="curriculum-materials-tab" value="materials">Materiales</TabsTrigger>
</TabsList>

// Lista de semanas
<div data-tutorial="curriculum-weeks-list">

// Botón editar semana
<Button data-tutorial="curriculum-edit-week-btn">
  <Edit2 className="h-4 w-4" />
</Button>

// Formulario agregar tema
<Input data-tutorial="curriculum-topic-name-input" placeholder="Nombre del tema" />
<Button data-tutorial="curriculum-add-topic-btn">Agregar Tema</Button>

// Botón subir material
<Button data-tutorial="curriculum-upload-material-btn">
  <Upload className="h-4 w-4" />
  Subir Archivo
</Button>

// Switch guía de profesor
<Switch data-tutorial="curriculum-teacher-guide-switch" />
```

**En AdminDashboard.tsx (tabla de estudiantes):**
```tsx
// Botón progreso en fila
<Button data-tutorial="student-progress-btn">Progreso</Button>

// Botón horario en fila
<Button data-tutorial="student-schedule-btn">Horario</Button>

// Botón nivel en fila
<Button data-tutorial="student-level-btn">Nivel</Button>

// Botón asignar en fila
<Button data-tutorial="student-assign-btn">Asignar</Button>
```

---

### 2. Nuevos Pasos Granulares para ADMIN (35+ pasos)

```typescript
export const adminSteps: Step[] = [
  // ========== BIENVENIDA ==========
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Administrador! 🛡️',
    content: `Este tutorial te guiará por CADA botón y función de tu panel.

Aprenderás a:
• Aprobar usuarios paso a paso
• Gestionar estudiantes (progreso, horarios, asignaciones)
• Crear eventos en el calendario
• Administrar el currículo y materiales
• Y mucho más...

¡Vamos a explorarlo todo en detalle!`,
    disableBeacon: true,
  },

  // ========== PANEL DE APROBACIÓN ==========
  {
    target: '[data-tutorial="approval-panel"]',
    title: 'Panel de Aprobación de Usuarios 👤',
    content: `Aquí aparecen los nuevos usuarios que solicitan acceso.

📌 Cada tarjeta muestra:
   - Nombre y foto del usuario
   - Correo electrónico
   - Rol solicitado (estudiante, profesor, tutor)
   - Fecha de registro

Vamos a ver los botones de acción...`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="approve-user-btn"]',
    title: 'Botón Aprobar Usuario ✅',
    content: `Haz clic aquí para aprobar al usuario.

📌 **Al aprobar**:
   - El usuario recibe una notificación
   - Puede acceder a la plataforma
   - Aparece en las listas según su rol

💡 Tip: Verifica que el rol sea correcto antes de aprobar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="reject-user-btn"]',
    title: 'Botón Rechazar Usuario ❌',
    content: `Haz clic aquí para rechazar y eliminar la solicitud.

📌 **Al rechazar**:
   - El usuario es eliminado del sistema
   - No puede acceder con esa cuenta
   - Tendría que registrarse de nuevo

💡 Tip: Usa esto para registros falsos o duplicados.`,
    disableBeacon: true,
  },

  // ========== TABLA DE ESTUDIANTES ==========
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Lista completa de todos los estudiantes registrados.

📌 **Columnas**:
   - Nombre y email
   - Nivel actual (A1-C2)
   - Tipo (Online/Presencial)
   - Habitación asignada
   - Estado del examen de nivelación

Cada fila tiene botones de acción que veremos ahora...`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="student-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Abre el panel completo de progreso del estudiante.

📌 **Pestañas disponibles**:
   - Currículo: semanas y temas completados
   - Notas diarias: observaciones de clase y tutoría
   - Logros: insignias otorgadas

📌 **Puedes**:
   - Marcar temas como completados
   - Agregar notas diarias
   - Otorgar logros

💡 Tip: Revisa el progreso para identificar estudiantes que necesitan más apoyo.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="student-schedule-btn"]',
    title: 'Botón Gestionar Horario 📅',
    content: `Administra el horario individual del estudiante.

📌 **Opciones**:
   - Ver eventos asignados
   - Agregar clases específicas
   - Modificar tutorías
   - Asignar electivas

💡 Tip: Útil para crear horarios personalizados.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="student-level-btn"]',
    title: 'Botón Asignar Nivel 🎓',
    content: `Asigna o cambia el nivel de español manualmente.

📌 **Cuándo usarlo**:
   - Después de una evaluación oral
   - Para corregir nivel incorrecto
   - Para promocionar a un estudiante

📌 **Niveles**: A1, A2, B1, B2, C1, C2

💡 Tip: Normalmente el nivel se asigna después del examen de nivelación.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="student-assign-btn"]',
    title: 'Botón Asignar Staff ⚙️',
    content: `Asigna profesor y tutor al estudiante.

📌 **Puedes asignar**:
   - Profesor principal
   - Tutor de apoyo
   - Habitación (para presenciales)

📌 **Importante**: El estudiante verá a su profesor/tutor en su panel y podrá comunicarse con ellos.

💡 Tip: Equilibra la carga de estudiantes entre el staff.`,
    disableBeacon: true,
  },

  // ========== BOTONES PRINCIPALES ==========
  {
    target: '[data-tutorial="create-event-btn"]',
    title: 'Botón Crear Evento 📅',
    content: `Abre el formulario para crear eventos en el calendario.

📌 **Tipos de eventos**:
   - Clases de español
   - Tutorías de práctica
   - Actividades culturales
   - Aventuras y excursiones
   - Electivas

Haz clic para abrir el formulario y ver cada campo...`,
    disableBeacon: true,
  },

  // ========== DENTRO DEL MODAL CREAR EVENTO ==========
  {
    target: '[data-tutorial="event-title-input"]',
    title: 'Campo: Título del Evento 📝',
    content: `Escribe el nombre del evento.

📌 **Ejemplos**:
   - "Clase A1 - Verbos Regulares"
   - "Tutoría B2 - Conversación"
   - "Excursión: Museo de Historia"

💡 Tip: Sé descriptivo para que todos entiendan de qué se trata.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-type-select"]',
    title: 'Selector: Tipo de Evento 🏷️',
    content: `Elige el tipo de actividad.

📌 **Tipos disponibles**:
   - 📚 Clase
   - 👨‍🏫 Práctica/Tutoría
   - 🎭 Cultural
   - ⚽ Deportiva
   - 🏔️ Aventura
   - 💃 Baile
   - 📖 Electiva

📌 El tipo define el color en el calendario.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-days-select"]',
    title: 'Selector: Días de la Semana 📆',
    content: `Marca los días en que se repite el evento.

📌 **Opciones**:
   - Selecciona uno o varios días
   - Lunes a Sábado disponibles
   - Útil para clases recurrentes

💡 Tip: Para clases regulares, selecciona todos los días que aplican.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-time-start"]',
    title: 'Campo: Hora de Inicio ⏰',
    content: `Selecciona la hora de inicio del evento.

📌 Formato de 24 horas (ej: 09:00, 14:30)

💡 Tip: Verifica que no haya conflictos con otros eventos.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-time-end"]',
    title: 'Campo: Hora de Fin ⏱️',
    content: `Selecciona la hora de finalización.

📌 Debe ser posterior a la hora de inicio.

💡 Tip: Las clases típicas duran 1-2 horas.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-level-select"]',
    title: 'Selector: Nivel 🎯',
    content: `Asigna el nivel de español para este evento.

📌 **Niveles**: A1, A2, B1, B2, C1, C2

📌 Solo estudiantes de este nivel verán el evento en su calendario.

💡 Tip: Deja vacío para eventos generales (aventuras, deportes).`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-teacher-select"]',
    title: 'Selector: Profesor 👨‍🏫',
    content: `Asigna el profesor responsable.

📌 El profesor verá este evento en su horario.
📌 Puedes asignar hasta 2 profesores.

💡 Tip: Verifica disponibilidad antes de asignar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="event-create-btn"]',
    title: 'Botón Crear ✅',
    content: `Confirma y crea el evento.

📌 El evento aparecerá inmediatamente en:
   - El calendario semanal
   - El horario de los profesores asignados
   - El horario de estudiantes del nivel seleccionado

💡 Tip: Revisa todos los campos antes de crear.`,
    disableBeacon: true,
  },

  // ========== BOTÓN CURRÍCULO ==========
  {
    target: '[data-tutorial="curriculum-btn"]',
    title: 'Botón Gestionar Currículo 📚',
    content: `Abre el administrador completo del currículo.

📌 Aquí puedes:
   - Crear y editar semanas
   - Agregar temas a cada semana
   - Subir materiales y guías
   - Organizar contenido por nivel

Haz clic para explorar el panel de currículo...`,
    disableBeacon: true,
  },

  // ========== DENTRO DEL MODAL CURRÍCULO ==========
  {
    target: '[data-tutorial="curriculum-tabs"]',
    title: 'Pestañas del Currículo 📑',
    content: `El currículo tiene dos secciones principales:

📌 **Semanas y Temas**: Estructura del programa
📌 **Material Extra**: PDFs y recursos adicionales

Vamos a explorar cada una...`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-weeks-list"]',
    title: 'Lista de Semanas 📋',
    content: `Todas las semanas del programa organizadas por nivel.

📌 Cada semana muestra:
   - Número y título
   - Nivel (A1-C2)
   - Número de temas

📌 Haz clic en una semana para ver/editar sus temas.

💡 Tip: Las semanas con más temas aparecen con indicador.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-edit-week-btn"]',
    title: 'Botón Editar Semana ✏️',
    content: `Modifica los datos de la semana.

📌 **Puedes cambiar**:
   - Título de la semana
   - Descripción
   - Nivel asignado

💡 Tip: Usa títulos descriptivos como "Semana 1: Presentaciones".`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-topic-name-input"]',
    title: 'Campo: Nuevo Tema 📝',
    content: `Escribe el nombre del tema a agregar.

📌 **Ejemplos**:
   - "Verbos regulares -AR"
   - "Vocabulario: La familia"
   - "Gramática: Ser vs Estar"

💡 Tip: Mantén los nombres concisos y claros.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-add-topic-btn"]',
    title: 'Botón Agregar Tema ➕',
    content: `Confirma y agrega el tema a la semana.

📌 El tema aparecerá en:
   - La lista de la semana
   - El progreso de estudiantes de este nivel

💡 Tip: Puedes reordenar los temas después.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-upload-material-btn"]',
    title: 'Botón Subir Material 📄',
    content: `Sube archivos PDF o multimedia.

📌 **Formatos permitidos**:
   - PDF (documentos y guías)
   - MP4 (videos)
   - PNG/JPG (imágenes)

📌 **Tamaño máximo**: 50MB

💡 Tip: Nombra los archivos descriptivamente.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="curriculum-teacher-guide-switch"]',
    title: 'Switch: Guía del Profesor 🎓',
    content: `Marca si el material es solo para profesores.

📌 **Activado**: Solo profesores/tutores ven el archivo
📌 **Desactivado**: Estudiantes también pueden acceder

💡 Tip: Las guías de profesor incluyen instrucciones de clase.`,
    disableBeacon: true,
  },

  // ========== OTROS BOTONES PRINCIPALES ==========
  {
    target: '[data-tutorial="manage-rooms-btn"]',
    title: 'Gestión de Habitaciones 🏠',
    content: `Administra las habitaciones de la escuela.

📌 **Funciones**:
   - Crear nuevas habitaciones
   - Asignar estudiantes
   - Ver ocupación
   - Activar/desactivar

💡 Tip: Solo aplica para estudiantes presenciales.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="staff-hours-btn"]',
    title: 'Control de Horas del Personal 🕐',
    content: `Revisa y aprueba horas trabajadas.

📌 **Ver**:
   - Horas por profesor/tutor
   - Límite semanal asignado
   - Solicitudes de horas extra

📌 **Aprobar/Rechazar** solicitudes de horas adicionales.

💡 Tip: Revisa semanalmente para mantener control.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="placement-test-btn"]',
    title: 'Examen de Nivelación 📝',
    content: `Configura el examen para nuevos estudiantes.

📌 **Secciones**:
   - Preguntas de gramática
   - Comprensión lectora
   - Audio (listening)

📌 El profesor confirma el nivel con evaluación oral.

💡 Tip: Revisa las preguntas periódicamente.`,
    disableBeacon: true,
  },

  // ========== NOTIFICACIONES ==========
  {
    target: '[data-tutorial="notifications"]',
    title: 'Centro de Notificaciones 🔔',
    content: `Recibe alertas importantes.

📌 **Te notifica sobre**:
   - Nuevos usuarios pendientes
   - Solicitudes de horas extra
   - Cambios importantes
   - Mensajes del sistema

📌 **Número rojo**: Notificaciones sin leer.

💡 Tip: Revisa al iniciar sesión.`,
    disableBeacon: true,
  },

  // ========== CIERRE ==========
  {
    target: 'body',
    placement: 'center',
    title: '¡Tutorial Completado! 🏆',
    content: `Ya conoces CADA botón y función de tu panel.

📌 **Resumen de flujos principales**:
   1. Aprobar usuarios nuevos
   2. Asignar staff a estudiantes
   3. Crear eventos en el calendario
   4. Gestionar currículo y materiales
   5. Controlar horas del personal

📌 **Ver tutorial de nuevo**: Icono ❓ en el menú superior.

¡Éxito gestionando la escuela! 🛡️`,
    disableBeacon: true,
  },
];
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/AdminApprovalPanel.tsx` | Agregar `data-tutorial` a botones aprobar/rechazar |
| `src/components/CreateScheduleEventDialog.tsx` | Agregar `data-tutorial` a cada campo del formulario |
| `src/components/ManageCurriculumDialog.tsx` | Agregar `data-tutorial` a tabs, lista, botones |
| `src/pages/AdminDashboard.tsx` | Agregar `data-tutorial` a botones de tabla de estudiantes |
| `src/components/tutorial/steps/adminSteps.ts` | Reescribir con 35+ pasos granulares |

---

## Consideraciones Especiales

### Pasos Dentro de Modales

Para que el tutorial funcione DENTRO de los modales, necesitamos:
1. **Abrir el modal automáticamente** antes del paso correspondiente
2. O hacer que esos pasos sean **opcionales** si el modal no está abierto

La librería react-joyride tiene la opción `spotlightClicks: true` que permite interactuar mientras el tutorial está activo. Esto permite al usuario abrir el modal y luego el tutorial continúa.

### Flujo Sugerido

1. Tutorial explica el botón "Crear Evento" en el dashboard
2. El paso dice "Haz clic para abrir el formulario..."
3. El usuario hace clic y abre el modal
4. Los siguientes pasos apuntan a elementos DENTRO del modal
5. Si el modal se cierra, esos pasos se saltan automáticamente

---

## Beneficios

1. **Ultra-detallado**: Cada botón tiene su propia explicación
2. **Dentro de modales**: Explica paso a paso los formularios
3. **Interactivo**: El usuario ve exactamente dónde hacer clic
4. **Completo**: No se omite ninguna función
5. **Tolerante a errores**: Si un elemento no existe, salta al siguiente
