import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

const PlacementTest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testComplete, setTestComplete] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['placement-test-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .order('level', { ascending: true })
        .order('question_number', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const submitTestMutation = useMutation({
    mutationFn: async ({ score, answers }: { score: number; answers: Record<string, string> }) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('student_profiles')
        .update({
          placement_test_status: 'pending',
          placement_test_written_score: score,
          placement_test_answers: answers
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      setTestComplete(true);
      toast.success('¡Examen enviado exitosamente! Tu profesor lo revisará pronto.');
    },
    onError: () => {
      toast.error('Error al enviar el examen. Por favor intenta de nuevo.');
    }
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (!questions) return;
    
    // Calculate score only from answered questions
    const answeredQuestions = questions.filter(q => answers[q.id]);
    let correctCount = 0;
    
    answeredQuestions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    
    // Calculate score based on answered questions only
    const score = answeredQuestions.length > 0 
      ? Math.round((correctCount / answeredQuestions.length) * 100)
      : 0;
    
    submitTestMutation.mutate({ score, answers });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (testComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Examen Completado!</CardTitle>
            <CardDescription>
              Tu examen escrito ha sido enviado exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Tu profesor revisará los resultados y programará una evaluación oral para determinar tu nivel final.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <CardTitle>Preguntas No Disponibles</CardTitle>
            <CardDescription>
              El examen de nivelación no está disponible en este momento. Por favor contacta a tu administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
          <img src={logo} alt="Spanish Adventure" className="h-10" />
          <h1 className="text-lg font-bold">Examen de Nivelación</h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-muted h-2">
        <div 
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pregunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm font-medium text-primary">
                Nivel: {question.level}
              </span>
            </div>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswer(question.id, value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="A" id="option-a" />
                  <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                    A) {question.option_a}
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="B" id="option-b" />
                  <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                    B) {question.option_b}
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="C" id="option-c" />
                  <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                    C) {question.option_c}
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="D" id="option-d" />
                  <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                    D) {question.option_d}
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Anterior
                </Button>
                
                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== questions.length || submitTestMutation.isPending}
                  >
                    {submitTestMutation.isPending ? 'Enviando…' : 'Enviar Examen'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Siguiente
                  </Button>
                )}
              </div>
              
              {/* Early finish button - always show if not on last question */}
              {currentQuestion < questions.length - 1 && (
                <Button
                  variant="secondary"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length === 0 || submitTestMutation.isPending}
                  className="w-full"
                >
                  {submitTestMutation.isPending ? 'Enviando…' : 'No entiendo más - Finalizar Test'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlacementTest;
