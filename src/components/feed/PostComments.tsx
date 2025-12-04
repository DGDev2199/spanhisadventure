import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { toast } from 'sonner';
import { extractMentions } from './MentionInput';

interface PostCommentsProps {
  postId: string;
  postAuthorId: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  role?: string | null;
}

export const PostComments = ({ postId, postAuthorId }: PostCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const authorIds = [...new Set(commentsData.map(c => c.author_id))];
        
        // Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);

        // Fetch roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', authorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
        
        return commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.author_id) || null,
          role: rolesMap.get(comment.author_id) || null,
        }));
      }
      return commentsData || [];
    },
    enabled: isExpanded,
  });

  const createNotifications = async (content: string) => {
    if (!user?.id) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Notify post author
    if (user.id !== postAuthorId) {
      await supabase.rpc('create_notification', {
        p_user_id: postAuthorId,
        p_title: 'Nuevo comentario',
        p_message: `${profile?.full_name || 'Alguien'} comentó en tu publicación`,
        p_type: 'comment',
        p_related_id: postId,
      });
    }

    // Notify mentioned users
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('full_name', mentions);

      for (const mentionedUser of mentionedUsers || []) {
        if (mentionedUser.id !== user.id) {
          await supabase.rpc('create_notification', {
            p_user_id: mentionedUser.id,
            p_title: 'Te mencionaron',
            p_message: `${profile?.full_name || 'Alguien'} te mencionó en un comentario`,
            p_type: 'mention',
            p_related_id: postId,
          });
        }
      }
    }
  };

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
      return newComment.trim();
    },
    onSuccess: async (content) => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Comentario añadido');
      if (content) {
        await createNotifications(content);
      }
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

  // Organize comments into threads
  const organizeComments = (commentsList: Comment[]) => {
    const rootComments: Comment[] = [];
    const repliesMap = new Map<string, Comment[]>();

    commentsList.forEach(comment => {
      if (!comment.parent_id) {
        rootComments.push(comment);
      } else {
        const parentReplies = repliesMap.get(comment.parent_id) || [];
        parentReplies.push(comment);
        repliesMap.set(comment.parent_id, parentReplies);
      }
    });

    return { rootComments, repliesMap };
  };

  const { rootComments, repliesMap } = comments 
    ? organizeComments(comments) 
    : { rootComments: [], repliesMap: new Map() };

  const totalCount = comments?.length || 0;

  return (
    <div className="border-t pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="gap-2 text-muted-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {isExpanded ? 'Ocultar' : totalCount > 0 ? `Ver ${totalCount} comentarios` : 'Comentar'}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2">Cargando...</div>
          ) : rootComments.length > 0 ? (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {rootComments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  postId={postId}
                  postAuthorId={postAuthorId}
                  replies={repliesMap.get(comment.id) || []}
                  depth={0}
                  onReplyAdded={() => refetch()}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No hay comentarios aún</p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
            <Input
              placeholder="Escribe un comentario... (usa @ para mencionar)"
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
