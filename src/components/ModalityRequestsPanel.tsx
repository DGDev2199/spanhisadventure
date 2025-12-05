import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Clock, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getModalityLabel = (type: string) => {
  switch (type) {
    case 'online': return { label: 'Online', icon: <Globe className="h-3 w-3" /> };
    case 'presencial': return { label: 'Presencial', icon: <MapPin className="h-3 w-3" /> };
    case 'both': return { label: 'Ambos', icon: <><Globe className="h-3 w-3" /><MapPin className="h-3 w-3" /></> };
    default: return { label: type, icon: null };
  }
};

export const ModalityRequestsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['modality-requests'],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from('staff_modality_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!requestsData?.length) return [];

      // Get profiles for these users
      const userIds = requestsData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Get roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      return requestsData.map(request => ({
        ...request,
        profile: profiles?.find(p => p.id === request.user_id),
        role: roles?.find(r => r.user_id === request.user_id)?.role,
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error: requestError } = await supabase
        .from('staff_modality_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (requestError) throw requestError;

      // Update profile staff_type
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ staff_type: request.requested_modality })
        .eq('id', request.user_id);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modality-requests'] });
      toast.success('Solicitud aprobada');
    },
    onError: () => toast.error('Error al aprobar solicitud'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('staff_modality_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modality-requests'] });
      toast.success('Solicitud rechazada');
    },
    onError: () => toast.error('Error al rechazar solicitud'),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solicitudes de Modalidad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!requests?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solicitudes de Modalidad</CardTitle>
          <CardDescription>Aprobar cambios de modalidad para profesores y tutores</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">No hay solicitudes pendientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Solicitudes de Modalidad
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
        <CardDescription>Aprobar cambios de modalidad para profesores y tutores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => {
            const initials = request.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
            const currentModality = getModalityLabel(request.current_modality);
            const requestedModality = getModalityLabel(request.requested_modality);

            return (
              <div key={request.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar>
                  <AvatarImage src={request.profile?.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{request.profile?.full_name || 'Usuario'}</p>
                    <Badge variant="outline" className="text-xs">
                      {request.role === 'teacher' ? 'Profesor' : 'Tutor'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {currentModality.icon} {currentModality.label}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium flex items-center gap-1 text-primary">
                      {requestedModality.icon} {requestedModality.label}
                    </span>
                  </div>
                  {request.reason && (
                    <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      "{request.reason}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => approveMutation.mutate(request.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate(request.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};