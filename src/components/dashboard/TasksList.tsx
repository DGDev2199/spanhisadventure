import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Download } from 'lucide-react';

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
        <CardDescription>
          {t('tasks.completeAssigned')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onCompleteTask(task.id)}
                className="mt-1"
              />
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const TasksList = memo(TasksListComponent);
TasksList.displayName = 'TasksList';