import React, { useState, useEffect } from 'react';
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
  const [supports3D, setSupports3D] = useState(true);

  const { cards } = content;
  const currentCard = cards[currentIndex];
  const progress = ((Object.keys(results).length) / cards.length) * 100;

  // Detect 3D transform support on mount
  useEffect(() => {
    const check3DSupport = () => {
      if (typeof window === 'undefined') return true;
      try {
        return window.CSS?.supports?.('transform-style', 'preserve-3d') ?? true;
      } catch {
        return true;
      }
    };
    setSupports3D(check3DSupport());
  }, []);

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

  // Fallback card for browsers without 3D support
  const renderFallbackCard = () => (
    <div
      className="relative w-full max-w-md min-h-[120px] sm:min-h-[140px] md:min-h-[160px] cursor-pointer"
      onClick={handleFlip}
    >
      <Card
        className={cn(
          "w-full h-full flex items-center justify-center transition-all duration-300 overflow-hidden",
          isFlipped 
            ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" 
            : "bg-gradient-to-br from-primary/5 to-primary/10"
        )}
      >
        <CardContent className="text-center p-3 sm:p-4 md:p-6 max-h-[180px] overflow-y-auto w-full">
          {isFlipped ? (
            <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 dark:text-green-400 break-words">
              {currentCard.back}
            </p>
          ) : (
            <>
              <p className="text-sm sm:text-base md:text-lg font-medium break-words">{currentCard.front}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                Toca para voltear
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // 3D flip card for supported browsers
  const render3DCard = () => (
    <div
      className="relative w-full max-w-md min-h-[120px] sm:min-h-[140px] md:min-h-[160px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={handleFlip}
    >
      <div
        className="w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <Card
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <CardContent className="text-center p-3 sm:p-4 md:p-6 max-h-[180px] overflow-y-auto w-full">
            <p className="text-sm sm:text-base md:text-lg font-medium break-words">{currentCard.front}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
              Toca para voltear
            </p>
          </CardContent>
        </Card>

        {/* Back */}
        <Card
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardContent className="text-center p-3 sm:p-4 md:p-6 max-h-[180px] overflow-y-auto w-full">
            <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 dark:text-green-400 break-words">
              {currentCard.back}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Progress */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex justify-between text-[10px] sm:text-xs md:text-sm">
          <span>Tarjeta {currentIndex + 1} de {cards.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-1 sm:h-1.5 md:h-2" />
      </div>

      {/* Results summary */}
      <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
        <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Conocidas: {Object.values(results).filter(r => r === 'known').length}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Por aprender: {Object.values(results).filter(r => r === 'unknown').length}
        </Badge>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center px-2">
        {supports3D ? render3DCard() : renderFallbackCard()}
      </div>

      {/* Hint */}
      {currentCard.hint && (
        <div className="flex justify-center px-2">
          {showHint ? (
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground bg-muted px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-center max-w-sm">
              💡 {currentCard.hint}
            </p>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] sm:text-xs md:text-sm h-8 min-h-[44px] px-3"
              onClick={() => setShowHint(true)}
            >
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Ver pista
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      {isFlipped && (
        <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 px-2">
          <Button
            variant="outline"
            onClick={() => handleResult('unknown')}
            className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 text-[10px] sm:text-xs md:text-sm min-h-[44px] h-auto py-2 px-3 sm:px-4 flex-1 max-w-[140px]"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span>No la sabía</span>
          </Button>
          <Button
            onClick={() => handleResult('known')}
            className="bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs md:text-sm min-h-[44px] h-auto py-2 px-3 sm:px-4 flex-1 max-w-[140px]"
          >
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span>¡La sabía!</span>
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center px-1 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] sm:text-xs md:text-sm min-h-[44px] h-auto px-2 sm:px-3"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline sm:inline">Anterior</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] sm:text-xs min-h-[44px] h-auto px-2" 
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline ml-1">Reiniciar</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] sm:text-xs md:text-sm min-h-[44px] h-auto px-2 sm:px-3"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          <span className="hidden xs:inline sm:inline">Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}
