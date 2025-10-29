import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Plus } from 'lucide-react';

interface AddExtraHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function AddExtraHoursDialog({ open, onOpenChange, userId }: AddExtraHoursDialogProps) {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<number>(0);
  const [justification, setJustification] = useState('');

  const addExtraHoursMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('extra_hours')
        .insert({
          user_id: userId,
          hours,
          justification,
          created_by: userId,
          approved: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hours', userId] });
      queryClient.invalidateQueries({ queryKey: ['extra-hours', userId] });
      toast.success('Solicitud de horas extras enviada. Pendiente de aprobación por administrador.');
      setHours(0);
      setJustification('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error al agregar horas extras: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (hours <= 0) {
      toast.error('Las horas deben ser mayores a 0');
      return;
    }
    if (!justification.trim()) {
      toast.error('Debes proporcionar una justificación');
      return;
    }
    addExtraHoursMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Horas Extras
          </DialogTitle>
          <DialogDescription>
            Solicita horas adicionales justificando su origen. Requiere aprobación del administrador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Cantidad de Horas</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 2.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justificación</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explica el origen de estas horas extras (ej: reuniones adicionales, preparación de materiales, actividades especiales, etc.)"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={addExtraHoursMutation.isPending}
          >
            {addExtraHoursMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}