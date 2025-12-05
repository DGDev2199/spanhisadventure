import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CalendarIcon, Clock, Loader2, Check, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  staffAvatar?: string | null;
  staffRole: 'teacher' | 'tutor';
}

interface TimeSlot {
  start: string;
  end: string;
  dayOfWeek: number;
}

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

export const BookingDialog = ({
  open,
  onOpenChange,
  staffId,
  staffName,
  staffAvatar,
  staffRole
}: BookingDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch staff availability and rates
  const { data: staffProfile } = useQuery({
    queryKey: ['staff-availability', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('availability, hourly_rate, currency')
        .eq('id', staffId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch existing bookings for the staff
  const { data: existingBookings } = useQuery({
    queryKey: ['staff-bookings', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_bookings')
        .select('booking_date, start_time, end_time')
        .or(`teacher_id.eq.${staffId},tutor_id.eq.${staffId}`)
        .in('status', ['pending', 'confirmed']);
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Calculate price breakdown
  const hourlyRate = (staffProfile as any)?.hourly_rate || 0;
  const currency = (staffProfile as any)?.currency || 'USD';
  const price = hourlyRate;
  const platformFee = price * PLATFORM_FEE_PERCENTAGE;
  const staffEarnings = price - platformFee;

  // Parse availability JSON
  const getAvailableSlots = (date: Date): TimeSlot[] => {
    if (!staffProfile?.availability) return [];
    
    try {
      const availability = JSON.parse(staffProfile.availability);
      const dayOfWeek = date.getDay();
      const slots: TimeSlot[] = [];
      
      // Check each hour if it's marked as available
      Object.keys(availability).forEach(key => {
        const [day, hour] = key.split('-').map(Number);
        if (day === dayOfWeek && availability[key]) {
          slots.push({
            start: `${hour.toString().padStart(2, '0')}:00`,
            end: `${(hour + 1).toString().padStart(2, '0')}:00`,
            dayOfWeek: day
          });
        }
      });

      // Filter out already booked slots
      const dateStr = format(date, 'yyyy-MM-dd');
      return slots.filter(slot => {
        return !existingBookings?.some(booking => 
          booking.booking_date === dateStr && 
          booking.start_time === slot.start + ':00'
        );
      });
    } catch {
      return [];
    }
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedDate || !selectedSlot) {
        throw new Error('Missing booking details');
      }

      const { data: booking, error } = await supabase
        .from('class_bookings')
        .insert({
          student_id: user.id,
          teacher_id: staffRole === 'teacher' ? staffId : null,
          tutor_id: staffRole === 'tutor' ? staffId : null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot.start + ':00',
          end_time: selectedSlot.end + ':00',
          notes: notes || null,
          status: 'pending',
          price: price,
          platform_fee: platformFee,
          staff_earnings: staffEarnings,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for staff
      await supabase.rpc('create_notification', {
        p_user_id: staffId,
        p_title: 'Nueva Reserva de Clase',
        p_message: `Tienes una nueva solicitud de reserva para el ${format(selectedDate, 'dd/MM/yyyy')} a las ${selectedSlot.start}${price > 0 ? ` - ${currency} $${price.toFixed(2)}` : ''}`,
        p_type: 'booking_request',
        p_related_id: user.id
      });

      return booking;
    },
    onSuccess: () => {
      toast.success('Reserva creada correctamente');
      onOpenChange(false);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff-bookings'] });
    },
    onError: (error: any) => {
      toast.error('Error al crear reserva: ' + error.message);
    }
  });

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  // Check if a date has any available slots
  const hasAvailability = (date: Date) => {
    if (!staffProfile?.availability) return false;
    try {
      const availability = JSON.parse(staffProfile.availability);
      const dayOfWeek = date.getDay();
      return Object.keys(availability).some(key => {
        const [day] = key.split('-').map(Number);
        return day === dayOfWeek && availability[key];
      });
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reservar Clase</DialogTitle>
          <DialogDescription>
            Selecciona fecha y horario para tu clase con {staffName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={staffAvatar || undefined} />
              <AvatarFallback>
                {staffName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{staffName}</p>
              <p className="text-sm text-muted-foreground">
                {staffRole === 'teacher' ? 'Profesor' : 'Tutor'}
              </p>
            </div>
            {hourlyRate > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {currency} ${hourlyRate}/hora
              </Badge>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <Label>Selecciona una fecha</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || !hasAvailability(date);
              }}
              locale={es}
              className="rounded-md border w-full"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Horarios disponibles para {format(selectedDate, 'dd/MM/yyyy')}</Label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot, idx) => (
                    <Button
                      key={idx}
                      variant={selectedSlot?.start === slot.start ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSlot(slot)}
                      className="flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {slot.start}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>
          )}

          {/* Price Summary */}
          {selectedSlot && hourlyRate > 0 && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">Resumen del Pago</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Clase con {staffName} (1 hora)</span>
                  <span className="font-medium">{currency} ${price.toFixed(2)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total a pagar</span>
                  <span className="text-green-600">{currency} ${price.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {selectedSlot && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Hay algo específico que quieras trabajar en esta clase?"
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createBookingMutation.mutate()}
            disabled={!selectedDate || !selectedSlot || createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {hourlyRate > 0 ? `Pagar ${currency} $${price.toFixed(2)}` : 'Confirmar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};