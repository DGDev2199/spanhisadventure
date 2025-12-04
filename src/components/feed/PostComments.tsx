import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { toast } from 'sonner';

interface PostCommentsProps {
  postId: string;
}

export const PostComments = ({ postId }: PostCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch profiles for authors
      if (commentsData && commentsData.length > 0) {
        const authorIds = [...new Set(commentsData.map(c => c.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        return commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.author_id) || null,
        }));
      }
      return commentsData || [];
    },
    enabled: isExpanded,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newComment.trim()) return;
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Comentario añadido');
    },
    onError: () => {
      toast.error('Error al añadir comentario');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate();
    }
  };

  return (
    <div className="border-t pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="gap-2 text-muted-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {isExpanded ? 'Ocultar comentarios' : 'Ver comentarios'}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2">Cargando...</div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} postId={postId} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No hay comentarios aún</p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
            <Input
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
