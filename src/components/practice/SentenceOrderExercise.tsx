import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentenceOrderItem {
  scrambled_words: string[];
  correct_sentence: string;
  hint?: string;
}

interface SentenceOrderContent {
  exercises: SentenceOrderItem[];
}

interface SentenceOrderExerciseProps {
  content: SentenceOrderContent;
  onComplete: (result: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function SentenceOrderExercise({ content, onComplete }: SentenceOrderExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  const exercises = content.exercises || [];
  const currentExercise = exercises[currentIndex];

  // Initialize available words when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setAvailableWords([...currentExercise.scrambled_words]);
      setSelectedWords([]);
      setShowResult(false);
    }
  }, [currentIndex, currentExercise]);

  if (!currentExercise) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay ejercicios de ordenar oraciones disponibles.
      </div>
    );
  }

  const handleSelectWord = (word: string, index: number) => {
    if (showResult) return;
    setSelectedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (index: number) => {
    if (showResult) return;
    const word = selectedWords[index];
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, word]);
  };

  const handleReset = () => {
    setSelectedWords([]);
    setAvailableWords([...currentExercise.scrambled_words]);
  };

  const handleConfirm = () => {
    const userSentence = selectedWords.join(' ');
    const isCorrect = userSentence.toLowerCase() === currentExercise.correct_sentence.toLowerCase();
    
    setShowResult(true);
    setAnswers(prev => ({ ...prev, [currentIndex]: userSentence }));
    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const userSentence = selectedWords.join(' ');
      const isCorrect = userSentence.toLowerCase() === currentExercise.correct_sentence.toLowerCase();
      onComplete({
        correct: results.correct + (showResult && isCorrect ? 0 : (isCorrect ? 1 : 0)),
        incorrect: results.incorrect + (showResult && !isCorrect ? 0 : (!isCorrect ? 1 : 0)),
        answers,
      });
    }
  };

  const userSentence = selectedWords.join(' ');
  const isCorrect = userSentence.toLowerCase() === currentExercise.correct_sentence.toLowerCase();

  return (
    <div className="h-full flex flex-col space-y-3 sm:space-y-4">
      {/* Progress - fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between text-xs sm:text-sm">
        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
          Oración {currentIndex + 1} de {exercises.length}
        </Badge>
        <div className="flex gap-2">
          <span className="text-green-600">✓ {results.correct}</span>
          <span className="text-red-600">✗ {results.incorrect}</span>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4">
        {/* Hint */}
        {currentExercise.hint && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center italic px-2 break-words">
            💡 {currentExercise.hint}
          </p>
        )}

        {/* Selected words area */}
        <Card className={cn(
          'min-h-[80px] sm:min-h-[90px]',
          showResult && isCorrect && 'border-green-500',
          showResult && !isCorrect && 'border-red-500'
        )}>
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[44px]">
              {selectedWords.length === 0 ? (
                <p className="text-muted-foreground text-xs sm:text-sm">Toca las palabras para formar la oración...</p>
              ) : (
                selectedWords.map((word, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className={cn(
                      'text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 cursor-pointer hover:bg-destructive/20 break-words max-w-full',
                      showResult && 'cursor-default'
                    )}
                    onClick={() => handleRemoveWord(idx)}
                  >
                    {word}
                  </Badge>
                ))
              )}
            </div>
            {showResult && (
              <div className="mt-2 sm:mt-3 flex items-start gap-1.5 sm:gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={cn('text-xs sm:text-sm break-words', isCorrect ? 'text-green-600' : 'text-red-600')}>
                  {isCorrect ? '¡Correcto!' : `Correcta: ${currentExercise.correct_sentence}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available words */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          {availableWords.map((word, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="text-xs sm:text-sm h-auto min-h-[40px] sm:min-h-[44px] py-2 px-2.5 sm:px-4 whitespace-normal break-words max-w-[45%]"
              onClick={() => handleSelectWord(word, idx)}
              disabled={showResult}
            >
              {word}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions - fixed at bottom */}
      <div className="flex-shrink-0 flex justify-center gap-2 sm:gap-3 pt-2">
        {!showResult ? (
          <>
            <Button variant="outline" className="text-xs sm:text-sm h-10 min-h-[44px] flex-1 sm:flex-none" onClick={handleReset} disabled={selectedWords.length === 0}>
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Reiniciar
            </Button>
            <Button className="text-xs sm:text-sm h-10 min-h-[44px] flex-1 sm:flex-none" onClick={handleConfirm} disabled={availableWords.length > 0}>
              Confirmar
            </Button>
          </>
        ) : (
          <Button className="text-xs sm:text-sm h-10 min-h-[44px] w-full sm:w-auto" onClick={handleNext}>
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
