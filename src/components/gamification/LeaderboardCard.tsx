import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRankings } from "@/hooks/useGamification";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardCardProps {
  currentUserId: string;
  limit?: number;
}

export const LeaderboardCard = ({ currentUserId, limit = 10 }: LeaderboardCardProps) => {
  const { t } = useTranslation();
  const { data: rankings = [], isLoading } = useUserRankings();

  const displayRankings = rankings.slice(0, limit);
  const currentUserRanking = rankings.find(r => r.id === currentUserId);
  const isCurrentUserInTop = displayRankings.some(r => r.id === currentUserId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary/30";
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30";
      default:
        return "bg-muted/30 border-transparent";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          {t('gamification.leaderboard', 'Ranking')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <ScrollArea className="h-[200px] sm:h-[300px] pr-2 sm:pr-4">
          <div className="space-y-1.5 sm:space-y-2">
            {displayRankings.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg border transition-colors",
                    getRankBg(user.rank, isCurrentUser),
                    isCurrentUser && "ring-1 ring-primary"
                  )}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-6 sm:w-8 flex justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] sm:text-xs">
                      {user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs sm:text-sm font-medium truncate",
                      isCurrentUser && "text-primary"
                    )}>
                      {user.full_name}
                      {isCurrentUser && " (Tú)"}
                    </p>
                    <div className="hidden sm:flex items-center gap-1">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {user.badge_count} insignias
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <Badge variant="secondary" className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2">
                    {user.total_points.toLocaleString()}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Current user if not in top */}
        {!isCurrentUserInTop && currentUserRanking && (
          <>
            <div className="text-center text-muted-foreground text-xs sm:text-sm py-1 sm:py-2">• • •</div>
            <div
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg border",
                "bg-primary/10 border-primary/30 ring-1 ring-primary"
              )}
            >
              <div className="flex-shrink-0 w-6 sm:w-8 flex justify-center">
                <span className="text-xs sm:text-sm font-medium">#{currentUserRanking.rank}</span>
              </div>
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                <AvatarImage src={currentUserRanking.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] sm:text-xs">
                  {currentUserRanking.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate text-primary">
                  {currentUserRanking.full_name} (Tú)
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                {currentUserRanking.total_points.toLocaleString()}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
