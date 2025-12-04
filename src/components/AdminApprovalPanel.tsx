import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  student_type?: string;
}

export const AdminApprovalPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      // Get users that are not approved
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at, is_approved')
        .or('is_approved.eq.false,is_approved.is.null')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for these users
      const userIds = profilesData?.map(p => p.id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Get student types for students
      const { data: studentProfilesData } = await supabase
        .from('student_profiles')
        .select('user_id, student_type')
        .in('user_id', userIds);

      // Merge data
      return profilesData?.map(profile => ({
        ...profile,
        role: rolesData?.find(r => r.user_id === profile.id)?.role,
        student_type: studentProfilesData?.find(s => s.user_id === profile.id)?.student_type,
      })) || [];
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_approved: true, 
          approved_by: user?.id, 
          approved_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      // Create notification for the user
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: 'Cuenta Aprobada',
        p_message: '¡Tu cuenta ha sido aprobada! Ya puedes acceder a todas las funciones de la plataforma.',
        p_type: 'approval',
      });
    },
    onSuccess: () => {
      toast.success('Usuario aprobado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error('Error al aprobar usuario: ' + error.message);
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user and associated data
      await supabase.from('student_profiles').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Delete from auth using edge function
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      toast.success('Usuario rechazado y eliminado');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error('Error al rechazar usuario: ' + error.message);
    },
  });

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'student':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Estudiante</Badge>;
      case 'teacher':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Profesor</Badge>;
      case 'tutor':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Tutor</Badge>;
      default:
        return <Badge variant="secondary">Sin rol</Badge>;
    }
  };

  const getStudentTypeBadge = (studentType?: string) => {
    if (!studentType) return null;
    return studentType === 'online' 
      ? <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">Online</Badge>
      : <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Presencial</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Usuarios Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Usuarios Pendientes de Aprobación
          {pendingUsers && pendingUsers.length > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Revisa y aprueba los nuevos registros
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers && pendingUsers.length > 0 ? (
          <div className="space-y-3">
            {pendingUsers.map((pendingUser) => (
              <div 
                key={pendingUser.id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={pendingUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {pendingUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{pendingUser.full_name}</p>
                      {getRoleBadge(pendingUser.role)}
                      {pendingUser.role === 'student' && getStudentTypeBadge(pendingUser.student_type)}
                    </div>
                    <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(pendingUser.created_at).toLocaleDateString('es', { 
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
                    onClick={() => {
                      if (window.confirm(`¿Rechazar y eliminar a ${pendingUser.full_name}?`)) {
                        rejectUserMutation.mutate(pendingUser.id);
                      }
                    }}
                    disabled={rejectUserMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => approveUserMutation.mutate(pendingUser.id)}
                    disabled={approveUserMutation.isPending}
                  >
                    {approveUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay usuarios pendientes de aprobación</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
