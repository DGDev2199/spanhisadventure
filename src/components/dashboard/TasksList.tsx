import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Download, Send, Sparkles, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: string;
  score?: number;
  teacher_feedback?: string;
  attachment_url?: string;
}

interface TasksListProps {
  tasks: Task[];
  onSubmitTask: (taskId: string, notes?: string) => void;
  isSubmitting?: boolean;
}

function TasksListComponent({ tasks, onSubmitTask, isSubmitting }: TasksListProps) {
  const { t } = useTranslation();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [submittedTaskIds, setSubmittedTaskIds] = useState<Set<string>>(new Set());
  
  if (!tasks || tasks.length === 0) return null;

  const getStatusBadge = (status: string, score?: number, isLocallySubmitted?: boolean) => {
    if (isLocallySubmitted || status === 'submitted') {
      return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 gap-1">
          <Clock className="h-3 w-3" />
          En revisión
        </Badge>
      );
    }
    switch (status) {
      case 'reviewed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {score !== undefined ? `${score} pts` : 'Revisada'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Pendiente
          </Badge>
        );
    }
  };

  const handleSubmit = async (taskId: string) => {
    setSubmittingTaskId(taskId);
    try {
      await onSubmitTask(taskId, taskNotes[taskId]);
      // Mark as locally submitted to prevent button from reappearing
      setSubmittedTaskIds(prev => new Set(prev).add(taskId));
    } finally {
      setSubmittingTaskId(null);
      setExpandedTask(null);
    }
  };

  return (
    <Card className="shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {t('tasks.myTasks')}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {t('tasks.completeAssigned')}
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Sparkles className="h-3 w-3" />
            Hasta 10 puntos por tarea
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const isLocallySubmitted = submittedTaskIds.has(task.id);
            const isPending = (task.status === 'pending' || !task.status) && !isLocallySubmitted;
            const isSubmitted = task.status === 'submitted' || isLocallySubmitted;
            const isReviewed = task.status === 'reviewed';
            const isCurrentlySubmitting = submittingTaskId === task.id;
            
            return (
              <div 
                key={task.id} 
                className={cn(
                  "p-4 border rounded-lg transition-all",
                  isReviewed && "bg-green-50 border-green-200",
                  isSubmitted && "bg-yellow-50 border-yellow-200",
                  isPending && "hover:bg-accent/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {getStatusBadge(task.status || 'pending', task.score, isLocallySubmitted)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                    {task.teacher_feedback && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Feedback:</span> {task.teacher_feedback}
                      </div>
                    )}
                    {task.attachment_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(task.attachment_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('tasks.downloadFile')}
                      </Button>
                    )}
                    
                    {/* Expandable notes section for pending tasks */}
                    {isPending && expandedTask === task.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Agrega una nota o comentario para el profesor (opcional)"
                          value={taskNotes[task.id] || ''}
                          onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                  
                  {isPending && (
                    <div className="flex flex-col gap-2">
                      {expandedTask !== task.id ? (
                        <Button
                          onClick={() => setExpandedTask(task.id)}
                          size="sm"
                          className="flex-shrink-0 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('tasks.submitTask', 'Enviar')}</span>
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmit(task.id)}
                            size="sm"
                            disabled={isCurrentlySubmitting || isSubmitting}
                            className="flex-shrink-0 gap-2 bg-green-500 hover:bg-green-600"
                          >
                            {isCurrentlySubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Confirmar
                          </Button>
                          <Button
                            onClick={() => setExpandedTask(null)}
                            size="sm"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isSubmitted && (
                    <div className="text-xs text-muted-foreground text-center">
                      Esperando<br/>revisión
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const TasksList = memo(TasksListComponent);
TasksList.displayName = 'TasksList';
