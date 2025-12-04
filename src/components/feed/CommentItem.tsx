import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
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

  const authorName = comment.profiles?.full_name || 'Usuario';
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
          </span>
        </div>
        <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
      </div>
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
