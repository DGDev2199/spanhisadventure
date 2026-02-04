import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualLevelAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  currentLevel?: string | null;
}

const LEVELS = ['A1', 'A1 Especial', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Map each level to its available weeks
const LEVEL_WEEKS: Record<string, number[]> = {
  'A1': [1, 2],
  'A1 Especial': [1, 2],
  'A2': [3, 4],
  'B1': [5, 6],
  'B2': [7, 8],
  'C1': [9, 10],
  'C2': [11, 12]
};

export function ManualLevelAssignDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentLevel
}: ManualLevelAssignDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel || '');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [initialNotes, setInitialNotes] = useState<string>('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setSelectedLevel(currentLevel || '');
      setInitialNotes('');
      // Reset selected week when dialog opens
      if (currentLevel && LEVEL_WEEKS[currentLevel]) {
        setSelectedWeek(LEVEL_WEEKS[currentLevel][0]);
      } else {
        setSelectedWeek(null);
      }
    }
  }, [currentLevel, open]);

  // Update selected week when level changes
  useEffect(() => {
    if (selectedLevel && LEVEL_WEEKS[selectedLevel]) {
      setSelectedWeek(LEVEL_WEEKS[selectedLevel][0]);
    }
  }, [selectedLevel]);

  const assignLevelMutation = useMutation({
    mutationFn: async ({ level, week, notes }: { level: string; week: number; notes: string }) => {
      // Update student profile - mark test as completed (bypassed)
      const { data, error } = await supabase
        .from('student_profiles')
        .update({
          level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
          placement_test_status: 'completed' as const,
          placement_test_oral_completed: true,
          initial_feedback: notes || `Nivel asignado manualmente: ${level}`
        })
        .eq('user_id', studentId)
        .select();

      if (error) throw error;
      
      // Create initial progress week
      if (notes || level) {
        const { data: weekData, error: weekError } = await supabase
          .from('student_progress_weeks')
          .insert({
            student_id: studentId,
            week_number: week,
            week_theme: `Nivel Inicial: ${level} - Semana ${week}`,
            week_objectives: `Evaluación inicial (presencial/manual). Nivel asignado: ${level}. Comenzando en semana ${week}.`,
            is_completed: false
          })
          .select()
          .single();

        if (weekError) {
          console.error('Error creating initial week:', weekError);
        } else if (weekData && notes) {
          // Get current user (teacher)
          const { data: { user } } = await supabase.auth.getUser();
          
          // Create initial note
          await supabase
            .from('student_progress_notes')
            .insert({
              week_id: weekData.id,
              day_type: 'evaluation',
              notes: notes,
              created_by: user?.id || studentId
            });
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress-weeks'] });
      toast.success('Nivel asignado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error al asignar nivel: ${error.message || 'Error desconocido'}`);
    }
  });

  const handleAssignLevel = () => {
    if (!selectedLevel) {
      toast.error('Por favor selecciona un nivel');
      return;
    }
    if (!selectedWeek) {
      toast.error('Por favor selecciona la semana de inicio');
      return;
    }
    assignLevelMutation.mutate({ 
      level: selectedLevel, 
      week: selectedWeek, 
      notes: initialNotes 
    });
  };

  const availableWeeks = selectedLevel ? LEVEL_WEEKS[selectedLevel] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Asignar Nivel Manualmente
          </DialogTitle>
          <DialogDescription>
            Estudiante: {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-accent/20 border-accent">
            <AlertCircle className="h-4 w-4 text-accent-foreground" />
            <AlertDescription className="text-sm text-accent-foreground">
              Usa esta opción cuando el test de nivelación fue realizado presencialmente o de otra forma.
            </AlertDescription>
          </Alert>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label htmlFor="level-select">Nivel</Label>
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
          </div>

          {/* Week Selection */}
          {selectedLevel && availableWeeks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="week-select">Semana de Inicio</Label>
              <Select 
                value={selectedWeek?.toString() || ''} 
                onValueChange={(val) => setSelectedWeek(parseInt(val))}
              >
                <SelectTrigger id="week-select">
                  <SelectValue placeholder="Selecciona la semana" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Semana {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Iniciales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Comentarios sobre la evaluación presencial, fortalezas, áreas de mejora..."
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssignLevel}
            disabled={!selectedLevel || !selectedWeek || assignLevelMutation.isPending}
          >
            {assignLevelMutation.isPending ? 'Asignando...' : 'Asignar Nivel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
