import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  useAllBadges, 
  useUserBadges, 
  useUserTotalPoints,
  useStudentAchievements,
  useCompletedWeeksCount,
  useCompletedTasksCount,
  useCompletedExercisesCount
} from "@/hooks/useGamification";
import { Trophy, Star, Award, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamificationPanelProps {
  userId: string;
}

export const GamificationPanel = ({ userId }: GamificationPanelProps) => {
  const { t } = useTranslation();
  const { data: allBadges = [] } = useAllBadges();
  const { data: userBadges = [] } = useUserBadges(userId);
  const { data: totalPoints = 0 } = useUserTotalPoints(userId);
  const { data: studentAchievements = [] } = useStudentAchievements(userId);
  
  // Get real counts for progress calculation
  const { data: completedWeeksCount = 0 } = useCompletedWeeksCount(userId);
  const { data: completedTasksCount = 0 } = useCompletedTasksCount(userId);
  const { data: completedExercisesCount = 0 } = useCompletedExercisesCount(userId);

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedBadges = userBadges.map(ub => ub.badge);
  
  // Find next badge to unlock
  const unearnedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));
  const nextBadge = unearnedBadges[0];

  // Calculate real progress to next badge based on actual counts
  const getProgressToNextBadge = () => {
    if (!nextBadge) return 100;
    
    let currentValue = 0;
    switch (nextBadge.criteria_type) {
      case 'tasks_completed':
        currentValue = completedTasksCount;
        break;
      case 'first_task':
        currentValue = completedTasksCount >= 1 ? 1 : 0;
        break;
      case 'weeks_completed':
        currentValue = completedWeeksCount;
        break;
      case 'exercises_completed':
        currentValue = completedExercisesCount;
        break;
      default:
        currentValue = 0;
    }
    
    return Math.min((currentValue / nextBadge.criteria_value) * 100, 99);
  };

  // Get description for next badge based on current progress
  const getProgressDescription = () => {
    if (!nextBadge) return '';
    
    let currentValue = 0;
    switch (nextBadge.criteria_type) {
      case 'tasks_completed':
        currentValue = completedTasksCount;
        return `${currentValue}/${nextBadge.criteria_value} tareas`;
      case 'first_task':
        return completedTasksCount >= 1 ? 'Completado' : 'Completa tu primera tarea';
      case 'weeks_completed':
        currentValue = completedWeeksCount;
        return `${currentValue}/${nextBadge.criteria_value} semanas`;
      case 'exercises_completed':
        currentValue = completedExercisesCount;
        return `${currentValue}/${nextBadge.criteria_value} ejercicios`;
      default:
        return nextBadge.description || '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('gamification.title', 'Mi Progreso')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Total Points */}
        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-sm sm:text-base">{t('gamification.points', 'Puntos')}</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalPoints.toLocaleString()}
          </span>
        </div>

        {/* Earned Badges (Automatic) */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <Award className="h-3 w-3 sm:h-4 sm:w-4" />
            {t('gamification.earnedBadges', 'Insignias')} ({earnedBadges.length})
          </h4>
          {earnedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {earnedBadges.map((badge) => badge && (
                <Badge
                  key={badge.id}
                  variant="secondary"
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                  title={badge.description || badge.name}
                >
                  <span className="mr-1">{badge.icon}</span>
                  <span className="hidden sm:inline">{badge.name}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('gamification.noBadges', 'Completa tareas para ganar insignias')}
            </p>
          )}
        </div>

        {/* Custom Achievements (Awarded by staff) */}
        {studentAchievements.length > 0 && (
          <div>
            <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <Medal className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              Logros ({studentAchievements.length})
            </h4>
            <div className="space-y-2">
              {studentAchievements.map((sa) => sa.achievement && (
                <div 
                  key={sa.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10"
                >
                  <span className="text-xl">{sa.achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{sa.achievement.name}</span>
                      {sa.achievement.points_reward && sa.achievement.points_reward > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          +{sa.achievement.points_reward} pts
                        </Badge>
                      )}
                    </div>
                    {sa.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        "{sa.notes}"
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Por: {(sa.awarder as any)?.full_name || 'Staff'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Badge */}
        {nextBadge && (
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-medium flex items-center gap-1">
                  <span className="opacity-50">{nextBadge.icon}</span>
                  <span className="truncate">{t('gamification.nextBadge', 'Próxima')}</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {nextBadge.name}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                +{nextBadge.points_reward} pts
              </Badge>
            </div>
            <Progress value={getProgressToNextBadge()} className="h-1.5 sm:h-2" />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
              {getProgressDescription()}
            </p>
          </div>
        )}

        {/* All Badges Preview */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-2">
            {t('gamification.allBadges', 'Todas las insignias')}
          </h4>
          <div className="flex flex-wrap gap-1">
            {allBadges.map((badge) => (
              <span
                key={badge.id}
                className={cn(
                  "text-lg",
                  earnedBadgeIds.has(badge.id) ? "opacity-100" : "opacity-30 grayscale"
                )}
                title={`${badge.name}: ${badge.description}`}
              >
                {badge.icon}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};