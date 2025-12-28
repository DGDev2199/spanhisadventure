import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Day {
  value: number;
  label: string;
  fullLabel: string;
  color?: string;
}

interface DaySelectorProps {
  days: Day[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  className?: string;
}

export function DaySelector({ days, selectedDay, onSelectDay, className }: DaySelectorProps) {
  const currentIndex = days.findIndex(d => d.value === selectedDay);
  const currentDay = days[currentIndex];

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : days.length - 1;
    onSelectDay(days[newIndex].value);
  };

  const goToNext = () => {
    const newIndex = currentIndex < days.length - 1 ? currentIndex + 1 : 0;
    onSelectDay(days[newIndex].value);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Navigation with current day */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className={cn(
          "px-4 py-1.5 rounded-full text-sm font-medium min-w-[120px] text-center",
          currentDay?.color || "bg-primary/10 text-primary"
        )}>
          {currentDay?.fullLabel}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day pills for quick selection */}
      <div className="flex justify-center gap-1">
        {days.map((day) => (
          <button
            key={day.value}
            onClick={() => onSelectDay(day.value)}
            className={cn(
              "w-8 h-8 rounded-full text-xs font-medium transition-colors",
              selectedDay === day.value
                ? day.color || "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {day.label.slice(0, 1)}
          </button>
        ))}
      </div>
    </div>
  );
}
