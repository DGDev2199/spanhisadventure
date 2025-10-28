import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Fetch placement test questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['placement-test-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .order('level', { ascending: true })
        .order('question_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const assignLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          level: level as any,
          placement_test_status: 'completed',
          placement_test_oral_completed: true
        })
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      toast.success('Nivel asignado exitosamente');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al asignar nivel');
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisar Examen de Nivelación</DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
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

            {/* Questions and Answers Review */}
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : questions && studentAnswers ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Respuestas del Estudiante</h3>
                {questions.map((question, index) => {
                  const studentAnswer = studentAnswers[question.id];
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
                                getOptionLabel(question.correct_answer) === 'A' 
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toUpperCase() === 'A'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">A)</span> {question.option_a}
                              </div>
                              <div className={`p-2 rounded ${
                                getOptionLabel(question.correct_answer) === 'B' 
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toUpperCase() === 'B'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">B)</span> {question.option_b}
                              </div>
                              <div className={`p-2 rounded ${
                                getOptionLabel(question.correct_answer) === 'C' 
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toUpperCase() === 'C'
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-muted/50'
                              }`}>
                                <span className="font-medium">C)</span> {question.option_c}
                              </div>
                              <div className={`p-2 rounded ${
                                getOptionLabel(question.correct_answer) === 'D' 
                                  ? 'bg-green-50 border border-green-200' 
                                  : studentAnswer?.toUpperCase() === 'D'
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
              </div>
            ) : null}

            {/* Oral Test Guide */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Descarga la guía del examen oral para completar la evaluación
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/Examen_de_nivelación.pdf', '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Guía
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Instrucciones para la Evaluación Oral</h3>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                <li>Descarga y revisa el protocolo del examen oral</li>
                <li>Realiza el examen oral siguiendo las instrucciones del PDF</li>
                <li>Evalúa al estudiante en diferentes áreas: gramática, fluidez, comprensión</li>
                <li>Combina el resultado del test escrito con tu evaluación oral</li>
                <li>Asigna el nivel apropiado basado en ambas evaluaciones</li>
              </ul>
            </div>

            {/* Level Assignment */}
            <div className="space-y-3">
              <Label htmlFor="level-select">Asignar Nivel Final</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger id="level-select">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona el nivel final después de revisar tanto el examen escrito como el oral
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background border-t mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAssignLevel}
                disabled={!selectedLevel || assignLevelMutation.isPending}
              >
                {assignLevelMutation.isPending ? 'Asignando...' : 'Asignar Nivel'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
