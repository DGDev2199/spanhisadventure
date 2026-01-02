import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardCheck, 
  Download, 
  ThumbsUp, 
  Minus, 
  ThumbsDown,
  Loader2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useTeacherSubmittedTasks, useReviewTask } from '@/hooks/useStudentDashboardData';
import { cn } from '@/lib/utils';

interface TeacherTaskReviewPanelProps {
  teacherId: string;
}

export const TeacherTaskReviewPanel = ({ teacherId }: TeacherTaskReviewPanelProps) => {
  const { t } = useTranslation();
  const { data: submittedTasks = [], isLoading } = useTeacherSubmittedTasks(teacherId);
  const reviewTask = useReviewTask();
  
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [gradingTaskId, setGradingTaskId] = useState<string | null>(null);

  const handleGrade = async (taskId: string, score: number) => {
    setGradingTaskId(taskId);
    await reviewTask.mutateAsync({
      taskId,
      score,
      feedback: feedback[taskId]
    });
    setGradingTaskId(null);
    setExpandedTask(null);
    setFeedback(prev => {
      const newFeedback = { ...prev };
      delete newFeedback[taskId];
      return newFeedback;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show empty state instead of returning null
  const hasSubmittedTasks = submittedTasks.length > 0;

  return (
    <Card className={hasSubmittedTasks ? "border-yellow-200 bg-yellow-50/30" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-yellow-600" />
          Tareas para Revisar
          {hasSubmittedTasks && (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              {submittedTasks.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasSubmittedTasks 
            ? "Revisa y califica las tareas enviadas por tus estudiantes"
            : "Cuando los estudiantes envíen sus tareas, aparecerán aquí para que las revises y califiques"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSubmittedTasks ? (
          <div className="text-center py-6 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay tareas pendientes de revisión</p>
            <p className="text-sm mt-1">Las tareas con status "Pending" aún no han sido enviadas por el estudiante</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {submittedTasks.map((task: any) => {
                const isExpanded = expandedTask === task.id;
                const isGrading = gradingTaskId === task.id;
                
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      "p-4 border rounded-lg bg-background transition-all",
                      isExpanded && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={task.student?.avatar_url} />
                        <AvatarFallback>
                          {task.student?.full_name?.[0] || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{task.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {task.student?.full_name || 'Estudiante'}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Student notes */}
                        {task.student_notes && (
                          <div className="mt-2 p-2 bg-muted rounded-lg flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{task.student_notes}</p>
                          </div>
                        )}
                        
                        {/* Attachment */}
                        {task.attachment_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open(task.attachment_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Ver archivo adjunto
                          </Button>
                        )}
                        
                        {/* Expanded grading section */}
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            <Textarea
                              placeholder="Feedback para el estudiante (opcional)"
                              value={feedback[task.id] || ''}
                              onChange={(e) => setFeedback(prev => ({ 
                                ...prev, 
                                [task.id]: e.target.value 
                              }))}
                              rows={2}
                            />
                            
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => handleGrade(task.id, 10)}
                                disabled={isGrading}
                                className="bg-green-500 hover:bg-green-600 gap-2"
                              >
                                {isGrading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ThumbsUp className="h-4 w-4" />
                                )}
                                Excelente (10 pts)
                              </Button>
                              <Button
                                onClick={() => handleGrade(task.id, 5)}
                                disabled={isGrading}
                                variant="secondary"
                                className="gap-2"
                              >
                                {isGrading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Minus className="h-4 w-4" />
                                )}
                                Regular (5 pts)
                              </Button>
                              <Button
                                onClick={() => handleGrade(task.id, 0)}
                                disabled={isGrading}
                                variant="outline"
                                className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                              >
                                {isGrading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ThumbsDown className="h-4 w-4" />
                                )}
                                Incorrecto (0 pts)
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedTask(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {!isExpanded && (
                        <Button
                          onClick={() => setExpandedTask(task.id)}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
