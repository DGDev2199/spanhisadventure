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
    <div className="space-y-4 sm:space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
          Oración {currentIndex + 1} de {exercises.length}
        </Badge>
        <div className="flex gap-2">
          <span className="text-green-600">✓ {results.correct}</span>
          <span className="text-red-600">✗ {results.incorrect}</span>
        </div>
      </div>

      {/* Hint */}
      {currentExercise.hint && (
        <p className="text-xs sm:text-sm text-muted-foreground text-center italic">
          💡 {currentExercise.hint}
        </p>
      )}

      {/* Selected words area */}
      <Card className={cn(
        'min-h-[70px] sm:min-h-[80px]',
        showResult && isCorrect && 'border-green-500',
        showResult && !isCorrect && 'border-red-500'
      )}>
        <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-[40px]">
            {selectedWords.length === 0 ? (
              <p className="text-muted-foreground text-xs sm:text-sm">Toca las palabras para formar la oración...</p>
            ) : (
              selectedWords.map((word, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={cn(
                    'text-xs sm:text-base py-1.5 sm:py-2 px-2.5 sm:px-4 cursor-pointer hover:bg-destructive/20',
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
            <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2">
              {isCorrect ? (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              )}
              <span className={cn('text-xs sm:text-sm', isCorrect ? 'text-green-600' : 'text-red-600')}>
                {isCorrect ? '¡Correcto!' : `Correcta: ${currentExercise.correct_sentence}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available words */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center px-2">
        {availableWords.map((word, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="text-xs sm:text-base h-8 sm:h-10 px-2.5 sm:px-4"
            onClick={() => handleSelectWord(word, idx)}
            disabled={showResult}
          >
            {word}
          </Button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2 sm:gap-3 px-2">
        {!showResult ? (
          <>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9" onClick={handleReset} disabled={selectedWords.length === 0}>
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Reiniciar
            </Button>
            <Button size="sm" className="text-xs sm:text-sm h-9" onClick={handleConfirm} disabled={availableWords.length > 0}>
              Confirmar
            </Button>
          </>
        ) : (
          <Button size="sm" className="text-xs sm:text-sm h-9 w-full sm:w-auto" onClick={handleNext}>
            {currentIndex < exercises.length - 1 ? (
              <>
                Siguiente <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
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
