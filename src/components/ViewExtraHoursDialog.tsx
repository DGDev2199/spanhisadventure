import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ViewExtraHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isAdmin?: boolean;
}

export function ViewExtraHoursDialog({ open, onOpenChange, userId, isAdmin = false }: ViewExtraHoursDialogProps) {
  const queryClient = useQueryClient();

  const { data: extraHours, isLoading } = useQuery({
    queryKey: ['extra-hours', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extra_hours')
        .select(`
          *,
          profiles!extra_hours_created_by_fkey(full_name),
          approver:profiles!extra_hours_approved_by_fkey(full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const approveMutation = useMutation({
    mutationFn: async (extraHourId: string) => {
      const { error } = await supabase
        .from('extra_hours')
        .update({
          approved: true,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', extraHourId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-hours', userId] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours', userId] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Horas extras aprobadas');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (extraHourId: string) => {
      const { error } = await supabase
        .from('extra_hours')
        .delete()
        .eq('id', extraHourId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-hours', userId] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours', userId] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Solicitud eliminada');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Horas Extras
          </DialogTitle>
          <DialogDescription>
            Visualiza todas las solicitudes de horas extras y su estado
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : extraHours && extraHours.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead>Justificación</TableHead>
                <TableHead>Estado</TableHead>
                {isAdmin && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {extraHours.map((extra) => (
                <TableRow key={extra.id}>
                  <TableCell className="text-sm">
                    {new Date(extra.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {extra.hours}h
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm line-clamp-2">{extra.justification}</p>
                  </TableCell>
                  <TableCell>
                    {extra.approved ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Aprobado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        {!extra.approved && (
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(extra.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(extra.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert>
            <AlertDescription>
              No hay horas extras registradas aún.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}