
# Plan: Tutorial Mejorado y Detallado con Corrección de Errores

## Problema Identificado

### Error del Tutorial (7/9 y se cierra)
**Causa raíz**: El paso 8 del tutorial de estudiante (`[data-tutorial="weekly-calendar"]`) solo se renderiza para estudiantes **presenciales**. Si el usuario es un estudiante online, el elemento no existe en el DOM y react-joyride detecta que el elemento target no existe, lo cual causa que el tutorial se cierre automáticamente.

### Descripciones muy cortas
Las descripciones actuales son de 1-2 líneas. Necesitan expandirse para explicar:
- Qué hace cada botón específicamente
- Cómo usarlo paso a paso
- Qué beneficios tiene

---

## Solución

### 1. Hacer los pasos condicionales o con `disableBeacon: true`

Modificar los pasos para que manejen elementos que pueden no existir agregando la opción `isOptional: true` en los pasos opcionales, y reorganizar los pasos para que los elementos condicionales estén al final o usar pasos diferentes según el tipo de estudiante.

### 2. Expandir todas las descripciones

Cada paso tendrá una descripción más detallada de 3-5 líneas explicando:
- ¿Qué es esta sección?
- ¿Qué puedes hacer aquí?
- ¿Cómo lo usas?
- Tip o beneficio

---

## Cambios en TutorialProvider.tsx

```tsx
// Agregar manejo de pasos opcionales que pueden no existir
const handleCallback = useCallback((data: CallBackProps) => {
  const { status, action, index, type, lifecycle } = data;
  const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
  
  if (finishedStatuses.includes(status)) {
    setRun(false);
    setStepIndex(0);
    localStorage.setItem(storageKey, 'true');
  } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
    setStepIndex(index + 1);
  } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
    setStepIndex(index - 1);
  } else if (type === EVENTS.TARGET_NOT_FOUND) {
    // Si el elemento no existe, saltar al siguiente paso
    setStepIndex(index + 1);
  }
}, [storageKey]);
```

---

## Nuevos Pasos para Estudiantes (Detallados)

```typescript
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

📌 **Si no tienes nivel aún**: Deberás completar el Examen de Nivelación. Este examen tiene una parte escrita y una parte oral con tu profesor.

📌 **Si ya tienes nivel**: Aquí verás tu progreso. Tu nivel puede cambiar según tu avance en el currículo.

💡 **Tip**: El nivel determina qué contenido verás en tus clases y ejercicios.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="teacher-card"]',
    title: 'Tu Profesor Asignado 👨‍🏫',
    content: `Aquí aparece la información de tu profesor de español.

📌 **Botón "Chat"**: Envía mensajes directos a tu profesor para resolver dudas o consultas.

📌 **Botón "Perfil"**: Ve la información completa de tu profesor, su experiencia y especialidades.

📌 **Botón "Reservar"** (solo online): Programa clases en los horarios disponibles de tu profesor.

📌 **Botón "Horario"** (solo presencial): Ve el horario de clases asignado.

💡 **Tip**: No dudes en escribirle si tienes preguntas sobre las clases o tareas.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="tutor-card"]',
    title: 'Tu Tutor de Apoyo 🎓',
    content: `Tu tutor es quien te ayuda con práctica adicional y resolución de dudas.

📌 **Diferencia con el profesor**: El tutor se enfoca en reforzar lo que aprendes, practicar conversación y ayudarte con vocabulario.

📌 **Botones disponibles**: Chat para mensajes, Perfil para conocerlo, y opciones de reserva/horario según tu modalidad.

💡 **Tip**: Aprovecha las sesiones con tu tutor para practicar conversación y ganar confianza al hablar español.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="tasks-card"]',
    title: 'Tus Tareas Pendientes 📝',
    content: `Este contador muestra cuántas tareas tienes pendientes por entregar.

📌 **Ver tareas**: Más abajo encontrarás la lista completa de tareas con fechas de entrega.

📌 **Entregar tarea**: Haz clic en una tarea para ver los detalles y subir tu trabajo.

📌 **Archivos adjuntos**: Algunas tareas incluyen PDFs o materiales que tu profesor adjuntó.

💡 **Tip**: Revisa las fechas de entrega para organizar tu tiempo. Las tareas completadas a tiempo suman puntos extra.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="progress-grid"]',
    title: 'Tu Progreso en el Currículo 📈',
    content: `Aquí ves tu avance visual en las semanas del currículo.

📌 **Semanas coloreadas**: 
   - 🟢 Verde = Completada
   - 🟡 Amarillo = En progreso  
   - ⚪ Gris = Pendiente

📌 **Clic en una semana**: Ve los temas de esa semana y cuáles has completado.

📌 **Temas (Topics)**: Cada semana tiene varios temas. Al completar todos, la semana se marca como finalizada.

💡 **Tip**: Haz clic en una semana para ver exactamente qué temas te faltan por completar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Ejercicios de Práctica 🎯',
    content: `Aquí encontrarás ejercicios personalizados creados por tu profesor o tutor.

📌 **Tipos de ejercicios**:
   - Flashcards de vocabulario
   - Conjugación de verbos
   - Completar oraciones
   - Lectura comprensiva
   - Ordenar oraciones

📌 **Ganar puntos**: Cada ejercicio completado suma puntos a tu ranking.

💡 **Tip**: Practica un poco cada día. La constancia es clave para mejorar tu español.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="gamification-panel"]',
    title: 'Puntos, Logros y Ranking 🏆',
    content: `¡Aquí está la diversión! Sistema de gamificación para motivarte.

📌 **Puntos**: Ganas puntos por:
   - Completar ejercicios
   - Entregar tareas
   - Asistir a clases
   - Logros especiales

📌 **Logros**: Insignias especiales que tu profesor te otorga por buen desempeño.

📌 **Ranking**: Compite amigablemente con otros estudiantes.

💡 **Tip**: ¡Los puntos se acumulan! Intenta subir en el ranking cada semana.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario de la Semana 📅',
    content: `Ve tu horario completo de actividades.

📌 **Tipos de eventos**:
   - 📚 Clases de español
   - 🎓 Tutorías
   - 🎨 Electivas (arte, música, deportes)
   - 🌄 Aventuras y excursiones

📌 **Navegación**: Usa las flechas para ver semanas anteriores o futuras.

📌 **Detalles**: Haz clic en un evento para ver más información.

💡 **Tip**: Revisa el calendario cada mañana para saber qué actividades tienes.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Centro de Notificaciones 🔔',
    content: `La campanita te avisa de novedades importantes.

📌 **Recibirás alertas cuando**:
   - Tu profesor te asigne una nueva tarea
   - Alguien te envíe un mensaje
   - Recibas un logro
   - Haya cambios en el horario

📌 **Número rojo**: Indica cuántas notificaciones sin leer tienes.

💡 **Tip**: Revisa las notificaciones regularmente para no perderte información importante.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Estás listo para aprender! 🚀',
    content: `¡Felicitaciones! Ya conoces todas las herramientas de tu panel.

📌 **Resumen**:
   - Revisa tu progreso en el currículo
   - Completa tareas y ejercicios
   - Comunícate con tu profesor y tutor
   - Gana puntos y logros
   - Consulta tu calendario

📌 **Ver tutorial de nuevo**: Haz clic en el icono ❓ en el menú superior.

¡Mucho éxito en tu aventura de aprender español! 🇪🇸`,
    disableBeacon: true,
  },
];
```

---

## Nuevos Pasos para Tutores (Detallados)

```typescript
export const tutorSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Tutor! 🎓',
    content: `Este es tu centro de control para gestionar a tus estudiantes.

Como tutor, tu rol es apoyar el aprendizaje reforzando lo que enseña el profesor. Aquí encontrarás:
- Lista de estudiantes asignados
- Herramientas para generar ejercicios
- Acceso a materiales del currículo
- Control de tus horas trabajadas

¡Vamos a explorar cada sección!`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tabla de Estudiantes 👥',
    content: `Aquí verás todos tus estudiantes asignados en una tabla organizada.

📌 **Columnas**:
   - Nombre del estudiante
   - Tu rol (Profesor, Tutor o ambos)
   - Nivel actual (A1-C2)
   - Tipo (Online/Presencial)
   - Sala asignada
   - Profesor principal

📌 **Ordenamiento**: Los más recientes aparecen primero.

💡 **Tip**: Si eres profesor Y tutor del mismo estudiante, verás ambas etiquetas.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Botón Ver Progreso 📊',
    content: `Este botón abre el panel completo de progreso del estudiante.

📌 **Qué puedes hacer**:
   - Ver las semanas del currículo completadas
   - Editar notas diarias (clase, tutoría, vocabulario)
   - Ver y otorgar logros
   - Consultar el historial completo

📌 **Notas de tutoría**: Cada día puedes registrar qué temas practicaron y observaciones.

💡 **Tip**: Registrar notas diarias ayuda al profesor a saber qué reforzar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas 🕐',
    content: `Aquí gestionas tus horas trabajadas de la semana.

📌 **Visualización**:
   - Horas trabajadas hoy
   - Horas trabajadas esta semana
   - Límite semanal
   - Gráfico de distribución

📌 **Solicitar horas extra**: Si necesitas más horas, puedes solicitar aprobación al administrador.

💡 **Tip**: Las horas se calculan automáticamente de los eventos en el calendario.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Generador de Ejercicios IA 🤖',
    content: `Herramienta potente para crear ejercicios personalizados con inteligencia artificial.

📌 **Tipos de ejercicios**:
   - 📚 Flashcards de vocabulario
   - 🔤 Conjugación de verbos
   - ✏️ Completar espacios
   - 📖 Comprensión lectora
   - 🔀 Ordenar oraciones

📌 **Cómo usarlo**:
   1. Selecciona el tipo de ejercicio
   2. Elige el nivel (A1-C2)
   3. Ingresa el tema o vocabulario
   4. La IA genera los ejercicios
   5. Asígnalos a uno o varios estudiantes

💡 **Tip**: Los ejercicios generados quedan guardados para reutilizar.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Materiales del Currículo 📚',
    content: `Accede a todas las guías y recursos organizados por semana.

📌 **Contenido disponible**:
   - Guías de cada tema
   - Material de apoyo (PDFs)
   - Recursos multimedia
   - Ejercicios prediseñados

📌 **Protección**: Los PDFs tienen marca de agua con tu nombre para evitar distribución no autorizada.

📌 **Navegación**: Selecciona una semana para ver todos sus materiales.

💡 **Tip**: Revisa los materiales antes de la tutoría para estar preparado.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="my-schedule-btn"]',
    title: 'Botón Mi Horario 📅',
    content: `Abre tu calendario personal de actividades asignadas.

📌 **Verás**:
   - Tutorías programadas
   - Clases (si también eres profesor)
   - Horarios por día y hora

📌 **Vista**: Calendario semanal con todas tus asignaciones.

💡 **Tip**: Consulta tu horario cada día para confirmar tus sesiones.`,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="notifications"]',
    title: 'Centro de Notificaciones 🔔',
    content: `Recibe alertas importantes en tiempo real.

📌 **Te notifica sobre**:
   - Mensajes nuevos de estudiantes
   - Cambios en el horario
   - Solicitudes de horas extra (estado)
   - Avisos del administrador

📌 **Indicador rojo**: Muestra cuántas notificaciones sin leer tienes.

💡 **Tip**: Revisa las notificaciones al iniciar tu jornada.`,
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Listo para tutorear! 🚀',
    content: `Ya conoces todas las herramientas de tu panel.

📌 **Flujo de trabajo típico**:
   1. Revisa tu horario del día
   2. Prepara los materiales para cada tutoría
   3. Registra notas después de cada sesión
   4. Genera ejercicios de práctica si es necesario
   5. Responde mensajes de estudiantes

📌 **Ver tutorial de nuevo**: Icono ❓ en el menú.

¡Éxito con tus tutorías! 🎓`,
    disableBeacon: true,
  },
];
```

---

## Nuevos Pasos para Profesores (Detallados)

Similar estructura con:
- Explicación detallada de crear tareas
- Cómo revisar entregas
- Crear exámenes personalizados
- Ver progreso de estudiantes
- Generar ejercicios con IA
- Etc.

---

## Nuevos Pasos para Admin (Detallados)

Similar estructura con:
- Panel de aprobación de usuarios
- Gestión de estudiantes
- Asignación de staff
- Calendario y eventos
- Gestión de cuartos
- Horas del personal
- Currículo
- Examen de nivelación

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/tutorial/TutorialProvider.tsx` | Agregar manejo de `TARGET_NOT_FOUND` para saltar pasos |
| `src/components/tutorial/steps/studentSteps.ts` | Descripciones detalladas, agregar `disableBeacon: true` |
| `src/components/tutorial/steps/tutorSteps.ts` | Descripciones detalladas |
| `src/components/tutorial/steps/teacherSteps.ts` | Descripciones detalladas |
| `src/components/tutorial/steps/adminSteps.ts` | Descripciones detalladas |

---

## Beneficios

1. **Tutorial no se cierra inesperadamente** - Maneja elementos que no existen
2. **Descripciones completas** - Cada paso explica el qué, cómo y por qué
3. **Formato mejorado** - Uso de emojis y bullets para mejor legibilidad
4. **Tips útiles** - Sugerencias prácticas para cada función
5. **Resumen al final** - Recordatorio de lo aprendido
