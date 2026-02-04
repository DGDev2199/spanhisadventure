import { useState, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Mountain, 
  Palette, 
  Calendar, 
  Users,
  Plus
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface StaffHoursDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string;
}

interface HoursDetail {
  id: string;
  source_type: string;
  source_title: string;
  hours: number;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
}

const SOURCE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; labelEn: string }> = {
  class: { icon: BookOpen, color: 'bg-blue-500', label: 'Clases', labelEn: 'Classes' },
  adventure: { icon: Mountain, color: 'bg-green-500', label: 'Aventuras', labelEn: 'Adventures' },
  elective: { icon: Palette, color: 'bg-purple-500', label: 'Electivas', labelEn: 'Electives' },
  tutoring: { icon: Users, color: 'bg-orange-500', label: 'Tutorías', labelEn: 'Tutoring' },
  event: { icon: Calendar, color: 'bg-pink-500', label: 'Eventos', labelEn: 'Events' },
  booking: { icon: Clock, color: 'bg-cyan-500', label: 'Reservas', labelEn: 'Bookings' },
  extra: { icon: Plus, color: 'bg-yellow-500', label: 'Horas Extras', labelEn: 'Extra Hours' },
};

function StaffHoursDetailDialogComponent({ 
  open, 
  onOpenChange, 
  userId,
  userName 
}: StaffHoursDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const locale = i18n.language === 'es' ? es : enUS;

  const handlePreviousMonth = useCallback(() => {
    setSelectedMonth(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(prev => addMonths(prev, 1));
  }, []);

  const { data: hoursDetails = [], isLoading } = useQuery({
    queryKey: ['staff-hours-detail', userId, format(selectedMonth, 'yyyy-MM-01')],
    queryFn: async () => {
      const monthStart = format(selectedMonth, 'yyyy-MM-01');
      
      const { data, error } = await supabase
        .from('staff_hours_detail')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthStart)
        .order('source_type', { ascending: true })
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return (data || []) as HoursDetail[];
    },
    enabled: open && !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Group hours by source_type
  const groupedHours = useMemo(() => {
    const groups: Record<string, { items: HoursDetail[]; total: number }> = {};
    
    hoursDetails.forEach((detail) => {
      if (!groups[detail.source_type]) {
        groups[detail.source_type] = { items: [], total: 0 };
      }
      groups[detail.source_type].items.push(detail);
      groups[detail.source_type].total += Number(detail.hours);
    });
    
    return groups;
  }, [hoursDetails]);

  const totalHours = useMemo(() => {
    return hoursDetails.reduce((sum, d) => sum + Number(d.hours), 0);
  }, [hoursDetails]);

  const maxHours = useMemo(() => {
    const values = Object.values(groupedHours).map(g => g.total);
    return Math.max(...values, 1);
  }, [groupedHours]);

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getDayName = (dayOfWeek: number | null) => {
    if (dayOfWeek === null) return '';
    const days = i18n.language === 'es' 
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('staffHours.hoursSummary', 'Desglose de Horas')}
            {userName && <span className="text-muted-foreground">- {userName}</span>}
          </DialogTitle>
          <DialogDescription>
            {t('staffHours.detailFor', 'Detalle de horas para')} {format(selectedMonth, 'MMMM yyyy', { locale })}
          </DialogDescription>
        </DialogHeader>

        {/* Month Navigator */}
        <div className="flex items-center justify-between py-2 border-b">
          <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('staffHours.previousMonth', 'Anterior')}
          </Button>
          <span className="font-semibold capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale })}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNextMonth}
            disabled={selectedMonth >= startOfMonth(new Date())}
          >
            {t('staffHours.nextMonth', 'Siguiente')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : hoursDetails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t('staffHours.noHoursThisMonth', 'No hay horas registradas este mes')}</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Summary Chart */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {t('staffHours.byActivityType', 'Por Tipo de Actividad')}
                </h3>
                <div className="space-y-2">
                  {Object.entries(groupedHours).map(([type, { total }]) => {
                    const config = SOURCE_TYPE_CONFIG[type] || SOURCE_TYPE_CONFIG.class;
                    const Icon = config.icon;
                    const label = i18n.language === 'es' ? config.label : config.labelEn;
                    const percentage = (total / maxHours) * 100;
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${config.color} text-white`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <span>{label}</span>
                          </div>
                          <span className="font-semibold">{total.toFixed(1)}h</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {t('staffHours.detail', 'Detalle')}
                </h3>
                
                {Object.entries(groupedHours).map(([type, { items, total }]) => {
                  const config = SOURCE_TYPE_CONFIG[type] || SOURCE_TYPE_CONFIG.class;
                  const Icon = config.icon;
                  const label = i18n.language === 'es' ? config.label : config.labelEn;
                  
                  return (
                    <div key={type} className="border rounded-lg overflow-hidden">
                      <div className={`flex items-center justify-between p-3 ${config.color} bg-opacity-10`}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${config.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold">{label}</span>
                          <Badge variant="secondary">{items.length}</Badge>
                        </div>
                        <span className="font-bold text-lg">{total.toFixed(1)}h</span>
                      </div>
                      <div className="divide-y">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50">
                            <div className="flex-1">
                              <p className="font-medium">{item.source_title}</p>
                              {item.day_of_week !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {getDayName(item.day_of_week)}
                                  {item.start_time && item.end_time && (
                                    <span> • {formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">{Number(item.hours).toFixed(1)}h</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer Total */}
        <div className="border-t pt-4 flex items-center justify-between">
          <span className="text-muted-foreground">
            {t('staffHours.totalMonth', 'Total del mes')}
          </span>
          <span className="text-2xl font-bold text-primary">
            {totalHours.toFixed(1)}h
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const StaffHoursDetailDialog = memo(StaffHoursDetailDialogComponent);
