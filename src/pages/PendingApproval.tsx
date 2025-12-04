import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, LogOut, RefreshCw } from 'lucide-react';
import logo from '@/assets/logo.png';

const PendingApproval = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkApprovalStatus = async () => {
    if (!user?.id) return;
    
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.is_approved) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkApprovalStatus();
    
    // Set up realtime subscription for approval updates
    const channel = supabase
      .channel('approval-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_approved) {
            navigate('/dashboard');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <img src={logo} alt="Spanish Adventure" className="h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-2">Spanish Adventure</h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-xl">Pendiente de Aprobación</CardTitle>
            <CardDescription>
              Tu cuenta está siendo revisada por nuestro equipo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Cuenta creada</p>
                  <p className="text-xs text-muted-foreground">Tu registro fue recibido correctamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">En revisión</p>
                  <p className="text-xs text-muted-foreground">
                    Un administrador revisará tu información pronto
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Recibirás acceso completo una vez que tu cuenta sea aprobada. 
              Este proceso generalmente toma menos de 24 horas.
            </p>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={checkApprovalStatus} 
                variant="outline" 
                className="w-full"
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                Verificar Estado
              </Button>
              <Button 
                onClick={signOut} 
                variant="ghost" 
                className="w-full text-muted-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
