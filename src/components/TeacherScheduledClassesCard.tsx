import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Video,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TeacherScheduledClassesCardProps {
  teacherId: string;
  onStartVideoCall?: (studentId: string, studentName: string) => void;
}

export const TeacherScheduledClassesCard = ({ 
  teacherId, 
  onStartVideoCall 
}: TeacherScheduledClassesCardProps) => {
  const { t } = useTranslation();

  const { data: scheduledClasses = [], isLoading } = useQuery({
    queryKey: ['teacher-topic-classes', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          notes,
          student_id,
          topic_id
        `)
        .eq('teacher_id', teacherId)
        .not('topic_id', 'is', null)
        .in('status', ['confirmed', 'pending'])
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Get topic and student details
      const topicIds = [...new Set(data?.map(c => c.topic_id).filter(Boolean))];
      const studentIds = [...new Set(data?.map(c => c.student_id))];

      const [topicsResult, studentsResult] = await Promise.all([
        topicIds.length > 0 
          ? supabase.from('week_topics').select('id, name').in('id', topicIds)
          : { data: [] },
        studentIds.length > 0
          ? supabase.from('safe_profiles_view').select('id, full_name, avatar_url').in('id', studentIds)
          : { data: [] }
      ]);

      const topicsMap = new Map((topicsResult.data || []).map(t => [t.id, t] as const));
      const studentsMap = new Map((studentsResult.data || []).map(s => [s.id, s] as const));

      return data?.map(booking => ({
        ...booking,
        topic: topicsMap.get(booking.topic_id),
        student: studentsMap.get(booking.student_id)
      })) || [];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (scheduledClasses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Clases Programadas por Tema
          <Badge variant="secondary">{scheduledClasses.length}</Badge>
        </CardTitle>
        <CardDescription>
          Próximas clases solicitadas por tus estudiantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3">
            {scheduledClasses.map((booking: any) => (
              <div
                key={booking.id}
                className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={booking.student?.avatar_url} />
                    <AvatarFallback>
                      {booking.student?.full_name?.[0] || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(booking.booking_date), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                      </Badge>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {booking.topic?.name || 'Tema no especificado'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estudiante: {booking.student?.full_name || 'Desconocido'}
                      </p>
                    </div>
                    
                    {booking.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{booking.notes}"
                      </p>
                    )}
                  </div>
                  
                  {onStartVideoCall && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartVideoCall(
                        booking.student_id,
                        booking.student?.full_name || 'Estudiante'
                      )}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Llamar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
