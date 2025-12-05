import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Video, X, Loader2, MessageSquare, Star, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { VideoCallDialog } from './VideoCallDialog';
import { StudentChatDialog } from './StudentChatDialog';
import { ReviewClassDialog } from './ReviewClassDialog';
import { StarRating } from './StarRating';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_url: string | null;
  notes: string | null;
  teacher_id: string | null;
  tutor_id: string | null;
  teacher?: { full_name: string; avatar_url: string | null } | null;
  tutor?: { full_name: string; avatar_url: string | null } | null;
}

export const MyBookingsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          teacher:profiles!class_bookings_teacher_id_fkey(full_name, avatar_url),
          tutor:profiles!class_bookings_tutor_id_fkey(full_name, avatar_url)
        `)
        .eq('student_id', user.id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as unknown as Booking[];
    },
    enabled: !!user?.id
  });

  // Fetch existing reviews for user's bookings
  const { data: existingReviews } = useQuery({
    queryKey: ['booking-reviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('class_reviews')
        .select('booking_id, rating')
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const hasReview = (bookingId: string) => {
    return existingReviews?.some(r => r.booking_id === bookingId);
  };

  const getReviewRating = (bookingId: string) => {
    return existingReviews?.find(r => r.booking_id === bookingId)?.rating;
  };

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reserva cancelada');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: () => {
      toast.error('Error al cancelar reserva');
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

  const upcomingBookings = bookings?.filter(b => 
    b.status !== 'cancelled' && 
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

  const handleReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewOpen(true);
  };

  const getStaffInfo = (booking: Booking) => {
    if (booking.teacher) {
      return { ...booking.teacher, id: booking.teacher_id!, role: 'teacher' as const };
    }
    if (booking.tutor) {
      return { ...booking.tutor, id: booking.tutor_id!, role: 'tutor' as const };
    }
    return null;
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
            Mis Reservas
          </CardTitle>
          <CardDescription>
            Tus clases programadas con profesores y tutores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tienes clases programadas
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => {
                const staff = getStaffInfo(booking);
                return (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={staff?.avatar_url || undefined} />
                        <AvatarFallback>
                          {staff?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{staff?.full_name}</p>
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
                      {booking.status === 'confirmed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleChat(booking)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVideoCall(booking)}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === 'completed' && (
                        hasReview(booking.id) ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <StarRating rating={getReviewRating(booking.id) || 0} size="sm" />
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReview(booking)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Reseña
                          </Button>
                        )
                      )}
                      {booking.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => cancelMutation.mutate(booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Call Dialog */}
      {selectedBooking && (
        <VideoCallDialog
          open={videoCallOpen}
          onOpenChange={setVideoCallOpen}
          participantName={getStaffInfo(selectedBooking)?.full_name || ''}
          participantAvatar={getStaffInfo(selectedBooking)?.avatar_url}
          participantRole={getStaffInfo(selectedBooking)?.role || 'teacher'}
          roomId={`class-${selectedBooking.id.slice(0, 8)}`}
        />
      )}

      {/* Chat Dialog */}
      {selectedBooking && getStaffInfo(selectedBooking) && (
        <StudentChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          staffId={getStaffInfo(selectedBooking)!.id}
          staffName={getStaffInfo(selectedBooking)!.full_name}
          staffAvatar={getStaffInfo(selectedBooking)!.avatar_url}
          staffRole={getStaffInfo(selectedBooking)!.role}
        />
      )}

      {/* Review Dialog */}
      {selectedBooking && getStaffInfo(selectedBooking) && (
        <ReviewClassDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          bookingId={selectedBooking.id}
          staffId={getStaffInfo(selectedBooking)!.id}
          staffName={getStaffInfo(selectedBooking)!.full_name}
          staffAvatar={getStaffInfo(selectedBooking)!.avatar_url}
          staffRole={getStaffInfo(selectedBooking)!.role}
          bookingDate={selectedBooking.booking_date}
        />
      )}
    </>
  );
};
