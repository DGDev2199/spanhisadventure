import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from './FollowButton';
import { FollowersListDialog } from './FollowersListDialog';
import { StarRating } from './StarRating';
import { MapPin, Globe, Clock, Languages, Users, Eye, EyeOff } from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const getRoleBadgeStyles = (role: string | null | undefined) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700 border-red-200';
    case 'coordinator': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'tutor': return 'bg-green-100 text-green-700 border-green-200';
    case 'student': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getRoleLabel = (role: string | null | undefined) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'coordinator': return 'Coordinador';
    case 'teacher': return 'Profesor';
    case 'tutor': return 'Tutor';
    case 'student': return 'Estudiante';
    default: return 'Usuario';
  }
};

const getModalityLabel = (type: string | null | undefined) => {
  switch (type) {
    case 'online': return '🌐 Online';
    case 'presencial': return '📍 Presencial';
    case 'both': return '🌐📍 Online y Presencial';
    default: return null;
  }
};

export const UserProfileDialog = ({ open, onOpenChange, userId }: UserProfileDialogProps) => {
  const { user } = useAuth();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('safe_profiles_view')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: open && !!userId,
  });

  const { data: userRole } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      return data?.role;
    },
    enabled: open && !!userId,
  });

  const { data: followCounts } = useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return {
        followers: followers.count || 0,
        following: following.count || 0,
      };
    },
    enabled: open && !!userId,
  });

  const { data: staffRating } = useQuery({
    queryKey: ['staff-rating', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('class_reviews')
        .select('rating')
        .eq('staff_id', userId);
      if (!data?.length) return { avg: 0, count: 0 };
      const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
      return { avg, count: data.length };
    },
    enabled: open && !!userId && (userRole === 'teacher' || userRole === 'tutor'),
  });

  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_profiles')
        .select('level, student_type')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: open && !!userId && userRole === 'student',
  });

  if (profileLoading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isOwnProfile = user?.id === userId;
  const isPublic = profile.is_public_profile !== false;
  const showFollowers = profile.show_followers !== false;
  const showFollowing = profile.show_following !== false;
  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // If profile is private and not own profile, show limited info
  if (!isPublic && !isOwnProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mb-2">{profile.full_name}</h2>
            <Badge variant="outline" className={getRoleBadgeStyles(userRole)}>{getRoleLabel(userRole)}</Badge>
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
              <EyeOff className="h-4 w-4" />
              <span className="text-sm">Perfil privado</span>
            </div>
            <div className="mt-6">
              <FollowButton userId={userId} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <ScrollArea className="max-h-[80vh] pr-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">{profile.full_name}</h2>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className={getRoleBadgeStyles(userRole)}>{getRoleLabel(userRole)}</Badge>
                  {(userRole === 'teacher' || userRole === 'tutor') && profile.staff_type && (
                    <Badge variant="secondary">{getModalityLabel(profile.staff_type)}</Badge>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-muted-foreground mt-3 text-sm">{profile.bio}</p>
                )}
              </div>

              {/* Follow Stats */}
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => showFollowers && setFollowersOpen(true)}
                  className={`text-center ${showFollowers ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                  disabled={!showFollowers}
                >
                  <p className="text-2xl font-bold">{showFollowers ? followCounts?.followers || 0 : '-'}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </button>
                <button
                  onClick={() => showFollowing && setFollowingOpen(true)}
                  className={`text-center ${showFollowing ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                  disabled={!showFollowing}
                >
                  <p className="text-2xl font-bold">{showFollowing ? followCounts?.following || 0 : '-'}</p>
                  <p className="text-xs text-muted-foreground">Siguiendo</p>
                </button>
              </div>

              {!isOwnProfile && (
                <div className="flex justify-center">
                  <FollowButton userId={userId} />
                </div>
              )}

              <Separator />

              {/* Staff Info */}
              {(userRole === 'teacher' || userRole === 'tutor') && (
                <>
              {/* Video */}
              {(profile as any).intro_video_url && (
                <div>
                  <h3 className="font-semibold mb-2">Video de Presentación</h3>
                  <video
                    src={(profile as any).intro_video_url}
                    controls
                    className="w-full rounded-lg max-h-[200px]"
                  />
                </div>
              )}

              {/* Rating */}
              {staffRating && staffRating.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={staffRating.avg} size="md" showValue totalReviews={staffRating.count} />
                </div>
              )}

                  {/* Pricing */}
                  {profile.hourly_rate && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Tarifa por hora</p>
                      <p className="text-2xl font-bold text-primary">
                        {profile.currency || 'USD'} {profile.hourly_rate}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Student Info */}
              {userRole === 'student' && studentProfile && (
                <div className="space-y-2">
                  {studentProfile.level && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Nivel:</span>
                      <Badge>{studentProfile.level}</Badge>
                    </div>
                  )}
                  {profile.study_objectives && (
                    <div>
                      <p className="text-sm text-muted-foreground">Objetivos:</p>
                      <p className="text-sm">{profile.study_objectives}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Common Info */}
              <div className="space-y-3">
                {profile.timezone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.timezone}</span>
                  </div>
                )}
                {profile.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.nationality}</span>
                  </div>
                )}
                {profile.languages_spoken?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.languages_spoken.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Experience for staff */}
              {(userRole === 'teacher' || userRole === 'tutor') && profile.experience && (
                <div>
                  <h3 className="font-semibold mb-2">Experiencia</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.experience}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <FollowersListDialog
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        userId={userId}
        type="followers"
      />
      <FollowersListDialog
        open={followingOpen}
        onOpenChange={setFollowingOpen}
        userId={userId}
        type="following"
      />
    </>
  );
};