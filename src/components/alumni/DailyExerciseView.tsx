import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SentenceOrderExercise, FlashcardExercise } from './exercises';

interface ExercisePack {
  id: string;
  exercises_data: {
    analysis_summary?: string;
    exercises?: Array<{
      type: string;
      content: any;
    }>;
  };
  completed_count: number;
}

interface DailyExerciseViewProps {
  pack: ExercisePack;
  currentIndex: number;
  onExerciseComplete: (index: number, correct: boolean) => void;
  onClose: () => void;
}

export function DailyExerciseView({
  pack,
  currentIndex,
  onExerciseComplete,
  onClose,
}: DailyExerciseViewProps) {
  const exercises = pack.exercises_data?.exercises || [];
  const exercise = exercises[currentIndex];
  const totalExercises = exercises.length;

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!exercise) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>No hay más ejercicios disponibles.</p>
          <Button onClick={onClose} className="mt-4">Volver</Button>
        </CardContent>
      </Card>
    );
  }

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correctAnswer = getCorrectAnswer(exercise);
    const correct = selectedAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleNext = () => {
    onExerciseComplete(currentIndex, isCorrect);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setIsCorrect(false);
  };

  const handleFlashcardCorrect = () => {
    setIsCorrect(true);
    setShowResult(true);
  };

  const getCorrectAnswer = (exercise: { type: string; content: any }): string => {
    const { type, content } = exercise;
    switch (type) {
      case 'vocabulary':
        return content.correct_answer || content.word;
      case 'conjugation':
      case 'fill_gaps':
      case 'multiple_choice':
        return content.correct_answer;
      case 'sentence_order':
        return content.correct_sentence;
      case 'flashcard':
        return content.back;
      default:
        return content.correct_answer || '';
    }
  };

  const getOptions = (exercise: { type: string; content: any }): string[] => {
    const { type, content } = exercise;
    switch (type) {
      case 'conjugation':
      case 'fill_gaps':
      case 'multiple_choice':
        return content.options || [];
      case 'vocabulary':
        return content.options || [content.correct_answer];
      default:
        return content.options || [];
    }
  };

  const getHint = (exercise: { type: string; content: any }): string | null => {
    const { type, content } = exercise;
    switch (type) {
      case 'vocabulary':
        return content.context_hint;
      case 'conjugation':
        return `Verbo: ${content.verb}, Tiempo: ${content.tense}`;
      case 'fill_gaps':
        return content.context;
      case 'multiple_choice':
        return null;
      case 'sentence_order':
        return content.hint;
      case 'flashcard':
        return content.hint;
      default:
        return null;
    }
  };

  const getExerciseTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      vocabulary: 'Vocabulario',
      conjugation: 'Conjugación',
      fill_gaps: 'Completar espacios',
      multiple_choice: 'Opción múltiple',
      sentence_order: 'Ordenar oración',
      flashcard: 'Tarjeta de memoria',
      reading: 'Comprensión lectora',
    };
    return labels[type] || type;
  };

  const getExerciseQuestion = (exercise: { type: string; content: any }): string => {
    const { type, content } = exercise;
    switch (type) {
      case 'vocabulary':
        return content.sentence_blank || `¿Qué significa "${content.word}"?`;
      case 'conjugation':
        return `Conjuga el verbo "${content.verb}" en ${content.tense} para ${content.subject}`;
      case 'fill_gaps':
        return content.sentence_with_gap;
      case 'multiple_choice':
        return content.question;
      case 'sentence_order':
        return 'Ordena las palabras para formar una oración correcta';
      case 'flashcard':
        return 'Tarjeta de vocabulario';
      default:
        return content.question || 'Ejercicio';
    }
  };

  const renderExercise = () => {
    const { type, content } = exercise;
    const options = getOptions(exercise);
    const hint = getHint(exercise);

    return (
      <div className="space-y-6">
        {/* Exercise header */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {getExerciseTypeLabel(type)}
          </span>
          <h3 className="text-lg font-semibold">
            {getExerciseQuestion(exercise)}
          </h3>
        </div>

        {/* Hint */}
        {hint && (
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              {showHint ? 'Ocultar pista' : 'Ver pista'}
            </Button>
            {showHint && (
              <p className="text-sm text-muted-foreground italic">{hint}</p>
            )}
          </div>
        )}

        {/* Options for multiple choice type exercises */}
        {options.length > 0 && type !== 'sentence_order' && type !== 'flashcard' ? (
          <div className="grid grid-cols-1 gap-3">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option.toLowerCase().trim() === getCorrectAnswer(exercise).toLowerCase().trim();
              
              let buttonClass = 'border-2 p-4 rounded-lg text-left transition-all';
              
              if (showResult) {
                if (isCorrectOption) {
                  buttonClass += ' border-green-500 bg-green-50 dark:bg-green-950/30';
                } else if (isSelected && !isCorrectOption) {
                  buttonClass += ' border-red-500 bg-red-50 dark:bg-red-950/30';
                } else {
                  buttonClass += ' border-muted opacity-50';
                }
              } else {
                buttonClass += isSelected
                  ? ' border-primary bg-primary/10'
                  : ' border-muted hover:border-primary/50';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : type === 'sentence_order' ? (
          <SentenceOrderExercise
            content={content}
            showResult={showResult}
            onAnswerChange={setSelectedAnswer}
          />
        ) : type === 'flashcard' ? (
          <FlashcardExercise
            content={content}
            showResult={showResult}
            onAnswerChange={setSelectedAnswer}
            onCorrect={handleFlashcardCorrect}
          />
        ) : null}

        {/* Result and explanation */}
        {showResult && (
          <div className={cn(
            'p-4 rounded-lg',
            isCorrect ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">¡Correcto!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-300">Incorrecto</span>
                </>
              )}
            </div>
            {exercise.content.explanation && (
              <p className="text-sm text-muted-foreground">{exercise.content.explanation}</p>
            )}
            {!isCorrect && (
              <p className="text-sm mt-1">
                Respuesta correcta: <strong>{getCorrectAnswer(exercise)}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <span className="text-sm font-medium">
            Ejercicio {currentIndex + 1} de {totalExercises}
          </span>
        </div>
        <Progress value={((currentIndex + 1) / totalExercises) * 100} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="p-6">
        {renderExercise()}

        <div className="flex justify-end gap-3 mt-6">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              Verificar
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex === totalExercises - 1 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
