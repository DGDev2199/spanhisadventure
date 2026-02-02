import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VocabularyContent } from '@/hooks/usePracticeExercises';

interface VocabularyExerciseProps {
  content: VocabularyContent;
  onComplete: (results: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function VocabularyExercise({ content, onComplete }: VocabularyExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean }>>({});

  const { exercises } = content;
  const currentExercise = exercises[currentIndex];
  const progress = ((currentIndex) / exercises.length) * 100;

  const normalizeAnswer = (text: string) => {
    return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const handleCheck = () => {
    if (!userAnswer.trim()) return;
    
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(currentExercise.correct_answer);
    const newAnswers = {
      ...answers,
      [currentIndex]: { answer: userAnswer, correct: isCorrect },
    };
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
    } else {
      // Complete
      const correct = Object.values(answers).filter(a => a.correct).length +
                     (normalizeAnswer(userAnswer) === normalizeAnswer(currentExercise.correct_answer) ? 1 : 0);
      const incorrect = exercises.length - correct;
      const answerMap = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, v.answer])
      );
      onComplete({ correct, incorrect, answers: answerMap });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!showResult) {
        handleCheck();
      } else {
        handleNext();
      }
    }
  };

  // Render the sentence with blank
  const renderSentence = () => {
    const parts = currentExercise.sentence_blank.split('____');
    return (
      <p className="text-sm sm:text-lg leading-relaxed">
        {parts[0]}
        <span className="inline-block min-w-[70px] sm:min-w-[100px] border-b-2 border-primary mx-1 px-1 sm:px-2">
          {showResult ? (
            <span className={cn(
              "font-bold",
              answers[currentIndex]?.correct ? "text-green-600" : "text-red-600"
            )}>
              {currentExercise.correct_answer}
            </span>
          ) : userAnswer || '___'}
        </span>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-3 sm:space-y-4">
      {/* Progress - fixed at top */}
      <div className="flex-shrink-0 space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Ejercicio {currentIndex + 1} de {exercises.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Results summary */}
      <div className="flex-shrink-0 flex gap-2 sm:gap-4 justify-center">
        <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Correctas: {Object.values(answers).filter(a => a.correct).length}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Incorrectas: {Object.values(answers).filter(a => !a.correct).length}
        </Badge>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Exercise */}
        <Card>
          <CardHeader className="text-center px-3 sm:px-6 pb-2 sm:pb-3 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base">
              <span className="text-primary break-words">"{currentExercise.word}"</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 break-words">
              {currentExercise.definition}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-4">
            {/* Sentence with blank */}
            <div className="text-center py-2.5 sm:py-3 bg-muted/50 rounded-lg px-2">
              {renderSentence()}
            </div>

            {/* Hint */}
            {currentExercise.context_hint && (
              <div className="flex justify-center">
                {showHint ? (
                  <p className="text-xs sm:text-sm text-muted-foreground bg-muted px-3 sm:px-4 py-2 rounded-lg text-center break-words max-w-full">
                    💡 {currentExercise.context_hint}
                  </p>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs sm:text-sm h-9 min-h-[44px]"
                    onClick={() => setShowHint(true)}
                    disabled={showResult}
                  >
                    <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ver pista
                  </Button>
                )}
              </div>
            )}

            {/* Input */}
            {!showResult && (
              <div className="flex gap-2">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe la palabra..."
                  className="text-center text-sm sm:text-base h-11 min-h-[44px]"
                  autoFocus
                />
              </div>
            )}

            {/* Feedback */}
            {showResult && (
              <div className={cn(
                "p-2.5 sm:p-3 rounded-lg text-center text-xs sm:text-sm",
                answers[currentIndex]?.correct
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              )}>
                {answers[currentIndex]?.correct ? (
                  <p>¡Correcto! 🎉</p>
                ) : (
                  <p className="break-words">
                    Tu respuesta: <span className="line-through">{answers[currentIndex]?.answer}</span>
                    <br />
                    Correcta: <strong>{currentExercise.correct_answer}</strong>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions - fixed at bottom */}
      <div className="flex-shrink-0 flex justify-center pt-2">
        {!showResult ? (
          <Button
            className="w-full sm:w-auto text-xs sm:text-sm h-10 min-h-[44px]"
            onClick={handleCheck}
            disabled={!userAnswer.trim()}
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Comprobar
          </Button>
        ) : (
          <Button className="w-full sm:w-auto text-xs sm:text-sm h-10 min-h-[44px]" onClick={handleNext}>
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
