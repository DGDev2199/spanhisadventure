import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReadingQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface ReadingItem {
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

interface ReadingContent {
  exercises: ReadingItem[];
}

interface ReadingExerciseProps {
  content: ReadingContent;
  onComplete: (result: { correct: number; incorrect: number; answers: Record<number, string> }) => void;
}

export default function ReadingExercise({ content, onComplete }: ReadingExerciseProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  const exercises = content.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const currentQuestion = currentExercise?.questions?.[currentQuestionIndex];

  if (!currentExercise || !currentQuestion) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay ejercicios de lectura disponibles.
      </div>
    );
  }

  const totalQuestions = exercises.reduce((sum, ex) => sum + (ex.questions?.length || 0), 0);
  const currentQuestionNumber = exercises
    .slice(0, currentExerciseIndex)
    .reduce((sum, ex) => sum + (ex.questions?.length || 0), 0) + currentQuestionIndex + 1;

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleConfirm = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setShowResult(true);
    setAnswers(prev => ({ ...prev, [`${currentExerciseIndex}-${currentQuestionIndex}`]: selectedAnswer }));
    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    const hasMoreQuestions = currentQuestionIndex < currentExercise.questions.length - 1;
    const hasMoreExercises = currentExerciseIndex < exercises.length - 1;

    if (hasMoreQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else if (hasMoreExercises) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Complete
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;
      onComplete({
        correct: results.correct + (showResult ? 0 : (isCorrect ? 1 : 0)),
        incorrect: results.incorrect + (showResult ? 0 : (!isCorrect ? 1 : 0)),
        answers: answers as Record<number, string>,
      });
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const isLastQuestion = currentExerciseIndex === exercises.length - 1 && 
                         currentQuestionIndex === currentExercise.questions.length - 1;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline">
          Pregunta {currentQuestionNumber} de {totalQuestions}
        </Badge>
        <div className="flex gap-2">
          <span className="text-green-600">✓ {results.correct}</span>
          <span className="text-red-600">✗ {results.incorrect}</span>
        </div>
      </div>

      {/* Reading passage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {currentExercise.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {currentExercise.text}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <p className="font-medium mb-4">{currentQuestion.question}</p>
          
          <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === currentQuestion.correct_answer;

              return (
                <Button
                  key={idx}
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-3 px-4 text-left justify-start',
                    isSelected && !showResult && 'ring-2 ring-primary bg-primary/10',
                    showResult && isCorrectAnswer && 'bg-green-100 dark:bg-green-900/30 border-green-500',
                    showResult && isSelected && !isCorrectAnswer && 'bg-red-100 dark:bg-red-900/30 border-red-500'
                  )}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={showResult}
                >
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600 ml-2" />}
                  {showResult && isSelected && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-600 ml-2" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        {!showResult ? (
          <Button onClick={handleConfirm} disabled={!selectedAnswer}>
            Confirmar respuesta
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {!isLastQuestion ? (
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
