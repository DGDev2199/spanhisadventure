import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

interface TestAssignment {
  id: string;
  status: string;
  score: number | null;
  custom_tests: {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    time_limit_minutes?: number;
  } | null;
}

interface AssignedTestsListProps {
  assignments: TestAssignment[];
}

export const AssignedTestsList = memo(({ assignments }: AssignedTestsListProps) => {
  const navigate = useNavigate();
  
  if (!assignments || assignments.length === 0) return null;

  return (
    <Card className="shadow-md mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-secondary" />
          Tests Asignados
        </CardTitle>
        <CardDescription>
          Tests creados por tu profesor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-lg">{assignment.custom_tests?.title}</h4>
                  {assignment.custom_tests?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{assignment.custom_tests.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {assignment.custom_tests?.due_date && (
                      <span>Entrega: {new Date(assignment.custom_tests.due_date).toLocaleDateString()}</span>
                    )}
                    {assignment.custom_tests?.time_limit_minutes && (
                      <span>Tiempo: {assignment.custom_tests.time_limit_minutes} min</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {assignment.status === 'assigned' && (
                    <Button size="sm" onClick={() => navigate(`/test/${assignment.id}`)}>
                      Empezar Test
                    </Button>
                  )}
                  {assignment.status === 'in_progress' && (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/test/${assignment.id}`)}>
                      Continuar
                    </Button>
                  )}
                  {assignment.status === 'submitted' && (
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Pendiente revisión
                      </span>
                      {assignment.score !== null && (
                        <p className="text-2xl font-bold text-primary mt-2">{assignment.score}%</p>
                      )}
                    </div>
                  )}
                  {assignment.status === 'graded' && (
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Calificado
                      </span>
                      <p className="text-3xl font-bold text-primary mt-2">{assignment.score}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Puntos obtenidos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

AssignedTestsList.displayName = 'AssignedTestsList';
