import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Languages, MessageSquare, Trophy, RotateCcw, X, ListChecks, ArrowDownUp, FileText, BookOpenCheck } from 'lucide-react';
import { PracticeExercise, FlashcardContent, ConjugationContent, VocabularyContent, useUpdateAssignmentStatus, useSaveAttempt } from '@/hooks/usePracticeExercises';
import { useAddPoints } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import FlashcardExercise from './FlashcardExercise';
import ConjugationExercise from './ConjugationExercise';
import VocabularyExercise from './VocabularyExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import SentenceOrderExercise from './SentenceOrderExercise';
import FillGapsExercise from './FillGapsExercise';
import ReadingExercise from './ReadingExercise';

interface PracticeExerciseViewProps {
  open: boolean;
  onClose: () => void;
  exercise: PracticeExercise;
  assignmentId?: string;
}

interface CompletionResult {
  correct?: number;
  incorrect?: number;
  known?: number;
  unknown?: number;
  answers?: Record<number, string>;
}

export default function PracticeExerciseView({
  open,
  onClose,
  exercise,
  assignmentId,
}: PracticeExerciseViewProps) {
  const { user } = useAuth();
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);

  const updateStatusMutation = useUpdateAssignmentStatus();
  const saveAttemptMutation = useSaveAttempt();
  const addPointsMutation = useAddPoints();

  // Mark as in_progress when opened
  useEffect(() => {
    if (assignmentId && open) {
      updateStatusMutation.mutate({
        id: assignmentId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
    }
  }, [assignmentId, open]);

  const handleComplete = async (completionResult: CompletionResult) => {
    setResult(completionResult);
    setIsCompleted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const content = exercise.content as any;
    
    // Calculate total questions based on exercise type
    let totalQuestions = 0;
    if (exercise.exercise_type === 'flashcard' && content.cards) {
      totalQuestions = content.cards.length;
    } else if (exercise.exercise_type === 'reading' && content.exercises) {
      // For reading, count total questions across all exercises
      totalQuestions = content.exercises.reduce((sum: number, ex: any) => sum + (ex.questions?.length || 0), 0);
    } else if (content.exercises) {
      totalQuestions = content.exercises.length;
    }
    
    // Fallback to prevent division by zero
    if (totalQuestions === 0) totalQuestions = 1;

    const correctCount = completionResult.correct ?? completionResult.known ?? 0;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Save attempt if there's an assignment
    if (assignmentId) {
      await saveAttemptMutation.mutateAsync({
        assignment_id: assignmentId,
        answers: completionResult.answers || {},
        score,
        time_spent_seconds: timeSpent,
      });

      await updateStatusMutation.mutateAsync({
        id: assignmentId,
        status: 'completed',
        score,
        completed_at: new Date().toISOString(),
      });
    }

    // Award points based on score
    if (user) {
      let points = 5; // Base points for completing
      if (score >= 80) points = 15;
      else if (score >= 60) points = 10;

      await addPointsMutation.mutateAsync({
        userId: user.id,
        points,
        reason: `Ejercicio de ${exercise.exercise_type} completado`,
      });
    }
  };

  const getExerciseIcon = () => {
    switch (exercise.exercise_type) {
      case 'flashcard':
        return <BookOpen className="h-5 w-5" />;
      case 'conjugation':
        return <Languages className="h-5 w-5" />;
      case 'vocabulary':
        return <MessageSquare className="h-5 w-5" />;
      case 'multiple_choice':
        return <ListChecks className="h-5 w-5" />;
      case 'sentence_order':
        return <ArrowDownUp className="h-5 w-5" />;
      case 'fill_gaps':
        return <FileText className="h-5 w-5" />;
      case 'reading':
        return <BookOpenCheck className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getExerciseLabel = () => {
    switch (exercise.exercise_type) {
      case 'flashcard':
        return 'Flashcards';
      case 'conjugation':
        return 'Conjugación';
      case 'vocabulary':
        return 'Vocabulario';
      case 'multiple_choice':
        return 'Opción Múltiple';
      case 'sentence_order':
        return 'Ordenar Oraciones';
      case 'fill_gaps':
        return 'Completar Huecos';
      case 'reading':
        return 'Comprensión Lectora';
      default:
        return exercise.exercise_type;
    }
  };

  const renderExercise = () => {
    const content = exercise.content as any;
    
    switch (exercise.exercise_type) {
      case 'flashcard':
        return (
          <FlashcardExercise
            content={content as FlashcardContent}
            onComplete={handleComplete}
          />
        );
      case 'conjugation':
        return (
          <ConjugationExercise
            content={content as ConjugationContent}
            onComplete={handleComplete}
          />
        );
      case 'vocabulary':
        return (
          <VocabularyExercise
            content={content as VocabularyContent}
            onComplete={handleComplete}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceExercise
            content={content}
            onComplete={handleComplete}
          />
        );
      case 'sentence_order':
        return (
          <SentenceOrderExercise
            content={content}
            onComplete={handleComplete}
          />
        );
      case 'fill_gaps':
        return (
          <FillGapsExercise
            content={content}
            onComplete={handleComplete}
          />
        );
      case 'reading':
        return (
          <ReadingExercise
            content={content}
            onComplete={handleComplete}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Tipo de ejercicio no soportado: {exercise.exercise_type}
          </div>
        );
    }
  };

  const renderCompletionScreen = () => {
    if (!result) return null;

    const correctCount = result.correct ?? result.known ?? 0;
    const incorrectCount = result.incorrect ?? result.unknown ?? 0;
    const total = correctCount + incorrectCount;
    const percentage = Math.round((correctCount / total) * 100);

    let message = '';
    let emoji = '';
    if (percentage >= 90) {
      message = '¡Excelente trabajo!';
      emoji = '🏆';
    } else if (percentage >= 70) {
      message = '¡Muy bien!';
      emoji = '⭐';
    } else if (percentage >= 50) {
      message = '¡Buen intento!';
      emoji = '👍';
    } else {
      message = 'Sigue practicando';
      emoji = '💪';
    }

    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">{emoji}</div>
        <div>
          <h3 className="text-2xl font-bold">{message}</h3>
          <p className="text-muted-foreground mt-2">Has completado el ejercicio</p>
        </div>

        <Card className="max-w-xs mx-auto">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-primary">{percentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {correctCount} de {total} correctas
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => {
            setIsCompleted(false);
            setResult(null);
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Repetir
          </Button>
          <Button onClick={onClose}>
            Terminar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getExerciseIcon()}
            {exercise.title}
            <Badge variant="secondary" className="ml-2">{getExerciseLabel()}</Badge>
          </DialogTitle>
          {exercise.topic_context && (
            <p className="text-sm text-muted-foreground">
              Tema: {exercise.topic_context} • Nivel: {exercise.level}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isCompleted ? renderCompletionScreen() : renderExercise()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
