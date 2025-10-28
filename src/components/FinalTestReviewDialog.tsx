import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Award, BookOpen, ClipboardCheck, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FinalTestReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  testScore: number;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function FinalTestReviewDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  testScore
}: FinalTestReviewDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const queryClient = useQueryClient();

  // Get current student profile
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile-review', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('level')
        .eq('user_id', studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Get weekly progress (tasks and other tests)
  const { data: weeklyProgress } = useQuery({
    queryKey: ['weekly-progress', studentId],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get completed tasks from the last week
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', studentId)
        .eq('completed', true)
        .gte('updated_at', oneWeekAgo.toISOString());

      if (tasksError) throw tasksError;

      // Get other test scores from the last week
      const { data: testAssignments, error: testsError } = await supabase
        .from('test_assignments')
        .select(`
          *,
          custom_tests (
            title,
            test_type
          )
        `)
        .eq('student_id', studentId)
        .not('score', 'is', null)
        .gte('submitted_at', oneWeekAgo.toISOString());

      if (testsError) throw testsError;

      return {
        tasks: tasks || [],
        tests: testAssignments || []
      };
    },
    enabled: open
  });

  useEffect(() => {
    if (studentProfile?.level) {
      setSelectedLevel(studentProfile.level);
    }
  }, [studentProfile]);

  const assignLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      const { error } = await supabase
        .from('student_profiles')
        .update({ level: level as any })
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile-review'] });
      toast.success('Nivel actualizado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar nivel: ${error.message}`);
    }
  });

  const handleAssignLevel = () => {
    if (!selectedLevel) {
      toast.error('Por favor selecciona un nivel');
      return;
    }
    assignLevelMutation.mutate(selectedLevel);
  };

  const avgTestScore = weeklyProgress?.tests && weeklyProgress.tests.length > 0
    ? Math.round(weeklyProgress.tests.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / weeklyProgress.tests.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-2xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Revisar Test Final y Asignar Nivel</DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] px-6">
          <div className="pr-4">
            <div className="space-y-6">
            {/* Current Level */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Nivel Actual</h3>
              <div className="text-3xl font-bold text-primary">
                {studentProfile?.level || 'No asignado'}
              </div>
            </div>

            {/* Test Final Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Resultado del Test Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary text-center py-4">
                  {testScore}%
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progreso de la Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <BookOpen className="h-4 w-4" />
                      Tareas Completadas
                    </div>
                    <div className="text-2xl font-bold">
                      {weeklyProgress?.tasks.length || 0}
                    </div>
                  </div>
                  <div className="bg-accent/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Award className="h-4 w-4" />
                      Promedio de Tests
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {avgTestScore}%
                    </div>
                  </div>
                </div>

                {/* Test List */}
                {weeklyProgress?.tests && weeklyProgress.tests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Tests de la Semana:</h4>
                    {weeklyProgress.tests.map((test: any) => (
                      <div key={test.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{test.custom_tests?.title || 'Test'}</span>
                        <span className="font-semibold">{test.score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks List */}
                {weeklyProgress?.tasks && weeklyProgress.tasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Tareas Completadas:</h4>
                    <div className="space-y-1">
                      {weeklyProgress.tasks.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="text-sm p-2 bg-muted rounded">
                          • {task.title}
                        </div>
                      ))}
                      {weeklyProgress.tasks.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{weeklyProgress.tasks.length - 5} más
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Level Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Asignar Nuevo Nivel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="level-select">Selecciona el Nuevo Nivel</Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger id="level-select">
                      <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Considera el resultado del test final, el promedio de tests y las tareas completadas
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </ScrollArea>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 pb-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleAssignLevel}
            disabled={!selectedLevel || assignLevelMutation.isPending}
            className="sm:w-auto"
          >
            {assignLevelMutation.isPending ? 'Asignando...' : 'Asignar Nivel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
