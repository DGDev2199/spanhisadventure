import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useTutorial } from './TutorialProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const TutorialLauncher = () => {
  const { resetTutorial, hasSeenTutorial } = useTutorial();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 sm:h-10 touch-target"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={resetTutorial}>
          <Play className="h-4 w-4 mr-2" />
          {hasSeenTutorial ? 'Ver tutorial de nuevo' : 'Iniciar tutorial'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
