import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Languages, MessageSquare, Play, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAssignments, PracticeAssignment, PracticeExercise } from '@/hooks/usePracticeExercises';
import PracticeExerciseView from './PracticeExerciseView';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

export default function StudentPracticePanel() {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<(PracticeAssignment & { exercise: PracticeExercise }) | null>(null);
  const isMobile = useIsMobile();

  const { data: assignments, isLoading } = useStudentAssignments(user?.id);

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

  const getStatusBadge = (status: string, score?: number | null) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {score !== null ? `${score}%` : 'Completado'}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En progreso
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Circle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  // Filter out assignments where exercise is null (deleted exercises)
  const validAssignments = assignments?.filter(a => a.exercise !== null) || [];
  const pendingAssignments = validAssignments.filter(a => a.status !== 'completed');
  const completedAssignments = validAssignments.filter(a => a.status === 'completed');

  return (
    <>
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Mis Ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Cargando ejercicios...
            </div>
          ) : !validAssignments.length ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tienes ejercicios asignados</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Pending exercises */}
              {pendingAssignments.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">Por completar</h4>
                  <ScrollArea className={isMobile ? 'h-auto max-h-[60vh]' : 'h-auto max-h-[350px]'}>
                    <div className="space-y-2">
                      {pendingAssignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                  <span className="flex-shrink-0">{getExerciseIcon(assignment.exercise.exercise_type)}</span>
                                  <span className="font-medium truncate text-xs sm:text-sm">
                                    {assignment.exercise.title}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                    {getExerciseLabel(assignment.exercise.exercise_type)}
                                  </Badge>
                                  {getStatusBadge(assignment.status)}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                onClick={() => setSelectedAssignment(assignment)}
                              >
                                <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Iniciar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Spacer to avoid last item's button being clipped by nested scroll on some mobiles */}
                      <div className="h-2" />
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Completed exercises */}
              {completedAssignments.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2 text-muted-foreground">Completados</h4>
                  <ScrollArea className={isMobile ? 'h-auto max-h-[45vh]' : 'h-auto max-h-[250px]'}>
                    <div className="space-y-2">
                      {completedAssignments.map((assignment) => (
                        <Card key={assignment.id} className="bg-muted/30">
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                  <span className="flex-shrink-0">{getExerciseIcon(assignment.exercise.exercise_type)}</span>
                                  <span className="font-medium truncate text-xs sm:text-sm">
                                    {assignment.exercise.title}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                  {getStatusBadge(assignment.status, assignment.score)}
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    {assignment.completed_at && formatDistanceToNow(new Date(assignment.completed_at), {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full sm:w-auto h-8 sm:h-9"
                                onClick={() => setSelectedAssignment(assignment)}
                              >
                                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sm:hidden ml-1">Ver</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="h-2" />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAssignment && (
        <PracticeExerciseView
          open={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          exercise={selectedAssignment.exercise}
          assignmentId={selectedAssignment.id}
        />
      )}
    </>
  );
}
