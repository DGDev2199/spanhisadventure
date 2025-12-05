import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export const FollowButton = ({ userId, variant = 'default', size = 'sm', showText = true }: FollowButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFollowing, isLoading } = useQuery({
    queryKey: ['is-following', user?.id, userId],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && user.id !== userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Ahora sigues a este usuario');
    },
    onError: () => toast.error('Error al seguir usuario'),
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Has dejado de seguir a este usuario');
    },
    onError: () => toast.error('Error al dejar de seguir'),
  });

  if (!user?.id || user.id === userId) return null;
  if (isLoading) return <Button variant={variant} size={size} disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>;

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => unfollowMutation.mutate()}
        disabled={isPending}
        className="gap-1"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
        {showText && 'Dejar de seguir'}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => followMutation.mutate()}
      disabled={isPending}
      className="gap-1"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {showText && 'Seguir'}
    </Button>
  );
};