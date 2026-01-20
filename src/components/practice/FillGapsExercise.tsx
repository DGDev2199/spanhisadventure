import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FillGapsItem {
  sentence_with_gap: string;
  options: string[];
  correct_answer: string;
  context?: string;
}

interface FillGapsContent {
  exercises: FillGapsItem[];
}

interface FillGapsExerciseProps {
  content: FillGapsContent;
  onComplete: (result: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function FillGapsExercise({ content, onComplete }: FillGapsExerciseProps) {
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
        No hay ejercicios de completar huecos disponibles.
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

  // Render sentence with gap highlighted
  const renderSentence = () => {
    const parts = currentExercise.sentence_with_gap.split('____');
    return (
      <p className="text-lg text-center">
        {parts[0]}
        <span className={cn(
          'inline-block min-w-[80px] border-b-2 mx-1 text-center font-medium',
          showResult && isCorrect && 'text-green-600 border-green-500',
          showResult && !isCorrect && 'text-red-600 border-red-500',
          !showResult && selectedAnswer && 'text-primary border-primary'
        )}>
          {showResult ? currentExercise.correct_answer : (selectedAnswer || '...')}
        </span>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline">
          Ejercicio {currentIndex + 1} de {exercises.length}
        </Badge>
        <div className="flex gap-2">
          <span className="text-green-600">✓ {results.correct}</span>
          <span className="text-red-600">✗ {results.incorrect}</span>
        </div>
      </div>

      {/* Context hint */}
      {currentExercise.context && (
        <p className="text-sm text-muted-foreground text-center italic">
          💡 {currentExercise.context}
        </p>
      )}

      {/* Sentence */}
      <Card>
        <CardContent className="pt-6">
          {renderSentence()}
        </CardContent>
      </Card>

      {/* Result feedback */}
      {showResult && !isCorrect && (
        <div className="flex items-center justify-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>Tu respuesta: {selectedAnswer}</span>
        </div>
      )}

      {showResult && isCorrect && (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>¡Correcto!</span>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {currentExercise.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === currentExercise.correct_answer;

          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'h-auto py-3 px-4',
                isSelected && !showResult && 'ring-2 ring-primary bg-primary/10',
                showResult && isCorrectAnswer && 'bg-green-100 dark:bg-green-900/30 border-green-500',
                showResult && isSelected && !isCorrectAnswer && 'bg-red-100 dark:bg-red-900/30 border-red-500'
              )}
              onClick={() => handleSelectAnswer(option)}
              disabled={showResult}
            >
              {option}
            </Button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        {!showResult ? (
          <Button onClick={handleConfirm} disabled={!selectedAnswer}>
            Confirmar
          </Button>
        ) : (
          <Button onClick={handleNext}>
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
