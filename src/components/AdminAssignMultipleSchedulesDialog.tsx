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
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminAssignMultipleSchedulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AdminAssignMultipleSchedulesDialog({
  open,
  onOpenChange,
}: AdminAssignMultipleSchedulesDialogProps) {
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState<"class" | "tutoring">("class");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch all students
  const { data: allStudents } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      // First get student profiles
      const { data: studentProfiles, error: profileError } = await supabase
        .from("student_profiles")
        .select("user_id")
        .eq("status", "active");

      if (profileError) throw profileError;
      
      if (!studentProfiles || studentProfiles.length === 0) return [];

      // Then get the profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentProfiles.map(sp => sp.user_id))
        .order("full_name");

      if (error) throw error;
      
      return data?.map(profile => ({
        user_id: profile.id,
        full_name: profile.full_name
      })) || [];
    },
    enabled: open,
  });

  // Fetch teachers or tutors based on schedule type
  const { data: staffMembers } = useQuery({
    queryKey: ["staff-members", scheduleType],
    queryFn: async () => {
      const role = scheduleType === "class" ? "teacher" : "tutor";
      
      // First get user_roles for the specific role
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", role);

      if (rolesError) throw rolesError;
      
      if (!userRoles || userRoles.length === 0) return [];

      // Then get the profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userRoles.map(ur => ur.user_id))
        .order("full_name");

      if (error) throw error;
      
      return data?.map(profile => ({
        user_id: profile.id,
        full_name: profile.full_name
      })) || [];
    },
    enabled: open,
  });

  // Add schedules mutation
  const addSchedulesMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      if (!selectedStaffId) throw new Error("Debe seleccionar un profesor o tutor");
      if (selectedStudents.length === 0) throw new Error("Debe seleccionar al menos un estudiante");
      if (selectedDays.length === 0) throw new Error("Debe seleccionar al menos un día");

      // Create schedules for each selected student and each selected day
      const schedulesToCreate = [];
      
      // For each unique day+time combination, generate a group_session_id if multiple students
      for (const day of selectedDays) {
        // Generate a unique group_session_id for this day+time slot when there are multiple students
        const groupSessionId = selectedStudents.length > 1 ? crypto.randomUUID() : null;
        
        for (const studentId of selectedStudents) {
          const scheduleData: any = {
            student_id: studentId,
            schedule_type: scheduleType,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
            created_by: user.id,
            group_session_id: groupSessionId, // Link students in the same group session
          };

          if (scheduleType === "class") {
            scheduleData.teacher_id = selectedStaffId;
          } else {
            scheduleData.tutor_id = selectedStaffId;
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
      
      // Reset form
      setSelectedStudents([]);
      setSelectedDays([1]);
      setStartTime("09:00");
      setEndTime("10:00");
      setSelectedStaffId("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al asignar horarios");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSchedulesMutation.mutate();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === allStudents?.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allStudents?.map((s) => s.user_id) || []);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Horarios a Múltiples Estudiantes
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Schedule Type Selection */}
              <div className="space-y-2">
                <Label>Tipo de Horario</Label>
                <Select
                  value={scheduleType}
                  onValueChange={(value: "class" | "tutoring") => {
                    setScheduleType(value);
                    setSelectedStaffId(""); // Reset staff selection when type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Clase</SelectItem>
                    <SelectItem value="tutoring">Tutoría</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Member Selection */}
              <div className="space-y-2">
                <Label>{scheduleType === "class" ? "Profesor" : "Tutor"}</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Seleccionar ${scheduleType === "class" ? "profesor" : "tutor"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers?.map((staff) => (
                      <SelectItem key={staff.user_id} value={staff.user_id}>
                        {staff.full_name || staff.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Days Selection */}
              <div className="space-y-2">
                <Label>Días de la Semana</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Hora de Inicio
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Hora de Fin
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Students Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Estudiantes ({selectedStudents.length} seleccionados)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAllStudents}
                  >
                    {selectedStudents.length === allStudents?.length
                      ? "Deseleccionar Todos"
                      : "Seleccionar Todos"}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {allStudents?.map((student) => (
                    <div key={student.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.user_id}`}
                        checked={selectedStudents.includes(student.user_id)}
                        onCheckedChange={() => toggleStudent(student.user_id)}
                      />
                      <label
                        htmlFor={`student-${student.user_id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {student.full_name || student.user_id}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                addSchedulesMutation.isPending ||
                selectedStudents.length === 0 ||
                selectedDays.length === 0 ||
                !selectedStaffId
              }
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addSchedulesMutation.isPending
                ? "Asignando..."
                : `Asignar ${selectedStudents.length * selectedDays.length} Horario${
                    selectedStudents.length * selectedDays.length > 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
