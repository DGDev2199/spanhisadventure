import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Clock, Trophy } from 'lucide-react';
import logo from '@/assets/logo.png';

const TakeReevaluationTest = () => {
  const { testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [resultColor, setResultColor] = useState<string | null>(null);

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['reevaluation-test', testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_reevaluation_tests')
        .select(`
          *,
          week_topics (id, name, week_id)
        `)
        .eq('id', testId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!testId
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['reevaluation-questions', testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_reevaluation_questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!testId
  });

  // Timer logic
  useEffect(() => {
    if (testStarted && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, timeLeft]);

  const startTest = () => {
    setTestStarted(true);
    if (test?.time_limit_minutes) {
      setTimeLeft(test.time_limit_minutes * 60);
    }
  };

  const submitTestMutation = useMutation({
    mutationFn: async () => {
      if (!testId || !questions || !user?.id || !test) return;

      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      questions.forEach((q) => {
        totalPoints += q.points;
        const userAnswer = answers[q.id];
        
        if (q.question_type !== 'free_text') {
          if (userAnswer === q.correct_answer) {
            correctAnswers++;
            earnedPoints += q.points;
          }
        }
      });

      const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      
      // Determine color based on score
      let newColor: string;
      if (scorePercentage >= 90) {
        newColor = 'green';
      } else if (scorePercentage >= 70) {
        newColor = 'yellow';
      } else {
        newColor = 'red';
      }

      // Save attempt
      const { error: attemptError } = await supabase
        .from('topic_reevaluation_attempts')
        .insert({
          test_id: testId,
          student_id: user.id,
          score: scorePercentage,
          answers: answers,
          completed_at: new Date().toISOString(),
          result_color: newColor,
        });

      if (attemptError) throw attemptError;

      // Update student topic progress with new color
      const { error: progressError } = await supabase
        .from('student_topic_progress')
        .upsert({
          student_id: user.id,
          topic_id: test.topic_id,
          color: newColor,
          updated_by: user.id,
        }, {
          onConflict: 'student_id,topic_id',
        });

      if (progressError) throw progressError;

      return { score: scorePercentage, color: newColor };
    },
    onSuccess: (data) => {
      if (data) {
        setFinalScore(data.score);
        setResultColor(data.color);
        setShowResults(true);
        queryClient.invalidateQueries({ queryKey: ['student-topic-progress'] });
        queryClient.invalidateQueries({ queryKey: ['reevaluation-attempts'] });
      }
    },
    onError: () => {
      toast.error('Error al enviar el examen');
    },
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    submitTestMutation.mutate();
  };

  if (testLoading || questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!test || !questions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Examen no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const getColorInfo = () => {
      switch (resultColor) {
        case 'green':
          return {
            emoji: '🟢',
            label: 'Dominado',
            message: '¡Excelente! Has demostrado dominio de este tema.',
            bgClass: 'bg-green-100 border-green-500',
          };
        case 'yellow':
          return {
            emoji: '🟡',
            label: 'Necesita práctica',
            message: '¡Buen trabajo! Sigues mejorando. Continúa practicando.',
            bgClass: 'bg-yellow-100 border-yellow-500',
          };
        default:
          return {
            emoji: '🔴',
            label: 'Dificultad',
            message: 'Necesitas más práctica. Revisa el material y vuelve a intentarlo.',
            bgClass: 'bg-red-100 border-red-500',
          };
      }
    };

    const colorInfo = getColorInfo();

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={logo} alt="Spanish Adventure" className="h-16 mx-auto mb-4" />
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl">¡Examen completado!</CardTitle>
            <CardDescription>{test.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {finalScore}%
              </div>
              <p className="text-muted-foreground">Tu puntuación</p>
            </div>

            <div className={`p-4 rounded-lg border-2 ${colorInfo.bgClass}`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{colorInfo.emoji}</span>
                <span className="font-bold text-lg">{colorInfo.label}</span>
              </div>
              <p className="text-center text-sm">{colorInfo.message}</p>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Tu color para el tema "{test.week_topics?.name}" ha sido actualizado.</p>
            </div>

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={logo} alt="Spanish Adventure" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">{test.title}</CardTitle>
            <CardDescription>{test.description || `Examen de reevaluación para: ${test.week_topics?.name}`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preguntas:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              {test.time_limit_minutes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo límite:</span>
                  <span className="font-medium">{test.time_limit_minutes} minutos</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puntuación mínima:</span>
                <span className="font-medium">{test.passing_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puntos totales:</span>
                <span className="font-medium">{questions.reduce((sum, q) => sum + q.points, 0)}</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Sistema de colores:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>🟢 ≥90% - Dominado</li>
                <li>🟡 ≥70% - Necesita práctica</li>
                <li>🔴 &lt;70% - Dificultad</li>
              </ul>
            </div>

            <Button onClick={startTest} className="w-full">
              Comenzar Examen
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test in progress
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10" />
            <h1 className="text-lg font-bold">{test.title}</h1>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-md">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="w-full bg-muted h-2">
        <div 
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pregunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {question.points} {question.points === 1 ? 'punto' : 'puntos'}
              </span>
            </div>
            <CardTitle className="text-xl">{question.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.question_type === 'multiple_choice' && question.options && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswer(question.id, value)}
              >
                <div className="space-y-3">
                  {((question.options as any).options || []).map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + index)}) {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.question_type === 'true_false' && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswer(question.id, value)}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">Verdadero</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">Falso</Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {question.question_type === 'free_text' && (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
              />
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
              >
                Anterior
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitTestMutation.isPending}
                >
                  {submitTestMutation.isPending ? 'Enviando…' : 'Enviar Examen'}
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                  Siguiente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TakeReevaluationTest;
