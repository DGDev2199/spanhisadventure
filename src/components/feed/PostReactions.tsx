import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface PostReactionsProps {
  postId: string;
}

export const PostReactions = ({ postId }: PostReactionsProps) => {
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

  const reactMutation = useMutation({
    mutationFn: async (type: 'like' | 'dislike') => {
      if (!user?.id) throw new Error('Not authenticated');

      if (userReaction) {
        if (userReaction.reaction_type === type) {
          // Remove reaction
          const { error } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', userReaction.id);
          if (error) throw error;
        } else {
          // Update reaction
          const { error } = await supabase
            .from('post_reactions')
            .update({ reaction_type: type })
            .eq('id', userReaction.id);
          if (error) throw error;
        }
      } else {
        // Create new reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: type,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] });
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
