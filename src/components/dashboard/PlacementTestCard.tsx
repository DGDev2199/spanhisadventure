import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle } from 'lucide-react';

interface PlacementTestCardProps {
  status: 'not_started' | 'pending' | 'completed' | null;
  writtenScore?: number | null;
  level?: string | null;
  oralCompleted?: boolean;
}

export const PlacementTestCard = memo(({ 
  status, 
  writtenScore, 
  level, 
  oralCompleted 
}: PlacementTestCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {t('placementTest.title')}
        </CardTitle>
        <CardDescription>
          {status === 'not_started' 
            ? t('placementTestCard.notStartedDesc')
            : status === 'pending'
            ? t('placementTestCard.pendingDesc')
            : t('placementTestCard.completedDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'not_started' ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t('placementTestCard.notStartedInfo')}
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/placement-test')}
            >
              {t('placementTestCard.startTest')}
            </Button>
          </>
        ) : status === 'pending' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('placementTestCard.submittedSuccess')}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('placementTestCard.writtenScore')}:</span>
                <span className="font-bold text-lg">{writtenScore || 0}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('placementTestCard.pendingReviewInfo')}
              </p>
            </div>
            <Button 
              className="w-full"
              disabled
              variant="outline"
            >
              {t('placementTestCard.waitingReview')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('placementTestCard.testCompleted')}</span>
            </div>
            <div className="space-y-2 bg-accent/10 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('placementTestCard.writtenScore')}:</span>
                <span className="font-bold text-lg">{writtenScore || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('placementTestCard.assignedLevel')}:</span>
                <span className="font-bold text-2xl text-primary">{level || 'N/A'}</span>
              </div>
              {oralCompleted && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  ✓ {t('placementTestCard.oralCompleted')}
                </p>
              )}
            </div>
            <Button 
              className="w-full"
              disabled
              variant="secondary"
            >
              {t('placementTestCard.testFinished')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PlacementTestCard.displayName = 'PlacementTestCard';