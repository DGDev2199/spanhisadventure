import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mi Horario de {userRole === "teacher" ? "Clases" : "Tutorías"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p>Cargando horario...</p>
        ) : !schedules || schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tienes horarios asignados
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
                          {schedule.studentName}
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