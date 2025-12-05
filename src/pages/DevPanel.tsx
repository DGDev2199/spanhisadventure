import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock, Unlock, Settings, ArrowLeft, Package, Globe, Users, Star, KeyRound } from 'lucide-react';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showChangePin, setShowChangePin] = useState(false);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlags = async () => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('phase', { ascending: true })
      .order('feature_name', { ascending: true });

    if (error) {
      toast.error('Error al cargar flags');
      return;
    }
    setFlags(data || []);
  };

  const validatePin = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('developer_settings')
      .select('setting_value')
      .eq('setting_key', 'dev_pin')
      .single();

    if (error || !data) {
      toast.error('Error de autenticación');
      setLoading(false);
      return;
    }

    if (data.setting_value === pin) {
      setIsAuthenticated(true);
      await fetchFlags();
      toast.success('Acceso concedido');
    } else {
      toast.error('PIN incorrecto');
    }
    setLoading(false);
  };

  const toggleFeature = async (flag: FeatureFlag) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: !flag.is_enabled, updated_at: new Date().toISOString() })
      .eq('id', flag.id);

    if (error) {
      toast.error('Error al actualizar');
      return;
    }

    setFlags(prev => 
      prev.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f)
    );
    toast.success(`${flag.feature_name} ${!flag.is_enabled ? 'activado' : 'desactivado'}`);
  };

  const togglePhase = async (phase: number, enable: boolean) => {
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
  };

  const disableAll = async () => {
    for (const flag of flags) {
      await supabase
        .from('feature_flags')
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq('id', flag.id);
    }

    setFlags(prev => prev.map(f => ({ ...f, is_enabled: false })));
    toast.success('Todas las funciones desactivadas');
  };

  const changePin = async () => {
    if (newPin.length < 4) {
      toast.error('El PIN debe tener al menos 4 caracteres');
      return;
    }

    const { error } = await supabase
      .from('developer_settings')
      .update({ setting_value: newPin })
      .eq('setting_key', 'dev_pin');

    if (error) {
      toast.error('Error al cambiar PIN');
      return;
    }

    toast.success('PIN cambiado exitosamente');
    setNewPin('');
    setShowChangePin(false);
  };

  const getFlagsByPhase = (phase: number) => flags.filter(f => f.phase === phase);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Panel de Desarrollador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Ingresa el PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validatePin()}
            />
            <Button onClick={validatePin} className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Acceder'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
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
            <h1 className="text-2xl font-bold">Panel de Desarrollador</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowChangePin(!showChangePin)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Cambiar PIN
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        {/* Change PIN */}
        {showChangePin && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Nuevo PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
                <Button onClick={changePin}>Guardar</Button>
                <Button variant="ghost" onClick={() => setShowChangePin(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
