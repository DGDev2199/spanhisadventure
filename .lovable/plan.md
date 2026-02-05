
# Plan: Sistema de Tutorial/Guía Interactiva por Rol

## Resumen

Implementar un sistema de tutoriales interactivos estilo videojuego que guíe a cada tipo de usuario por las funciones de su dashboard. Los tutoriales se muestran automáticamente la primera vez que un usuario inicia sesión, con opción de repetirlos desde el menú.

---

## Librería Seleccionada

**react-joyride** - La más popular para React con soporte TypeScript:
- 34k+ estrellas en GitHub
- 249k descargas diarias en npm
- Licencia MIT
- Soporte completo para componentes personalizados
- Control de estado con callbacks

---

## Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                    TutorialProvider                          │
│  (Context global que maneja estado de todos los tutoriales) │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐        ┌──────────┐
   │  Tutor   │         │ Teacher  │        │  Admin   │
   │ Tutorial │         │ Tutorial │        │ Tutorial │
   └──────────┘         └──────────┘        └──────────┘
                              │
                              ▼
                       ┌──────────┐
                       │ Student  │
                       │ Tutorial │
                       └──────────┘
```

---

## Parte 1: Instalación

```bash
npm install react-joyride
```

---

## Parte 2: Estructura de Archivos

```text
src/
├── components/
│   └── tutorial/
│       ├── index.ts                    # Exports
│       ├── TutorialProvider.tsx        # Context + estado global
│       ├── TutorialTooltip.tsx         # Tooltip personalizado
│       ├── TutorialLauncher.tsx        # Botón para reiniciar tutorial
│       └── steps/
│           ├── tutorSteps.ts           # Pasos para Tutores
│           ├── teacherSteps.ts         # Pasos para Profesores
│           ├── adminSteps.ts           # Pasos para Admin/Coordinador
│           └── studentSteps.ts         # Pasos para Estudiantes
└── hooks/
    └── useTutorial.ts                  # Hook para usar el tutorial
```

---

## Parte 3: TutorialProvider (Context Global)

```tsx
// src/components/tutorial/TutorialProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { tutorSteps } from './steps/tutorSteps';
import { teacherSteps } from './steps/teacherSteps';
import { adminSteps } from './steps/adminSteps';
import { studentSteps } from './steps/studentSteps';
import { TutorialTooltip } from './TutorialTooltip';

interface TutorialContextType {
  startTutorial: () => void;
  stopTutorial: () => void;
  isRunning: boolean;
  hasSeenTutorial: boolean;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within TutorialProvider');
  return context;
};

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Key para localStorage basado en rol
  const storageKey = `tutorial-seen-${userRole}-${user?.id}`;

  const hasSeenTutorial = localStorage.getItem(storageKey) === 'true';

  // Obtener pasos según el rol
  useEffect(() => {
    if (!userRole) return;
    
    switch (userRole) {
      case 'tutor':
        setSteps(tutorSteps);
        break;
      case 'teacher':
        setSteps(teacherSteps);
        break;
      case 'admin':
      case 'coordinator':
        setSteps(adminSteps);
        break;
      case 'student':
        setSteps(studentSteps);
        break;
    }
  }, [userRole]);

  // Auto-iniciar tutorial para usuarios nuevos
  useEffect(() => {
    if (user && userRole && steps.length > 0 && !hasSeenTutorial) {
      // Pequeño delay para que el DOM se renderice
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, userRole, steps.length, hasSeenTutorial]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(storageKey, 'true');
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      setStepIndex(index - 1);
    }
  }, [storageKey]);

  const startTutorial = () => {
    setStepIndex(0);
    setRun(true);
  };

  const stopTutorial = () => {
    setRun(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(storageKey);
    startTutorial();
  };

  return (
    <TutorialContext.Provider value={{
      startTutorial,
      stopTutorial,
      isRunning: run,
      hasSeenTutorial,
      resetTutorial,
    }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        callback={handleCallback}
        continuous
        scrollToFirstStep
        showSkipButton
        showProgress
        spotlightClicks
        disableOverlayClose
        tooltipComponent={TutorialTooltip}
        locale={{
          back: 'Anterior',
          close: 'Cerrar',
          last: '¡Listo!',
          next: 'Siguiente',
          skip: 'Saltar tutorial',
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#7c3aed', // Primary color del tema
            overlayColor: 'rgba(0, 0, 0, 0.6)',
          },
        }}
      />
    </TutorialContext.Provider>
  );
};
```

---

## Parte 4: Tooltip Personalizado

```tsx
// src/components/tutorial/TutorialTooltip.tsx
import { TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const TutorialTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
}: TooltipRenderProps) => {
  const progress = ((index + 1) / size) * 100;

  return (
    <Card 
      {...tooltipProps} 
      className="max-w-md shadow-xl border-2 border-primary/20 animate-in fade-in zoom-in-95"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">{step.title}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            {...closeProps}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {index + 1} / {size}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="py-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          {...skipProps}
          className="text-muted-foreground"
        >
          Saltar
        </Button>
        
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          
          {continuous && (
            <Button size="sm" {...primaryProps}>
              {index === size - 1 ? '¡Terminé!' : 'Siguiente'}
              {index < size - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
```

---

## Parte 5: Pasos del Tutorial - TUTORES

```tsx
// src/components/tutorial/steps/tutorSteps.ts
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
```

---

## Parte 6: Pasos del Tutorial - PROFESORES

```tsx
// src/components/tutorial/steps/teacherSteps.ts
import { Step } from 'react-joyride';

export const teacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Profesor! 👨‍🏫',
    content: 'Este tutorial te mostrará todas las herramientas disponibles para gestionar tus clases y estudiantes.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Tus Estudiantes',
    content: 'Lista completa de estudiantes asignados. Verás en qué rol estás para cada uno (Profesor, Tutor o ambos).',
  },
  {
    target: '[data-tutorial="create-task-btn"]',
    title: 'Crear Tarea',
    content: 'Asigna tareas a tus estudiantes. Puedes adjuntar archivos PDF y establecer fechas de entrega.',
  },
  {
    target: '[data-tutorial="task-review-panel"]',
    title: 'Revisar Entregas',
    content: 'Aquí verás las tareas que los estudiantes han enviado. Puedes calificarlas y dar feedback.',
  },
  {
    target: '[data-tutorial="create-test-btn"]',
    title: 'Crear Exámenes',
    content: 'Crea exámenes personalizados con preguntas de opción múltiple, completar y más. Asígnalos a uno o varios estudiantes.',
  },
  {
    target: '[data-tutorial="view-progress-btn"]',
    title: 'Progreso del Estudiante',
    content: 'Accede al progreso completo: semanas del currículo, notas diarias y logros otorgados.',
  },
  {
    target: '[data-tutorial="staff-hours"]',
    title: 'Control de Horas',
    content: 'Registra tus horas trabajadas y solicita horas extra cuando sea necesario.',
  },
  {
    target: '[data-tutorial="practice-panel"]',
    title: 'Generador de Ejercicios IA',
    content: 'La inteligencia artificial te ayuda a crear ejercicios personalizados: flashcards, conjugaciones, lecturas y más.',
  },
  {
    target: '[data-tutorial="materials-panel"]',
    title: 'Guías y Materiales',
    content: 'Todos los recursos del currículo organizados por semana. Las guías de profesor están protegidas.',
  },
  {
    target: '[data-tutorial="scheduled-classes"]',
    title: 'Clases Programadas',
    content: 'Si tienes estudiantes online, aquí verás las reservaciones de clase pendientes.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Todo listo! 🎉',
    content: 'Conoces todas las herramientas. Puedes reiniciar este tutorial cuando quieras desde el menú. ¡Buenas clases!',
  },
];
```

---

## Parte 7: Pasos del Tutorial - ADMIN/COORDINADOR

```tsx
// src/components/tutorial/steps/adminSteps.ts
import { Step } from 'react-joyride';

export const adminSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '¡Bienvenido, Administrador! 🛡️',
    content: 'Este tutorial te mostrará las herramientas de gestión de la escuela. Tienes acceso a todas las funciones administrativas.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="approval-panel"]',
    title: 'Aprobación de Usuarios',
    content: 'Aquí verás las solicitudes de registro pendientes. Puedes aprobar o rechazar a estudiantes, profesores y tutores.',
  },
  {
    target: '[data-tutorial="students-table"]',
    title: 'Gestión de Estudiantes',
    content: 'Lista completa de estudiantes. Puedes asignar profesores, tutores, cuartos y gestionar su progreso.',
  },
  {
    target: '[data-tutorial="assign-teacher-btn"]',
    title: 'Asignar Staff',
    content: 'Asigna o cambia el profesor y tutor de cada estudiante. También puedes cambiar su modalidad (presencial/online).',
  },
  {
    target: '[data-tutorial="manage-progress-btn"]',
    title: 'Ver Progreso',
    content: 'Accede al progreso completo de cualquier estudiante: currículo, notas semanales y logros.',
  },
  {
    target: '[data-tutorial="weekly-calendar"]',
    title: 'Calendario Semanal',
    content: 'Gestiona el horario de la escuela. Crea clases, tutorías, aventuras, electivas y eventos especiales.',
  },
  {
    target: '[data-tutorial="create-event-btn"]',
    title: 'Crear Eventos',
    content: 'Agrega nuevos eventos al calendario: clases grupales, aventuras, deportes, culturales y más.',
  },
  {
    target: '[data-tutorial="manage-rooms-btn"]',
    title: 'Gestión de Cuartos',
    content: 'Administra los cuartos de la escuela y asigna estudiantes a cada uno.',
  },
  {
    target: '[data-tutorial="staff-hours-btn"]',
    title: 'Horas del Personal',
    content: 'Revisa y aprueba las horas trabajadas y solicitudes de horas extra del staff.',
  },
  {
    target: '[data-tutorial="curriculum-btn"]',
    title: 'Gestión del Currículo',
    content: 'Administra las semanas, temas y materiales del currículo. Sube PDFs y recursos para los profesores.',
  },
  {
    target: '[data-tutorial="placement-test-btn"]',
    title: 'Examen de Nivelación',
    content: 'Configura y gestiona el examen de nivelación que toman los nuevos estudiantes.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Panel dominado! 🏆',
    content: 'Ahora conoces todas las herramientas administrativas. Puedes reiniciar este tutorial cuando necesites. ¡Éxito gestionando la escuela!',
  },
];
```

---

## Parte 8: Pasos del Tutorial - ESTUDIANTES

```tsx
// src/components/tutorial/steps/studentSteps.ts
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
```

---

## Parte 9: Botón para Reiniciar Tutorial

```tsx
// src/components/tutorial/TutorialLauncher.tsx
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useTutorial } from './TutorialProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const TutorialLauncher = () => {
  const { startTutorial, resetTutorial, hasSeenTutorial } = useTutorial();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={resetTutorial}>
          <Play className="h-4 w-4 mr-2" />
          {hasSeenTutorial ? 'Ver tutorial de nuevo' : 'Iniciar tutorial'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## Parte 10: Agregar data-tutorial a los Componentes

Necesitamos agregar atributos `data-tutorial` a los elementos clave de cada dashboard:

### Dashboard.tsx (Estudiante)
```tsx
// Ejemplo de atributos a agregar:
<QuickStatCard data-tutorial="level-card" ... />
<StaffCard data-tutorial="teacher-card" ... />
<StaffCard data-tutorial="tutor-card" ... />
<Card data-tutorial="tasks-card" ... />
<WeeklyProgressGrid data-tutorial="progress-grid" ... />
<StudentPracticePanel data-tutorial="practice-panel" ... />
<GamificationPanel data-tutorial="gamification-panel" ... />
<WeeklyCalendar data-tutorial="weekly-calendar" ... />
<NotificationBell data-tutorial="notifications" ... />
```

### TeacherDashboard.tsx
```tsx
<Table data-tutorial="students-table" ... />
<Button data-tutorial="create-task-btn" ... />
<TeacherTaskReviewPanel data-tutorial="task-review-panel" ... />
<Button data-tutorial="create-test-btn" ... />
<Button data-tutorial="view-progress-btn" ... />
<StaffHoursCard data-tutorial="staff-hours" ... />
<PracticeSessionPanel data-tutorial="practice-panel" ... />
<TeacherMaterialsPanel data-tutorial="materials-panel" ... />
<TeacherScheduledClassesCard data-tutorial="scheduled-classes" ... />
<Button data-tutorial="my-schedule-btn" ... />
```

### TutorDashboard.tsx
```tsx
<Table data-tutorial="students-table" ... />
<Button data-tutorial="view-progress-btn" ... />
<StaffHoursCard data-tutorial="staff-hours" ... />
<PracticeSessionPanel data-tutorial="practice-panel" ... />
<TeacherMaterialsPanel data-tutorial="materials-panel" ... />
<Button data-tutorial="my-schedule-btn" ... />
<NotificationBell data-tutorial="notifications" ... />
```

### AdminDashboard.tsx
```tsx
<AdminApprovalPanel data-tutorial="approval-panel" ... />
<Table data-tutorial="students-table" ... />
<Button data-tutorial="assign-teacher-btn" ... />
<Button data-tutorial="manage-progress-btn" ... />
<WeeklyCalendar data-tutorial="weekly-calendar" ... />
<Button data-tutorial="create-event-btn" ... />
<Button data-tutorial="manage-rooms-btn" ... />
<Button data-tutorial="staff-hours-btn" ... />
<Button data-tutorial="curriculum-btn" ... />
<Button data-tutorial="placement-test-btn" ... />
```

---

## Parte 11: Integrar Provider en App.tsx

```tsx
// src/App.tsx
import { TutorialProvider } from './components/tutorial';

// Envolver dentro de AuthProvider
<AuthProvider>
  <TutorialProvider>
    <Routes>
      ...
    </Routes>
  </TutorialProvider>
</AuthProvider>
```

---

## Parte 12: Agregar Launcher al Header de Cada Dashboard

Agregar el botón de ayuda en el header de cada dashboard:

```tsx
import { TutorialLauncher } from '@/components/tutorial';

// En el header, junto a otros botones
<div className="flex items-center gap-1.5 sm:gap-2">
  <TutorialLauncher />
  <LanguageSwitcher />
  <NotificationBell />
  ...
</div>
```

---

## Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| `package.json` | +react-joyride |
| `src/components/tutorial/TutorialProvider.tsx` | **Nuevo** - Context + Joyride |
| `src/components/tutorial/TutorialTooltip.tsx` | **Nuevo** - Tooltip personalizado |
| `src/components/tutorial/TutorialLauncher.tsx` | **Nuevo** - Botón de ayuda |
| `src/components/tutorial/steps/tutorSteps.ts` | **Nuevo** - Pasos tutor |
| `src/components/tutorial/steps/teacherSteps.ts` | **Nuevo** - Pasos profesor |
| `src/components/tutorial/steps/adminSteps.ts` | **Nuevo** - Pasos admin |
| `src/components/tutorial/steps/studentSteps.ts` | **Nuevo** - Pasos estudiante |
| `src/components/tutorial/index.ts` | **Nuevo** - Exports |
| `src/App.tsx` | +TutorialProvider |
| `src/pages/Dashboard.tsx` | +data-tutorial attrs +Launcher |
| `src/pages/TeacherDashboard.tsx` | +data-tutorial attrs +Launcher |
| `src/pages/TutorDashboard.tsx` | +data-tutorial attrs +Launcher |
| `src/pages/AdminDashboard.tsx` | +data-tutorial attrs +Launcher |

---

## Flujo del Usuario

```text
1. Usuario nuevo se registra y es aprobado
2. Primera vez que entra al dashboard:
   - Tutorial inicia automáticamente (1.5s delay)
   - Tooltip aparece centrado: "¡Bienvenido!"
   - Usuario hace clic en "Siguiente"
3. Tutorial guía por cada sección resaltada
4. Al terminar o saltar:
   - Se guarda en localStorage que ya lo vio
   - No aparece automáticamente de nuevo
5. Si quiere verlo otra vez:
   - Click en icono (?) en el header
   - "Ver tutorial de nuevo"
```

---

## Beneficios

1. **Onboarding automático** - Usuarios nuevos aprenden sin manual
2. **Específico por rol** - Cada usuario ve solo lo relevante
3. **No intrusivo** - Puede saltarse y reiniciarse cuando quiera
4. **Responsive** - Funciona en móvil y desktop
5. **Personalizable** - Tooltip con estilo de la app
6. **Persistente** - Recuerda si ya lo vio
7. **i18n ready** - Textos traducibles a inglés fácilmente
