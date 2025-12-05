import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/StarRating';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  staffId: string;
  staffName: string;
  staffAvatar: string | null;
  staffRole: 'teacher' | 'tutor';
  bookingDate: string;
}

export const ReviewClassDialog = ({
  open,
  onOpenChange,
  bookingId,
  staffId,
  staffName,
  staffAvatar,
  staffRole,
  bookingDate,
}: ReviewClassDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase.from('class_reviews').insert({
        booking_id: bookingId,
        student_id: user.id,
        staff_id: staffId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('¡Gracias por tu reseña!');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['staff-reviews'] });
      onOpenChange(false);
      setRating(5);
      setComment('');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Ya dejaste una reseña para esta clase');
      } else {
        toast.error('Error al enviar reseña');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dejar Reseña</DialogTitle>
          <DialogDescription>
            Comparte tu experiencia con {staffRole === 'teacher' ? 'el profesor' : 'el tutor'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={staffAvatar || undefined} />
              <AvatarFallback>
                {staffName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{staffName}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(parseISO(bookingDate), 'dd MMM yyyy', { locale: es })}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex justify-center py-2">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Malo'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bueno'}
              {rating === 5 && 'Excelente'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos sobre tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => submitReview.mutate()}
            disabled={submitReview.isPending || rating < 1}
          >
            {submitReview.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enviar Reseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
