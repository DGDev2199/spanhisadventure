import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FlashcardExerciseProps {
  content: {
    front: string;
    back: string;
    hint?: string;
  };
  showResult: boolean;
  onAnswerChange: (answer: string) => void;
  onCorrect: () => void;
}

export function FlashcardExercise({
  content,
  showResult,
  onAnswerChange,
  onCorrect,
}: FlashcardExerciseProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
    if (!flipped) {
      onAnswerChange(content.back);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleFlip}
        className="w-full min-h-[150px] p-6 border-2 rounded-xl transition-all hover:border-primary/50 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-lg font-medium">
            {flipped ? content.back : content.front}
          </p>
          {!flipped && (
            <p className="text-sm text-muted-foreground mt-2">Haz clic para ver la respuesta</p>
          )}
        </div>
      </button>
      
      {flipped && !showResult && (
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => setFlipped(false)}>
            Ver de nuevo
          </Button>
          <Button onClick={onCorrect}>
            ¡Lo sabía!
          </Button>
        </div>
      )}
    </div>
  );
}
