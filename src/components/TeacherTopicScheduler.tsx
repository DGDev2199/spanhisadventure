import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useProgramWeeks, useAllWeekTopics, getCurrentWeekForLevel } from '@/hooks/useGamification';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleTopicClassDialog } from './ScheduleTopicClassDialog';

interface TeacherTopicSchedulerProps {
  teacherId: string;
}

export const TeacherTopicScheduler = ({ teacherId }: TeacherTopicSchedulerProps) => {
  const { t } = useTranslation();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch students assigned to this teacher
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students-for-scheduler', teacherId],
    queryFn: async () => {
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('user_id, level')
        .eq('teacher_id', teacherId);
      
      if (studentError) throw studentError;
      if (!studentData || studentData.length === 0) return [];

      const userIds = studentData.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('safe_profiles_view')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      return studentData.map(sp => ({
        ...sp,
        profile: profiles?.find(p => p.id === sp.user_id)
      }));
    },
    enabled: !!teacherId
  });

  // Get student's completed weeks
  const { data: studentProgress } = useQuery({
    queryKey: ['student-progress-weeks', selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .select('week_number, is_completed')
        .eq('student_id', selectedStudentId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId
  });

  const { data: weeks } = useProgramWeeks();
  const { data: allTopics } = useAllWeekTopics();

  const selectedStudent = useMemo(() => {
    return students?.find(s => s.user_id === selectedStudentId);
  }, [students, selectedStudentId]);

  const completedWeekNumbers = useMemo(() => {
    return studentProgress?.filter(p => p.is_completed).map(p => p.week_number) || [];
  }, [studentProgress]);

  const currentWeek = useMemo(() => {
    return getCurrentWeekForLevel(selectedStudent?.level || null, completedWeekNumbers);
  }, [selectedStudent?.level, completedWeekNumbers]);

  const getWeekStatus = (weekNumber: number) => {
    if (completedWeekNumbers.includes(weekNumber)) return 'completed';
    if (weekNumber === currentWeek) return 'current';
    if (weekNumber <= currentWeek) return 'available';
    return 'locked';
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': 'bg-emerald-500',
      'A2': 'bg-green-500',
      'B1': 'bg-yellow-500',
      'B2': 'bg-orange-500',
      'C1': 'bg-red-500',
      'C2': 'bg-purple-500'
    };
    return colors[level] || 'bg-muted';
  };

  const selectedWeek = weeks?.find(w => w.id === selectedWeekId);
  const topicsForWeek = allTopics?.filter(t => t.week_id === selectedWeekId) || [];

  const handleTopicClick = (topicId: string, topicTitle: string) => {
    setSelectedTopic({ id: topicId, title: topicTitle });
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Agendar Clase por Tema
              </CardTitle>
              <CardDescription>
                Selecciona un estudiante y el tema del currículo para programar una clase
              </CardDescription>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Student Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Estudiante</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.profile?.full_name || 'Sin nombre'} 
                      {student.level && <span className="ml-2 text-muted-foreground">({student.level})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weeks Grid */}
            {selectedStudentId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Semana del Currículo</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {weeks?.map(week => {
                    const status = getWeekStatus(week.week_number);
                    const isSelected = selectedWeekId === week.id;
                    
                    return (
                      <button
                        key={week.id}
                        onClick={() => setSelectedWeekId(isSelected ? null : week.id)}
                        className={`
                          relative p-3 rounded-lg border-2 text-center transition-all
                          ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
                          ${status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                        `}
                        disabled={status === 'locked'}
                      >
                        <div className="text-lg font-bold">{week.week_number}</div>
                        <div className={`text-xs px-1 py-0.5 rounded ${getLevelColor(week.level)} text-white`}>
                          {week.level}
                        </div>
                        {status === 'completed' && (
                          <CheckCircle className="absolute top-1 right-1 h-3 w-3 text-green-500" />
                        )}
                        {status === 'locked' && (
                          <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topics for Selected Week */}
            {selectedWeek && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">
                  Semana {selectedWeek.week_number} - {selectedWeek.title}
                </h4>
                {selectedWeek.description && (
                  <p className="text-sm text-muted-foreground mb-3">{selectedWeek.description}</p>
                )}
                
                {topicsForWeek.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topicsForWeek.map(topic => (
                      <Button
                        key={topic.id}
                        variant="outline"
                        className="justify-start gap-2 h-auto py-3"
                        onClick={() => handleTopicClick(topic.id, topic.name)}
                      >
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">{topic.name}</div>
                          <div className="text-xs text-muted-foreground">Agendar clase</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay temas configurados para esta semana</p>
                )}
              </div>
            )}

            {!selectedStudentId && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Selecciona un estudiante para ver el currículo
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Schedule Dialog */}
      {selectedTopic && selectedStudentId && (
        <ScheduleTopicClassDialog
          open={!!selectedTopic}
          onOpenChange={(open) => !open && setSelectedTopic(null)}
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
          studentId={selectedStudentId}
          studentName={selectedStudent?.profile?.full_name || 'Estudiante'}
          teacherId={teacherId}
        />
      )}
    </>
  );
};
