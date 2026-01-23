import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlashcardContent } from '@/hooks/usePracticeExercises';

interface FlashcardExerciseProps {
  content: FlashcardContent;
  onComplete: (results: { known: number; unknown: number }) => void;
}

export default function FlashcardExercise({ content, onComplete }: FlashcardExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<Record<number, 'known' | 'unknown'>>({});

  const { cards } = content;
  const currentCard = cards[currentIndex];
  const progress = ((Object.keys(results).length) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleResult = (result: 'known' | 'unknown') => {
    const newResults = { ...results, [currentIndex]: result };
    setResults(newResults);

    // Move to next card or complete
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // All cards completed
      const known = Object.values(newResults).filter(r => r === 'known').length;
      const unknown = Object.values(newResults).filter(r => r === 'unknown').length;
      onComplete({ known, unknown });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setResults({});
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Tarjeta {currentIndex + 1} de {cards.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Results summary */}
      <div className="flex gap-2 sm:gap-4 justify-center">
        <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Conocidas: {Object.values(results).filter(r => r === 'known').length}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Por aprender: {Object.values(results).filter(r => r === 'unknown').length}
        </Badge>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center px-2">
        <div
          className="relative w-full max-w-md h-48 sm:h-64 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div
            className={cn(
              "absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d",
              isFlipped && "rotate-y-180"
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <Card
              className="absolute inset-0 w-full h-full flex items-center justify-center backface-hidden bg-gradient-to-br from-primary/5 to-primary/10"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <CardContent className="text-center p-4 sm:p-6">
                <p className="text-base sm:text-lg font-medium">{currentCard.front}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">Toca para voltear</p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className="absolute inset-0 w-full h-full flex items-center justify-center backface-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CardContent className="text-center p-4 sm:p-6">
                <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{currentCard.back}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hint */}
      {currentCard.hint && (
        <div className="flex justify-center px-2">
          {showHint ? (
            <p className="text-xs sm:text-sm text-muted-foreground bg-muted px-3 sm:px-4 py-2 rounded-lg text-center">
              💡 {currentCard.hint}
            </p>
          ) : (
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8" onClick={() => setShowHint(true)}>
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Ver pista
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      {isFlipped && (
        <div className="flex justify-center gap-2 sm:gap-4 px-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => handleResult('unknown')}
            className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <X className="h-4 w-4 mr-1 sm:mr-2" />
            No la sabía
          </Button>
          <Button
            size="default"
            onClick={() => handleResult('known')}
            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <Check className="h-4 w-4 mr-1 sm:mr-2" />
            ¡La sabía!
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center px-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm h-8 px-2 sm:px-3"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={handleReset}>
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline ml-1">Reiniciar</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm h-8 px-2 sm:px-3"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}
