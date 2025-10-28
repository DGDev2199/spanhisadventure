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
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import logo from '@/assets/logo.png';

const TakeCustomTest = () => {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['test-assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_assignments')
        .select(`
          *,
          custom_tests (
            id,
            title,
            description,
            time_limit_minutes,
            teacher_id
          )
        `)
        .eq('id', assignmentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['test-questions', assignment?.test_id],
    queryFn: async () => {
      if (!assignment?.test_id) return [];
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', assignment.test_id)
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!assignment?.test_id
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

  const startTestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('test_assignments')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setTestStarted(true);
      if (assignment?.custom_tests?.time_limit_minutes) {
        setTimeLeft(assignment.custom_tests.time_limit_minutes * 60);
      }
      queryClient.invalidateQueries({ queryKey: ['test-assignment'] });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentId || !questions) return;

      // Calculate score for auto-graded questions
      let totalPoints = 0;
      let earnedPoints = 0;

      const answersToInsert = questions.map((q) => {
        totalPoints += q.points;
        const userAnswer = answers[q.id];
        let isCorrect = false;
        let pointsEarned = 0;

        if (q.question_type !== 'free_text' && q.correct_answer) {
          if (q.question_type === 'true_false') {
            isCorrect = userAnswer === q.correct_answer;
          } else if (q.question_type === 'multiple_choice') {
            isCorrect = userAnswer === q.correct_answer;
          }
          
          if (isCorrect) {
            pointsEarned = q.points;
            earnedPoints += q.points;
          }
        }

        return {
          assignment_id: assignmentId,
          question_id: q.id,
          answer_text: userAnswer || '',
          is_correct: q.question_type !== 'free_text' ? isCorrect : null,
          points_earned: pointsEarned,
        };
      });

      // Insert answers
      const { error: answersError } = await supabase
        .from('test_answers')
        .upsert(answersToInsert);

      if (answersError) throw answersError;

      // Update assignment
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const { error: assignmentError } = await supabase
        .from('test_assignments')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          score: score,
        })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      toast.success('¡Test enviado exitosamente!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Error al enviar el test');
    },
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    submitTestMutation.mutate();
  };

  if (assignmentLoading || questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assignment || !questions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Test no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assignment.status === 'assigned' && !testStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={logo} alt="Spanish Adventure" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">{assignment.custom_tests.title}</CardTitle>
            <CardDescription>{assignment.custom_tests.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preguntas:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              {assignment.custom_tests.time_limit_minutes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo límite:</span>
                  <span className="font-medium">{assignment.custom_tests.time_limit_minutes} minutos</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puntos totales:</span>
                <span className="font-medium">{questions.reduce((sum, q) => sum + q.points, 0)}</span>
              </div>
            </div>
            <Button onClick={() => startTestMutation.mutate()} className="w-full" disabled={startTestMutation.isPending}>
              {startTestMutation.isPending ? 'Iniciando...' : 'Comenzar Test'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10" />
            <h1 className="text-lg font-bold">{assignment.custom_tests.title}</h1>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-md">
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
                  {(question.options as any).options?.map((option: string, index: number) => (
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
                  {submitTestMutation.isPending ? 'Enviando…' : 'Enviar Test'}
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

export default TakeCustomTest;
