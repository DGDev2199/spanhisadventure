import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, BookOpen, Languages, MessageSquare, Plus, Play, Users, Clock, Trash2, ListOrdered, CheckSquare, Shuffle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePracticeExercises, useDeleteExercise, PracticeExercise } from '@/hooks/usePracticeExercises';
import GenerateExercisesDialog from './GenerateExercisesDialog';
import PracticeExerciseView from './PracticeExerciseView';
import AssignExerciseDialog from './AssignExerciseDialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const isMobile = useIsMobile();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<PracticeExercise | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [exerciseToAssign, setExerciseToAssign] = useState<string | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<PracticeExercise | null>(null);

  const { data: exercises, isLoading } = usePracticeExercises(user?.id);
  const deleteMutation = useDeleteExercise();

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'flashcard':
        return <BookOpen className="h-4 w-4" />;
      case 'conjugation':
        return <Languages className="h-4 w-4" />;
      case 'vocabulary':
        return <MessageSquare className="h-4 w-4" />;
      case 'sentence_order':
        return <ListOrdered className="h-4 w-4" />;
      case 'multiple_choice':
        return <CheckSquare className="h-4 w-4" />;
      case 'fill_gaps':
        return <Shuffle className="h-4 w-4" />;
      case 'reading':
        return <FileText className="h-4 w-4" />;
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
      case 'sentence_order':
        return 'Ordenar Frases';
      case 'multiple_choice':
        return 'Opción Múltiple';
      case 'fill_gaps':
        return 'Completar Huecos';
      case 'reading':
        return 'Comprensión Lectora';
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

  const handleDelete = (exercise: PracticeExercise) => {
    setExerciseToDelete(exercise);
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteMutation.mutate(exerciseToDelete.id);
      setExerciseToDelete(null);
    }
  };

  // Get all unique exercise types for tabs
  const exerciseTypes = ['all', 'flashcard', 'conjugation', 'vocabulary', 'sentence_order', 'multiple_choice', 'fill_gaps', 'reading'];

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
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
                <TabsTrigger value="conjugation">Conjugación</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulario</TabsTrigger>
                <TabsTrigger value="sentence_order">Ordenar</TabsTrigger>
                <TabsTrigger value="multiple_choice">Opción Múlt.</TabsTrigger>
                <TabsTrigger value="fill_gaps">Huecos</TabsTrigger>
                <TabsTrigger value="reading">Lectura</TabsTrigger>
              </TabsList>
            </ScrollArea>

            {exerciseTypes.map((tab) => (
              <TabsContent key={tab} value={tab}>
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
                ) : isMobile ? (
                  <div className="space-y-3">
                    {exercises
                      ?.filter(e => tab === 'all' || e.exercise_type === tab)
                      .map((exercise) => (
                        <Card key={exercise.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-3">
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
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssign(exercise.id)}
                                  title="Asignar a estudiante"
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Asignar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedExercise(exercise)}
                                  title="Practicar"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Practicar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(exercise)}
                                  title="Eliminar ejercicio"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    <div className="h-4" />
                  </div>
                ) : (
                  <ScrollArea className="h-auto max-h-[350px]">
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
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssign(exercise.id)}
                                    title="Asignar a estudiante"
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedExercise(exercise)}
                                    title="Practicar"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(exercise)}
                                    title="Eliminar ejercicio"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      <div className="h-2" />
                    </div>
                  </ScrollArea>
                )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!exerciseToDelete} onOpenChange={() => setExerciseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente "{exerciseToDelete?.title}" y todas las asignaciones asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
