import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, RotateCcw, Save, TrendingUp, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ViewExtraHoursDialog } from '@/components/ViewExtraHoursDialog';

interface ManageStaffHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageStaffHoursDialog({ open, onOpenChange }: ManageStaffHoursDialogProps) {
  const queryClient = useQueryClient();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [viewExtraHoursUserId, setViewExtraHoursUserId] = useState<string | null>(null);

  // Fetch all staff (teachers and tutors) with their hours
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff-hours-management'],
    queryFn: async () => {
      // Get all teachers and tutors
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['teacher', 'tutor']);

      if (rolesError) throw rolesError;

      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get hours data
      const { data: hours, error: hoursError } = await supabase
        .from('staff_hours')
        .select('*')
        .in('user_id', userIds);

      if (hoursError) throw hoursError;

      // Merge data
      return userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const hoursData = hours?.find(h => h.user_id === userId);
        const userRoles = roles?.filter(r => r.user_id === userId).map(r => r.role);

        return {
          userId,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          roles: userRoles || [],
          totalHours: hoursData?.total_hours || 0,
          calculatedHours: hoursData?.calculated_hours || 0,
          manualAdjustment: hoursData?.manual_adjustment_hours || 0,
          lastCalculated: hoursData?.last_calculated_at,
        };
      });
    },
    enabled: open,
  });

  // Mutation to adjust hours
  const adjustHoursMutation = useMutation({
    mutationFn: async ({ userId, manualHours }: { userId: string; manualHours: number }) => {
      // Update or insert staff hours record
      const { data: existing } = await supabase
        .from('staff_hours')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('staff_hours')
          .update({ 
            manual_adjustment_hours: manualHours,
            total_hours: existing.calculated_hours + manualHours,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff_hours')
          .insert({ 
            user_id: userId,
            manual_adjustment_hours: manualHours,
            total_hours: manualHours,
            calculated_hours: 0
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Horas actualizadas exitosamente');
      setAdjustments({});
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Mutation to reset hours
  const resetHoursMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('staff_hours')
        .update({ 
          manual_adjustment_hours: 0,
          total_hours: 0,
          calculated_hours: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Horas reseteadas exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Mutation to recalculate all hours
  const recalculateAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('calculate_staff_hours');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Todas las horas han sido recalculadas desde el horario semanal');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAdjustmentChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAdjustments(prev => ({ ...prev, [userId]: numValue }));
  };

  const handleSaveAdjustment = (userId: string) => {
    const adjustment = adjustments[userId];
    if (adjustment !== undefined) {
      adjustHoursMutation.mutate({ userId, manualHours: adjustment });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Gestión de Horas de Personal
          </DialogTitle>
          <DialogDescription>
            Las horas se calculan automáticamente desde el horario semanal. Puedes hacer ajustes manuales o resetear.
          </DialogDescription>
        </DialogHeader>

        <Alert className="flex-shrink-0">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Horas del Horario:</strong> Se calculan automáticamente desde las actividades asignadas en el Horario Semanal. 
            <strong> Horas Extras:</strong> Solicitudes aprobadas de horas adicionales con justificación.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={() => recalculateAllMutation.mutate()}
            disabled={recalculateAllMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Recalcular Todo
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : staffData && staffData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Hrs. Horario</TableHead>
                  <TableHead className="text-right">Hrs. Extras</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffData.map((staff) => (
                  <TableRow key={staff.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{staff.name}</div>
                        <div className="text-xs text-muted-foreground">{staff.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {staff.roles.map(role => (
                          <span key={role} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                            {role}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">{staff.calculatedHours.toFixed(2)}h</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-sm">{staff.manualAdjustment.toFixed(2)}h</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewExtraHoursUserId(staff.userId)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-lg text-primary">
                        {staff.totalHours.toFixed(2)}h
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetHoursMutation.mutate(staff.userId)}
                        disabled={resetHoursMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay personal registrado
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {viewExtraHoursUserId && (
        <ViewExtraHoursDialog
          open={!!viewExtraHoursUserId}
          onOpenChange={(open) => !open && setViewExtraHoursUserId(null)}
          userId={viewExtraHoursUserId}
          isAdmin={true}
        />
      )}
    </Dialog>
  );
}
