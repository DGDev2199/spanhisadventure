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
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-2xl font-bold text-primary truncate">
          {isLoading ? '...' : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

export const QuickStatCard = memo(QuickStatCardComponent);
QuickStatCard.displayName = 'QuickStatCard';
