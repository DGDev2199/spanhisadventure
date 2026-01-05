import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMOJI_OPTIONS = ['🏆', '⭐', '🎯', '🎤', '📚', '💬', '🌟', '🔥', '💡', '🎓', '👏', '🏅', '🥇', '🎉', '✨'];

export const CreateAchievementDialog = ({ open, onOpenChange }: CreateAchievementDialogProps) => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏆');
  const [pointsReward, setPointsReward] = useState(10);
  const [isGlobal, setIsGlobal] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'coordinator';

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('custom_achievements')
        .insert({
          name,
          description: description || null,
          icon,
          points_reward: pointsReward,
          created_by: user?.id,
          creator_role: userRole,
          is_global: isAdmin ? isGlobal : false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Logro creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['custom-achievements'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Error al crear logro: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('🏆');
    setPointsReward(10);
    setIsGlobal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Crear Nuevo Logro
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del logro</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Participación Destacada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué representa este logro..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Icono</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                    icon === emoji 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Puntos de recompensa</Label>
            <Input
              id="points"
              type="number"
              min={0}
              max={100}
              value={pointsReward}
              onChange={(e) => setPointsReward(Number(e.target.value))}
            />
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="global">Logro Global</Label>
                <p className="text-xs text-muted-foreground">
                  Los logros globales pueden ser asignados por cualquier profesor
                </p>
              </div>
              <Switch
                id="global"
                checked={isGlobal}
                onCheckedChange={setIsGlobal}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Logro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
