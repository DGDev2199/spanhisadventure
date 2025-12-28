import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Award, Clock, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  testTitle: string;
  testType?: string;
  onOpenFinalReview?: (studentId: string, studentName: string, score: number) => void;
}

export function TestDetailsDialog({ 
  open, 
  onOpenChange, 
  testId, 
  testTitle, 
  testType,
  onOpenFinalReview 
}: TestDetailsDialogProps) {
  const { data: testDetails, isLoading } = useQuery({
    queryKey: ['test-details', testId],
    queryFn: async () => {
      const { data: test, error: testError } = await supabase
        .from('custom_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('test_assignments')
        .select(`
          id,
          student_id,
          status,
          score,
          completed_at,
          started_at
        `)
        .eq('test_id', testId);

      if (assignmentsError) throw assignmentsError;

      // Get student profiles using secure view
      const studentIds = assignments?.map(a => a.student_id) || [];
      const { data: profiles } = await supabase
        .from('safe_profiles_view')
        .select('id, full_name, email')
        .in('id', studentIds);

      // Merge data
      const assignmentsWithProfiles = assignments?.map(assignment => ({
        ...assignment,
        student: profiles?.find(p => p.id === assignment.student_id)
      }));

      return {
        test,
        assignments: assignmentsWithProfiles
      };
    },
    enabled: open
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Calificado</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Enviado</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">En Progreso</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Asignado</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-2xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {testTitle}
            {testType === 'final' && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-normal">
                Test Final
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Resultados y estadísticas del test
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[65vh] sm:h-[70vh] px-6">
          <div className="pr-4">
            {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : testDetails ? (
            <div className="space-y-6">
              {/* Test Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Entrega
                  </div>
                  <div className="font-semibold">
                    {testDetails.test.due_date 
                      ? new Date(testDetails.test.due_date).toLocaleDateString()
                      : 'Sin fecha límite'}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Tiempo Límite
                  </div>
                  <div className="font-semibold">
                    {testDetails.test.time_limit_minutes 
                      ? `${testDetails.test.time_limit_minutes} minutos`
                      : 'Sin límite'}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Award className="h-4 w-4" />
                    Promedio
                  </div>
                  <div className="font-semibold text-2xl text-primary">
                    {testDetails.assignments.filter((a: any) => a.score !== null).length > 0
                      ? Math.round(
                          testDetails.assignments
                            .filter((a: any) => a.score !== null)
                            .reduce((sum: number, a: any) => sum + a.score, 0) /
                          testDetails.assignments.filter((a: any) => a.score !== null).length
                        )
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Estudiantes Asignados</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Puntuación</TableHead>
                      <TableHead>Fecha de Envío</TableHead>
                      {testType === 'final' && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testDetails.assignments.length > 0 ? (
                      testDetails.assignments.map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.student?.full_name || 'Desconocido'}
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                          <TableCell>
                            {assignment.score !== null ? (
                              <span className="text-lg font-bold text-primary">
                                {assignment.score}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.submitted_at 
                              ? new Date(assignment.submitted_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          {testType === 'final' && (
                            <TableCell>
                              {assignment.status === 'graded' && assignment.score !== null && onOpenFinalReview && (
                                <Button
                                  size="sm"
                                  onClick={() => onOpenFinalReview(
                                    assignment.student_id,
                                    assignment.student?.full_name || 'Estudiante',
                                    assignment.score
                                  )}
                                >
                                  Revisar y Asignar Nivel
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={testType === 'final' ? 5 : 4} className="text-center text-muted-foreground">
                          No hay estudiantes asignados a este test
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
            </div>
        </ScrollArea>

        <div className="flex justify-end px-6 pb-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
