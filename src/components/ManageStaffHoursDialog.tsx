import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, RotateCcw, Save, TrendingUp, History, Check, X } from 'lucide-react';
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
  const [showPendingHours, setShowPendingHours] = useState(false);

  // Fetch pending extra hours for admin
  const { data: pendingHours, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-extra-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extra_hours')
        .select(`
          *,
          user_profile:profiles!extra_hours_user_id_fkey(full_name, email),
          created_by_profile:profiles!extra_hours_created_by_fkey(full_name)
        `)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Mutation to approve pending hours
  const approvePendingMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['pending-extra-hours'] });
      queryClient.invalidateQueries({ queryKey: ['staff-hours-management'] });
      toast.success('Horas extras aprobadas');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Mutation to reject/delete pending hours
  const rejectPendingMutation = useMutation({
    mutationFn: async (extraHourId: string) => {
      const { error } = await supabase
        .from('extra_hours')
        .delete()
        .eq('id', extraHourId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-extra-hours'] });
      toast.success('Solicitud rechazada');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

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

        {/* Pending Hours Alert */}
        {pendingHours && pendingHours.length > 0 && (
          <Alert className="flex-shrink-0 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Tienes {pendingHours.length} solicitud{pendingHours.length !== 1 ? 'es' : ''} de horas extras pendiente{pendingHours.length !== 1 ? 's' : ''} de aprobación
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingHours(!showPendingHours)}
              >
                {showPendingHours ? 'Ocultar' : 'Ver Pendientes'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Hours Table */}
        {showPendingHours && pendingHours && pendingHours.length > 0 && (
          <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Solicitudes Pendientes de Aprobación</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Justificación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingHours.map((pending: any) => (
                  <TableRow key={pending.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pending.user_profile?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{pending.user_profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {pending.created_by_profile?.full_name}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {pending.hours}h
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm line-clamp-2">{pending.justification}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(pending.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => approvePendingMutation.mutate(pending.id)}
                          disabled={approvePendingMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm('¿Rechazar esta solicitud de horas extras?')) {
                              rejectPendingMutation.mutate(pending.id);
                            }
                          }}
                          disabled={rejectPendingMutation.isPending}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
