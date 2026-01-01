import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useProgramWeeks, 
  useAllWeekTopics, 
  useStudentTopicProgress 
} from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleTopicClassDialog } from '@/components/ScheduleTopicClassDialog';
import { 
  BookOpen, 
  Calendar, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentTopicSchedulerProps {
  studentId: string;
  studentLevel?: string;
}

export const StudentTopicScheduler = ({ studentId, studentLevel }: StudentTopicSchedulerProps) => {
  const { t } = useTranslation();
  const { data: weeks = [] } = useProgramWeeks();
  const { data: allTopics = [] } = useAllWeekTopics();
  const { data: topicProgress = [] } = useStudentTopicProgress(studentId);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Get student's teacher
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile-scheduler', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('teacher_id')
        .eq('user_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Get teacher profile with availability
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-availability', studentProfile?.teacher_id],
    queryFn: async () => {
      if (!studentProfile?.teacher_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, availability')
        .eq('id', studentProfile.teacher_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentProfile?.teacher_id
  });

  // Get completed week numbers
  const { data: completedWeeks = [] } = useQuery({
    queryKey: ['student-completed-weeks-list', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_progress_weeks')
        .select('week_number')
        .eq('student_id', studentId)
        .eq('is_completed', true);
      if (error) throw error;
      return data?.map(w => w.week_number) || [];
    }
  });

  // Get level order for filtering
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const studentLevelIndex = levelOrder.indexOf(studentLevel || 'A1');

  // Filter weeks based on student level
  const accessibleWeeks = useMemo(() => {
    return weeks.filter(week => {
      const weekLevelIndex = levelOrder.indexOf(week.level);
      return weekLevelIndex <= studentLevelIndex;
    });
  }, [weeks, studentLevelIndex]);

  const getTopicsForWeek = (weekId: string) => {
    return allTopics.filter(t => t.week_id === weekId);
  };

  const getTopicStatus = (topicId: string) => {
    const progress = topicProgress.find(p => p.topic_id === topicId);
    return progress?.status || 'not_started';
  };

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      'A1': 'bg-emerald-500',
      'A2': 'bg-green-500',
      'B1': 'bg-blue-500',
      'B2': 'bg-indigo-500',
      'C1': 'bg-purple-500',
      'C2': 'bg-pink-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const handleSelectTopic = (topic: any) => {
    if (!teacherProfile) return;
    setSelectedTopic(topic);
    setShowScheduleDialog(true);
  };

  if (!teacherProfile) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('schedule.bookTopicClass', 'Agendar Clase por Tema')}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CardTitle>
          {!isExpanded && (
            <CardDescription>
              Selecciona un tema del currículo para agendar una clase con tu profesor
            </CardDescription>
          )}
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Weeks grid */}
            <div>
              <h4 className="text-sm font-medium mb-2">Selecciona una semana:</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {accessibleWeeks.map((week) => {
                  const isCompleted = completedWeeks.includes(week.week_number);
                  const isSelected = selectedWeek === week.id;
                  
                  return (
                    <button
                      key={week.id}
                      onClick={() => setSelectedWeek(isSelected ? null : week.id)}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all",
                        isSelected && "ring-2 ring-primary bg-primary/10",
                        isCompleted && !isSelected && "bg-green-50 border-green-200",
                        !isSelected && !isCompleted && "hover:bg-muted"
                      )}
                    >
                      <div className="text-sm font-bold">{week.week_number}</div>
                      <Badge className={cn("text-[10px] px-1", getLevelColor(week.level))}>
                        {week.level}
                      </Badge>
                      {isCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics for selected week */}
            {selectedWeek && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Temas de la semana:
                </h4>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {getTopicsForWeek(selectedWeek).map((topic) => {
                      const status = getTopicStatus(topic.id);
                      
                      return (
                        <div
                          key={topic.id}
                          className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{topic.name}</p>
                              {topic.description && (
                                <p className="text-xs text-muted-foreground">{topic.description}</p>
                              )}
                            </div>
                            {status === 'completed' && (
                              <Badge className="bg-green-500 text-xs">Dominado</Badge>
                            )}
                            {status === 'needs_review' && (
                              <Badge className="bg-yellow-500 text-xs">Práctica</Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectTopic(topic)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Agendar
                          </Button>
                        </div>
                      );
                    })}
                    {getTopicsForWeek(selectedWeek).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay temas en esta semana
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Teacher info */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              Profesor: <span className="font-medium">{teacherProfile.full_name}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Schedule Dialog */}
      {selectedTopic && teacherProfile && (
        <ScheduleTopicClassDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.name}
          teacherId={teacherProfile.id}
          studentId={studentId}
          studentName=""
        />
      )}
    </>
  );
};
