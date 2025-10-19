import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReviewPlacementTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  writtenScore?: number;
  currentLevel?: string;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function ReviewPlacementTestDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  writtenScore,
  currentLevel
}: ReviewPlacementTestDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel || '');
  const queryClient = useQueryClient();

  const assignLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          level: level as any,
          placement_test_status: 'completed',
          placement_test_oral_completed: true
        })
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-students'] });
      toast.success('Nivel asignado exitosamente');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al asignar nivel');
    }
  });

  const handleAssignLevel = () => {
    if (!selectedLevel) {
      toast.error('Por favor selecciona un nivel');
      return;
    }
    assignLevelMutation.mutate(selectedLevel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Examen de Nivelación</DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Written Test Score */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Resultado del Examen Escrito</h3>
            <div className="text-3xl font-bold text-primary">
              {writtenScore !== undefined ? `${writtenScore}%` : 'No disponible'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Puntaje automático del test de opción múltiple
            </p>
          </div>

          {/* Oral Test Guide */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Descarga la guía del examen oral para completar la evaluación
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/Examen_de_nivelación.pdf', '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Guía
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Instrucciones para la Evaluación Oral</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
              <li>Descarga y revisa el protocolo del examen oral</li>
              <li>Realiza el examen oral siguiendo las instrucciones del PDF</li>
              <li>Evalúa al estudiante en diferentes áreas: gramática, fluidez, comprensión</li>
              <li>Combina el resultado del test escrito con tu evaluación oral</li>
              <li>Asigna el nivel apropiado basado en ambas evaluaciones</li>
            </ul>
          </div>

          {/* Level Assignment */}
          <div className="space-y-3">
            <Label htmlFor="level-select">Asignar Nivel Final</Label>
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
            <p className="text-xs text-muted-foreground">
              Selecciona el nivel final después de revisar tanto el examen escrito como el oral
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignLevel}
              disabled={!selectedLevel || assignLevelMutation.isPending}
            >
              {assignLevelMutation.isPending ? 'Asignando...' : 'Asignar Nivel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
