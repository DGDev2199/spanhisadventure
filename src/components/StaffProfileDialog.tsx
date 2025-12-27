import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/StarRating';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Globe, Languages, Send, Loader2, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface StaffProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffRole: 'teacher' | 'tutor';
  onRequestClick?: () => void;
  hasRequested?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student: { full_name: string; avatar_url: string | null } | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  timezone: string | null;
  languages_spoken: string[] | null;
  availability: string | null;
  experience: string | null;
  staff_type: string | null;
  hourly_rate: number | null;
  currency: string | null;
  intro_video_url?: string | null;
}

export const StaffProfileDialog = ({
  open,
  onOpenChange,
  staffId,
  staffRole,
  onRequestClick,
  hasRequested,
}: StaffProfileDialogProps) => {
  // Fetch staff profile using secure view that hides sensitive data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['staff-profile', staffId],
    queryFn: async (): Promise<StaffProfile | null> => {
      // Use secure view that masks email, hourly_rate, and other sensitive fields
      // based on the viewer's relationship to the profile
      const { data, error } = await supabase
        .from('safe_profiles_view' as any)
        .select('*')
        .eq('id', staffId)
        .single();
      if (error) throw error;
      return data as unknown as StaffProfile;
    },
    enabled: open && !!staffId,
  });

  // Fetch reviews with rating stats
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['staff-reviews', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          student:profiles!class_reviews_student_id_fkey(full_name, avatar_url)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const reviews = data as unknown as Review[];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      return { reviews, avgRating, totalReviews: reviews.length };
    },
    enabled: open && !!staffId,
  });

  const getTimezoneOffset = (tz: string | null) => {
    if (!tz) return null;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric' });
      return formatter.format(new Date());
    } catch {
      return null;
    }
  };

  const isLoading = profileLoading || reviewsLoading;
  const localTime = profile?.timezone ? getTimezoneOffset(profile.timezone) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              {/* Header */}
              <DialogHeader className="mb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{profile.full_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={staffRole === 'teacher' ? 'default' : 'secondary'}>
                        {staffRole === 'teacher' ? 'Profesor' : 'Tutor'}
                      </Badge>
                      {(profile as any).staff_type && (
                        <Badge variant="outline">
                          {(profile as any).staff_type === 'online' ? '🌐 Online' : '📍 Presencial'}
                        </Badge>
                      )}
                    </div>
                    {reviewsData && reviewsData.totalReviews > 0 && (
                      <div className="mt-2">
                        <StarRating
                          rating={reviewsData.avgRating}
                          showValue
                          totalReviews={reviewsData.totalReviews}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Video */}
              {(profile as any).intro_video_url && (
                <div className="mb-4">
                  <video
                    src={(profile as any).intro_video_url}
                    controls
                    className="w-full rounded-lg max-h-52 bg-black"
                  />
                </div>
              )}

              {/* Price */}
              {(profile as any).hourly_rate && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {(profile as any).currency || 'USD'} ${(profile as any).hourly_rate}/hora
                    </p>
                    <p className="text-xs text-muted-foreground">Tarifa por clase</p>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {localTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{localTime} (local)</span>
                  </div>
                )}
                {profile.languages_spoken && profile.languages_spoken.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.languages_spoken.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Availability */}
              {profile.availability && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Globe className="h-4 w-4" /> Disponibilidad
                  </h4>
                  <p className="text-sm text-muted-foreground">{profile.availability}</p>
                </div>
              )}

              {/* Experience */}
              {profile.experience && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Experiencia</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.experience}</p>
                </div>
              )}

              <Separator className="my-4" />

              {/* Reviews */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3">
                  Reseñas ({reviewsData?.totalReviews || 0})
                </h4>
                {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {reviewsData.reviews.map((review) => (
                      <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={review.student?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {review.student?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{review.student?.full_name || 'Anónimo'}</span>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(review.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no hay reseñas
                  </p>
                )}
              </div>

              {/* Action Button */}
              {onRequestClick && (
                <Button
                  className="w-full"
                  disabled={hasRequested}
                  onClick={onRequestClick}
                >
                  {hasRequested ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Solicitud Pendiente
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar {staffRole === 'teacher' ? 'Clases' : 'Tutorías'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
