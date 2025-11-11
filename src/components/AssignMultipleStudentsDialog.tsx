import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Plus, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AssignMultipleStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
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

export function AssignMultipleStudentsDialog({
  open,
  onOpenChange,
  teacherId,
}: AssignMultipleStudentsDialogProps) {
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState<"class" | "tutoring">("class");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch students assigned to this teacher/tutor
  const { data: students } = useQuery({
    queryKey: ["teacher-students", teacherId, scheduleType],
    queryFn: async () => {
      const field = scheduleType === "class" ? "teacher_id" : "tutor_id";
      
      const { data, error } = await supabase
        .from("student_profiles")
        .select(`
          user_id,
          profiles!inner(id, full_name)
        `)
        .eq(field, teacherId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Add schedules mutation
  const addSchedulesMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Create schedules for each selected student and each selected day
      const schedulesToCreate = [];
      for (const studentId of selectedStudents) {
        for (const day of selectedDays) {
          const scheduleData: any = {
            student_id: studentId,
            schedule_type: scheduleType,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
            created_by: user.id,
          };

          if (scheduleType === "class") {
            scheduleData.teacher_id = teacherId;
          } else {
            scheduleData.tutor_id = teacherId;
          }

          schedulesToCreate.push(scheduleData);
        }
      }

      const { error } = await supabase
        .from("student_class_schedules")
        .insert(schedulesToCreate);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-class-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["class-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["tutoring-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["staff-hours"] });
      const totalSchedules = selectedStudents.length * selectedDays.length;
      toast.success(`${totalSchedules} horario${totalSchedules > 1 ? 's' : ''} asignado${totalSchedules > 1 ? 's' : ''} exitosamente`);
      setSelectedStudents([]);
      setSelectedDays([1]);
      setStartTime("09:00");
      setEndTime("10:00");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al asignar horarios");
      console.error(error);
    },
  });

  const handleAssign = () => {
    if (selectedStudents.length === 0) {
      toast.error("Por favor selecciona al menos un estudiante");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Por favor selecciona al menos un día");
      return;
    }
    addSchedulesMutation.mutate();
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Horario a Múltiples Estudiantes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Horario</Label>
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
            <Label>Estudiantes (selecciona uno o varios)</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {!students || students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay estudiantes asignados</p>
              ) : (
                students.map((student: any) => (
                  <div key={student.user_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.user_id}`}
                      checked={selectedStudents.includes(student.user_id)}
                      onCheckedChange={() => toggleStudent(student.user_id)}
                    />
                    <label
                      htmlFor={`student-${student.user_id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {student.profiles.full_name}
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedStudents.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedStudents.length} estudiante{selectedStudents.length > 1 ? 's' : ''} seleccionado{selectedStudents.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Días de la Semana (selecciona uno o varios)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-3">
              {DAYS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDays.length} día{selectedDays.length > 1 ? 's' : ''} seleccionado{selectedDays.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={addSchedulesMutation.isPending || selectedStudents.length === 0 || selectedDays.length === 0}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addSchedulesMutation.isPending ? 'Asignando...' : `Asignar a ${selectedStudents.length} estudiante${selectedStudents.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
