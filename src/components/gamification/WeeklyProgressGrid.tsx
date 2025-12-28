import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  useProgramWeeks, 
  useAllWeekTopics, 
  useStudentTopicProgress,
  getCurrentWeekForLevel,
  getWeekStatus,
  type ProgramWeek,
  type WeekTopic,
  type StudentTopicProgress
} from "@/hooks/useGamification";
import { TopicCard } from "./TopicCard";
import { TopicActionsModal } from "./TopicActionsModal";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyProgressGridProps {
  studentId: string;
  studentLevel: string | null;
  completedWeeks?: number[];
  isEditable?: boolean;
}

export const WeeklyProgressGrid = ({ 
  studentId, 
  studentLevel, 
  completedWeeks = [],
  isEditable = false
}: WeeklyProgressGridProps) => {
  const { t } = useTranslation();
  const [selectedWeek, setSelectedWeek] = useState<ProgramWeek | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<WeekTopic | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);

  const { data: weeks = [] } = useProgramWeeks();
  const { data: allTopics = [] } = useAllWeekTopics();
  const { data: progress = [] } = useStudentTopicProgress(studentId);

  const currentWeek = getCurrentWeekForLevel(studentLevel);

  const getTopicsForWeek = (weekId: string): WeekTopic[] => {
    return allTopics.filter(t => t.week_id === weekId);
  };

  const getTopicProgress = (topicId: string): StudentTopicProgress | undefined => {
    return progress.find(p => p.topic_id === topicId);
  };

  const handleWeekClick = (week: ProgramWeek) => {
    setSelectedWeek(selectedWeek?.id === week.id ? null : week);
  };

  const handleTopicClick = (topic: WeekTopic, isLocked: boolean) => {
    if (isLocked) return; // No abrir modal para temas bloqueados
    setSelectedTopic(topic);
    setShowTopicModal(true);
  };

  // Determinar si la semana seleccionada está en modo preview (bloqueada)
  const isPreviewMode = selectedWeek 
    ? getWeekStatus(selectedWeek.week_number, currentWeek, completedWeeks) === 'locked'
    : false;

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📅</span>
          {t('progress.weeklyProgress', 'Progreso Semanal')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid de 12 semanas */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {weeks.map((week) => {
            const status = getWeekStatus(week.week_number, currentWeek, completedWeeks);
            const isSelected = selectedWeek?.id === week.id;
            
            return (
              <button
                key={week.id}
                onClick={() => handleWeekClick(week)}
                className={cn(
                  "relative p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 border-2 text-center cursor-pointer",
                  status === 'completed' && "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300",
                  status === 'current' && "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 ring-2 ring-blue-300 ring-offset-1 sm:ring-offset-2",
                  status === 'locked' && "bg-muted/50 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/70",
                  isSelected && "scale-105 shadow-lg",
                  "hover:scale-105 hover:shadow-md"
                )}
              >
                {/* Status icon */}
                <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5">
                  {status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 bg-white dark:bg-background rounded-full" />
                  )}
                  {status === 'current' && (
                    <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 fill-blue-600" />
                  )}
                  {status === 'locked' && (
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Week number */}
                <div className="text-base sm:text-lg font-bold">{week.week_number}</div>
                
                {/* Level badge */}
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 mt-0.5 sm:mt-1 text-white",
                    getLevelColor(week.level)
                  )}
                >
                  {week.level}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Detalle de la semana seleccionada */}
        {selectedWeek && (
          <Card className={cn(
            "border-2",
            isPreviewMode 
              ? "border-dashed border-muted-foreground/30 bg-muted/20" 
              : "border-primary/20 bg-primary/5"
          )}>
            <CardHeader className="pb-2 px-3 sm:px-6">
              {/* Banner motivacional para semanas bloqueadas */}
              {isPreviewMode && (
                <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">🚀</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm sm:text-base truncate">
                      ¡Esto te espera en la Semana {selectedWeek.week_number}!
                    </p>
                    <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400">
                      Sigue practicando para desbloquear
                    </p>
                  </div>
                </div>
              )}
              
              <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:justify-between">
                <span className="flex items-center gap-2 min-w-0 truncate">
                  {isPreviewMode && <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />}
                  <span className="truncate">Semana {selectedWeek.week_number}: {selectedWeek.title}</span>
                </span>
                <Badge className={cn("text-white text-xs w-fit flex-shrink-0", getLevelColor(selectedWeek.level))}>
                  {selectedWeek.level}
                </Badge>
              </CardTitle>
              {selectedWeek.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {selectedWeek.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {/* Topics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {getTopicsForWeek(selectedWeek.id).map((topic) => {
                  const topicProgress = getTopicProgress(topic.id);
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      status={topicProgress?.status || 'not_started'}
                      onClick={() => handleTopicClick(topic, isPreviewMode)}
                      isLocked={isPreviewMode}
                    />
                  );
                })}
                {getTopicsForWeek(selectedWeek.id).length === 0 && (
                  <p className="text-muted-foreground text-xs sm:text-sm col-span-full text-center py-4">
                    {t('progress.noTopics', 'No hay temas asignados a esta semana')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de acciones */}
        {selectedTopic && (
          <TopicActionsModal
            open={showTopicModal}
            onOpenChange={setShowTopicModal}
            topic={selectedTopic}
            studentId={studentId}
            isEditable={isEditable}
          />
        )}
      </CardContent>
    </Card>
  );
};
