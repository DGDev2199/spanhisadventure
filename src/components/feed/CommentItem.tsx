import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Check, X, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { renderContentWithMentions, extractMentions } from './MentionInput';
import { UserProfileDialog } from '@/components/UserProfileDialog';

interface CommentItemProps {
  comment: {
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
  };
  postId: string;
  postAuthorId: string;
  replies?: CommentItemProps['comment'][];
  depth?: number;
  onReplyAdded?: () => void;
}

const getRoleBadgeStyles = (role: string | null | undefined) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'coordinator':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'teacher':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'tutor':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'student':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getRoleLabel = (role: string | null | undefined) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'coordinator': return 'Coord';
    case 'teacher': return 'Prof';
    case 'tutor': return 'Tutor';
    case 'student': return 'Est';
    default: return '';
  }
};

const getAvatarBgColor = (role: string | null | undefined) => {
  switch (role) {
    case 'admin': return 'bg-red-500';
    case 'coordinator': return 'bg-purple-500';
    case 'teacher': return 'bg-blue-500';
    case 'tutor': return 'bg-green-500';
    case 'student': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

export const CommentItem = ({ comment, postId, postAuthorId, replies = [], depth = 0, onReplyAdded }: CommentItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.id === comment.author_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const maxDepth = 2;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Comentario eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar comentario');
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Comentario actualizado');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Error al actualizar comentario');
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !replyContent.trim()) return;
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: replyContent.trim(),
          parent_id: comment.id,
        });
      if (error) throw error;
      return replyContent.trim();
    },
    onSuccess: async (content) => {
      setReplyContent('');
      setIsReplying(false);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('Respuesta añadida');
      onReplyAdded?.();

      // Notify comment author
      if (user?.id && user.id !== comment.author_id && content) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await supabase.rpc('create_notification', {
          p_user_id: comment.author_id,
          p_title: 'Nueva respuesta',
          p_message: `${profile?.full_name || 'Alguien'} respondió a tu comentario`,
          p_type: 'reply',
          p_related_id: postId,
        });

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
                p_message: `${profile?.full_name || 'Alguien'} te mencionó en una respuesta`,
                p_type: 'mention',
                p_related_id: postId,
              });
            }
          }
        }
      }
    },
    onError: () => {
      toast.error('Error al añadir respuesta');
    },
  });

  const authorName = comment.profiles?.full_name || 'Usuario';
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;
  const hasReplies = replies.length > 0;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      editMutation.mutate();
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      replyMutation.mutate();
    }
  };

  return (
    <>
    <div className={`${depth > 0 ? 'ml-6 pl-3 border-l-2 border-muted' : ''}`}>
      <div className="flex gap-3 py-2">
        <button onClick={() => setProfileOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.profiles?.avatar_url || undefined} />
            <AvatarFallback className={`text-xs text-white ${getAvatarBgColor(comment.role)}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setProfileOpen(true)} className="font-medium text-sm hover:underline cursor-pointer">
              {authorName}
            </button>
            {comment.role && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRoleBadgeStyles(comment.role)}`}>
                {getRoleLabel(comment.role)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
              {wasEdited && ' · editado'}
            </span>
          </div>
          {isEditing ? (
            <div className="mt-1 flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleSaveEdit}
                disabled={editMutation.isPending}
              >
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mt-1 break-words">
                {renderContentWithMentions(comment.content)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {depth < maxDepth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-primary p-0"
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Responder
                  </Button>
                )}
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-primary p-0"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    {showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ocultar {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Ver {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        {isOwner && !isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Reply input */}
      {isReplying && (
        <form onSubmit={handleSubmitReply} className="flex gap-2 ml-11 mt-1 mb-2">
          <Input
            placeholder="Escribe tu respuesta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8" disabled={!replyContent.trim() || replyMutation.isPending}>
            Enviar
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setIsReplying(false)}>
            Cancelar
          </Button>
        </form>
      )}

      {/* Nested replies */}
      {showReplies && hasReplies && (
        <div className="space-y-1">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              replies={[]}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>

    <UserProfileDialog
      open={profileOpen}
      onOpenChange={setProfileOpen}
      userId={comment.author_id}
    />
    </>
  );
};
