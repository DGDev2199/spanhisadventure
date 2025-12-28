import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Video, Check, X, Loader2, MessageSquare, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { VideoCallDialog } from './VideoCallDialog';
import { StaffToStudentChatDialog } from './StaffToStudentChatDialog';
import { TeacherTutorChatDialog } from './TeacherTutorChatDialog';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  student_id: string;
  student?: { full_name: string; avatar_url: string | null } | null;
}

export const StaffBookingsPanel = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [staffChatOpen, setStaffChatOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch bookings for teacher/tutor using secure view that hides sensitive payment data
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['staff-class-bookings', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Use the secure view that hides price/platform_fee from staff
      const column = userRole === 'teacher' ? 'teacher_id' : 'tutor_id';
      const { data: bookingsData, error } = await supabase
        .from('staff_bookings_view' as any)
        .select('*')
        .eq(column, user.id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      if (!bookingsData || bookingsData.length === 0) return [];
      
      // Fetch student data separately using secure view
      const studentIds = [...new Set(bookingsData.map((b: any) => b.student_id))];
      const { data: students } = await supabase
        .from('safe_profiles_view')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);
      
      const studentMap = new Map(students?.map(s => [s.id, s]) || []);
      
      return bookingsData.map((booking: any) => ({
        ...booking,
        student: studentMap.get(booking.student_id) || null
      })) as Booking[];
    },
    enabled: !!user?.id && (userRole === 'teacher' || userRole === 'tutor')
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, studentId }: { bookingId: string; status: string; studentId: string }) => {
      const updateData: any = { status };
      
      // Generate meeting URL for confirmed bookings
      if (status === 'confirmed') {
        updateData.meeting_url = `https://meet.jit.si/spanish-adventure-${bookingId.slice(0, 8)}`;
      }

      const { error } = await supabase
        .from('class_bookings')
        .update(updateData)
        .eq('id', bookingId);
      
      if (error) throw error;

      // Notify student
      await supabase.rpc('create_notification', {
        p_user_id: studentId,
        p_title: status === 'confirmed' ? 'Reserva Confirmada' : 'Reserva Rechazada',
        p_message: status === 'confirmed' 
          ? 'Tu reserva de clase ha sido confirmada. ¡Nos vemos pronto!'
          : 'Tu reserva de clase ha sido rechazada. Por favor, intenta con otro horario.',
        p_type: 'booking_update',
        p_related_id: bookingId
      });
    },
    onSuccess: () => {
      toast.success('Reserva actualizada');
      queryClient.invalidateQueries({ queryKey: ['staff-class-bookings'] });
    },
    onError: () => {
      toast.error('Error al actualizar reserva');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'completed':
        return <Badge variant="outline">Completada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const upcomingBookings = bookings?.filter(b => 
    b.status === 'confirmed' && 
    isAfter(parseISO(b.booking_date), new Date(new Date().setHours(0, 0, 0, 0) - 86400000))
  ) || [];

  const handleVideoCall = (booking: Booking) => {
    setSelectedBooking(booking);
    setVideoCallOpen(true);
  };

  const handleChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setChatOpen(true);
  };

  const handleStaffChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setStaffChatOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Reservas de Clases
          </CardTitle>
          <CardDescription>
            Gestiona las reservas de tus estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Bookings */}
          {pendingBookings.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                Solicitudes Pendientes ({pendingBookings.length})
              </h4>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50/50 border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={booking.student?.avatar_url || undefined} />
                        <AvatarFallback>
                          {booking.student?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{booking.student?.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(booking.booking_date), 'dd MMM yyyy', { locale: es })}
                          <Clock className="h-3 w-3 ml-1" />
                          {booking.start_time.slice(0, 5)}
                        </div>
                        {booking.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => updateStatusMutation.mutate({ 
                          bookingId: booking.id, 
                          status: 'cancelled',
                          studentId: booking.student_id
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ 
                          bookingId: booking.id, 
                          status: 'confirmed',
                          studentId: booking.student_id
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Confirmed Bookings */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">
              Próximas Clases ({upcomingBookings.length})
            </h4>
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No tienes clases confirmadas próximamente
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={booking.student?.avatar_url || undefined} />
                        <AvatarFallback>
                          {booking.student?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{booking.student?.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(booking.booking_date), 'dd MMM yyyy', { locale: es })}
                          <Clock className="h-3 w-3 ml-1" />
                          {booking.start_time.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChat(booking)}
                        title="Chat con estudiante"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStaffChat(booking)}
                        title={`Chat con ${userRole === 'teacher' ? 'Tutor' : 'Profesor'}`}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVideoCall(booking)}
                        title="Videollamada"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Call Dialog */}
      {selectedBooking && selectedBooking.student && (
        <VideoCallDialog
          open={videoCallOpen}
          onOpenChange={setVideoCallOpen}
          participantName={selectedBooking.student.full_name}
          participantAvatar={selectedBooking.student.avatar_url}
          participantRole="student"
          roomId={`class-${selectedBooking.id.slice(0, 8)}`}
        />
      )}

      {/* Chat Dialog - Direct chat with student */}
      {selectedBooking && selectedBooking.student && (
        <StaffToStudentChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          studentId={selectedBooking.student_id}
          studentName={selectedBooking.student.full_name}
        />
      )}

      {/* Staff Chat Dialog - Chat with other staff about student */}
      {selectedBooking && selectedBooking.student && (
        <TeacherTutorChatDialog
          open={staffChatOpen}
          onOpenChange={setStaffChatOpen}
          studentId={selectedBooking.student_id}
          studentName={selectedBooking.student.full_name}
        />
      )}
    </>
  );
};
