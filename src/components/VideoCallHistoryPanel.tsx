import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VideoCall {
  id: string;
  caller_id: string;
  student_id: string;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  student_profile?: {
    full_name: string;
  };
}

export const VideoCallHistoryPanel = () => {
  const { user } = useAuth();

  const { data: videoCalls, isLoading } = useQuery({
    queryKey: ['video-calls', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('caller_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Fetch student names
      const studentIds = [...new Set(data?.map(c => c.student_id) || [])];
      if (studentIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      
      return data?.map(call => ({
        ...call,
        student_profile: profiles?.find(p => p.id === call.student_id)
      })) as VideoCall[];
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Historial de Videollamadas
        </CardTitle>
        <CardDescription>Tus últimas videollamadas con estudiantes</CardDescription>
      </CardHeader>
      <CardContent>
        {videoCalls && videoCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Sala</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videoCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {call.student_profile?.full_name || 'Estudiante'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(call.started_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(call.started_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {call.room_id.slice(0, 20)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay videollamadas registradas
          </p>
        )}
      </CardContent>
    </Card>
  );
};
