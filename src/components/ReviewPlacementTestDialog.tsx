import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // Fetch placement test questions
  const { data: questions } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['my-students'] });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Revisar Examen de Nivelación</DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
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

            {/* Student Answers Review */}
            {questions && studentAnswers && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Respuestas del Estudiante</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const studentAnswer = studentAnswers[question.id];
                    const isCorrect = studentAnswer === question.correct_answer;
                    const getOptionText = (letter: string) => {
                      switch(letter) {
                        case 'A': return question.option_a;
                        case 'B': return question.option_b;
                        case 'C': return question.option_c;
                        case 'D': return question.option_d;
                        default: return '';
                      }
                    };

                    return (
                      <div key={question.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Pregunta {index + 1} - Nivel {question.level}
                              </span>
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <p className="font-medium mb-3">{question.question}</p>
                            
                            <div className="space-y-2 text-sm">
                              <div className={`p-2 rounded ${
                                studentAnswer === 'A' 
                                  ? isCorrect 
                                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-600' 
                                    : 'bg-red-100 dark:bg-red-900/30 border border-red-600'
                                  : question.correct_answer === 'A'
                                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-400'
                                  : ''
                              }`}>
                                <span className="font-medium">A)</span> {question.option_a}
                                {studentAnswer === 'A' && !isCorrect && <span className="ml-2 text-red-600 font-semibold">(Seleccionada)</span>}
                                {question.correct_answer === 'A' && <span className="ml-2 text-green-600 font-semibold">(Correcta)</span>}
                              </div>
                              
                              <div className={`p-2 rounded ${
                                studentAnswer === 'B' 
                                  ? isCorrect 
                                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-600' 
                                    : 'bg-red-100 dark:bg-red-900/30 border border-red-600'
                                  : question.correct_answer === 'B'
                                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-400'
                                  : ''
                              }`}>
                                <span className="font-medium">B)</span> {question.option_b}
                                {studentAnswer === 'B' && !isCorrect && <span className="ml-2 text-red-600 font-semibold">(Seleccionada)</span>}
                                {question.correct_answer === 'B' && <span className="ml-2 text-green-600 font-semibold">(Correcta)</span>}
                              </div>
                              
                              <div className={`p-2 rounded ${
                                studentAnswer === 'C' 
                                  ? isCorrect 
                                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-600' 
                                    : 'bg-red-100 dark:bg-red-900/30 border border-red-600'
                                  : question.correct_answer === 'C'
                                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-400'
                                  : ''
                              }`}>
                                <span className="font-medium">C)</span> {question.option_c}
                                {studentAnswer === 'C' && !isCorrect && <span className="ml-2 text-red-600 font-semibold">(Seleccionada)</span>}
                                {question.correct_answer === 'C' && <span className="ml-2 text-green-600 font-semibold">(Correcta)</span>}
                              </div>
                              
                              <div className={`p-2 rounded ${
                                studentAnswer === 'D' 
                                  ? isCorrect 
                                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-600' 
                                    : 'bg-red-100 dark:bg-red-900/30 border border-red-600'
                                  : question.correct_answer === 'D'
                                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-400'
                                  : ''
                              }`}>
                                <span className="font-medium">D)</span> {question.option_d}
                                {studentAnswer === 'D' && !isCorrect && <span className="ml-2 text-red-600 font-semibold">(Seleccionada)</span>}
                                {question.correct_answer === 'D' && <span className="ml-2 text-green-600 font-semibold">(Correcta)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
}
