import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ManageStudentScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
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

export function ManageStudentScheduleDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: ManageStudentScheduleDialogProps) {
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState<"class" | "tutoring">("class");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [staffId, setStaffId] = useState("");

  // Fetch current schedules
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["student-class-schedules", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_schedules")
        .select(`
          *,
          teacher:teacher_id(id, full_name),
          tutor:tutor_id(id, full_name)
        `)
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ["teachers-for-schedule"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (!roles?.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", roles.map(r => r.user_id));

      return profiles || [];
    },
    enabled: open,
  });

  // Fetch tutors
  const { data: tutors } = useQuery({
    queryKey: ["tutors-for-schedule"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "tutor");

      if (!roles?.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", roles.map(r => r.user_id));

      return profiles || [];
    },
    enabled: open,
  });

  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const scheduleData: any = {
        student_id: studentId,
        schedule_type: scheduleType,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        created_by: user.id,
      };

      if (scheduleType === "class") {
        scheduleData.teacher_id = staffId;
      } else {
        scheduleData.tutor_id = staffId;
      }

      const { error } = await supabase
        .from("student_class_schedules")
        .insert(scheduleData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-class-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["staff-hours"] });
      toast.success("Horario agregado exitosamente");
      setStaffId("");
      setStartTime("09:00");
      setEndTime("10:00");
    },
    onError: (error) => {
      toast.error("Error al agregar horario");
      console.error(error);
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("student_class_schedules")
        .update({ is_active: false })
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-class-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["staff-hours"] });
      toast.success("Horario eliminado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar horario");
      console.error(error);
    },
  });

  const handleAddSchedule = () => {
    if (!staffId) {
      toast.error("Por favor selecciona un profesor o tutor");
      return;
    }
    addScheduleMutation.mutate();
  };

  const classSchedules = schedules?.filter(s => s.schedule_type === "class") || [];
  const tutoringSchedules = schedules?.filter(s => s.schedule_type === "tutoring") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Horario de {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Clase</SelectItem>
                      <SelectItem value="tutoring">Tutoría</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Día</Label>
                  <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>{scheduleType === "class" ? "Profesor" : "Tutor"}</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar ${scheduleType === "class" ? "profesor" : "tutor"}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(scheduleType === "class" ? teachers : tutors)?.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddSchedule} disabled={addScheduleMutation.isPending} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Horario
              </Button>
            </CardContent>
          </Card>

          {/* Current schedules */}
          {schedulesLoading ? (
            <p>Cargando horarios...</p>
          ) : (
            <div className="space-y-4">
              {/* Class schedules */}
              <Card>
                <CardHeader>
                  <CardTitle>Horario de Clases</CardTitle>
                </CardHeader>
                <CardContent>
                  {classSchedules.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay horarios de clase asignados</p>
                  ) : (
                    <div className="space-y-2">
                      {classSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {DAYS.find(d => d.value === schedule.day_of_week)?.label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} con{" "}
                                {(schedule.teacher as any)?.full_name}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            disabled={deleteScheduleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tutoring schedules */}
              <Card>
                <CardHeader>
                  <CardTitle>Horario de Tutorías</CardTitle>
                </CardHeader>
                <CardContent>
                  {tutoringSchedules.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay horarios de tutoría asignados</p>
                  ) : (
                    <div className="space-y-2">
                      {tutoringSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {DAYS.find(d => d.value === schedule.day_of_week)?.label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} con{" "}
                                {(schedule.tutor as any)?.full_name}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            disabled={deleteScheduleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
