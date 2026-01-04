import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Trash2, 
  Save,
  ClipboardList,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_type: 'multiple_choice' | 'true_false' | 'free_text';
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
}

interface CreateTopicReevaluationTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicName: string;
}

export const CreateTopicReevaluationTestDialog = ({
  open,
  onOpenChange,
  topicId,
  topicName,
}: CreateTopicReevaluationTestDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(`Reevaluación: ${topicName}`);
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New question form state
  const [newQuestionType, setNewQuestionType] = useState<'multiple_choice' | 'true_false' | 'free_text'>('multiple_choice');
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");
  const [newPoints, setNewPoints] = useState(1);

  const addQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error("La pregunta no puede estar vacía");
      return;
    }

    if (newQuestionType === 'multiple_choice') {
      const validOptions = newOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast.error("Agrega al menos 2 opciones");
        return;
      }
      if (!newCorrectAnswer) {
        toast.error("Selecciona la respuesta correcta");
        return;
      }
    }

    const question: Question = {
      id: crypto.randomUUID(),
      question_type: newQuestionType,
      question_text: newQuestionText,
      options: newQuestionType === 'multiple_choice' ? newOptions.filter(o => o.trim()) : [],
      correct_answer: newQuestionType === 'free_text' ? '' : newCorrectAnswer,
      points: newPoints,
    };

    setQuestions([...questions, question]);
    
    // Reset form
    setNewQuestionText("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectAnswer("");
    setNewPoints(1);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      if (questions.length === 0) throw new Error("Agrega al menos una pregunta");

      // Create test
      const { data: testData, error: testError } = await supabase
        .from('topic_reevaluation_tests')
        .insert({
          topic_id: topicId,
          title,
          description: description || null,
          time_limit_minutes: timeLimit || null,
          passing_score: passingScore,
          created_by: user.id,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        test_id: testData.id,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.question_type === 'multiple_choice' ? { options: q.options } : null,
        correct_answer: q.correct_answer || null,
        points: q.points,
        order_number: index,
      }));

      const { error: questionsError } = await supabase
        .from('topic_reevaluation_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      return testData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-reevaluation-test'] });
      toast.success("Examen de reevaluación creado exitosamente");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear el examen");
    },
  });

  const resetForm = () => {
    setTitle(`Reevaluación: ${topicName}`);
    setDescription("");
    setTimeLimit(undefined);
    setPassingScore(70);
    setQuestions([]);
    setNewQuestionText("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectAnswer("");
    setNewPoints(1);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("El título es requerido");
      return;
    }
    if (questions.length === 0) {
      toast.error("Agrega al menos una pregunta");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Crear Examen de Reevaluación - {topicName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Test info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título del examen</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del examen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porcentaje mínimo para aprobar</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del examen..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tiempo límite (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={timeLimit || ""}
                    onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Sin límite"
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
              </div>
            </div>

            {/* Questions list */}
            {questions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Preguntas ({questions.length})</h3>
                <div className="space-y-2">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-3 border rounded-lg bg-muted/30 flex items-start gap-3"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {index + 1}. {q.question_text}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {q.points} pts
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {q.question_type === 'multiple_choice' && 'Opción múltiple'}
                          {q.question_type === 'true_false' && 'Verdadero/Falso'}
                          {q.question_type === 'free_text' && 'Respuesta libre'}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add question form */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar pregunta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de pregunta</Label>
                  <Select value={newQuestionType} onValueChange={(v: any) => setNewQuestionType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Opción múltiple</SelectItem>
                      <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                      <SelectItem value="free_text">Respuesta libre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puntos</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto de la pregunta</Label>
                <Textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Escribe la pregunta..."
                  rows={2}
                />
              </div>

              {newQuestionType === 'multiple_choice' && (
                <div className="space-y-3">
                  <Label>Opciones</Label>
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-6">
                        {String.fromCharCode(65 + index)})
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[index] = e.target.value;
                          setNewOptions(updated);
                        }}
                        placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label>Respuesta correcta</Label>
                    <Select value={newCorrectAnswer} onValueChange={setNewCorrectAnswer}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {newOptions.map((_, index) => (
                          <SelectItem key={index} value={String.fromCharCode(65 + index)}>
                            {String.fromCharCode(65 + index)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {newQuestionType === 'true_false' && (
                <div className="space-y-2">
                  <Label>Respuesta correcta</Label>
                  <Select value={newCorrectAnswer} onValueChange={setNewCorrectAnswer}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Verdadero</SelectItem>
                      <SelectItem value="false">Falso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={addQuestion} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar pregunta
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || questions.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Guardando..." : "Guardar examen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
