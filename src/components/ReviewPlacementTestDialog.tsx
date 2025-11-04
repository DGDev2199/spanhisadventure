import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedLevel(currentLevel || '');
  }, [currentLevel]);

  // Fetch placement test questions - ONLY text-based multiple choice questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['placement-test-questions-text-only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .eq('question_type', 'text') // Only get multiple choice questions
        .order('level', { ascending: true })
        .order('question_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const assignLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      console.log('Assigning level:', { level, studentId });
      
      const { data, error } = await supabase
        .from('student_profiles')
        .update({
          level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
          placement_test_status: 'completed' as const,
          placement_test_oral_completed: true
        })
        .eq('user_id', studentId)
        .select();

      if (error) {
        console.error('Error assigning level:', error);
        throw error;
      }
      
      console.log('Level assigned successfully:', data);
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
    assignLevelMutation.mutate(selectedLevel);
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
                📝 Este modal muestra solo las <strong>preguntas de opción múltiple</strong> del test escrito. 
                Las preguntas de audio y respuestas grabadas se revisan durante la entrevista oral.
              </AlertDescription>
            </Alert>

            {/* Questions and Answers Review */}
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : questions && questions.length > 0 ? (
              <div className="space-y-4">
                {!studentAnswers || Object.keys(studentAnswers).length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      El estudiante aún no ha completado el test o las respuestas no están disponibles.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg">
                      Respuestas de Opción Múltiple ({Object.keys(studentAnswers).length} preguntas respondidas)
                    </h3>
                    {questions
                      .filter(question => studentAnswers[question.id] !== undefined) // Solo preguntas respondidas
                      .map((question, index) => {
                  const studentAnswer = studentAnswers?.[question.id];
                  const isCorrect = studentAnswer?.toLowerCase() === question.correct_answer?.toLowerCase();
                  
                  return (
                    <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Pregunta {index + 1}
                              </span>
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                Nivel {question.level}
                              </span>
                            </div>
                            
                            <p className="font-medium">{question.question}</p>
                            
                             <div className="grid grid-cols-1 gap-2 text-sm">
                              <div className={`p-2 rounded ${
                                question.correct_answer?.toLowerCase() === 'a'
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toLowerCase() === 'a'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">A)</span> {question.option_a}
                              </div>
                              <div className={`p-2 rounded ${
                                question.correct_answer?.toLowerCase() === 'b'
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toLowerCase() === 'b'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">B)</span> {question.option_b}
                              </div>
                              <div className={`p-2 rounded ${
                                question.correct_answer?.toLowerCase() === 'c'
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toLowerCase() === 'c'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">C)</span> {question.option_c}
                              </div>
                              <div className={`p-2 rounded ${
                                question.correct_answer?.toLowerCase() === 'd'
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toLowerCase() === 'd'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">D)</span> {question.option_d}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm pt-2">
                              <div>
                                <span className="text-muted-foreground">Respuesta del estudiante: </span>
                                <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {studentAnswer ? getOptionLabel(studentAnswer) : 'No respondió'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Respuesta correcta: </span>
                                <span className="font-semibold text-green-600">
                                  {getOptionLabel(question.correct_answer)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                      );
                    })}
                  </>
                )}
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
