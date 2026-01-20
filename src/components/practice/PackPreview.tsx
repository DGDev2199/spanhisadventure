import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, ChevronDown, ChevronRight, BookOpen, Languages, MessageSquare, ListOrdered, CheckSquare, Shuffle, FileText, Package, Clock } from 'lucide-react';
import { 
  ExerciseType, 
  ExerciseContent, 
  FlashcardContent, 
  ConjugationContent, 
  VocabularyContent, 
  SentenceOrderContent, 
  MultipleChoiceContent, 
  FillGapsContent, 
  ReadingContent 
} from '@/hooks/usePracticeExercises';

interface PackExercise {
  type: ExerciseType;
  content: ExerciseContent;
}

interface PackPreviewProps {
  packName: string;
  exercises: PackExercise[];
  estimatedTime?: number;
  removedIndices: Set<string>;
  onRemoveExercise: (typeIndex: number, exerciseIndex: number) => void;
}

const exerciseTypeConfig: Record<ExerciseType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  flashcard: { label: 'Flashcards', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  conjugation: { label: 'Conjugación', icon: Languages, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  vocabulary: { label: 'Vocabulario', icon: MessageSquare, color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  sentence_order: { label: 'Ordenar Frases', icon: ListOrdered, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  multiple_choice: { label: 'Opción Múltiple', icon: CheckSquare, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  fill_gaps: { label: 'Completar Huecos', icon: Shuffle, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  reading: { label: 'Comprensión Lectora', icon: FileText, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

function getExerciseItems(exercise: PackExercise): Array<{ key: string; preview: React.ReactNode }> {
  const { type, content } = exercise;

  // Guard against undefined or null content
  if (!content || typeof content !== 'object') {
    console.warn('PackPreview: Invalid content for exercise type', type, content);
    return [];
  }

  if (type === 'flashcard' && 'cards' in content) {
    const cards = (content as FlashcardContent).cards;
    if (!Array.isArray(cards)) return [];
    return cards.map((card, idx) => ({
      key: `card-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm"><span className="font-medium">Frente:</span> {card.front}</p>
          <p className="text-sm text-muted-foreground"><span className="font-medium">Reverso:</span> {card.back}</p>
          {card.hint && <p className="text-xs text-muted-foreground italic">Pista: {card.hint}</p>}
        </div>
      ),
    }));
  }

  if (type === 'conjugation' && 'exercises' in content) {
    const exercises = (content as ConjugationContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `conj-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">{ex.verb} ({ex.tense}) - {ex.subject}</p>
          <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
        </div>
      ),
    }));
  }

  if (type === 'vocabulary' && 'exercises' in content) {
    const exercises = (content as VocabularyContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `vocab-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">{ex.word}</p>
          <p className="text-sm text-muted-foreground">{ex.definition}</p>
          <p className="text-xs text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
        </div>
      ),
    }));
  }

  if (type === 'sentence_order' && 'exercises' in content) {
    const exercises = (content as SentenceOrderContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `order-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">Palabras: {Array.isArray(ex.scrambled_words) ? ex.scrambled_words.join(' / ') : ''}</p>
          <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_sentence}</p>
        </div>
      ),
    }));
  }

  if (type === 'multiple_choice' && 'exercises' in content) {
    const exercises = (content as MultipleChoiceContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `mc-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">{ex.question}</p>
          <p className="text-xs text-muted-foreground">Opciones: {Array.isArray(ex.options) ? ex.options.join(' | ') : ''}</p>
          <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
        </div>
      ),
    }));
  }

  if (type === 'fill_gaps' && 'exercises' in content) {
    const exercises = (content as FillGapsContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `fill-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">{ex.sentence_with_gap}</p>
          <p className="text-sm text-green-600 dark:text-green-400">✓ {ex.correct_answer}</p>
        </div>
      ),
    }));
  }

  if (type === 'reading' && 'exercises' in content) {
    const exercises = (content as ReadingContent).exercises;
    if (!Array.isArray(exercises)) return [];
    return exercises.map((ex, idx) => ({
      key: `read-${idx}`,
      preview: (
        <div className="flex-1">
          <p className="text-sm font-medium">{ex.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{ex.text?.substring(0, 100) || ''}...</p>
          <p className="text-xs mt-1">{ex.questions?.length || 0} preguntas</p>
        </div>
      ),
    }));
  }

  return [];
}

export default function PackPreview({
  packName,
  exercises,
  estimatedTime,
  removedIndices,
  onRemoveExercise,
}: PackPreviewProps) {
  // Filter out invalid exercises first - memoize to ensure consistent reference
  const validExercises = React.useMemo(() => 
    (exercises || []).filter(ex => ex && ex.type && ex.content),
    [exercises]
  );
  
  // useState must be called before any early returns
  const [openSections, setOpenSections] = React.useState<Set<number>>(new Set());
  
  // Update open sections when validExercises changes
  React.useEffect(() => {
    setOpenSections(new Set(validExercises.map((_, i) => i)));
  }, [validExercises.length]);

  // If no valid exercises, show a message
  if (validExercises.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay ejercicios para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Count total active exercises
  const totalActiveExercises = validExercises.reduce((total, exercise, typeIdx) => {
    const items = getExerciseItems(exercise);
    const activeItems = items.filter((_, exIdx) => !removedIndices.has(`${typeIdx}-${exIdx}`));
    return total + activeItems.length;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Pack Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">{packName}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Total: {totalActiveExercises} ejercicios</span>
                  {estimatedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{estimatedTime} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Sections */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {validExercises.map((exercise, typeIdx) => {
          const config = exerciseTypeConfig[exercise.type];
          const Icon = config.icon;
          const items = getExerciseItems(exercise);
          const activeItems = items.filter((_, exIdx) => !removedIndices.has(`${typeIdx}-${exIdx}`));
          const isOpen = openSections.has(typeIdx);

          if (activeItems.length === 0) return null;

          return (
            <Collapsible key={typeIdx} open={isOpen} onOpenChange={() => toggleSection(typeIdx)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-between h-auto py-3 px-4 ${config.color}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {activeItems.length}
                    </Badge>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 pl-2">
                {items.map((item, exIdx) => {
                  const isRemoved = removedIndices.has(`${typeIdx}-${exIdx}`);
                  if (isRemoved) return null;

                  return (
                    <Card key={item.key} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {item.preview}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveExercise(typeIdx, exIdx);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
