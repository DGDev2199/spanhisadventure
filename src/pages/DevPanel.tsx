import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock, Unlock, Settings, ArrowLeft, Package, Globe, Users, Star, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  phase: number;
}

const phaseInfo = [
  { phase: 1, name: 'Base (Presencial)', icon: Package, color: 'text-green-500' },
  { phase: 2, name: 'Online', icon: Globe, color: 'text-blue-500' },
  { phase: 3, name: 'Comunidad', icon: Users, color: 'text-purple-500' },
  { phase: 4, name: 'Avanzado', icon: Star, color: 'text-amber-500' },
];

const DevPanel = () => {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchFlags();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAdmin, authLoading]);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('phase', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error('Error al cargar flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled, updated_at: new Date().toISOString() })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(prev => 
        prev.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f)
      );
      toast.success(`${flag.feature_name} ${!flag.is_enabled ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error('Error al actualizar');
    }
  };

  const togglePhase = async (phase: number, enable: boolean) => {
    try {
      const phaseFlags = flags.filter(f => f.phase === phase);
      
      for (const flag of phaseFlags) {
        await supabase
          .from('feature_flags')
          .update({ is_enabled: enable, updated_at: new Date().toISOString() })
          .eq('id', flag.id);
      }

      setFlags(prev => 
        prev.map(f => f.phase === phase ? { ...f, is_enabled: enable } : f)
      );
      toast.success(`Fase ${phase} ${enable ? 'activada' : 'desactivada'}`);
    } catch (error) {
      console.error('Error toggling phase:', error);
      toast.error('Error al cambiar el estado de la fase');
    }
  };

  const disableAll = async () => {
    try {
      for (const flag of flags) {
        await supabase
          .from('feature_flags')
          .update({ is_enabled: false, updated_at: new Date().toISOString() })
          .eq('id', flag.id);
      }

      setFlags(prev => prev.map(f => ({ ...f, is_enabled: false })));
      toast.success('Todas las funciones desactivadas');
    } catch (error) {
      console.error('Error disabling all:', error);
      toast.error('Error al desactivar todo');
    }
  };

  const getFlagsByPhase = (phase: number) => flags.filter(f => f.phase === phase);

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los administradores pueden acceder al panel de desarrollo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Panel de Desarrollador</h1>
              <p className="text-sm text-muted-foreground">Autenticado como Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>

        {/* Phases */}
        {phaseInfo.map(({ phase, name, icon: Icon, color }) => {
          const phaseFlags = getFlagsByPhase(phase);
          const allEnabled = phaseFlags.every(f => f.is_enabled);
          const someEnabled = phaseFlags.some(f => f.is_enabled);

          return (
            <Card key={phase}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <CardTitle className="text-lg">
                      Fase {phase} - {name}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      ({phaseFlags.filter(f => f.is_enabled).length}/{phaseFlags.length} activas)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePhase(phase, true)}
                      disabled={allEnabled}
                    >
                      <Unlock className="h-4 w-4 mr-1" />
                      Activar Todo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePhase(phase, false)}
                      disabled={!someEnabled}
                    >
                      <Lock className="h-4 w-4 mr-1" />
                      Desactivar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phaseFlags.map(flag => (
                    <div
                      key={flag.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {flag.is_enabled ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{flag.feature_name}</span>
                        </div>
                        {flag.description && (
                          <p className="text-sm text-muted-foreground ml-6">
                            {flag.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => toggleFeature(flag)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Emergency Button */}
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-destructive">Zona de Emergencia</h3>
                <p className="text-sm text-muted-foreground">
                  Desactivar todas las funciones inmediatamente
                </p>
              </div>
              <Button variant="destructive" onClick={disableAll}>
                <Lock className="h-4 w-4 mr-2" />
                DESACTIVAR TODO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevPanel;