import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/contexts/AuthContext';

interface FollowersListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: 'followers' | 'following';
}

export const FollowersListDialog = ({ open, onOpenChange, userId, type }: FollowersListDialogProps) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      if (type === 'followers') {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', userId);
        
        if (!follows?.length) return [];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', follows.map(f => f.follower_id));
        
        return profiles || [];
      } else {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        if (!follows?.length) return [];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', follows.map(f => f.following_id));
        
        return profiles || [];
      }
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'followers' ? 'Seguidores' : 'Siguiendo'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Cargando...</p>
          ) : !users?.length ? (
            <p className="text-center py-4 text-muted-foreground">
              {type === 'followers' ? 'Sin seguidores aún' : 'No sigue a nadie aún'}
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile.full_name}</span>
                  </div>
                  {user?.id !== profile.id && (
                    <FollowButton userId={profile.id} size="sm" showText={false} />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};