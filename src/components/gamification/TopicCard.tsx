import { WeekTopic } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Circle, HelpCircle } from "lucide-react";

interface TopicCardProps {
  topic: WeekTopic;
  status: 'not_started' | 'in_progress' | 'needs_review' | 'completed';
  onClick: () => void;
}

export const TopicCard = ({ topic, status, onClick }: TopicCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30 border-green-500',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          label: 'Dominado',
          textColor: 'text-green-800 dark:text-green-300',
        };
      case 'needs_review':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          label: 'Necesita práctica',
          textColor: 'text-yellow-800 dark:text-yellow-300',
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
          icon: <Circle className="h-5 w-5 text-blue-600 fill-blue-200" />,
          label: 'En progreso',
          textColor: 'text-blue-800 dark:text-blue-300',
        };
      default:
        return {
          bg: 'bg-muted border-muted-foreground/20',
          icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
          label: 'No iniciado',
          textColor: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border-2 transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-md cursor-pointer text-left",
        config.bg
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium truncate", config.textColor)}>
            {topic.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {config.label}
          </p>
          {topic.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
