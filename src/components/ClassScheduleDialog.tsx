import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ClassScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

const DAYS = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Lun", fullLabel: "Lunes" },
  { value: 2, label: "Mar", fullLabel: "Martes" },
  { value: 3, label: "Mié", fullLabel: "Miércoles" },
  { value: 4, label: "Jue", fullLabel: "Jueves" },
  { value: 5, label: "Vie", fullLabel: "Viernes" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

export function ClassScheduleDialog({
  open,
  onOpenChange,
  studentId,
}: ClassScheduleDialogProps) {
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

      // Fetch teacher names
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

  // Group schedules by day
  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const dayInfo = DAYS.find(d => d.value === schedule.day_of_week);
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = {
        dayLabel: dayInfo?.label || '',
        fullLabel: dayInfo?.fullLabel || '',
        items: []
      };
    }
    acc[schedule.day_of_week].items.push({
      startTime: schedule.start_time.slice(0, 5),
      endTime: schedule.end_time.slice(0, 5),
      teacherName: schedule.teacherName
    });
    return acc;
  }, {} as Record<number, { dayLabel: string; fullLabel: string; items: { startTime: string; endTime: string; teacherName: string }[] }>);

  const totalClasses = schedules?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Mi Horario de Clases
          </DialogTitle>
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
        ) : (
          <ScrollArea className="flex-1 min-h-0 h-[50vh]">
            <div className="space-y-3 pr-4">
              {Object.entries(schedulesByDay || {}).map(([dayValue, dayData]) => (
                <Card key={dayValue} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{dayData.fullLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dayData.items.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
