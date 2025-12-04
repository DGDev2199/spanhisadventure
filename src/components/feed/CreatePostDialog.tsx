import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Image, Video, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MentionInput, extractMentions } from './MentionInput';

export const CreatePostDialog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setContent('');
    setFile(null);
    setPreview(null);
    setMediaType(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 50MB.');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      setMediaType('image');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type.startsWith('video/')) {
      setMediaType('video');
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setMediaType('file');
      setPreview(null);
    }
  };

  const notifyMentionedUsers = async (postContent: string, postId: string) => {
    if (!user?.id) return;
    
    const mentions = extractMentions(postContent);
    if (mentions.length === 0) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('full_name', mentions);

    for (const mentionedUser of mentionedUsers || []) {
      if (mentionedUser.id !== user.id) {
        await supabase.rpc('create_notification', {
          p_user_id: mentionedUser.id,
          p_title: 'Te mencionaron',
          p_message: `${profile?.full_name || 'Alguien'} te mencionó en una publicación`,
          p_type: 'mention',
          p_related_id: postId,
        });
      }
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!content.trim() && !file) throw new Error('No content');

      let mediaUrl = null;
      let fileName = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: content.trim() || null,
          media_type: mediaType,
          media_url: mediaUrl,
          file_name: fileName,
        })
        .select()
        .single();

      if (error) throw error;
      return { postId: data.id, content: content.trim() };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Publicación creada');
      if (result?.content) {
        await notifyMentionedUsers(result.content, result.postId);
      }
      resetForm();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear publicación');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      toast.error('Añade contenido o un archivo');
      return;
    }
    createPostMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Publicación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Publicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <MentionInput
              value={content}
              onChange={setContent}
              placeholder="¿Qué quieres compartir? Usa @ para mencionar"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Adjuntar archivo (opcional)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                  }
                }}
              >
                <Image className="h-4 w-4 mr-2" />
                Imagen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'video/*';
                    fileInputRef.current.click();
                  }
                }}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar';
                    fileInputRef.current.click();
                  }
                }}
              >
                <File className="h-4 w-4 mr-2" />
                Archivo
              </Button>
            </div>
          </div>

          {file && (
            <div className="relative border rounded-md p-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setMediaType(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              {mediaType === 'image' && preview && (
                <img src={preview} alt="Preview" className="max-h-[200px] rounded mx-auto" />
              )}
              {mediaType === 'video' && preview && (
                <video src={preview} className="max-h-[200px] rounded mx-auto" controls />
              )}
              {mediaType === 'file' && (
                <div className="flex items-center gap-2">
                  <File className="h-8 w-8 text-primary" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publicar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
