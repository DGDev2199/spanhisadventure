import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, ChevronLeft, ChevronRight, Calendar, LayoutGrid, List, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSwipeable } from "react-swipeable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { toast } from "sonner";

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
  { value: 0, label: "Dom", fullLabel: "Domingo", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: 1, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: 2, label: "Mar", fullLabel: "Martes", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: 3, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: 4, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: 5, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: 6, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
];

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`);

type StudentSchedule = {
  studentId: string;
  studentName: string;
  days: {
    day: number;
    dayLabel: string;
    dayColor: string;
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!calendarRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `mi-horario-${userRole === "teacher" ? "clases" : "tutorias"}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Horario exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar el horario");
    } finally {
      setIsExporting(false);
    }
  };

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

  const studentSchedules: StudentSchedule[] = schedules?.reduce((acc, schedule) => {
    const existingStudent = acc.find(s => s.studentId === schedule.student_id);
    const dayInfo = DAYS.find(d => d.value === schedule.day_of_week);
    
    if (existingStudent) {
      existingStudent.days.push({
        day: schedule.day_of_week,
        dayLabel: dayInfo?.label || '',
        dayColor: dayInfo?.color || '',
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
          dayColor: dayInfo?.color || '',
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

  const getScheduleForSlot = (dayValue: number, timeSlot: string) => {
    return schedules?.filter(s => {
      const startHour = parseInt(s.start_time.slice(0, 2));
      const endHour = parseInt(s.end_time.slice(0, 2));
      const slotHour = parseInt(timeSlot.slice(0, 2));
      return s.day_of_week === dayValue && slotHour >= startHour && slotHour < endHour;
    }) || [];
  };

  const renderStudentCard = (student: StudentSchedule) => (
    <Card key={student.studentId} className="border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium">{student.studentName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {student.days.map((day, idx) => (
            <Badge key={idx} className={cn("flex items-center gap-1.5 px-2 py-1", day.dayColor)}>
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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <DialogTitle>Mi Horario de {userRole === "teacher" ? "Clases" : "Tutorías"}</DialogTitle>
            </div>
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
                  {isExporting ? "..." : "Exportar"}
                </Button>
              )}
              {viewMode === 'list' && studentSchedules.length > 1 && (
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
          </div>
          {studentSchedules.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {studentSchedules.length} estudiante{studentSchedules.length !== 1 ? 's' : ''} asignado{studentSchedules.length !== 1 ? 's' : ''}
            </p>
          )}
          {viewMode === 'list' && studentSchedules.length > 1 && (
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
        ) : viewMode === 'list' ? (
          <div {...handlers} className="flex-1 min-h-0">
            <ScrollArea className="hidden md:block h-[50vh]">
              <div className="space-y-3 pr-4">
                {studentSchedules.map(student => renderStudentCard(student))}
              </div>
            </ScrollArea>
            
            <div className="md:hidden">
              {studentSchedules[currentStudentIndex] && 
                renderStudentCard(studentSchedules[currentStudentIndex])
              }
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 h-[55vh]">
            <div className="min-w-[600px]">
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
                    return (
                      <div key={day.value} className={cn(
                        "p-1 min-h-[32px] rounded text-xs border",
                        slotSchedules.length > 0 ? day.color : "bg-muted/30"
                      )}>
                        {slotSchedules.length > 0 && (
                          <div className="truncate font-medium">
                            {slotSchedules[0].studentName?.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
