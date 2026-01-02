import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Clock } from 'lucide-react';

interface TimeSlot {
  day: number;
  startTime: string;
  endTime: string;
}

interface AvailabilitySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const parseAvailability = (value: string): TimeSlot[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
};

const serializeAvailability = (slots: TimeSlot[]): string => {
  return JSON.stringify(slots);
};

export const AvailabilitySelector = ({ value, onChange }: AvailabilitySelectorProps) => {
  const [slots, setSlots] = useState<TimeSlot[]>(() => parseAvailability(value));

  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({
    day: undefined,
    startTime: '',
    endTime: '',
  });

  const addSlot = () => {
    if (newSlot.day === undefined || !newSlot.startTime || !newSlot.endTime) return;

    const exists = slots.some(
      s =>
        s.day === newSlot.day &&
        s.startTime === newSlot.startTime &&
        s.endTime === newSlot.endTime
    );

    if (exists) return;

    const updated = [...slots, newSlot as TimeSlot];
    setSlots(updated);
    onChange(serializeAvailability(updated));

    setNewSlot({
      day: undefined,
      startTime: '',
      endTime: '',
    });
  };

  const removeSlot = (index: number) => {
    const updated = slots.filter((_, i) => i !== index);
    setSlots(updated);
    onChange(serializeAvailability(updated));
  };

  const getDayLabel = (day: number) =>
    DAYS.find(d => d.value === day)?.label || '';

  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Disponibilidad para Clases
      </Label>

      {Object.keys(slotsByDay).length > 0 && (
        <div className="space-y-2">
          {Object.entries(slotsByDay)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, daySlots]) => (
              <div key={day} className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium w-20">
                  {getDayLabel(Number(day))}:
                </span>

                <div className="flex flex-wrap gap-1">
                  {daySlots.map((slot, idx) => {
                    const globalIdx = slots.findIndex(
                      s =>
                        s.day === slot.day &&
                        s.startTime === slot.startTime &&
                        s.endTime === slot.endTime
                    );

                    return (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="flex items-center gap-1 py-1"
                      >
                        {slot.startTime} - {slot.endTime}
                        <button
                          type="button"
                          onClick={() => removeSlot(globalIdx)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tienes horarios configurados. Agrega tu disponibilidad para que los
          estudiantes puedan agendar clases.
        </p>
      )}

      {/* NUEVO HORARIO */}
      <div className="flex flex-wrap items-end gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <Label className="text-xs">Día</Label>
          <Select
            value={newSlot.day !== undefined ? newSlot.day.toString() : ''}
            onValueChange={(v) =>
              setNewSlot({ ...newSlot, day: parseInt(v) })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map(day => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Select
            value={newSlot.startTime || ''}
            onValueChange={(v) =>
              setNewSlot({ ...newSlot, startTime: v })
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Inicio" />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map(h => (
                <SelectItem key={h.value} value={h.value}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Select
            value={newSlot.endTime || ''}
            onValueChange={(v) =>
              setNewSlot({ ...newSlot, endTime: v })
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Fin" />
            </SelectTrigger>
            <SelectContent>
              {HOURS
                .filter(h => !newSlot.startTime || h.value > newSlot.startTime)
                .map(h => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={addSlot}
          disabled={
            newSlot.day === undefined ||
            !newSlot.startTime ||
            !newSlot.endTime
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>
    </div>
  );
