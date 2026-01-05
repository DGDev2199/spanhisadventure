import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Award, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AwardAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export const AwardAchievementDialog = ({ 
  open, 
  onOpenChange, 
  studentId, 
  studentName 
}: AwardAchievementDialogProps) => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [notes, setNotes] = useState('');

  // Get available achievements (global + own creations)
  const { data: achievements = [] } = useQuery({
    queryKey: ['available-achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_achievements')
        .select('*')
        .or(`is_global.eq.true,created_by.eq.${user?.id}`)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id,
  });

  // Get student's existing achievements
  const { data: studentAchievements = [] } = useQuery({
    queryKey: ['student-achievements', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select('achievement_id')
        .eq('student_id', studentId);
      if (error) throw error;
      return data.map(a => a.achievement_id);
    },
    enabled: open && !!studentId,
  });

  // Filter out already awarded achievements
  const availableAchievements = achievements.filter(
    a => !studentAchievements.includes(a.id)
  );

  const awardMutation = useMutation({
    mutationFn: async () => {
      const achievement = achievements.find(a => a.id === selectedAchievement);
      if (!achievement) throw new Error('Logro no encontrado');

      // Award the achievement
      const { error: awardError } = await supabase
        .from('student_achievements')
        .insert({
          achievement_id: selectedAchievement,
          student_id: studentId,
          awarded_by: user?.id,
          notes: notes || null,
        });
      if (awardError) throw awardError;

      // Award points if applicable
      if (achievement.points_reward && achievement.points_reward > 0) {
        await supabase
          .from('user_points')
          .insert({
            user_id: studentId,
            points: achievement.points_reward,
            reason: 'achievement_awarded',
            related_id: selectedAchievement,
          });
      }
    },
    onSuccess: () => {
      toast.success('Logro otorgado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['student-achievements', studentId] });
      queryClient.invalidateQueries({ queryKey: ['user-total-points', studentId] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings'] });
      onOpenChange(false);
      setSelectedAchievement('');
      setNotes('');
    },
    onError: (error) => {
      toast.error('Error al otorgar logro: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAchievement) {
      toast.error('Selecciona un logro');
      return;
    }
    awardMutation.mutate();
  };

  const selectedAchievementData = achievements.find(a => a.id === selectedAchievement);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Otorgar Logro a {studentName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Logro</Label>
            {availableAchievements.length > 0 ? (
              <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un logro" />
                </SelectTrigger>
                <SelectContent>
                  {availableAchievements.map((achievement) => (
                    <SelectItem key={achievement.id} value={achievement.id}>
                      <span className="flex items-center gap-2">
                        <span>{achievement.icon}</span>
                        <span>{achievement.name}</span>
                        {achievement.points_reward > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{achievement.points_reward} pts
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                No hay logros disponibles para asignar. {studentAchievements.length > 0 
                  ? 'El estudiante ya tiene todos los logros disponibles.'
                  : 'Crea un logro primero.'}
              </p>
            )}
          </div>

          {selectedAchievementData && (
            <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selectedAchievementData.icon}</span>
                <span className="font-medium">{selectedAchievementData.name}</span>
              </div>
              {selectedAchievementData.description && (
                <p className="text-sm text-muted-foreground">{selectedAchievementData.description}</p>
              )}
              {selectedAchievementData.points_reward > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm text-yellow-600">
                  <Sparkles className="h-3 w-3" />
                  +{selectedAchievementData.points_reward} puntos
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Nota personalizada (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Por excelente participación en la clase de hoy..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={awardMutation.isPending || !selectedAchievement}
            >
              {awardMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Otorgar Logro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
