import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TimeZoneSelector } from '@/components/TimeZoneSelector';
import { AvatarUpload } from '@/components/AvatarUpload';

interface RoleBasedEditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleBasedEditProfileDialog = ({ open, onOpenChange }: RoleBasedEditProfileDialogProps) => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    nationality: '',
    age: '',
    timezone: '',
    languages: '',
    diet: '',
    allergies: '',
    availability: '',
    experience: '',
    study_objectives: '',
    avatar_url: null as string | null,
    staff_type: 'presencial' as 'presencial' | 'online',
    hourly_rate: '',
    currency: 'USD',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      return data;
    },
    enabled: !!user && open,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        nationality: profile.nationality || '',
        age: profile.age?.toString() || '',
        timezone: profile.timezone || '',
        languages: profile.languages_spoken?.join(', ') || '',
        diet: profile.diet || '',
        allergies: profile.allergies || '',
        availability: profile.availability || '',
        experience: profile.experience || '',
        study_objectives: profile.study_objectives || '',
        avatar_url: profile.avatar_url || null,
        staff_type: (profile as any).staff_type || 'presencial',
        hourly_rate: (profile as any).hourly_rate?.toString() || '',
        currency: (profile as any).currency || 'USD',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        full_name: formData.full_name,
        nationality: formData.nationality,
        age: formData.age ? parseInt(formData.age) : null,
        timezone: formData.timezone,
        languages_spoken: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        diet: formData.diet,
        allergies: formData.allergies,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      };

      if (userRole === 'teacher' || userRole === 'tutor') {
        updates.availability = formData.availability;
        updates.experience = formData.experience;
        updates.staff_type = formData.staff_type;
        updates.hourly_rate = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null;
        updates.currency = formData.currency;
      } else if (userRole === 'student') {
        updates.study_objectives = formData.study_objectives;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
      onOpenChange(false);
    },
    onError: () => toast.error('Error al actualizar perfil'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Actualiza tu información personal</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <AvatarUpload
            value={profile?.avatar_url || null}
            onChange={(url) => setFormData({...formData, avatar_url: url})}
            userId={user?.id}
            userName={formData.full_name}
          />
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nacionalidad</Label>
              <Input value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Edad</Label>
              <Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
          </div>
          <TimeZoneSelector
            value={formData.timezone}
            onChange={(value) => setFormData({...formData, timezone: value})}
          />
          <div className="space-y-2">
            <Label>Idiomas (separados por comas)</Label>
            <Input value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dieta</Label>
              <Input value={formData.diet} onChange={e => setFormData({...formData, diet: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Alergias</Label>
              <Input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
            </div>
          </div>
          {(userRole === 'teacher' || userRole === 'tutor') && (
            <>
              <div className="space-y-2">
                <Label>Tipo de {userRole === 'teacher' ? 'Profesor' : 'Tutor'}</Label>
                <Select value={formData.staff_type} onValueChange={(v) => setFormData({...formData, staff_type: v as 'presencial' | 'online'})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">📍 Presencial</SelectItem>
                    <SelectItem value="online">🌐 Online</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.staff_type === 'online' 
                    ? 'Atiendes estudiantes de forma remota por videollamada' 
                    : 'Atiendes estudiantes de forma presencial en la escuela'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tarifa por Hora</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="25.00"
                    value={formData.hourly_rate} 
                    onChange={e => setFormData({...formData, hourly_rate: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">🇺🇸 USD</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                      <SelectItem value="MXN">🇲🇽 MXN</SelectItem>
                      <SelectItem value="COP">🇨🇴 COP</SelectItem>
                      <SelectItem value="ARS">🇦🇷 ARS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta tarifa se mostrará a estudiantes online. El 15% va como comisión de la plataforma.
              </p>
              <div className="space-y-2">
                <Label>Disponibilidad</Label>
                <Textarea value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Experiencia</Label>
                <Textarea value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
              </div>
            </>
          )}
          {userRole === 'student' && (
            <div className="space-y-2">
              <Label>Objetivos de Estudio</Label>
              <Textarea value={formData.study_objectives} onChange={e => setFormData({...formData, study_objectives: e.target.value})} />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="flex-1">
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
