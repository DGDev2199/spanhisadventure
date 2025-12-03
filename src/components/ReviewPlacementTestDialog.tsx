import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';


interface ReviewPlacementTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  writtenScore?: number;
  currentLevel?: string;
  studentAnswers?: Record<string, string>;
}

const LEVELS = ['A1', 'A1 Especial', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Map each level to its available weeks
const LEVEL_WEEKS: Record<string, number[]> = {
  'A1': [1, 2],
  'A1 Especial': [1, 2],
  'A2': [3, 4],
  'B1': [5, 6],
  'B2': [7, 8],
  'C1': [9, 10],
  'C2': [11, 12]
};

export function ReviewPlacementTestDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  writtenScore,
  currentLevel,
  studentAnswers
}: ReviewPlacementTestDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel || '');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [initialFeedback, setInitialFeedback] = useState<string>('');
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedLevel(currentLevel || '');
    // Reset selected week when dialog opens or level changes
    if (currentLevel && LEVEL_WEEKS[currentLevel]) {
      setSelectedWeek(LEVEL_WEEKS[currentLevel][0]); // Default to first week of level
    }
  }, [currentLevel, open]);

  // Update selected week when level changes
  useEffect(() => {
    if (selectedLevel && LEVEL_WEEKS[selectedLevel]) {
      setSelectedWeek(LEVEL_WEEKS[selectedLevel][0]); // Default to first week of new level
    }
  }, [selectedLevel]);

  // Fetch ALL placement test questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['placement-test-questions-all'],
    queryFn: async () => {
      console.log('📚 Fetching placement test questions...');
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .order('level', { ascending: true })
        .order('question_number', { ascending: true });
      if (error) {
        console.error('❌ Error fetching questions:', error);
        throw error;
      }
      console.log('✅ Questions fetched:', data?.length || 0, 'questions');
      console.log('📝 Student answers provided:', studentAnswers);
      console.log('📊 Number of student answers:', studentAnswers ? Object.keys(studentAnswers).length : 0);
      return data;
    },
    enabled: open
  });

  // Generate signed URLs for audio questions so they are always playable
  const [signedQuestionAudio, setSignedQuestionAudio] = useState<Record<string, string>>({});
  const [signedStudentAudio, setSignedStudentAudio] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const generate = async () => {
      if (!questions || !open) return;
      const entries: Record<string, string> = {};
      for (const q of questions) {
        if (q.question_type === 'audio_listen' && q.audio_url) {
          const extractPath = (urlOrPath: string) => {
            if (!urlOrPath) return null;
            if (!urlOrPath.startsWith('http')) return urlOrPath;
            const marker = '/student-audio-responses/';
            const idx = urlOrPath.indexOf(marker);
            if (idx === -1) return null;
            return urlOrPath.substring(idx + marker.length);
          };
          const path = extractPath(q.audio_url);
          if (path) {
            const { data } = await supabase.storage
              .from('student-audio-responses')
              .createSignedUrl(path, 3600);
            if (data?.signedUrl) entries[q.id] = data.signedUrl;
          }
        }
      }
      setSignedQuestionAudio(entries);
    };
    generate();
  }, [questions, open]);

  // Generate signed URLs for student audio responses
  useEffect(() => {
    const generate = async () => {
      if (!studentAnswers || !open || !questions) return;
      const entries: Record<string, string> = {};
      
      // Get question IDs that are audio_response type
      const audioResponseQuestionIds = new Set(
        questions
          .filter(q => q.question_type === 'audio_response')
          .map(q => q.id)
      );
      
      for (const [questionId, answer] of Object.entries(studentAnswers)) {
        // Check if this is an audio response question and has a valid answer
        if (audioResponseQuestionIds.has(questionId) && answer && typeof answer === 'string') {
          // The answer could be a full URL or just a path - extract the path
          const extractPath = (urlOrPath: string) => {
            if (!urlOrPath) return null;
            // If it's already just a path (contains .webm or similar audio extension)
            if (!urlOrPath.startsWith('http') && (urlOrPath.includes('.webm') || urlOrPath.includes('.mp3') || urlOrPath.includes('.wav') || urlOrPath.includes('.m4a'))) {
              return urlOrPath;
            }
            // If it's a full URL, extract the path
            if (urlOrPath.startsWith('http')) {
              const marker = '/student-audio-responses/';
              const idx = urlOrPath.indexOf(marker);
              if (idx !== -1) {
                return urlOrPath.substring(idx + marker.length);
              }
            }
            return null;
          };
          
          const path = extractPath(answer);
          console.log('🎵 Processing audio answer for question', questionId, '- path:', path);
          
          if (path) {
            const { data, error } = await supabase.storage
              .from('student-audio-responses')
              .createSignedUrl(path, 3600);
            if (data?.signedUrl) {
              entries[questionId] = data.signedUrl;
              console.log('✅ Signed URL generated for', questionId);
            } else if (error) {
              console.error('❌ Error generating signed URL for', questionId, error);
            }
          }
        }
      }
      setSignedStudentAudio(entries);
    };
    generate();
  }, [studentAnswers, open, questions]);

  const assignLevelMutation = useMutation({
    mutationFn: async ({ level, week, feedback }: { level: string; week: number; feedback: string }) => {
      console.log('🎯 Assigning level and week:', {
        level,
        selectedWeek: week,
        studentId,
        feedback: feedback.substring(0, 50) + '...'
      });

      // Update student profile
      const { data, error } = await supabase
        .from('student_profiles')
        .update({
          level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
          placement_test_status: 'completed' as const,
          placement_test_oral_completed: true,
          initial_feedback: feedback
        })
        .eq('user_id', studentId)
        .select();

      if (error) {
        console.error('❌ Error updating student profile:', error);
        throw error;
      }
      console.log('✅ Student profile updated successfully');
      
      // Create initial progress week with feedback note
      if (feedback) {
        console.log('📝 Creating initial progress week at week', week);
        const { data: weekData, error: weekError } = await supabase
          .from('student_progress_weeks')
          .insert({
            student_id: studentId,
            week_number: week,
            week_theme: `Nivel Inicial: ${level} - Semana ${week}`,
            week_objectives: `Evaluación inicial del estudiante. Nivel asignado: ${level}. Comenzando en semana ${week}.`,
            is_completed: false
          })
          .select()
          .single();

        if (weekError) {
          console.error('❌ Error creating initial week:', weekError);
        } else if (weekData) {
          console.log('✅ Initial week created:', weekData);
          // Get current user (teacher)
          const { data: { user } } = await supabase.auth.getUser();
          
          // Create initial note
          const { error: noteError } = await supabase
            .from('student_progress_notes')
            .insert({
              week_id: weekData.id,
              day_type: 'evaluation',
              notes: feedback,
              created_by: user?.id || studentId
            });
          
          if (noteError) {
            console.error('❌ Error creating initial note:', noteError);
          } else {
            console.log('✅ Initial feedback note created');
          }
        }
      }
      
      console.log('✅ Level assignment completed successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast.success('Nivel asignado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Assignment mutation error:', error);
      toast.error(`Error al asignar nivel: ${error.message || 'Error desconocido'}`);
    }
  });

  const handleAssignLevel = () => {
    if (!selectedLevel) {
      toast.error('Por favor selecciona un nivel');
      return;
    }
    if (!selectedWeek) {
      toast.error('Por favor selecciona la semana de inicio');
      return;
    }
    if (!initialFeedback.trim()) {
      toast.error('Por favor escribe un comentario inicial sobre el estudiante');
      return;
    }
    console.log('🚀 Submitting level assignment:', { level: selectedLevel, week: selectedWeek, feedback: initialFeedback.substring(0, 50) });
    assignLevelMutation.mutate({ level: selectedLevel, week: selectedWeek, feedback: initialFeedback });
  };

  const getOptionLabel = (option: string) => {
    return option.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl md:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Revisar Examen de Nivelación</DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 -mx-6">
          <div className="pr-4">
            <div className="space-y-6">
            {/* Written Test Score */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resultado del Examen Escrito</h3>
              <div className="text-3xl font-bold text-primary">
                {writtenScore !== undefined ? `${writtenScore}%` : 'No disponible'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Puntaje automático del test de opción múltiple
              </p>
            </div>

            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                📝 Aquí puedes revisar todas las respuestas del estudiante: preguntas de opción múltiple, 
                respuestas de texto y respuestas de audio.
              </AlertDescription>
            </Alert>

            {/* Questions and Answers Review */}
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : questions && questions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Preguntas del Test ({questions.length} preguntas totales)
                </h3>
                {!studentAnswers || Object.keys(studentAnswers).length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      ⚠️ El estudiante aún no ha completado el test o las respuestas no están disponibles.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(studentAnswers).length} de {questions.length} preguntas respondidas
                  </p>
                )}
                
                {questions.map((question, index) => {
                  const studentAnswer = studentAnswers?.[question.id];
                  
                  // Multiple choice question (text type)
                  if (question.question_type === 'text') {
                    const isCorrect = studentAnswer === question.correct_answer;
                    const wasAnswered = studentAnswer !== undefined && studentAnswer !== null;
                    
                    return (
                      <Card key={question.id} className={`border-l-4 ${
                        !wasAnswered ? 'border-l-gray-400' :
                        isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {!wasAnswered ? (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              ) : isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Pregunta {index + 1} - Opción Múltiple
                                </span>
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  Nivel {question.level}
                                </span>
                                {!wasAnswered && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    No respondida
                                  </span>
                                )}
                              </div>
                              
                              <p className="font-medium">{question.question}</p>
                              
                              <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className={`p-2 rounded ${
                                  question.correct_answer === 'A'
                                    ? 'bg-green-50 border border-green-200' 
                                    : wasAnswered && studentAnswer === 'A'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-muted/50'
                                }`}>
                                  <span className="font-medium">A)</span> {question.option_a}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correct_answer === 'B'
                                    ? 'bg-green-50 border border-green-200' 
                                    : wasAnswered && studentAnswer === 'B'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-muted/50'
                                }`}>
                                  <span className="font-medium">B)</span> {question.option_b}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correct_answer === 'C'
                                    ? 'bg-green-50 border border-green-200' 
                                    : wasAnswered && studentAnswer === 'C'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-muted/50'
                                }`}>
                                  <span className="font-medium">C)</span> {question.option_c}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correct_answer === 'D'
                                    ? 'bg-green-50 border border-green-200' 
                                    : wasAnswered && studentAnswer === 'D'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-muted/50'
                                }`}>
                                  <span className="font-medium">D)</span> {question.option_d}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm pt-2">
                                <div>
                                  <span className="text-muted-foreground">Respuesta del estudiante: </span>
                                  <span className={`font-semibold ${
                                    !wasAnswered ? 'text-gray-600' :
                                    isCorrect ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {wasAnswered ? studentAnswer : 'No respondió'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Respuesta correcta: </span>
                                  <span className="font-semibold text-green-600">
                                    {question.correct_answer}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Audio listen question (listening comprehension)
                  if (question.question_type === 'audio_listen') {
                    const wasAnswered = studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '';
                    
                    return (
                      <Card key={question.id} className={`border-l-4 ${
                        wasAnswered ? 'border-l-blue-500' : 'border-l-gray-400'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Pregunta {index + 1} - Comprensión Auditiva
                              </span>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                Nivel {question.level}
                              </span>
                              {!wasAnswered && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  No respondida
                                </span>
                              )}
                            </div>
                            
                            <p className="font-medium">{question.question}</p>
                            
                            {question.audio_url && (
                              <div className="bg-accent/10 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Audio de la pregunta:</p>
                                <audio controls src={signedQuestionAudio[question.id] || question.audio_url} className="w-full" />
                              </div>
                            )}
                            
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Respuesta del estudiante:</p>
                              <p className="font-medium">{wasAnswered ? studentAnswer : 'No respondió'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Audio response question (speaking)
                  if (question.question_type === 'audio_response') {
                    const wasAnswered = studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '';
                    
                    return (
                      <Card key={question.id} className={`border-l-4 ${
                        wasAnswered ? 'border-l-purple-500' : 'border-l-gray-400'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Pregunta {index + 1} - Respuesta Oral
                              </span>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                Nivel {question.level}
                              </span>
                              {!wasAnswered && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  No respondida
                                </span>
                              )}
                            </div>
                            
                            <p className="font-medium">{question.question}</p>
                            
                            {wasAnswered ? (
                              <div className="bg-accent/10 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Respuesta de audio del estudiante:</p>
                                <audio controls src={signedStudentAudio[question.id] || studentAnswer} className="w-full" />
                              </div>
                            ) : (
                              <div className="bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">El estudiante no respondió esta pregunta</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return null;
                })}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No hay preguntas disponibles en el test de nivelación.
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="border rounded-lg p-4 bg-accent/5">
              <h3 className="font-semibold mb-2">Instrucciones para Asignar Nivel</h3>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                <li>Revisa cuidadosamente todas las respuestas del estudiante arriba</li>
                <li>Evalúa la precisión gramatical y comprensión demostrada</li>
                <li>Considera tanto respuestas escritas como de audio si las hay</li>
                <li>Asigna el nivel apropiado basado en el rendimiento general</li>
              </ul>
            </div>

            {/* Level Assignment - Mobile Optimized */}
            <div className="space-y-4 p-4 bg-accent/10 rounded-lg">
              <h3 className="font-semibold text-lg">Asignar Nivel Final</h3>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level} className="h-12 text-lg">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecciona el nivel final después de revisar el examen
              </p>

              <div className="space-y-2">
                <Label htmlFor="initial-feedback">Comentario Inicial</Label>
                <Textarea
                  id="initial-feedback"
                  value={initialFeedback}
                  onChange={(e) => setInitialFeedback(e.target.value)}
                  placeholder="Describe las fortalezas, debilidades y razón de la asignación de nivel..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Este comentario será visible para el estudiante y explicará por qué comienza en este nivel
                </p>
              </div>
              
              {/* Mobile Actions */}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleAssignLevel}
                  disabled={!selectedLevel || assignLevelMutation.isPending}
                  className="w-full h-12 text-lg"
                >
                  {assignLevelMutation.isPending ? 'Asignando...' : 'Asignar Nivel'}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-12 text-lg">
                  Cancelar
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
