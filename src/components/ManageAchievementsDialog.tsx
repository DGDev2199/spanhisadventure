import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Plus, Trash2, Loader2, Globe, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CreateAchievementDialog } from './CreateAchievementDialog';

interface ManageAchievementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageAchievementsDialog = ({ open, onOpenChange }: ManageAchievementsDialogProps) => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'coordinator';

  // Fetch all achievements
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['custom-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_achievements')
        .select(`
          *,
          creator:profiles!custom_achievements_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Delete achievement mutation
  const deleteMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const { error } = await supabase
        .from('custom_achievements')
        .delete()
        .eq('id', achievementId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Logro eliminado');
      queryClient.invalidateQueries({ queryKey: ['custom-achievements'] });
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const handleDelete = (achievementId: string, name: string) => {
    if (window.confirm(`¿Eliminar el logro "${name}"? Los estudiantes que lo tengan lo perderán.`)) {
      deleteMutation.mutate(achievementId);
    }
  };

  const globalAchievements = achievements.filter(a => a.is_global);
  const personalAchievements = achievements.filter(a => !a.is_global);

  const renderAchievementList = (items: typeof achievements) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay logros en esta categoría
        </p>
      ) : (
        items.map((achievement) => {
          const canDelete = isAdmin || achievement.created_by === user?.id;
          return (
            <div 
              key={achievement.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{achievement.name}</span>
                    {achievement.points_reward > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{achievement.points_reward} pts
                      </Badge>
                    )}
                  </div>
                  {achievement.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {achievement.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Por: {(achievement.creator as any)?.full_name || 'Desconocido'}
                  </p>
                </div>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(achievement.id, achievement.name)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Gestionar Logros
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Crear Nuevo Logro
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="global" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="global" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Globales ({globalAchievements.length})
                </TabsTrigger>
                <TabsTrigger value="personal" className="gap-2">
                  <User className="h-4 w-4" />
                  Personales ({personalAchievements.length})
                </TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[300px] mt-4">
                <TabsContent value="global" className="m-0">
                  {renderAchievementList(globalAchievements)}
                </TabsContent>
                <TabsContent value="personal" className="m-0">
                  {renderAchievementList(personalAchievements)}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <CreateAchievementDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
};
