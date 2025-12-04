import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { renderContentWithMentions } from './MentionInput';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    updated_at?: string;
    profiles?: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
  postId: string;
}

export const CommentItem = ({ comment, postId }: CommentItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.id === comment.author_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

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

  const authorName = comment.profiles?.full_name || 'Usuario';
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      editMutation.mutate();
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{authorName}</span>
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
          <p className="text-sm text-foreground mt-1 break-words">
            {renderContentWithMentions(comment.content)}
          </p>
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
  );
};
