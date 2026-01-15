import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, BookOpen, Languages, MessageSquare, Save, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerateExercises, useSaveExercise, ExerciseContent, FlashcardContent, ConjugationContent, VocabularyContent } from '@/hooks/usePracticeExercises';
import { useToast } from '@/hooks/use-toast';
import AssignExerciseDialog from './AssignExerciseDialog';

interface GenerateExercisesDialogProps {
  open: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialVocabulary?: string;
  studentId?: string;
}

const exerciseTypes = [
  { value: 'flashcard', label: 'Flashcards', icon: BookOpen, description: 'Tarjetas con imagen/texto y traducción' },
  { value: 'conjugation', label: 'Conjugación', icon: Languages, description: 'Ejercicios de conjugación verbal' },
  { value: 'vocabulary', label: 'Vocabulario', icon: MessageSquare, description: 'Completar oraciones y definiciones' },
] as const;

const levels = ['A1', 'A2', 'B1', 'B2'];

export default function GenerateExercisesDialog({
  open,
  onClose,
  initialTopic = '',
  initialVocabulary = '',
  studentId,
}: GenerateExercisesDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [exerciseType, setExerciseType] = useState<'flashcard' | 'conjugation' | 'vocabulary'>('flashcard');
  const [topic, setTopic] = useState(initialTopic);
  const [vocabulary, setVocabulary] = useState(initialVocabulary);
  const [level, setLevel] = useState('A1');
  const [count, setCount] = useState(10);
  const [title, setTitle] = useState('');
  
  const [generatedContent, setGeneratedContent] = useState<ExerciseContent | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [savedExerciseId, setSavedExerciseId] = useState<string | null>(null);

  const generateMutation = useGenerateExercises();
  const saveMutation = useSaveExercise();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Tema requerido',
        description: 'Por favor ingresa un tema para generar los ejercicios.',
        variant: 'destructive',
      });
      return;
    }

    const vocabularyArray = vocabulary
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    try {
      const result = await generateMutation.mutateAsync({
        exercise_type: exerciseType,
        topic,
        vocabulary: vocabularyArray,
        count,
        level,
      });

      setGeneratedContent(result.content);
      if (!title) {
        setTitle(`${exerciseType === 'flashcard' ? 'Flashcards' : exerciseType === 'conjugation' ? 'Conjugación' : 'Vocabulario'}: ${topic}`);
      }

      toast({
        title: 'Ejercicios generados',
        description: `Se han generado ${count} ejercicios de ${exerciseType}.`,
      });
    } catch (error) {
      console.error('Error generating exercises:', error);
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !user) return;

    try {
      const result = await saveMutation.mutateAsync({
        title: title || `Ejercicio de ${exerciseType}`,
        exercise_type: exerciseType,
        topic_context: topic,
        vocabulary_context: vocabulary || undefined,
        level,
        content: generatedContent,
        created_by: user.id,
      });

      setSavedExerciseId(result.id);
      toast({
        title: 'Ejercicio guardado',
        description: 'Puedes asignarlo a estudiantes o usarlo en sesiones presenciales.',
      });
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleAssignClick = () => {
    if (!savedExerciseId && generatedContent) {
      // Save first, then open assign dialog
      handleSave().then(() => {
        setShowAssignDialog(true);
      });
    } else if (savedExerciseId) {
      setShowAssignDialog(true);
    }
  };

  const renderPreview = () => {
    if (!generatedContent) return null;

    if (exerciseType === 'flashcard' && 'cards' in generatedContent) {
      const content = generatedContent as FlashcardContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.cards.map((card, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Frente: {card.front}</p>
                    <p className="text-sm text-muted-foreground">Reverso: {card.back}</p>
                    {card.hint && <p className="text-xs text-muted-foreground italic">Pista: {card.hint}</p>}
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (exerciseType === 'conjugation' && 'exercises' in generatedContent) {
      const content = generatedContent as ConjugationContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.verb} ({ex.tense}) - {ex.subject}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
                    <p className="text-xs text-muted-foreground">Opciones: {ex.options.join(', ')}</p>
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (exerciseType === 'vocabulary' && 'exercises' in generatedContent) {
      const content = generatedContent as VocabularyContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.word}</p>
                    <p className="text-sm text-muted-foreground">{ex.definition}</p>
                    <p className="text-sm italic">{ex.sentence_blank}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return null;
  };

  const resetAndClose = () => {
    setGeneratedContent(null);
    setSavedExerciseId(null);
    setTitle('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetAndClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generar Ejercicios con IA
            </DialogTitle>
            <DialogDescription>
              Genera ejercicios prácticos automáticamente basados en el tema y vocabulario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Exercise Type Selection */}
            <div className="space-y-2">
              <Label>Tipo de Ejercicio</Label>
              <div className="grid grid-cols-3 gap-2">
                {exerciseTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={exerciseType === type.value ? 'default' : 'outline'}
                      className="h-auto flex-col py-3 px-2"
                      onClick={() => setExerciseType(type.value)}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {exerciseTypes.find(t => t.value === exerciseType)?.description}
              </p>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Tema *</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Pretérito indefinido, La familia..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vocabulary">Vocabulario (opcional, separado por comas)</Label>
              <Textarea
                id="vocabulary"
                value={vocabulary}
                onChange={(e) => setVocabulary(e.target.value)}
                placeholder="hablar, comer, vivir, estudiar..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Cantidad de ejercicios</Label>
                <Input
                  id="count"
                  type="number"
                  min={5}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Se genera automáticamente"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !topic.trim()}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Ejercicios
                </>
              )}
            </Button>

            {/* Preview */}
            {generatedContent && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vista Previa</h4>
                  <Badge variant="secondary">
                    {exerciseType === 'flashcard' && 'cards' in generatedContent 
                      ? `${(generatedContent as FlashcardContent).cards.length} tarjetas`
                      : 'exercises' in generatedContent
                      ? `${((generatedContent as ConjugationContent | VocabularyContent).exercises).length} ejercicios`
                      : ''}
                  </Badge>
                </div>
                
                {renderPreview()}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !!savedExerciseId}
                    className="flex-1"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {savedExerciseId ? 'Guardado' : 'Guardar'}
                  </Button>
                  <Button
                    onClick={handleAssignClick}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar a Estudiante
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {savedExerciseId && (
        <AssignExerciseDialog
          open={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          exerciseId={savedExerciseId}
          defaultStudentId={studentId}
        />
      )}
    </>
  );
}
