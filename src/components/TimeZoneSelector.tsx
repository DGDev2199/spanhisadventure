import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeZoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

// Common timezones grouped by region
const TIMEZONES = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York', offset: 'GMT-5' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Chicago', offset: 'GMT-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Denver', offset: 'GMT-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles', offset: 'GMT-8' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: 'GMT-6' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'GMT-5' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'GMT-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'GMT-3' },
  { value: 'America/Lima', label: 'Lima', offset: 'GMT-5' },
  { value: 'America/Bogota', label: 'Bogotá', offset: 'GMT-5' },
  { value: 'America/Caracas', label: 'Caracas', offset: 'GMT-4' },
  { value: 'America/Santiago', label: 'Santiago', offset: 'GMT-4' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT)', offset: 'GMT+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'GMT+1' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: 'GMT+1' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 'GMT+1' },
  { value: 'Europe/Rome', label: 'Rome (CET)', offset: 'GMT+1' },
  { value: 'Europe/Athens', label: 'Athens (EET)', offset: 'GMT+2' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 'GMT+3' },
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'GMT+4' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Kolkata (IST)', offset: 'GMT+5:30' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'GMT+9' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: 'GMT+9' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'GMT+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'GMT+8' },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: 'GMT+7' },
  // Pacific
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 'GMT+11' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT)', offset: 'GMT+11' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT)', offset: 'GMT+13' },
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', offset: 'GMT+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'GMT+2' },
  { value: 'Africa/Lagos', label: 'Lagos', offset: 'GMT+1' },
];

export const TimeZoneSelector = ({ value, onChange, error }: TimeZoneSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detectedTz, setDetectedTz] = useState<string | null>(null);

  // Detect user's timezone
  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTz(userTz);
    } catch (error) {
      console.error('Failed to detect timezone:', error);
    }
  }, []);

  const handleDetect = () => {
    if (detectedTz) {
      const found = TIMEZONES.find(tz => tz.value === detectedTz);
      if (found) {
        onChange(found.value);
      } else {
        // If exact match not found, use the detected timezone directly
        onChange(detectedTz);
      }
    }
  };

  const filteredTimezones = useMemo(() => {
    if (!search) return TIMEZONES;
    const searchLower = search.toLowerCase();
    return TIMEZONES.filter(
      tz =>
        tz.label.toLowerCase().includes(searchLower) ||
        tz.value.toLowerCase().includes(searchLower) ||
        tz.offset.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const selectedTimezone = TIMEZONES.find(tz => tz.value === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Zona Horaria *</Label>
        {detectedTz && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDetect}
            className="h-auto py-1 px-2 text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Detectar automáticamente
          </Button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-10 sm:h-11',
              error && 'border-destructive',
              !value && 'text-muted-foreground'
            )}
          >
            {selectedTimezone ? selectedTimezone.label : 'Selecciona tu zona horaria'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 popover-content-width-full" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar zona horaria..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron zonas horarias.</CommandEmpty>
              <CommandGroup>
                {filteredTimezones.map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    value={timezone.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === timezone.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{timezone.label}</span>
                      <span className="text-xs text-muted-foreground">{timezone.offset}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs sm:text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
