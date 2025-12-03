import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSwipeable } from "react-swipeable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Lun", fullLabel: "Lunes" },
  { value: 2, label: "Mar", fullLabel: "Martes" },
  { value: 3, label: "Mié", fullLabel: "Miércoles" },
  { value: 4, label: "Jue", fullLabel: "Jueves" },
  { value: 5, label: "Vie", fullLabel: "Viernes" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

type StudentSchedule = {
  studentId: string;
  studentName: string;
  days: {
    day: number;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }[];
};

export function MyScheduleDialog({
  open,
  onOpenChange,
  userId,
  userRole,
}: MyScheduleDialogProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

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

  // Group by student
  const studentSchedules: StudentSchedule[] = schedules?.reduce((acc, schedule) => {
    const existingStudent = acc.find(s => s.studentId === schedule.student_id);
    const dayInfo = DAYS.find(d => d.value === schedule.day_of_week);
    
    if (existingStudent) {
      existingStudent.days.push({
        day: schedule.day_of_week,
        dayLabel: dayInfo?.label || '',
        startTime: schedule.start_time.slice(0, 5),
        endTime: schedule.end_time.slice(0, 5),
      });
    } else {
      acc.push({
        studentId: schedule.student_id,
        studentName: schedule.studentName,
        days: [{
          day: schedule.day_of_week,
          dayLabel: dayInfo?.label || '',
          startTime: schedule.start_time.slice(0, 5),
          endTime: schedule.end_time.slice(0, 5),
        }]
      });
    }
    return acc;
  }, [] as StudentSchedule[]) || [];

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentStudentIndex(prev => 
      Math.min(studentSchedules.length - 1, prev + 1)
    ),
    onSwipedRight: () => setCurrentStudentIndex(prev => Math.max(0, prev - 1)),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  const renderStudentCard = (student: StudentSchedule) => (
    <Card key={student.studentId} className="border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium">{student.studentName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {student.days.map((day, idx) => (
            <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 px-2 py-1">
              <span className="font-medium">{day.dayLabel}</span>
              <Clock className="h-3 w-3" />
              <span className="text-xs">{day.startTime} - {day.endTime}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Mi Horario de {userRole === "teacher" ? "Clases" : "Tutorías"}</DialogTitle>
            {/* Mobile navigation */}
            {studentSchedules.length > 1 && (
              <div className="flex items-center gap-2 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStudentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentStudentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentStudentIndex + 1} / {studentSchedules.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStudentIndex(prev => 
                    Math.min(studentSchedules.length - 1, prev + 1)
                  )}
                  disabled={currentStudentIndex === studentSchedules.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {studentSchedules.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {studentSchedules.length} estudiante{studentSchedules.length !== 1 ? 's' : ''} asignado{studentSchedules.length !== 1 ? 's' : ''}
            </p>
          )}
          {studentSchedules.length > 1 && (
            <p className="text-xs text-muted-foreground md:hidden">
              Desliza para cambiar de estudiante
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !schedules || schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tienes horarios asignados
          </p>
        ) : (
          <div {...handlers} className="flex-1 min-h-0">
            {/* Desktop: Show all students with scroll */}
            <ScrollArea className="hidden md:block h-[50vh]">
              <div className="space-y-3 pr-4">
                {studentSchedules.map(student => renderStudentCard(student))}
              </div>
            </ScrollArea>
            
            {/* Mobile: Show one student at a time */}
            <div className="md:hidden">
              {studentSchedules[currentStudentIndex] && 
                renderStudentCard(studentSchedules[currentStudentIndex])
              }
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
