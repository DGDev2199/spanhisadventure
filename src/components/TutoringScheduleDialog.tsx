import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TutoringScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function TutoringScheduleDialog({
  open,
  onOpenChange,
  studentId,
}: TutoringScheduleDialogProps) {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["tutoring-schedule", studentId, open],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_schedules")
        .select(`
          *
        `)
        .eq("student_id", studentId)
        .eq("schedule_type", "tutoring")
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Group by day
  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, typeof schedules>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mi Horario de Tutorías</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p>Cargando horario...</p>
        ) : !schedules || schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tienes horarios de tutoría asignados
          </p>
        ) : (
          <div className="space-y-4">
            {DAYS.filter(day => schedulesByDay?.[day.value]).map((day) => (
              <Card key={day.value}>
                <CardHeader>
                  <CardTitle className="text-lg">{day.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {schedulesByDay?.[day.value]?.map((schedule) => (
                    <div key={schedule.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tutor asignado
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
