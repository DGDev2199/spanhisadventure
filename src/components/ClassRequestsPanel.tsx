import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, Clock, UserPlus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ClassRequest {
  id: string;
  student_id: string;
  teacher_id: string | null;
  tutor_id: string | null;
  request_type: 'teacher' | 'tutor';
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  student_profile?: {
    full_name: string;
    avatar_url: string | null;
    email: string;
    timezone: string | null;
  } | null;
}

export const ClassRequestsPanel = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['class-requests', user?.id, userRole],
    queryFn: async (): Promise<ClassRequest[]> => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('class_requests')
        .select('*')
        .eq('status', 'pending');

      if (userRole === 'teacher') {
        query = query.eq('teacher_id', user.id);
      } else if (userRole === 'tutor') {
        query = query.eq('tutor_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch student profiles
      if (data && data.length > 0) {
        const studentIds = data.map(r => r.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email, timezone')
          .in('id', studentIds);

        return data.map(request => ({
          ...request,
          request_type: request.request_type as 'teacher' | 'tutor',
          status: request.status as 'pending' | 'accepted' | 'rejected',
          student_profile: profiles?.find(p => p.id === request.student_id) || null,
        }));
      }

      return [];
    },
    enabled: !!user?.id && (userRole === 'teacher' || userRole === 'tutor'),
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error: updateError } = await supabase
        .from('class_requests')
        .update({
          status: accept ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (accept) {
        // Assign the teacher/tutor to the student
        const updateData: any = {};
        if (request.request_type === 'teacher') {
          updateData.teacher_id = user?.id;
        } else {
          updateData.tutor_id = user?.id;
        }

        const { error: assignError } = await supabase
          .from('student_profiles')
          .update(updateData)
          .eq('user_id', request.student_id);

        if (assignError) throw assignError;

        // Get staff name for notification
        const { data: staffProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user?.id)
          .single();

        // Notify student
        await supabase.rpc('create_notification', {
          p_user_id: request.student_id,
          p_title: `Solicitud Aceptada`,
          p_message: `${staffProfile?.full_name || 'Un profesor'} ha aceptado ser tu ${request.request_type === 'teacher' ? 'profesor' : 'tutor'}`,
          p_type: 'class_request_accepted',
          p_related_id: user?.id,
        });
      } else {
        // Notify rejection
        await supabase.rpc('create_notification', {
          p_user_id: request.student_id,
          p_title: 'Solicitud Rechazada',
          p_message: `Tu solicitud de ${request.request_type === 'teacher' ? 'clases' : 'tutorías'} no fue aceptada. Puedes intentar con otro profesional.`,
          p_type: 'class_request_rejected',
        });
      }
    },
    onSuccess: (_, { accept }) => {
      toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada');
      queryClient.invalidateQueries({ queryKey: ['class-requests'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-students'] });
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Solicitudes de Clase
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return null; // Don't show if no requests
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Solicitudes de {userRole === 'teacher' ? 'Clases' : 'Tutorías'}
          <Badge variant="destructive">{requests.length}</Badge>
        </CardTitle>
        <CardDescription>
          Estudiantes online que quieren tomar {userRole === 'teacher' ? 'clases' : 'tutorías'} contigo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="flex items-start justify-between p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {request.student_profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{request.student_profile?.full_name}</p>
                    <Badge variant="outline" className="text-xs">Online</Badge>
                  </div>
                  {request.student_profile?.timezone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {request.student_profile.timezone}
                    </p>
                  )}
                  {request.message && (
                    <div className="mt-2 p-2 bg-background rounded text-sm flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(request.created_at).toLocaleDateString('es', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => respondMutation.mutate({ requestId: request.id, accept: false })}
                  disabled={respondMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  onClick={() => respondMutation.mutate({ requestId: request.id, accept: true })}
                  disabled={respondMutation.isPending}
                >
                  {respondMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Aceptar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
