import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CalendarDragCreateProps {
  day: number;
  hour: number;
  canEdit: boolean;
  onDragComplete: (startDay: number, endDay: number, startHour: number, endHour: number) => void;
  isSelecting: boolean;
  selectionStart: { day: number; hour: number } | null;
  selectionEnd: { day: number; hour: number } | null;
  onMouseDown: (day: number, hour: number) => void;
  onMouseEnter: (day: number, hour: number) => void;
  children?: React.ReactNode;
}

export const CalendarDragCell = ({
  day,
  hour,
  canEdit,
  isSelecting,
  selectionStart,
  selectionEnd,
  onMouseDown,
  onMouseEnter,
  children,
}: CalendarDragCreateProps) => {
  // Detectar si esta celda está dentro del rectángulo de selección
  const isInSelection = useCallback(() => {
    if (!selectionStart || !selectionEnd) return false;
    
    const minDay = Math.min(selectionStart.day, selectionEnd.day);
    const maxDay = Math.max(selectionStart.day, selectionEnd.day);
    const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
    
    return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
  }, [selectionStart, selectionEnd, day, hour]);

  const isStart = selectionStart?.day === day && selectionStart?.hour === hour;
  const inSelection = isInSelection();

  return (
    <div
      className={cn(
        "min-h-[60px] border rounded-md p-1 bg-background relative transition-colors duration-100",
        canEdit && "cursor-crosshair hover:bg-primary/5",
        inSelection && "bg-primary/20 border-primary",
      )}
      onMouseDown={(e) => {
        if (canEdit && e.button === 0) {
          e.preventDefault();
          onMouseDown(day, hour);
        }
      }}
      onMouseEnter={() => {
        if (isSelecting && canEdit) {
          onMouseEnter(day, hour);
        }
      }}
    >
      {/* Selection preview overlay */}
      {inSelection && !children && (
        <div className="absolute inset-1 bg-primary/30 rounded border-2 border-dashed border-primary flex items-center justify-center">
          {isStart && (
            <span className="text-xs font-medium text-primary">
              {hour.toString().padStart(2, '0')}:00
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

interface UseCalendarDragProps {
  onCreateEvent: (startDay: number, endDay: number, startTime: string, endTime: string) => void;
}

export const useCalendarDrag = ({ onCreateEvent }: UseCalendarDragProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: number; hour: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ day: number; hour: number } | null>(null);

  const handleMouseDown = useCallback((day: number, hour: number) => {
    setIsSelecting(true);
    setSelectionStart({ day, hour });
    setSelectionEnd({ day, hour });
  }, []);

  // Permitir selección en cualquier día (multi-día / rectangular)
  const handleMouseEnter = useCallback((day: number, hour: number) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd({ day, hour });
    }
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionEnd) {
      const minDay = Math.min(selectionStart.day, selectionEnd.day);
      const maxDay = Math.max(selectionStart.day, selectionEnd.day);
      const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
      const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
      
      const startTime = `${minHour.toString().padStart(2, '0')}:00`;
      const endTime = `${(maxHour + 1).toString().padStart(2, '0')}:00`;
      
      onCreateEvent(minDay, maxDay, startTime, endTime);
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [isSelecting, selectionStart, selectionEnd, onCreateEvent]);

  // Global mouse up listener
  useEffect(() => {
    if (isSelecting) {
      const handleGlobalMouseUp = () => handleMouseUp();
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isSelecting, handleMouseUp]);

  return {
    isSelecting,
    selectionStart,
    selectionEnd,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
  };
};
