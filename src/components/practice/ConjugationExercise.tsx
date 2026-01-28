import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConjugationContent } from '@/hooks/usePracticeExercises';

interface ConjugationExerciseProps {
  content: ConjugationContent;
  onComplete: (results: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function ConjugationExercise({ content, onComplete }: ConjugationExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { selected: string; correct: boolean }>>({});

  const { exercises } = content;
  const currentExercise = exercises[currentIndex];
  const progress = ((currentIndex) / exercises.length) * 100;

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === currentExercise.correct_answer;
    const newAnswers = {
      ...answers,
      [currentIndex]: { selected: selectedAnswer, correct: isCorrect },
    };
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Complete
      const correct = Object.values(answers).filter(a => a.correct).length + 
                     (selectedAnswer === currentExercise.correct_answer ? 1 : 0);
      const incorrect = exercises.length - correct;
      const answerMap = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, v.selected])
      );
      onComplete({ correct, incorrect, answers: answerMap });
    }
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option
        ? 'border-primary bg-primary/10'
        : 'hover:border-primary/50';
    }

    if (option === currentExercise.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-950';
    }

    if (option === selectedAnswer && option !== currentExercise.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-950';
    }

    return 'opacity-50';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Ejercicio {currentIndex + 1} de {exercises.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Results summary */}
      <div className="flex gap-2 sm:gap-4 justify-center">
        <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Correctas: {Object.values(answers).filter(a => a.correct).length}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Incorrectas: {Object.values(answers).filter(a => !a.correct).length}
        </Badge>
      </div>

      {/* Exercise */}
      <Card>
        <CardHeader className="text-center px-3 sm:px-6 pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-lg">
            Conjuga el verbo <span className="text-primary">"{currentExercise.verb}"</span>
          </CardTitle>
          <div className="flex gap-1.5 sm:gap-2 justify-center mt-1.5 sm:mt-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">{currentExercise.tense}</Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{currentExercise.subject}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {currentExercise.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className={cn(
                  "h-11 sm:h-14 text-sm sm:text-lg font-medium transition-all",
                  getOptionStyle(option)
                )}
                onClick={() => handleSelect(option)}
                disabled={showResult}
              >
                {option}
                {showResult && option === currentExercise.correct_answer && (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2 text-green-600" />
                )}
                {showResult && option === selectedAnswer && option !== currentExercise.correct_answer && (
                  <X className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2 text-red-600" />
                )}
              </Button>
            ))}
          </div>

          {/* Feedback */}
          {showResult && (
            <div className={cn(
              "mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg text-center text-xs sm:text-sm",
              selectedAnswer === currentExercise.correct_answer
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            )}>
              {selectedAnswer === currentExercise.correct_answer ? (
                <p>¡Correcto! 🎉</p>
              ) : (
                <p>La respuesta correcta es: <strong>{currentExercise.correct_answer}</strong></p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-3 sm:gap-4 px-2">
        {!showResult ? (
          <Button
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            onClick={handleCheck}
            disabled={!selectedAnswer}
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Comprobar
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10" onClick={handleNext}>
            {currentIndex < exercises.length - 1 ? (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
              </>
            ) : (
              <>
                Finalizar
                <Check className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
