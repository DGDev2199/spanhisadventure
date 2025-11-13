import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSwipeable } from "react-swipeable";

interface MyScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "teacher" | "tutor";
}

type ScheduleWithStudent = {
  id: string;
  student_id: string;
  teacher_id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  schedule_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  studentName: string;
};

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function MyScheduleDialog({
  open,
  onOpenChange,
  userId,
  userRole,
}: MyScheduleDialogProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const { data: schedules, isLoading } = useQuery<ScheduleWithStudent[]>({
    queryKey: ["my-schedule", userId, userRole, open],
    queryFn: async (): Promise<ScheduleWithStudent[]> => {
      const column = userRole === "teacher" ? "teacher_id" : "tutor_id";
      const { data, error } = await supabase
        .from("student_class_schedules")
        .select('*')
        .eq(column, userId)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Fetch student names separately
      const studentIds = [...new Set(data.map(s => s.student_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      return data.map(schedule => ({
        ...schedule,
        studentName: profileMap.get(schedule.student_id) || 'Estudiante'
      }));
    },
    enabled: open,
  });

  // Group by day
  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, ScheduleWithStudent[]>);

  const daysWithSchedules = DAYS.filter(day => schedulesByDay?.[day.value]);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentDayIndex(prev => 
      Math.min(daysWithSchedules.length - 1, prev + 1)
    ),
    onSwipedRight: () => setCurrentDayIndex(prev => Math.max(0, prev - 1)),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Mi Horario de {userRole === "teacher" ? "Clases" : "Tutorías"}</DialogTitle>
            {daysWithSchedules.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentDayIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentDayIndex + 1} / {daysWithSchedules.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDayIndex(prev => 
                    Math.min(daysWithSchedules.length - 1, prev + 1)
                  )}
                  disabled={currentDayIndex === daysWithSchedules.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {daysWithSchedules.length > 1 && (
            <p className="text-xs text-muted-foreground md:hidden">
              Desliza para cambiar de día
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <p>Cargando horario...</p>
        ) : !schedules || schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tienes horarios asignados
          </p>
        ) : (
          <div {...handlers}>
            {/* Desktop: Mostrar todos los días */}
            <div className="hidden md:block space-y-4">
              {daysWithSchedules.map((day) => (
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
                            {schedule.studentName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Mobile: Mostrar un día a la vez */}
            <div className="md:hidden">
              {daysWithSchedules[currentDayIndex] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{daysWithSchedules[currentDayIndex].label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {schedulesByDay?.[daysWithSchedules[currentDayIndex].value]?.map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.studentName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}