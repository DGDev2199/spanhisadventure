import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Send, Sparkles } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  attachment_url?: string;
}

interface TasksListProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
}

function TasksListComponent({ tasks, onCompleteTask }: TasksListProps) {
  const { t } = useTranslation();
  
  if (!tasks || tasks.length === 0) return null;

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
            +5 puntos por tarea
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors group">
              <div className="flex-1">
                <h4 className="font-medium">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString()}
                  </p>
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
              </div>
              <Button
                onClick={() => onCompleteTask(task.id)}
                size="sm"
                className="flex-shrink-0 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t('tasks.submitTask', 'Enviar')}</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const TasksList = memo(TasksListComponent);
TasksList.displayName = 'TasksList';
