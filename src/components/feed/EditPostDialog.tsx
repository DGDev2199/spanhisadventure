import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MentionInput } from './MentionInput';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string | null;
  };
}

export const EditPostDialog = ({ open, onOpenChange, post }: EditPostDialogProps) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(post.content || '');

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Publicación actualizada');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al actualizar publicación');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Publicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder="¿Qué quieres compartir?"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Usa @ para mencionar a otros usuarios
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
