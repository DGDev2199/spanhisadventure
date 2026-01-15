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
      <p className="text-lg">
        {parts[0]}
        <span className="inline-block min-w-[100px] border-b-2 border-primary mx-1 px-2">
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
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Ejercicio {currentIndex + 1} de {exercises.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Results summary */}
      <div className="flex gap-4 justify-center">
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Check className="h-3 w-3 mr-1" />
          Correctas: {Object.values(answers).filter(a => a.correct).length}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-600">
          <X className="h-3 w-3 mr-1" />
          Incorrectas: {Object.values(answers).filter(a => !a.correct).length}
        </Badge>
      </div>

      {/* Exercise */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            <span className="text-primary">"{currentExercise.word}"</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {currentExercise.definition}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sentence with blank */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            {renderSentence()}
          </div>

          {/* Hint */}
          {currentExercise.context_hint && (
            <div className="flex justify-center">
              {showHint ? (
                <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg">
                  💡 {currentExercise.context_hint}
                </p>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHint(true)}
                  disabled={showResult}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
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
                className="text-center text-lg"
                autoFocus
              />
            </div>
          )}

          {/* Feedback */}
          {showResult && (
            <div className={cn(
              "p-3 rounded-lg text-center",
              answers[currentIndex]?.correct
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            )}>
              {answers[currentIndex]?.correct ? (
                <p>¡Correcto! 🎉</p>
              ) : (
                <p>
                  Tu respuesta: <span className="line-through">{answers[currentIndex]?.answer}</span>
                  <br />
                  Respuesta correcta: <strong>{currentExercise.correct_answer}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!showResult ? (
          <Button
            size="lg"
            onClick={handleCheck}
            disabled={!userAnswer.trim()}
          >
            <Check className="h-5 w-5 mr-2" />
            Comprobar
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext}>
            {currentIndex < exercises.length - 1 ? (
              <>
                Siguiente
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            ) : (
              <>
                Finalizar
                <Check className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
