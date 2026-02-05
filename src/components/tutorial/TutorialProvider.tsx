import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Key for localStorage based on role
  const storageKey = useMemo(() => 
    `tutorial-seen-${userRole}-${user?.id}`, 
    [userRole, user?.id]
  );

  const hasSeenTutorial = useMemo(() => 
    typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true',
    [storageKey]
  );

  // Get steps based on role
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
      default:
        setSteps([]);
    }
  }, [userRole]);

  // Auto-start tutorial for new users
  useEffect(() => {
    if (user && userRole && steps.length > 0 && !hasSeenTutorial) {
      // Small delay to let DOM render
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, userRole, steps.length, hasSeenTutorial]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(storageKey, 'true');
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      setStepIndex(index - 1);
    }
  }, [storageKey]);

  const startTutorial = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTutorial = useCallback(() => {
    setRun(false);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(storageKey);
    startTutorial();
  }, [storageKey, startTutorial]);

  const contextValue = useMemo(() => ({
    startTutorial,
    stopTutorial,
    isRunning: run,
    hasSeenTutorial,
    resetTutorial,
  }), [startTutorial, stopTutorial, run, hasSeenTutorial, resetTutorial]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      {steps.length > 0 && (
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
              primaryColor: 'hsl(var(--primary))',
              overlayColor: 'rgba(0, 0, 0, 0.6)',
            },
          }}
        />
      )}
    </TutorialContext.Provider>
  );
};
