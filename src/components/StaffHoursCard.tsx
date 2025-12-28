import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, TrendingUp, Plus, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AddExtraHoursDialog } from '@/components/AddExtraHoursDialog';
import { ViewExtraHoursDialog } from '@/components/ViewExtraHoursDialog';

interface StaffHoursCardProps {
  userId: string;
}

export const StaffHoursCard = memo(function StaffHoursCard({ userId }: StaffHoursCardProps) {
  const [showAddHours, setShowAddHours] = useState(false);
  const [showViewHours, setShowViewHours] = useState(false);

  const handleOpenAddHours = useCallback(() => setShowAddHours(true), []);
  const handleCloseAddHours = useCallback((open: boolean) => setShowAddHours(open), []);
  const handleOpenViewHours = useCallback(() => setShowViewHours(true), []);
  const handleCloseViewHours = useCallback((open: boolean) => setShowViewHours(open), []);

  const { data: hoursData, isLoading } = useQuery({
    queryKey: ['staff-hours', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_hours')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mis Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hoursData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mis Horas
          </CardTitle>
          <CardDescription>
            Horas semanales calculadas automáticamente desde el horario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No hay horas registradas aún. Las horas se calcularán automáticamente cuando se te asignen actividades en el horario semanal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Mis Horas Semanales
              </CardTitle>
              <CardDescription>
                Calculadas desde tus actividades en el horario semanal
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenViewHours}
              >
                <History className="h-4 w-4 mr-2" />
                Ver Historial
              </Button>
              <Button
                size="sm"
                onClick={handleOpenAddHours}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Horas
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Horas de Horario
            </div>
            <div className="text-2xl font-bold text-primary">
              {hoursData.calculated_hours.toFixed(2)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculadas automáticamente
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Ajuste Manual
            </div>
            <div className={`text-2xl font-bold ${
              hoursData.manual_adjustment_hours > 0 
                ? 'text-green-600' 
                : hoursData.manual_adjustment_hours < 0 
                ? 'text-red-600' 
                : 'text-muted-foreground'
            }`}>
              {hoursData.manual_adjustment_hours > 0 ? '+' : ''}{hoursData.manual_adjustment_hours.toFixed(2)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hoursData.manual_adjustment_hours === 0 ? 'Sin ajustes' : 'Por admin'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-lg text-white">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
              <Clock className="h-4 w-4" />
              Total Semanal
            </div>
            <div className="text-3xl font-bold">
              {hoursData.total_hours.toFixed(2)}h
            </div>
            <p className="text-xs text-white/80 mt-1">
              Horas totales
            </p>
          </div>
        </div>

        {hoursData.last_calculated_at && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Última actualización: {new Date(hoursData.last_calculated_at).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-xs">
              💡 Tus horas se actualizan automáticamente desde el horario. Las horas extras requieren aprobación del administrador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <AddExtraHoursDialog
        open={showAddHours}
        onOpenChange={handleCloseAddHours}
        userId={userId}
      />

      <ViewExtraHoursDialog
        open={showViewHours}
        onOpenChange={handleCloseViewHours}
        userId={userId}
      />
    </>
  );
});
