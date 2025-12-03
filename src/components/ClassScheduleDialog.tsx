import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, Calendar, LayoutGrid, List, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ClassScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

const DAYS = [
  { value: 0, label: "Dom", fullLabel: "Domingo", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: 1, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: 2, label: "Mar", fullLabel: "Martes", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: 3, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: 4, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: 5, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: 6, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
];

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);

export function ClassScheduleDialog({
  open,
  onOpenChange,
  studentId,
}: ClassScheduleDialogProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["class-schedule", studentId, open],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_schedules")
        .select(`*`)
        .eq("student_id", studentId)
        .eq("schedule_type", "class")
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;

      if (data && data.length > 0) {
        const teacherIds = [...new Set(data.filter(s => s.teacher_id).map(s => s.teacher_id))];
        if (teacherIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
          
          return data.map(schedule => ({
            ...schedule,
            teacherName: profileMap.get(schedule.teacher_id) || 'Profesor'
          }));
        }
      }

      return data?.map(s => ({ ...s, teacherName: 'Profesor' })) || [];
    },
    enabled: open,
  });

  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const dayInfo = DAYS.find(d => d.value === schedule.day_of_week);
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = {
        dayLabel: dayInfo?.label || '',
        fullLabel: dayInfo?.fullLabel || '',
        color: dayInfo?.color || '',
        items: []
      };
    }
    acc[schedule.day_of_week].items.push({
      startTime: schedule.start_time.slice(0, 5),
      endTime: schedule.end_time.slice(0, 5),
      teacherName: schedule.teacherName
    });
    return acc;
  }, {} as Record<number, { dayLabel: string; fullLabel: string; color: string; items: { startTime: string; endTime: string; teacherName: string }[] }>);

  const totalClasses = schedules?.length || 0;

  const getScheduleForSlot = (dayValue: number, timeSlot: string) => {
    return schedules?.filter(s => {
      const startHour = parseInt(s.start_time.slice(0, 2));
      const endHour = parseInt(s.end_time.slice(0, 2));
      const slotHour = parseInt(timeSlot.slice(0, 2));
      return s.day_of_week === dayValue && slotHour >= startHour && slotHour < endHour;
    }) || [];
  };

  const handleExport = async () => {
    if (!calendarRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `horario-clases-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Horario exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar el horario");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mi Horario de Clases
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              {viewMode === 'calendar' && schedules && schedules.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isExporting ? "Exportando..." : "Exportar"}
                </Button>
              )}
            </div>
          </div>
          {totalClasses > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalClasses} clase{totalClasses !== 1 ? 's' : ''} programada{totalClasses !== 1 ? 's' : ''}
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !schedules || schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tienes horarios de clase asignados
          </p>
        ) : viewMode === 'list' ? (
          <ScrollArea className="flex-1 min-h-0 h-[50vh]">
            <div className="space-y-3 pr-4">
              {Object.entries(schedulesByDay || {}).map(([dayValue, dayData]) => (
                <Card key={dayValue} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={cn("px-2 py-1", dayData.color)}>
                        {dayData.fullLabel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dayData.items.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs font-medium">{item.startTime} - {item.endTime}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <User className="h-3 w-3" />
                          <span className="text-xs">{item.teacherName}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1 min-h-0 h-[55vh]">
            <TooltipProvider>
              <div ref={calendarRef} className="min-w-[600px] p-2 bg-background">
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-xs font-medium text-muted-foreground">Hora</div>
                  {DAYS.slice(1, 7).concat(DAYS[0]).map((day) => (
                    <div key={day.value} className={cn("p-2 text-xs font-medium text-center rounded", day.color)}>
                      {day.label}
                    </div>
                  ))}
                </div>
                {TIME_SLOTS.map((timeSlot) => (
                  <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-1 text-xs text-muted-foreground">{timeSlot}</div>
                    {DAYS.slice(1, 7).concat(DAYS[0]).map((day) => {
                      const slotSchedules = getScheduleForSlot(day.value, timeSlot);
                      const hasSchedule = slotSchedules.length > 0;
                      
                      const cell = (
                        <div className={cn(
                          "p-1 min-h-[32px] rounded text-xs border cursor-default",
                          hasSchedule ? day.color : "bg-muted/30"
                        )}>
                          {hasSchedule && (
                            <div className="truncate font-medium">
                              {slotSchedules[0].teacherName?.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      );
                      
                      if (!hasSchedule) {
                        return <div key={day.value}>{cell}</div>;
                      }
                      
                      return (
                        <Tooltip key={day.value}>
                          <TooltipTrigger asChild>
                            {cell}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">{day.fullLabel}</p>
                              {slotSchedules.map((s, i) => (
                                <div key={i} className="text-sm">
                                  <p className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {s.teacherName}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
