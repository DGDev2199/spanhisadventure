import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, BookOpen, Languages, MessageSquare, Plus, Play, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeExercises, PracticeExercise } from '@/hooks/usePracticeExercises';
import GenerateExercisesDialog from './GenerateExercisesDialog';
import PracticeExerciseView from './PracticeExerciseView';
import AssignExerciseDialog from './AssignExerciseDialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PracticeSessionPanelProps {
  studentId?: string;
  initialTopic?: string;
  initialVocabulary?: string;
}

export default function PracticeSessionPanel({
  studentId,
  initialTopic,
  initialVocabulary,
}: PracticeSessionPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<PracticeExercise | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [exerciseToAssign, setExerciseToAssign] = useState<string | null>(null);

  const { data: exercises, isLoading } = usePracticeExercises(user?.id);

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'flashcard':
        return <BookOpen className="h-4 w-4" />;
      case 'conjugation':
        return <Languages className="h-4 w-4" />;
      case 'vocabulary':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getExerciseLabel = (type: string) => {
    switch (type) {
      case 'flashcard':
        return 'Flashcards';
      case 'conjugation':
        return 'Conjugación';
      case 'vocabulary':
        return 'Vocabulario';
      default:
        return type;
    }
  };

  const getExerciseCount = (exercise: PracticeExercise) => {
    if ('cards' in exercise.content) {
      return (exercise.content as any).cards.length;
    }
    if ('exercises' in exercise.content) {
      return (exercise.content as any).exercises.length;
    }
    return 0;
  };

  const handleAssign = (exerciseId: string) => {
    setExerciseToAssign(exerciseId);
    setShowAssignDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ejercicios Prácticos
          </CardTitle>
          <Button onClick={() => setShowGenerateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generar con IA
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
              <TabsTrigger value="conjugation">Conjugación</TabsTrigger>
              <TabsTrigger value="vocabulary">Vocabulario</TabsTrigger>
            </TabsList>

            {['all', 'flashcard', 'conjugation', 'vocabulary'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[300px]">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando ejercicios...
                    </div>
                  ) : exercises?.filter(e => tab === 'all' || e.exercise_type === tab).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay ejercicios todavía</p>
                      <Button
                        variant="link"
                        onClick={() => setShowGenerateDialog(true)}
                        className="mt-2"
                      >
                        Generar tu primer ejercicio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exercises
                        ?.filter(e => tab === 'all' || e.exercise_type === tab)
                        .map((exercise) => (
                          <Card key={exercise.id} className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getExerciseIcon(exercise.exercise_type)}
                                    <h4 className="font-medium truncate">{exercise.title}</h4>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {getExerciseLabel(exercise.exercise_type)}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(exercise.created_at), {
                                        addSuffix: true,
                                        locale: es,
                                      })}
                                    </span>
                                    <span>{getExerciseCount(exercise)} items</span>
                                    {exercise.level && (
                                      <Badge variant="secondary" className="text-xs">
                                        {exercise.level}
                                      </Badge>
                                    )}
                                  </div>
                                  {exercise.topic_context && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      Tema: {exercise.topic_context}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssign(exercise.id)}
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedExercise(exercise)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <GenerateExercisesDialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        initialTopic={initialTopic}
        initialVocabulary={initialVocabulary}
        studentId={studentId}
      />

      {selectedExercise && (
        <PracticeExerciseView
          open={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          exercise={selectedExercise}
        />
      )}

      {exerciseToAssign && (
        <AssignExerciseDialog
          open={showAssignDialog}
          onClose={() => {
            setShowAssignDialog(false);
            setExerciseToAssign(null);
          }}
          exerciseId={exerciseToAssign}
          defaultStudentId={studentId}
        />
      )}
    </>
  );
}
