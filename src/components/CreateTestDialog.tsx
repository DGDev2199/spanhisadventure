import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Upload, Save, FolderOpen } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SaveAsTemplateDialog } from '@/components/SaveAsTemplateDialog';
import { LoadTemplateDialog } from '@/components/LoadTemplateDialog';

interface Question {
  question_type: 'multiple_choice' | 'true_false' | 'free_text' | 'text' | 'audio_listen' | 'audio_response';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  points: number;
  audio_url?: string;
}

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: any[];
}

export const CreateTestDialog = ({ open, onOpenChange, students }: CreateTestDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testType, setTestType] = useState<'regular' | 'final'>('regular');
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);

  const createTestMutation = useMutation({
    mutationFn: async () => {
      console.log('🧪 Creating test...', { title, questionsCount: questions.length, studentsCount: selectedStudents.length });
      
      if (!user?.id) throw new Error('No user');
      if (questions.length === 0) throw new Error('Add at least one question');
      if (selectedStudents.length === 0) throw new Error('Select at least one student');

      // Create test
      console.log('📝 Inserting test into database...');
      const { data: testData, error: testError } = await supabase
        .from('custom_tests')
        .insert({
          teacher_id: user.id,
          title,
          description,
          due_date: dueDate || null,
          time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
          test_type: testType,
        })
        .select()
        .single();

      if (testError) {
        console.error('❌ Error creating test:', testError);
        throw testError;
      }
      console.log('✅ Test created:', testData.id);

      // Create questions
      console.log('❓ Inserting questions...');
      const questionsToInsert = questions.map((q, index) => ({
        test_id: testData.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options ? { options: q.options } : null,
        correct_answer: q.correct_answer,
        points: q.points,
        order_number: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('❌ Error creating questions:', questionsError);
        throw questionsError;
      }
      console.log('✅ Questions created:', questionsToInsert.length);

      // Create assignments
      console.log('👥 Creating assignments for students...');
      const assignmentsToInsert = selectedStudents.map(studentId => ({
        test_id: testData.id,
        student_id: studentId,
      }));

      const { error: assignmentsError } = await supabase
        .from('test_assignments')
        .insert(assignmentsToInsert);

      if (assignmentsError) {
        console.error('❌ Error creating assignments:', assignmentsError);
        throw assignmentsError;
      }
      console.log('✅ Assignments created for', assignmentsToInsert.length, 'students');
      
      return testData.id;
    },
    onSuccess: (testId) => {
      console.log('✅ Test creation completed successfully!');
      if (testId) setCreatedTestId(testId);
      queryClient.invalidateQueries({ queryKey: ['teacher-tests'] });
      toast.success('¡Test creado y asignado exitosamente!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el test');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setTimeLimit('');
    setSelectedStudents([]);
    setQuestions([]);
    setTestType('regular');
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_type: 'multiple_choice',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex].options = options;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const { data: template, error: templateError } = await supabase
        .from('test_templates')
        .select('*, template_questions(*)')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      setTitle(template.title);
      setDescription(template.description || '');
      setTestType(template.test_type as 'regular' | 'final');
      setQuestions(template.template_questions.map((q: any) => ({
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points
      })));

      toast.success('Template cargado');
    } catch (error) {
      toast.error('Error al cargar template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Test</DialogTitle>
            <DialogDescription>
              Crea un test personalizado y asígnalo a tus estudiantes
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 px-6 pb-2">
            <Button variant="outline" size="sm" onClick={() => setShowLoadTemplate(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Cargar Template
            </Button>
            {createdTestId && (
              <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)}>
                <Save className="h-4 w-4 mr-2" />
                Guardar como Template
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="space-y-4">
            <div>
              <Label>Tipo de Test *</Label>
              <RadioGroup value={testType} onValueChange={(value: 'regular' | 'final') => setTestType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="regular" />
                  <Label htmlFor="regular" className="font-normal cursor-pointer">
                    Test Regular - Evaluación estándar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="final" id="final" />
                  <Label htmlFor="final" className="font-normal cursor-pointer">
                    Test Final - Permite reasignar nivel después de completarlo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Título del Test *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Quiz de Gramática - Unidad 3"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el contenido del test..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Entrega</Label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Límite de Tiempo (minutos)</Label>
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label>Asignar a Estudiantes *</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                {students.map((student) => (
                  <label key={student.user_id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.user_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.user_id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.user_id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{student.profiles?.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Preguntas</Label>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Pregunta
                </Button>
              </div>

              {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Tipo de Pregunta</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value: any) => updateQuestion(qIndex, 'question_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                            <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                            <SelectItem value="free_text">Texto Libre</SelectItem>
                            <SelectItem value="text">Texto Simple</SelectItem>
                            <SelectItem value="audio_listen">Audio - Escuchar y Escribir</SelectItem>
                            <SelectItem value="audio_response">Audio - Respuesta Oral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Pregunta *</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                          placeholder="Escribe tu pregunta aquí..."
                        />
                      </div>

                      {question.question_type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <Label>Opciones</Label>
                          {question.options?.map((option, oIndex) => (
                            <Input
                              key={oIndex}
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                            />
                          ))}
                        </div>
                      )}

                      {question.question_type === 'true_false' && (
                        <div>
                          <Label>Respuesta Correcta</Label>
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Verdadero</SelectItem>
                              <SelectItem value="false">Falso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <Label>Respuesta Correcta</Label>
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la opción correcta" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options?.map((_, oIndex) => (
                                <SelectItem key={oIndex} value={String.fromCharCode(65 + oIndex)}>
                                  Opción {String.fromCharCode(65 + oIndex)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(question.question_type === 'audio_listen' || question.question_type === 'audio_response') && (
                        <div>
                          <Label>Archivo de Audio</Label>
                          <Input
                            type="file"
                            accept="audio/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Upload to Supabase storage
                                  const fileName = `test-audio/${Date.now()}-${file.name}`;
                                  const { data, error } = await supabase.storage
                                    .from('student-audio-responses')
                                    .upload(fileName, file);
                                  
                                  if (error) throw error;
                                  
                                  // Get signed URL for playback
                                  const { data: urlData } = await supabase.storage
                                    .from('student-audio-responses')
                                    .createSignedUrl(fileName, 3600);
                                  
                                  // Update question with signed URL
                                  updateQuestion(qIndex, 'audio_url', urlData?.signedUrl || fileName);
                                  toast.success('Audio subido exitosamente');
                                } catch (error) {
                                  console.error('Error uploading audio:', error);
                                  toast.error('Error al subir audio');
                                }
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {question.question_type === 'audio_listen' 
                              ? 'Audio que el estudiante escuchará antes de responder'
                              : 'Opcional: audio de referencia para la pregunta'}
                          </p>
                          {question.audio_url && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs text-green-600">
                                ✓ Audio cargado
                              </p>
                              <audio controls className="w-full">
                                <source src={question.audio_url} type="audio/mpeg" />
                                Tu navegador no soporta el elemento de audio.
                              </audio>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label>Puntos</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}

              {questions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay preguntas aún. Haz clic en "Agregar Pregunta" para comenzar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons - Fixed at bottom */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={() => createTestMutation.mutate()}
            disabled={!title || questions.length === 0 || selectedStudents.length === 0 || createTestMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            {createTestMutation.isPending ? 'Creando...' : 'Crear y Asignar Test'}
          </Button>
        </div>
      </DialogContent>

      {createdTestId && (
        <SaveAsTemplateDialog
          open={showSaveTemplate}
          onOpenChange={setShowSaveTemplate}
          testId={createdTestId}
        />
      )}

      <LoadTemplateDialog
        open={showLoadTemplate}
        onOpenChange={setShowLoadTemplate}
        onSelectTemplate={loadTemplate}
      />
    </Dialog>
  );
};
