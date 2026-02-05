import { TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const TutorialTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
}: TooltipRenderProps) => {
  const progress = ((index + 1) / size) * 100;

  return (
    <Card 
      {...tooltipProps} 
      className="max-w-md shadow-xl border-2 border-primary/20 animate-in fade-in zoom-in-95"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">{step.title as React.ReactNode}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            {...closeProps}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {index + 1} / {size}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="py-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.content as React.ReactNode}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          {...skipProps}
          className="text-muted-foreground"
        >
          Saltar
        </Button>
        
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          
          {continuous && (
            <Button size="sm" {...primaryProps}>
              {index === size - 1 ? '¡Terminé!' : 'Siguiente'}
              {index < size - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
