import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface PostReactionsProps {
  postId: string;
  postAuthorId: string;
}

export const PostReactions = ({ postId, postAuthorId }: PostReactionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId);
      if (error) throw error;
      return data;
    },
  });

  const userReaction = reactions?.find(r => r.user_id === user?.id);
  const likes = reactions?.filter(r => r.reaction_type === 'like').length || 0;
  const dislikes = reactions?.filter(r => r.reaction_type === 'dislike').length || 0;

  const createNotification = async (type: 'like' | 'dislike') => {
    if (!user?.id || user.id === postAuthorId) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const message = type === 'like' 
      ? `${profile?.full_name || 'Alguien'} le dio me gusta a tu publicación`
      : `${profile?.full_name || 'Alguien'} reaccionó a tu publicación`;

    await supabase.rpc('create_notification', {
      p_user_id: postAuthorId,
      p_title: 'Nueva reacción',
      p_message: message,
      p_type: 'reaction',
      p_related_id: postId,
    });
  };

  const reactMutation = useMutation({
    mutationFn: async (type: 'like' | 'dislike') => {
      if (!user?.id) throw new Error('Not authenticated');

      if (userReaction) {
        if (userReaction.reaction_type === type) {
          const { error } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', userReaction.id);
          if (error) throw error;
          return { action: 'removed' };
        } else {
          const { error } = await supabase
            .from('post_reactions')
            .update({ reaction_type: type })
            .eq('id', userReaction.id);
          if (error) throw error;
          return { action: 'changed', type };
        }
      } else {
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: type,
          });
        if (error) throw error;
        return { action: 'added', type };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] });
      if (result?.action === 'added' || result?.action === 'changed') {
        await createNotification(result.type as 'like' | 'dislike');
      }
    },
    onError: () => {
      toast.error('Error al reaccionar');
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userReaction?.reaction_type === 'like' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => reactMutation.mutate('like')}
        disabled={reactMutation.isPending}
        className="gap-1"
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{likes}</span>
      </Button>
      <Button
        variant={userReaction?.reaction_type === 'dislike' ? 'destructive' : 'ghost'}
        size="sm"
        onClick={() => reactMutation.mutate('dislike')}
        disabled={reactMutation.isPending}
        className="gap-1"
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
};
