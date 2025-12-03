import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Mic, Square, Volume2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const PlacementTest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [audioAnswers, setAudioAnswers] = useState<Record<string, string>>({});
  const [testComplete, setTestComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [signedAudioUrl, setSignedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Get current question for the useEffect - must be defined before conditional returns
  const currentQuestionData = questions?.[currentQuestion];

  useEffect(() => {
    const setup = async () => {
      if (!currentQuestionData) return setSignedAudioUrl(null);
      if (currentQuestionData.question_type !== 'audio_listen' || !currentQuestionData.audio_url) {
        setSignedAudioUrl(null);
        return;
      }
      const extractPath = (urlOrPath: string) => {
        if (!urlOrPath) return null;
        if (!urlOrPath.startsWith('http')) return urlOrPath;
        const marker = '/student-audio-responses/';
        const idx = urlOrPath.indexOf(marker);
        if (idx === -1) return null;
        return urlOrPath.substring(idx + marker.length);
      };
      const path = extractPath(currentQuestionData.audio_url);
      if (!path) {
        setSignedAudioUrl(currentQuestionData.audio_url);
        return;
      }
      const { data, error } = await supabase.storage
        .from('student-audio-responses')
        .createSignedUrl(path, 3600);
      if (error || !data) {
        console.warn('Audio signed URL error:', error);
        setSignedAudioUrl(currentQuestionData.audio_url);
      } else {
        setSignedAudioUrl(data.signedUrl);
      }
    };
    setup();
  }, [currentQuestionData?.id, currentQuestionData?.audio_url, currentQuestionData?.question_type]);

  const submitTestMutation = useMutation({
    mutationFn: async ({ score, answers }: { score: number; answers: Record<string, string> }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('student_profiles')
        .update({
          placement_test_status: 'pending',
          placement_test_written_score: score,
          placement_test_answers: answers
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating student profile:', error);
        throw error;
      }
      
      console.log('Test submitted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      setTestComplete(true);
      toast.success('¡Examen enviado exitosamente! Tu profesor lo revisará pronto.');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error('Error al enviar el examen. Por favor intenta de nuevo.');
    }
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioAnswer = async (questionId: string) => {
    if (!audioBlob || !user?.id) return null;

    try {
      const fileName = `${user.id}/${questionId}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('student-audio-responses')
        .upload(fileName, audioBlob);

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
        return null;
      }

      // Return the storage path; we'll generate signed URLs when needed
      return fileName;
    } catch (error) {
      console.error('Audio upload exception:', error);
      return null;
    }
  };

  const handleNext = async () => {
    if (!questions) return;
    
    const currentQ = questions[currentQuestion];
    
    // Handle audio response upload if needed
    if (currentQ.question_type === 'audio_response' && audioBlob) {
      const audioUrl = await uploadAudioAnswer(currentQ.id);
      if (audioUrl) {
        setAudioAnswers({ ...audioAnswers, [currentQ.id]: audioUrl });
        setAudioBlob(null);
      }
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!questions) return;
    
    // Upload any pending audio answer
    const currentQ = questions[currentQuestion];
    if (currentQ.question_type === 'audio_response' && audioBlob) {
      const audioUrl = await uploadAudioAnswer(currentQ.id);
      if (audioUrl) {
        setAudioAnswers({ ...audioAnswers, [currentQ.id]: audioUrl });
      }
    }
    
    // Merge text and audio answers
    const allAnswers = { ...answers, ...audioAnswers };
    
    // Calculate score only from text questions
    const textQuestions = questions.filter(q => q.question_type === 'text');
    const answeredTextQuestions = textQuestions.filter(q => answers[q.id]);
    let correctCount = 0;
    
    answeredTextQuestions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    
    const score = answeredTextQuestions.length > 0 
      ? Math.round((correctCount / answeredTextQuestions.length) * 100)
      : 0;
    
    submitTestMutation.mutate({ score, answers: allAnswers });
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
            {/* Text Question */}
            {question.question_type === 'text' && (
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
            )}

            {/* Audio Response Question */}
            {question.question_type === 'audio_response' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Graba tu respuesta en audio haciendo clic en el botón del micrófono
                </p>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="w-48"
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-5 w-5 mr-2" />
                        Detener Grabación
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        Grabar Respuesta
                      </>
                    )}
                  </Button>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-destructive">
                      <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-medium">Grabando...</span>
                    </div>
                  )}
                  {audioBlob && !isRecording && (
                    <div className="flex flex-col items-center gap-2">
                      <audio controls src={URL.createObjectURL(audioBlob)} />
                      <p className="text-sm text-green-600 font-medium">✓ Audio grabado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio Listen Question */}
            {question.question_type === 'audio_listen' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-6 bg-accent/10 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <Volume2 className="h-8 w-8 text-primary" />
                    {question.audio_url && (
                      <audio controls src={signedAudioUrl || question.audio_url} className="w-full" />
                    )}
                  </div>
                </div>
                <div>
                  <Label>Escribe lo que escuchaste:</Label>
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Escribe aquí tu respuesta..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

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
                    disabled={Object.keys({ ...answers, ...audioAnswers }).length !== questions.length || submitTestMutation.isPending}
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
