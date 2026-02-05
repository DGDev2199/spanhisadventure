import { memo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  isLoading?: boolean;
}

function QuickStatCardComponent({
  title,
  value,
  subtitle,
  icon,
  isLoading = false
}: QuickStatCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-3 sm:p-4 lg:p-6 lg:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">{title}</CardTitle>
        <div className="flex-shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="text-xl sm:text-2xl font-bold text-primary truncate">
          {isLoading ? '...' : value}
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

export const QuickStatCard = memo(QuickStatCardComponent);
QuickStatCard.displayName = 'QuickStatCard';
