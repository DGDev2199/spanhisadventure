import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Upload, Volume2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManagePlacementTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Question {
  id?: string;
  question: string;
  question_type: 'text' | 'audio_response' | 'audio_listen';
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  audio_url?: string;
  level: string;
  question_number: number;
}

export function ManagePlacementTestDialog({ open, onOpenChange }: ManagePlacementTestDialogProps) {
  const queryClient = useQueryClient();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['placement-test-questions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .order('level', { ascending: true })
        .order('question_number', { ascending: true });
      if (error) throw error;
      return data.map(q => ({
        ...q,
        question_type: q.question_type || 'text'
      })) as Question[];
    },
    enabled: open
  });

  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);

  React.useEffect(() => {
    if (questions) {
      setEditingQuestions(questions);
    }
  }, [questions]);

  const saveQuestionsMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing questions
      const { error: deleteError } = await supabase
        .from('placement_tests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new questions
      const questionsToInsert = editingQuestions.map((q, index) => ({
        question: q.question,
        question_type: q.question_type,
        option_a: q.option_a || null,
        option_b: q.option_b || null,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_answer: q.correct_answer ? q.correct_answer.toUpperCase() : null,
        audio_url: q.audio_url || null,
        level: q.level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
        question_number: index + 1,
      }));

      const { error: insertError } = await supabase
        .from('placement_tests')
        .insert(questionsToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-test-questions-admin'] });
      toast.success('Test de nivelación actualizado');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const uploadAudio = async (file: File, questionIndex: number) => {
    setUploadingAudio(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `question_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-audio-responses')
        .upload(`placement-questions/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-audio-responses')
        .getPublicUrl(`placement-questions/${fileName}`);

      updateQuestion(questionIndex, 'audio_url', publicUrl);
      toast.success('Audio subido exitosamente');
    } catch (error: any) {
      toast.error(`Error al subir audio: ${error.message}`);
    } finally {
      setUploadingAudio(false);
      setAudioFile(null);
    }
  };

  const addQuestion = () => {
    setEditingQuestions([
      ...editingQuestions,
      {
        question: '',
        question_type: 'text',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        level: 'A1',
        question_number: editingQuestions.length + 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setEditingQuestions(editingQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...editingQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditingQuestions(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-2xl md:max-w-5xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Gestionar Test de Nivelación</DialogTitle>
          <DialogDescription className="text-sm">
            Agrega, edita o elimina preguntas del test de nivelación. Soporta preguntas de texto, audio y escucha.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 -mx-6">
          <div className="space-y-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="bg-accent/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1">📝 Instrucciones:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Puedes agregar, editar o eliminar preguntas</li>
                    <li>• Cada pregunta puede ser de tipo Texto, Audio Response o Audio Listen</li>
                    <li>• Asegúrate de asignar el nivel correcto (A1-C2) a cada pregunta</li>
                  </ul>
                </div>

                {editingQuestions.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground mb-4">No hay preguntas en el test</p>
                    <Button onClick={addQuestion} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Primera Pregunta
                    </Button>
                  </div>
                ) : (
                  editingQuestions.map((question, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6 space-y-4">
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          Pregunta #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-4 pt-8">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nivel</Label>
                              <Select
                                value={question.level}
                                onValueChange={(value) => updateQuestion(index, 'level', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {level}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Tipo de Pregunta</Label>
                              <Select
                                value={question.question_type}
                                onValueChange={(value: any) => updateQuestion(index, 'question_type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto - Opción Múltiple</SelectItem>
                                  <SelectItem value="audio_response">Responder en Audio</SelectItem>
                                  <SelectItem value="audio_listen">Escuchar y Escribir</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Pregunta</Label>
                            <Textarea
                              value={question.question}
                              onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                              placeholder="Escribe la pregunta..."
                            />
                          </div>

                          {question.question_type === 'text' && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Opción A</Label>
                                  <Input
                                    value={question.option_a}
                                    onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Opción B</Label>
                                  <Input
                                    value={question.option_b}
                                    onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Opción C</Label>
                                  <Input
                                    value={question.option_c}
                                    onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Opción D</Label>
                                  <Input
                                    value={question.option_d}
                                    onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Respuesta Correcta</Label>
                                <Select
                                  value={question.correct_answer}
                                  onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          {question.question_type === 'audio_listen' && (
                            <div className="space-y-2">
                              <Label>Audio de la Pregunta</Label>
                              {question.audio_url ? (
                                <div className="flex items-center gap-2">
                                  <audio controls src={question.audio_url} className="flex-1" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuestion(index, 'audio_url', null)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadAudio(file, index);
                                    }}
                                    disabled={uploadingAudio}
                                  />
                                  <Upload className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          )}

                          {question.question_type === 'audio_response' && (
                            <p className="text-sm text-muted-foreground italic">
                              El estudiante grabará su respuesta en audio
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}

                {editingQuestions.length > 0 && (
                  <Button onClick={addQuestion} variant="outline" className="w-full" size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Pregunta
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row justify-between gap-3 px-6 pb-6 pt-4 border-t bg-background">
          <div className="text-xs text-muted-foreground self-center">
            {editingQuestions.length} pregunta{editingQuestions.length !== 1 ? 's' : ''} en total
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={() => saveQuestionsMutation.mutate()}
              disabled={saveQuestionsMutation.isPending || uploadingAudio || editingQuestions.length === 0}
              className="w-full sm:w-auto"
            >
              {saveQuestionsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
