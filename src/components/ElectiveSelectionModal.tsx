import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  elective_option_1?: string | null;
  elective_option_2?: string | null;
}

interface ElectiveSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent | null;
  eventDate: string;
}

export const ElectiveSelectionModal = ({ 
  open, 
  onOpenChange, 
  event, 
  eventDate 
}: ElectiveSelectionModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<1 | 2 | null>(null);

  // Check if already selected
  const { data: existingSelection } = useQuery({
    queryKey: ['elective-selection', event?.id, eventDate],
    queryFn: async () => {
      if (!user?.id || !event?.id) return null;
      const { data, error } = await supabase
        .from('student_elective_selections')
        .select('selected_option')
        .eq('student_id', user.id)
        .eq('event_id', event.id)
        .eq('event_date', eventDate)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!event?.id && open,
  });

  // Set selected option from existing selection
  useEffect(() => {
    if (existingSelection?.selected_option) {
      setSelectedOption(existingSelection.selected_option as 1 | 2);
    }
  }, [existingSelection]);

  const selectMutation = useMutation({
    mutationFn: async (option: 1 | 2) => {
      if (!user?.id || !event?.id) throw new Error('No user or event');
      
      const { error } = await supabase
        .from('student_elective_selections')
        .upsert({
          student_id: user.id,
          event_id: event.id,
          event_date: eventDate,
          selected_option: option,
        }, {
          onConflict: 'student_id,event_id,event_date'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elective-selection'] });
      queryClient.invalidateQueries({ queryKey: ['student-elective-selections'] });
      toast.success('¡Electiva seleccionada exitosamente!');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error selecting elective:', error);
      toast.error('Error al seleccionar electiva');
    }
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  if (!event) return null;

  const alreadySelected = !!existingSelection;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📖 Selecciona tu Electiva
          </DialogTitle>
          <DialogDescription>
            La electiva comienza a las {formatTime(event.start_time)}. 
            {alreadySelected ? ' Ya seleccionaste una opción, pero puedes cambiarla.' : ' Elige tu opción:'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 my-4">
          {/* Option 1 */}
          <button
            onClick={() => setSelectedOption(1)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all relative",
              selectedOption === 1 
                ? "border-primary bg-primary/10" 
                : "border-muted hover:border-primary/50"
            )}
          >
            {selectedOption === 1 && (
              <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
            )}
            <div className="font-medium">Opción 1</div>
            <div className="text-sm text-muted-foreground mt-1">
              {event.elective_option_1 || 'Cultural'}
            </div>
            {existingSelection?.selected_option === 1 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Tu selección actual
              </Badge>
            )}
          </button>

          {/* Option 2 */}
          <button
            onClick={() => setSelectedOption(2)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all relative",
              selectedOption === 2 
                ? "border-primary bg-primary/10" 
                : "border-muted hover:border-primary/50"
            )}
          >
            {selectedOption === 2 && (
              <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
            )}
            <div className="font-medium">Opción 2</div>
            <div className="text-sm text-muted-foreground mt-1">
              {event.elective_option_2 || 'Gramática'}
            </div>
            {existingSelection?.selected_option === 2 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Tu selección actual
              </Badge>
            )}
          </button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedOption && selectMutation.mutate(selectedOption)}
            disabled={!selectedOption || selectMutation.isPending}
          >
            {selectMutation.isPending ? 'Guardando...' : 'Confirmar Selección'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
