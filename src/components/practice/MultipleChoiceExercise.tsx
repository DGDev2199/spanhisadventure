import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultipleChoiceItem {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface MultipleChoiceContent {
  exercises: MultipleChoiceItem[];
}

interface MultipleChoiceExerciseProps {
  content: MultipleChoiceContent;
  onComplete: (result: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function MultipleChoiceExercise({ content, onComplete }: MultipleChoiceExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  const exercises = content.exercises || [];
  const currentExercise = exercises[currentIndex];

  if (!currentExercise) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay ejercicios de opción múltiple disponibles.
      </div>
    );
  }

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleConfirm = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentExercise.correct_answer;
    setShowResult(true);
    setAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));
    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete({
        correct: results.correct + (selectedAnswer === currentExercise.correct_answer ? 1 : 0),
        incorrect: results.incorrect + (selectedAnswer !== currentExercise.correct_answer ? 1 : 0),
        answers,
      });
    }
  };

  const isCorrect = selectedAnswer === currentExercise.correct_answer;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
          Pregunta {currentIndex + 1} de {exercises.length}
        </Badge>
        <div className="flex gap-2">
          <span className="text-green-600">✓ {results.correct}</span>
          <span className="text-red-600">✗ {results.incorrect}</span>
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <p className="text-base sm:text-lg font-medium text-center">{currentExercise.question}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid gap-2 sm:gap-3">
        {currentExercise.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === currentExercise.correct_answer;

          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'h-auto py-3 sm:py-4 px-3 sm:px-6 text-left justify-start text-xs sm:text-base',
                isSelected && !showResult && 'ring-2 ring-primary',
                showResult && isCorrectAnswer && 'bg-green-100 dark:bg-green-900/30 border-green-500',
                showResult && isSelected && !isCorrectAnswer && 'bg-red-100 dark:bg-red-900/30 border-red-500'
              )}
              onClick={() => handleSelectAnswer(option)}
              disabled={showResult}
            >
              <span className="flex-1">{option}</span>
              {showResult && isCorrectAnswer && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />}
              {showResult && isSelected && !isCorrectAnswer && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />}
            </Button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && currentExercise.explanation && (
        <Card className={cn(isCorrect ? 'border-green-500' : 'border-red-500')}>
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
            <p className="text-xs sm:text-sm">
              <span className="font-medium">Explicación: </span>
              {currentExercise.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center px-2">
        {!showResult ? (
          <Button onClick={handleConfirm} disabled={!selectedAnswer} className="w-full sm:w-auto text-sm">
            Confirmar respuesta
          </Button>
        ) : (
          <Button onClick={handleNext} className="w-full sm:w-auto text-sm">
            {currentIndex < exercises.length - 1 ? (
              <>
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Ver resultados'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
