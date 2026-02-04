import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, BookOpen, Languages, MessageSquare, Save, UserPlus, User, Package, Shuffle, ListOrdered, CheckSquare, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useGenerateExercises, 
  useSaveExercise, 
  useGenerateRecommendedPack, 
  useSaveExercisePack,
  ExerciseContent, 
  ExerciseType,
  FlashcardContent, 
  ConjugationContent, 
  VocabularyContent, 
  SentenceOrderContent, 
  MultipleChoiceContent, 
  FillGapsContent, 
  ReadingContent,
  RecommendedPackResult,
} from '@/hooks/usePracticeExercises';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AssignExerciseDialog from './AssignExerciseDialog';
import PackPreview from './PackPreview';

interface GenerateExercisesDialogProps {
  open: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialVocabulary?: string;
  studentId?: string;
}

interface StudentWithProgress {
  id: string;
  name: string;
  email: string;
  level: string | null;
  latestClassTopics: string | null;
  latestVocabulary: string | null;
  currentWeek: number | null;
}

const exerciseTypes: { value: ExerciseType; label: string; icon: React.ComponentType<any>; description: string }[] = [
  { value: 'flashcard', label: 'Flashcards', icon: BookOpen, description: 'Tarjetas con imagen/texto y traducción' },
  { value: 'conjugation', label: 'Conjugación', icon: Languages, description: 'Ejercicios de conjugación verbal' },
  { value: 'vocabulary', label: 'Vocabulario', icon: MessageSquare, description: 'Completar oraciones y definiciones' },
  { value: 'sentence_order', label: 'Ordenar Frases', icon: ListOrdered, description: 'Ordenar palabras para formar oraciones' },
  { value: 'multiple_choice', label: 'Opción Múltiple', icon: CheckSquare, description: 'Preguntas de selección múltiple' },
  { value: 'fill_gaps', label: 'Completar Huecos', icon: Shuffle, description: 'Rellenar espacios en blanco' },
  { value: 'reading', label: 'Comprensión Lectora', icon: FileText, description: 'Lectura con preguntas de comprensión' },
];

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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
  
  const [exerciseType, setExerciseType] = useState<ExerciseType>('flashcard');
  const [topic, setTopic] = useState(initialTopic);
  const [vocabulary, setVocabulary] = useState(initialVocabulary);
  const [level, setLevel] = useState('A1');
  const [count, setCount] = useState(10);
  const [title, setTitle] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Single exercise state
  const [generatedContent, setGeneratedContent] = useState<ExerciseContent | null>(null);
  const [savedExerciseId, setSavedExerciseId] = useState<string | null>(null);
  
  // Pack state
  const [generatedPack, setGeneratedPack] = useState<RecommendedPackResult | null>(null);
  const [removedPackIndices, setRemovedPackIndices] = useState<Set<string>>(new Set());
  const [savedPackIds, setSavedPackIds] = useState<string[]>([]);
  
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [generatingPack, setGeneratingPack] = useState(false);

  // Fetch students with their progress data - FIXED QUERY
  const { data: studentsWithProgress, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-with-progress-fixed', user?.id],
    queryFn: async (): Promise<StudentWithProgress[]> => {
      if (!user) return [];

      // Get user's roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
      
      // Step 1: Get student_profiles based on role
      let studentProfilesQuery = supabase
        .from('student_profiles')
        .select('user_id, level, teacher_id, tutor_id')
        .eq('status', 'active');

      if (userRoles.includes('admin') || userRoles.includes('coordinator')) {
        // Admin/coordinator sees all active students
      } else if (userRoles.includes('teacher')) {
        studentProfilesQuery = studentProfilesQuery.eq('teacher_id', user.id);
      } else if (userRoles.includes('tutor')) {
        studentProfilesQuery = studentProfilesQuery.eq('tutor_id', user.id);
      } else {
        return []; // No valid role
      }

      const { data: studentProfiles, error: spError } = await studentProfilesQuery;
      
      if (spError) {
        console.error('Error fetching student profiles:', spError);
        return [];
      }

      if (!studentProfiles || studentProfiles.length === 0) {
        return [];
      }

      // Step 2: Get profiles for these students
      const userIds = studentProfiles.map(sp => sp.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Step 3: Create a map for quick profile lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Step 4: For each student, fetch their latest progress notes
      const studentsWithData: StudentWithProgress[] = await Promise.all(
        studentProfiles.map(async (sp) => {
          const profile = profileMap.get(sp.user_id);
          
          if (!profile) {
            return null;
          }

          // Get only the most recent progress week for this student
          const { data: progressWeeks } = await supabase
            .from('student_progress_weeks')
            .select('id, week_number')
            .eq('student_id', sp.user_id)
            .order('week_number', { ascending: false })
            .limit(1);

          let latestClassTopics: string | null = null;
          let latestVocabulary: string | null = null;
          let currentWeek: number | null = null;

          if (progressWeeks && progressWeeks.length > 0) {
            currentWeek = progressWeeks[0].week_number;
            
            // Get ONLY the most recent note with class_topics (last class day)
            const { data: latestNote } = await supabase
              .from('student_progress_notes')
              .select('class_topics, vocabulary')
              .eq('week_id', progressWeeks[0].id)
              .not('class_topics', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (latestNote && latestNote.length > 0) {
              // Use only the topics and vocabulary from the most recent class day
              latestClassTopics = latestNote[0].class_topics || null;
              latestVocabulary = latestNote[0].vocabulary || null;
            }
          }

          return {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            level: sp.level,
            latestClassTopics,
            latestVocabulary,
            currentWeek,
          };
        })
      );

      // Filter out nulls
      return studentsWithData.filter((s): s is StudentWithProgress => s !== null);
    },
    enabled: open && !!user,
  });

  // Handle student selection - auto-fill topic, vocabulary, and level
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    
    if (studentId && studentsWithProgress) {
      const student = studentsWithProgress.find(s => s.id === studentId);
      if (student) {
        // Auto-fill topic from class_topics
        if (student.latestClassTopics) {
          setTopic(student.latestClassTopics);
        }
        // Auto-fill vocabulary
        if (student.latestVocabulary) {
          setVocabulary(student.latestVocabulary);
        }
        // Auto-fill level
        if (student.level) {
          setLevel(student.level);
        }
        
        toast({
          title: 'Datos cargados',
          description: `Se han cargado los temas y nivel de ${student.name}`,
        });
      }
    }
  };

  // Reset selected student when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedStudentId('');
      setGeneratedContent(null);
      setSavedExerciseId(null);
      setGeneratedPack(null);
      setRemovedPackIndices(new Set());
      setSavedPackIds([]);
    }
  }, [open]);

  const generateMutation = useGenerateExercises();
  const saveMutation = useSaveExercise();
  const generatePackMutation = useGenerateRecommendedPack();
  const savePackMutation = useSaveExercisePack();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Tema requerido',
        description: 'Por favor ingresa un tema para generar los ejercicios.',
        variant: 'destructive',
      });
      return;
    }

    // Clear any previous pack
    setGeneratedPack(null);
    setRemovedPackIndices(new Set());
    setSavedPackIds([]);

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
        const typeLabel = exerciseTypes.find(t => t.value === exerciseType)?.label || exerciseType;
        setTitle(`${typeLabel}: ${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`);
      }

      toast({
        title: 'Ejercicios generados',
        description: `Se han generado ${count} ejercicios de ${exerciseType}.`,
      });
    } catch (error) {
      console.error('Error generating exercises:', error);
    }
  };

  const handleGenerateRecommendedPack = async () => {
    if (!selectedStudentId) {
      toast({
        title: 'Selecciona un estudiante',
        description: 'Debes seleccionar un estudiante para generar un pack recomendado.',
        variant: 'destructive',
      });
      return;
    }

    const student = studentsWithProgress?.find(s => s.id === selectedStudentId);
    if (!student) return;

    // Clear single exercise content
    setGeneratedContent(null);
    setSavedExerciseId(null);
    setRemovedPackIndices(new Set());
    setSavedPackIds([]);

    setGeneratingPack(true);

    try {
      const result = await generatePackMutation.mutateAsync({
        student_id: selectedStudentId,
        week_number: student.currentWeek || 1,
        class_topics: student.latestClassTopics || topic || 'Vocabulario general',
        vocabulary: student.latestVocabulary || vocabulary || '',
        level: student.level || level,
      });

      // Store the full pack
      setGeneratedPack(result);
      setTitle(result.pack_name || `Pack Semana ${student.currentWeek} - ${student.level}`);

      toast({
        title: 'Pack recomendado generado',
        description: `Se han generado ${result.total_exercises} ejercicios variados para ${student.name}.`,
      });
    } catch (error) {
      console.error('Error generating recommended pack:', error);
    } finally {
      setGeneratingPack(false);
    }
  };

  const handleRemovePackExercise = (typeIndex: number, exerciseIndex: number) => {
    const key = `${typeIndex}-${exerciseIndex}`;
    setRemovedPackIndices(prev => new Set(prev).add(key));
  };

  // Get filtered pack exercises (excluding removed ones)
  const getFilteredPackExercises = () => {
    if (!generatedPack) return [];
    
    return generatedPack.exercises.filter((exercise, typeIdx) => {
      // Check if all items in this exercise type are removed
      const itemCount = getExerciseItemCount(exercise);
      const allRemoved = Array.from({ length: itemCount }, (_, exIdx) => 
        removedPackIndices.has(`${typeIdx}-${exIdx}`)
      ).every(Boolean);
      
      return !allRemoved;
    }).map((exercise, originalTypeIdx) => {
      // Filter out removed items within each exercise
      return filterExerciseContent(exercise, originalTypeIdx, removedPackIndices);
    }).filter(ex => ex !== null) as Array<{ type: ExerciseType; content: ExerciseContent }>;
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

  const handleSavePack = async () => {
    if (!generatedPack || !user) return;

    const filteredExercises = getFilteredPackExercises();
    if (filteredExercises.length === 0) {
      toast({
        title: 'No hay ejercicios',
        description: 'Todos los ejercicios han sido eliminados del pack.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const savedIds = await savePackMutation.mutateAsync({
        pack_name: title || generatedPack.pack_name,
        exercises: filteredExercises,
        topic_context: topic,
        vocabulary_context: vocabulary || undefined,
        level,
        created_by: user.id,
      });

      setSavedPackIds(savedIds);
    } catch (error) {
      console.error('Error saving pack:', error);
    }
  };

  const handleAssignClick = () => {
    if (generatedPack) {
      // For pack: save first if not saved, then open assign dialog
      if (savedPackIds.length === 0) {
        handleSavePack().then(() => {
          setShowAssignDialog(true);
        });
      } else {
        setShowAssignDialog(true);
      }
    } else if (generatedContent) {
      // For single exercise: save first if not saved
      if (!savedExerciseId) {
        handleSave().then(() => {
          setShowAssignDialog(true);
        });
      } else {
        setShowAssignDialog(true);
      }
    }
  };

  const renderPreview = () => {
    if (!generatedContent) return null;

    // Flashcard preview
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

    // Conjugation preview
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
                    <p className="text-xs text-muted-foreground">Opciones: {(ex.options || []).join(', ')}</p>
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Vocabulary preview
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

    // Sentence Order preview
    if (exerciseType === 'sentence_order' && 'exercises' in generatedContent) {
      const content = generatedContent as SentenceOrderContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Palabras: {(ex.scrambled_words || []).join(' / ')}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_sentence}</p>
                    {ex.hint && <p className="text-xs text-muted-foreground italic">Pista: {ex.hint}</p>}
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Multiple Choice preview
    if (exerciseType === 'multiple_choice' && 'exercises' in generatedContent) {
      const content = generatedContent as MultipleChoiceContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.question}</p>
                    <p className="text-xs text-muted-foreground">Opciones: {(ex.options || []).join(' | ')}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Fill Gaps preview
    if (exerciseType === 'fill_gaps' && 'exercises' in generatedContent) {
      const content = generatedContent as FillGapsContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.sentence_with_gap}</p>
                    <p className="text-xs text-muted-foreground">Opciones: {(ex.options || []).join(' | ')}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
                  </div>
                  <Badge variant="outline">{idx + 1}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Reading Comprehension preview
    if (exerciseType === 'reading' && 'exercises' in generatedContent) {
      const content = generatedContent as ReadingContent;
      return (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {content.exercises.map((ex, idx) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ex.text.substring(0, 150)}...</p>
                    <p className="text-xs mt-1">{ex.questions.length} preguntas</p>
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
    setGeneratedPack(null);
    setRemovedPackIndices(new Set());
    setSavedPackIds([]);
    setTitle('');
    setTopic(initialTopic);
    setVocabulary(initialVocabulary);
    setSelectedStudentId('');
    onClose();
  };

  const hasPackContent = generatedPack && generatedPack.exercises.length > 0;
  const hasSingleContent = generatedContent !== null;

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
            {/* Student Selection - Auto-fill from progress */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Seleccionar Estudiante (opcional)
              </Label>
              <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargar datos del estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : studentsWithProgress && studentsWithProgress.length > 0 ? (
                    studentsWithProgress.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.level && (
                            <Badge variant="secondary" className="text-xs">
                              {student.level}
                            </Badge>
                          )}
                          {student.currentWeek && (
                            <Badge variant="outline" className="text-xs">
                              Sem. {student.currentWeek}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No hay estudiantes asignados
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Al seleccionar un estudiante, se cargarán automáticamente los temas practicados en clase, vocabulario y nivel.
              </p>
            </div>

            {/* Generate Recommended Pack Button */}
            {selectedStudentId && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleGenerateRecommendedPack}
                disabled={generatingPack || generatePackMutation.isPending}
              >
                {generatingPack || generatePackMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando pack...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Generar Pack Recomendado por IA
                  </>
                )}
              </Button>
            )}

            {/* Pack Preview */}
            {hasPackContent && (
              <div className="space-y-4">
                <PackPreview
                  packName={title || generatedPack.pack_name}
                  exercises={generatedPack.exercises}
                  estimatedTime={generatedPack.estimated_time_minutes}
                  removedIndices={removedPackIndices}
                  onRemoveExercise={handleRemovePackExercise}
                />

                {/* Pack Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleSavePack}
                    disabled={savePackMutation.isPending || savedPackIds.length > 0}
                  >
                    {savePackMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {savedPackIds.length > 0 ? `Guardados (${savedPackIds.length})` : 'Guardar Pack'}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAssignClick}
                    disabled={savePackMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar a Estudiante
                  </Button>
                </div>
              </div>
            )}

            {/* Single Exercise Generation (shown when no pack) */}
            {!hasPackContent && (
              <>
                {/* Exercise Type Selection */}
                <div className="space-y-2">
                  <Label>Tipo de Ejercicio</Label>
                  <div className="grid grid-cols-4 gap-2">
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
                          <span className="text-xs text-center">{type.label}</span>
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
                    <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} ejercicios</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título (opcional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Se generará automáticamente"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !topic.trim()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Ejercicios
                    </>
                  )}
                </Button>

                {/* Preview */}
                {hasSingleContent && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Vista Previa</Label>
                      <Badge>{exerciseTypes.find(t => t.value === exerciseType)?.label}</Badge>
                    </div>
                    {renderPreview()}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saveMutation.isPending || !!savedExerciseId}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {savedExerciseId ? 'Guardado' : 'Guardar'}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleAssignClick}
                        disabled={saveMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar a Estudiante
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Exercise Dialog */}
      <AssignExerciseDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        exerciseId={savedExerciseId || ''}
        exerciseIds={savedPackIds.length > 0 ? savedPackIds : undefined}
        defaultStudentId={selectedStudentId || undefined}
      />
    </>
  );
}

// Helper functions for pack exercise filtering
function getExerciseItemCount(exercise: { type: ExerciseType; content: ExerciseContent }): number {
  const { type, content } = exercise;
  
  if (type === 'flashcard' && 'cards' in content) {
    return (content as FlashcardContent).cards.length;
  }
  if ('exercises' in content) {
    return (content as any).exercises.length;
  }
  return 0;
}

function filterExerciseContent(
  exercise: { type: ExerciseType; content: ExerciseContent },
  typeIdx: number,
  removedIndices: Set<string>
): { type: ExerciseType; content: ExerciseContent } | null {
  const { type, content } = exercise;

  if (type === 'flashcard' && 'cards' in content) {
    const flashcardContent = content as FlashcardContent;
    const filteredCards = flashcardContent.cards.filter((_, idx) => 
      !removedIndices.has(`${typeIdx}-${idx}`)
    );
    if (filteredCards.length === 0) return null;
    return { type, content: { cards: filteredCards } };
  }

  if ('exercises' in content) {
    const exerciseContent = content as any;
    const filteredExercises = exerciseContent.exercises.filter((_: any, idx: number) => 
      !removedIndices.has(`${typeIdx}-${idx}`)
    );
    if (filteredExercises.length === 0) return null;
    return { type, content: { exercises: filteredExercises } };
  }

  return exercise;
}
