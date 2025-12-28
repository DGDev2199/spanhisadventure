import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { DaySelector } from '@/components/ui/day-selector';
import { useSwipeable } from 'react-swipeable';

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS_CONFIG = [
  { value: 0, label: "Dom", fullLabel: "Domingo", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: 1, label: "Lun", fullLabel: "Lunes", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: 2, label: "Mar", fullLabel: "Martes", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: 3, label: "Mié", fullLabel: "Miércoles", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: 4, label: "Jue", fullLabel: "Jueves", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: 5, label: "Vie", fullLabel: "Viernes", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: 6, label: "Sáb", fullLabel: "Sábado", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
];

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

export const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedSlots, setSelectedSlots] = useState<Map<string, boolean>>(new Map());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot>({ day_of_week: 1, start_time: '09:00', end_time: '10:00' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [selectedMobileDay, setSelectedMobileDay] = useState(1); // Monday

  const dayHandlers = useSwipeable({
    onSwipedLeft: () => {
      setSelectedMobileDay(prev => prev < 6 ? prev + 1 : 0);
    },
    onSwipedRight: () => {
      setSelectedMobileDay(prev => prev > 0 ? prev - 1 : 6);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  // Fetch availability from profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['staff-availability', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('availability')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Parse availability string into slots
  useEffect(() => {
    if (profile?.availability) {
      try {
        const slots = JSON.parse(profile.availability);
        const newSelected = new Map<string, boolean>();
        slots.forEach((slot: TimeSlot) => {
          const startHour = parseInt(slot.start_time.split(':')[0]);
          const endHour = parseInt(slot.end_time.split(':')[0]);
          for (let h = startHour; h < endHour; h++) {
            newSelected.set(`${slot.day_of_week}-${h}`, true);
          }
        });
        setSelectedSlots(newSelected);
      } catch {
        // If not JSON, it's old format - ignore
      }
    }
  }, [profile]);

  // Save availability
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      // Convert selected slots to time ranges
      const slotsByDay = new Map<number, number[]>();
      selectedSlots.forEach((_, key) => {
        const [day, hour] = key.split('-').map(Number);
        if (!slotsByDay.has(day)) slotsByDay.set(day, []);
        slotsByDay.get(day)?.push(hour);
      });

      const slots: TimeSlot[] = [];
      slotsByDay.forEach((hours, day) => {
        hours.sort((a, b) => a - b);
        let start = hours[0];
        let end = hours[0] + 1;
        
        for (let i = 1; i < hours.length; i++) {
          if (hours[i] === end) {
            end = hours[i] + 1;
          } else {
            slots.push({
              day_of_week: day,
              start_time: `${start.toString().padStart(2, '0')}:00`,
              end_time: `${end.toString().padStart(2, '0')}:00`,
            });
            start = hours[i];
            end = hours[i] + 1;
          }
        }
        slots.push({
          day_of_week: day,
          start_time: `${start.toString().padStart(2, '0')}:00`,
          end_time: `${end.toString().padStart(2, '0')}:00`,
        });
      });

      const { error } = await supabase
        .from('profiles')
        .update({ availability: JSON.stringify(slots) })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Disponibilidad guardada');
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
    },
    onError: () => {
      toast.error('Error al guardar disponibilidad');
    },
  });

  const toggleSlot = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const newSelected = new Map(selectedSlots);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.set(key, true);
    }
    setSelectedSlots(newSelected);
  };

  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging && dragStart) {
      const key = `${day}-${hour}`;
      const newSelected = new Map(selectedSlots);
      // Toggle based on the first cell's state
      const startKey = `${dragStart.day}-${dragStart.hour}`;
      if (selectedSlots.has(startKey)) {
        newSelected.set(key, true);
      } else {
        newSelected.delete(key);
      }
      setSelectedSlots(newSelected);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const addManualSlot = () => {
    const startHour = parseInt(newSlot.start_time.split(':')[0]);
    const endHour = parseInt(newSlot.end_time.split(':')[0]);
    
    if (endHour <= startHour) {
      toast.error('La hora de fin debe ser mayor que la de inicio');
      return;
    }

    const newSelected = new Map(selectedSlots);
    for (let h = startHour; h < endHour; h++) {
      newSelected.set(`${newSlot.day_of_week}-${h}`, true);
    }
    setSelectedSlots(newSelected);
    setAddDialogOpen(false);
  };

  const clearAll = () => {
    setSelectedSlots(new Map());
  };

  const formatAvailabilityText = () => {
    const slotsByDay = new Map<number, string[]>();
    selectedSlots.forEach((_, key) => {
      const [day, hour] = key.split('-').map(Number);
      if (!slotsByDay.has(day)) slotsByDay.set(day, []);
      slotsByDay.get(day)?.push(`${hour}:00`);
    });

    const result: string[] = [];
    DAYS.forEach((dayName, dayIndex) => {
      const hours = slotsByDay.get(dayIndex);
      if (hours && hours.length > 0) {
        hours.sort();
        result.push(`${dayName}: ${hours[0]} - ${parseInt(hours[hours.length - 1]) + 1}:00`);
      }
    });
    return result;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Mobile single-day view
  const renderMobileCalendar = () => {
    const currentDayInfo = DAYS_CONFIG[selectedMobileDay];

    return (
      <div {...dayHandlers} className="space-y-4">
        <DaySelector
          days={DAYS_CONFIG}
          selectedDay={selectedMobileDay}
          onSelectDay={setSelectedMobileDay}
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Desliza para cambiar de día • Toca para seleccionar horas
        </p>

        <div className="space-y-1">
          {HOURS.map((hour) => {
            const isSelected = selectedSlots.has(`${selectedMobileDay}-${hour}`);
            return (
              <div key={hour} className="flex gap-2 items-center">
                <div className="w-14 text-xs text-muted-foreground flex-shrink-0">
                  {hour}:00
                </div>
                <button
                  className={cn(
                    "flex-1 h-10 rounded-lg transition-colors border text-sm font-medium",
                    isSelected 
                      ? currentDayInfo?.color || "bg-primary text-primary-foreground" 
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  )}
                  onClick={() => toggleSlot(selectedMobileDay, hour)}
                >
                  {isSelected ? "Disponible" : ""}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Desktop full calendar view
  const renderDesktopCalendar = () => (
    <div 
      className="select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="grid grid-cols-8 gap-1 mb-2">
        <div className="text-xs font-medium text-muted-foreground p-2">Hora</div>
        {DAYS.map((day, index) => (
          <div key={day} className="text-xs font-medium text-center p-2 truncate">
            <span className="hidden lg:inline">{day}</span>
            <span className="lg:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Time Slots */}
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
          <div className="text-xs text-muted-foreground p-2 flex items-center">
            {hour}:00
          </div>
          {DAYS.map((_, dayIndex) => {
            const isSelected = selectedSlots.has(`${dayIndex}-${hour}`);
            return (
              <button
                key={`${dayIndex}-${hour}`}
                className={cn(
                  "h-8 rounded transition-colors border",
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "bg-muted/30 border-border hover:bg-muted/50"
                )}
                onMouseDown={() => handleMouseDown(dayIndex, hour)}
                onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5" />
              Mi Disponibilidad
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isMobile ? "Toca para seleccionar horas" : "Haz clic o arrastra para seleccionar"}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          {isMobile ? renderMobileCalendar() : renderDesktopCalendar()}
        </div>

        {/* Summary */}
        {selectedSlots.size > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resumen de Disponibilidad
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {formatAvailabilityText().map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Slot Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Disponibilidad</DialogTitle>
            <DialogDescription>
              Agrega un bloque de tiempo disponible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Día</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md bg-background"
                value={newSlot.day_of_week}
                onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
              >
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={addManualSlot} className="w-full sm:w-auto">
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
