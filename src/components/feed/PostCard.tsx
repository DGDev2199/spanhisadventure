import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Download, FileIcon, Edit2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { PostReactions } from './PostReactions';
import { PostComments } from './PostComments';
import { EditPostDialog } from './EditPostDialog';
import { renderContentWithMentions } from './MentionInput';

interface PostCardProps {
  post: {
    id: string;
    author_id: string;
    content: string | null;
    media_type: string | null;
    media_url: string | null;
    file_name: string | null;
    created_at: string;
    updated_at?: string;
    profiles?: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.id === post.author_id;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (post.media_url) {
        const path = post.media_url.split('/post-media/')[1];
        if (path) {
          await supabase.storage.from('post-media').remove([path]);
        }
      }
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Publicación eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar publicación');
    },
  });

  const authorName = post.profiles?.full_name || 'Usuario';
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const wasEdited = post.updated_at && post.updated_at !== post.created_at;

  const handleDownload = async () => {
    if (!post.media_url) return;
    window.open(post.media_url, '_blank');
  };

  const renderMedia = () => {
    if (!post.media_url) return null;

    switch (post.media_type) {
      case 'image':
        return (
          <img
            src={post.media_url}
            alt="Post media"
            className="w-full max-h-[500px] object-contain rounded-md mt-3"
          />
        );
      case 'video':
        return (
          <video
            src={post.media_url}
            controls
            className="w-full max-h-[500px] rounded-md mt-3"
          />
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md mt-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{post.file_name || 'Archivo'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                  {wasEdited && ' · editado'}
                </p>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteMutation.mutate()}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {post.content && (
            <p className="text-foreground whitespace-pre-wrap break-words">
              {renderContentWithMentions(post.content)}
            </p>
          )}
          {renderMedia()}
          
          <div className="mt-4 space-y-3">
            <PostReactions postId={post.id} postAuthorId={post.author_id} />
            <PostComments postId={post.id} postAuthorId={post.author_id} />
          </div>
        </CardContent>
      </Card>

      <EditPostDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        post={post}
      />
    </>
  );
};
