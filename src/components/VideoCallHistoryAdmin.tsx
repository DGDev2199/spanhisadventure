import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Video, Clock, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface VideoCall {
  id: string;
  caller_id: string;
  student_id: string;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  caller_profile?: { full_name: string };
  student_profile?: { full_name: string };
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

export const VideoCallHistoryAdmin = () => {
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Fetch all staff members (teachers and tutors)
  const { data: staffMembers } = useQuery({
    queryKey: ['staff-for-calls'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['teacher', 'tutor']);
      
      if (error) throw error;
      
      const userIds = roles?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      return roles?.map(r => ({
        id: r.user_id,
        full_name: profiles?.find(p => p.id === r.user_id)?.full_name || 'Sin nombre',
        role: r.role
      })) as StaffMember[];
    }
  });

  // Fetch video calls
  const { data: videoCalls, isLoading } = useQuery({
    queryKey: ['admin-video-calls', selectedStaff],
    queryFn: async () => {
      let query = supabase
        .from('video_calls')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (selectedStaff !== 'all') {
        query = query.eq('caller_id', selectedStaff);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch all profile names
      const callerIds = [...new Set(data?.map(c => c.caller_id) || [])];
      const studentIds = [...new Set(data?.map(c => c.student_id) || [])];
      const allIds = [...new Set([...callerIds, ...studentIds])];
      
      if (allIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allIds);
      
      return data?.map(call => ({
        ...call,
        caller_profile: profiles?.find(p => p.id === call.caller_id),
        student_profile: profiles?.find(p => p.id === call.student_id)
      })) as VideoCall[];
    }
  });

  // Calculate stats
  const totalCalls = videoCalls?.length || 0;
  const uniqueStaff = new Set(videoCalls?.map(c => c.caller_id)).size;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Historial de Videollamadas
            </CardTitle>
            <CardDescription>Todas las videollamadas realizadas por el staff</CardDescription>
          </div>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {staffMembers?.map(staff => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.full_name} ({staff.role === 'teacher' ? 'Profesor' : 'Tutor'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              Total Llamadas
            </div>
            <p className="text-2xl font-bold text-primary">{totalCalls}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Staff Activo
            </div>
            <p className="text-2xl font-bold text-primary">{uniqueStaff}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videoCalls && videoCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesor/Tutor</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videoCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      {call.caller_profile?.full_name || 'Staff'}
                    </TableCell>
                    <TableCell>
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
