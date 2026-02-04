import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SentenceOrderExerciseProps {
  content: {
    scrambled_words?: string[];
    hint?: string;
  };
  showResult: boolean;
  onAnswerChange: (answer: string) => void;
}

export function SentenceOrderExercise({
  content,
  showResult,
  onAnswerChange,
}: SentenceOrderExerciseProps) {
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  
  const availableWords = content.scrambled_words?.filter(
    (w: string) => !orderedWords.includes(w)
  ) || [];

  const handleWordClick = (word: string) => {
    if (showResult) return;
    const newWords = [...orderedWords, word];
    setOrderedWords(newWords);
    onAnswerChange(newWords.join(' '));
  };

  const handleRemoveWord = (index: number) => {
    if (showResult) return;
    const newWords = orderedWords.filter((_, i) => i !== index);
    setOrderedWords(newWords);
    onAnswerChange(newWords.join(' '));
  };

  return (
    <div className="space-y-4">
      <div className="min-h-[60px] p-4 border-2 border-dashed rounded-lg flex flex-wrap gap-2">
        {orderedWords.map((word, index) => (
          <button
            key={index}
            onClick={() => handleRemoveWord(index)}
            disabled={showResult}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/80"
          >
            {word}
          </button>
        ))}
        {orderedWords.length === 0 && (
          <span className="text-muted-foreground text-sm">Haz clic en las palabras para ordenarlas</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableWords.map((word: string, index: number) => (
          <button
            key={index}
            onClick={() => handleWordClick(word)}
            disabled={showResult}
            className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
