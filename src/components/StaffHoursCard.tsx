import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, TrendingUp, Plus, History, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AddExtraHoursDialog } from '@/components/AddExtraHoursDialog';
import { ViewExtraHoursDialog } from '@/components/ViewExtraHoursDialog';
import { StaffHoursDetailDialog } from '@/components/StaffHoursDetailDialog';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface StaffHoursCardProps {
  userId: string;
}

function StaffHoursCardComponent({ userId }: StaffHoursCardProps) {
  const { t, i18n } = useTranslation();
  const [showAddHours, setShowAddHours] = useState(false);
  const [showViewHours, setShowViewHours] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const locale = i18n.language === 'es' ? es : enUS;
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale });

  const handleOpenAddHours = useCallback(() => setShowAddHours(true), []);
  const handleCloseAddHours = useCallback((open: boolean) => setShowAddHours(open), []);
  const handleOpenViewHours = useCallback(() => setShowViewHours(true), []);
  const handleCloseViewHours = useCallback((open: boolean) => setShowViewHours(open), []);
  const handleOpenDetailDialog = useCallback(() => setShowDetailDialog(true), []);
  const handleCloseDetailDialog = useCallback((open: boolean) => setShowDetailDialog(open), []);

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
            {t('staffHours.myHours', 'Mis Horas')}
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
            {t('staffHours.myHours', 'Mis Horas')}
          </CardTitle>
          <CardDescription>
            {t('staffHours.monthlyHours', 'Horas mensuales')} - {currentMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {t('staffHours.noHoursThisMonth', 'No hay horas registradas aún. Las horas se calcularán automáticamente cuando se te asignen actividades en el horario semanal.')}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('staffHours.monthlyHours', 'Mis Horas Mensuales')}
              </CardTitle>
              <CardDescription className="capitalize">
                {currentMonth}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenDetailDialog}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('staffHours.viewBreakdown', 'Ver Desglose')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenViewHours}
              >
                <History className="h-4 w-4 mr-2" />
                {t('staffHours.history', 'Historial')}
              </Button>
              <Button
                size="sm"
                onClick={handleOpenAddHours}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('staffHours.addHours', 'Agregar')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/80 border p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                {t('staffHours.scheduleHours', 'Horas de Horario')}
              </div>
              <div className="text-2xl font-bold text-primary">
                {hoursData.calculated_hours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('staffHours.calculatedFrom', 'Calculadas automáticamente')}
              </p>
            </div>

            <div className="bg-card/80 border p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                {t('staffHours.extraHours', 'Horas Extras')}
              </div>
              <div className={`text-2xl font-bold ${
                hoursData.manual_adjustment_hours > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : hoursData.manual_adjustment_hours < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-muted-foreground'
              }`}>
                {hoursData.manual_adjustment_hours > 0 ? '+' : ''}{hoursData.manual_adjustment_hours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {hoursData.manual_adjustment_hours === 0 
                  ? t('staffHours.noAdjustments', 'Sin ajustes') 
                  : t('staffHours.byAdmin', 'Aprobadas')}
              </p>
            </div>

            <div className="bg-primary p-4 rounded-lg text-primary-foreground">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80 mb-1">
                <Clock className="h-4 w-4" />
                {t('staffHours.totalMonth', 'Total del Mes')}
              </div>
              <div className="text-3xl font-bold">
                {hoursData.total_hours.toFixed(2)}h
              </div>
              <p className="text-xs text-primary-foreground/80 mt-1">
                {t('staffHours.totalHours', 'Horas totales')}
              </p>
            </div>
          </div>

          {hoursData.last_calculated_at && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {t('staffHours.lastUpdated', 'Última actualización')}: {new Date(hoursData.last_calculated_at).toLocaleString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          <Alert className="bg-muted/50 border-muted">
            <AlertDescription className="text-xs">
              💡 {t('staffHours.hoursInfo', 'Tus horas se actualizan automáticamente desde el horario. Las horas extras requieren aprobación del administrador.')}
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

      <StaffHoursDetailDialog
        open={showDetailDialog}
        onOpenChange={handleCloseDetailDialog}
        userId={userId}
      />
    </>
  );
}

export const StaffHoursCard = memo(StaffHoursCardComponent);
