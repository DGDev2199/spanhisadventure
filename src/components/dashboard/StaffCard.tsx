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
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6 lg:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">{title}</CardTitle>
        <User className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="text-base sm:text-lg font-bold">
          {isLoading ? (
            '...'
          ) : staffName && onViewProfile ? (
            <button
              onClick={onViewProfile}
              className="text-left hover:text-primary hover:underline cursor-pointer transition-colors flex items-center gap-1 touch-target min-h-[44px] w-full"
            >
              <span className="truncate">{staffName}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
            </button>
          ) : staffName ? (
            <span className="truncate block">{staffName}</span>
          ) : (
            <span className="text-muted-foreground text-sm sm:text-base">{t('dashboard.notAssigned')}</span>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
          {staffName ? `${title} ${t('dashboard.assigned')}` : t('dashboard.contactAdmin')}
        </p>
        {staffId && staffName && (
          <div className="space-y-2 mt-3">
            <div className="flex gap-1.5 sm:gap-2">
              {showChat && onChat && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-9 sm:h-8 touch-target"
                  onClick={onChat}
                  data-tutorial="staff-chat-btn"
                >
                  <MessageSquare className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">Chat</span>
                </Button>
              )}
              {showVideoCall && onVideoCall && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-9 sm:h-8 touch-target"
                  onClick={onVideoCall}
                  data-tutorial="staff-videocall-btn"
                >
                  <Video className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">Video</span>
                </Button>
              )}
            </div>
            {showBooking && onBooking && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 sm:h-8 touch-target text-xs sm:text-sm"
                onClick={onBooking}
                data-tutorial="staff-booking-btn"
              >
                <Calendar className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{defaultBookingLabel}</span>
              </Button>
            )}
            {showSchedule && onViewSchedule && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 sm:h-8 touch-target text-xs sm:text-sm"
                onClick={onViewSchedule}
                data-tutorial="staff-schedule-btn"
              >
                <Calendar className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{defaultScheduleLabel}</span>
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