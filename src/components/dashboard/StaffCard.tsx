import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MessageSquare, Video, Calendar, ExternalLink } from 'lucide-react';

interface StaffCardProps {
  title: string;
  staffName: string | null | undefined;
  isLoading: boolean;
  iconColor: string;
  staffId?: string;
  onChat?: () => void;
  onVideoCall?: () => void;
  onBooking?: () => void;
  onViewSchedule?: () => void;
  onViewProfile?: () => void;
  showChat?: boolean;
  showVideoCall?: boolean;
  showBooking?: boolean;
  showSchedule?: boolean;
  bookingLabel?: string;
  scheduleLabel?: string;
}

function StaffCardComponent({
  title,
  staffName,
  isLoading,
  iconColor,
  staffId,
  onChat,
  onVideoCall,
  onBooking,
  onViewSchedule,
  onViewProfile,
  showChat = false,
  showVideoCall = false,
  showBooking = false,
  showSchedule = false,
  bookingLabel,
  scheduleLabel
}: StaffCardProps) {
  const { t } = useTranslation();
  
  const defaultBookingLabel = bookingLabel || t('dashboard.bookClass');
  const defaultScheduleLabel = scheduleLabel || t('dashboard.viewClassSchedule');

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <User className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">
          {isLoading ? (
            '...'
          ) : staffName && onViewProfile ? (
            <button
              onClick={onViewProfile}
              className="text-left hover:text-primary hover:underline cursor-pointer transition-colors flex items-center gap-1"
            >
              {staffName}
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </button>
          ) : staffName ? (
            staffName
          ) : (
            <span className="text-muted-foreground text-base">{t('dashboard.notAssigned')}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {staffName ? `${title} ${t('dashboard.assigned')}` : t('dashboard.contactAdmin')}
        </p>
        {staffId && staffName && (
          <div className="space-y-2 mt-3">
            <div className="flex gap-2">
              {showChat && onChat && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onChat}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              {showVideoCall && onVideoCall && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onVideoCall}
                >
                  <Video className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showBooking && onBooking && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onBooking}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {defaultBookingLabel}
              </Button>
            )}
            {showSchedule && onViewSchedule && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onViewSchedule}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {defaultScheduleLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const StaffCard = memo(StaffCardComponent);
StaffCard.displayName = 'StaffCard';