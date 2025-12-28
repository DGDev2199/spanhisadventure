import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  WeekTopic, 
  useTopicMaterials,
  useStudentTopicProgress,
  useUpdateTopicProgress 
} from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  ClipboardList,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TopicActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: WeekTopic;
  studentId: string;
  isEditable?: boolean;
}

export const TopicActionsModal = ({
  open,
  onOpenChange,
  topic,
  studentId,
  isEditable = false,
}: TopicActionsModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: materials = [] } = useTopicMaterials(topic.id);
  const { data: allProgress = [] } = useStudentTopicProgress(studentId);
  const updateProgress = useUpdateTopicProgress();
  
  const currentProgress = allProgress.find(p => p.topic_id === topic.id);
  const currentStatus = currentProgress?.status || 'not_started';

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'exercise': return <ClipboardList className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: 'not_started' | 'in_progress' | 'needs_review' | 'completed') => {
    if (!user) return;
    try {
      await updateProgress.mutateAsync({
        studentId,
        topicId: topic.id,
        status: newStatus,
        updatedBy: user.id,
      });
      toast.success(t('progress.statusUpdated', 'Estado actualizado'));
    } catch (error) {
      toast.error(t('errors.generic', 'Error al actualizar'));
    }
  };

  const handleOpenMaterial = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleScheduleExtraClass = () => {
    toast.info(t('progress.scheduleExtraClass', 'Función de agendar clase extra próximamente'));
    // TODO: Integrar con sistema de booking existente
  };

  const handleTakePracticeTest = () => {
    toast.info(t('progress.practiceTest', 'Función de examen de práctica próximamente'));
    // TODO: Integrar con sistema de tests existente
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">{topic.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Estado:</span>
            <Badge 
              variant={
                currentStatus === 'completed' ? 'default' :
                currentStatus === 'needs_review' ? 'secondary' :
                'outline'
              }
              className={cn(
                "text-xs sm:text-sm",
                currentStatus === 'completed' ? 'bg-green-500 hover:bg-green-600' :
                currentStatus === 'needs_review' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                currentStatus === 'in_progress' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                ''
              )}
            >
              {currentStatus === 'completed' && '✅ Dominado'}
              {currentStatus === 'needs_review' && '⚠️ Práctica'}
              {currentStatus === 'in_progress' && '🔵 En progreso'}
              {currentStatus === 'not_started' && '⬜ No iniciado'}
            </Badge>
          </div>

          {/* Status change buttons (for staff) */}
          {isEditable && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium">Cambiar estado:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={currentStatus === 'completed' ? 'default' : 'outline'}
                    className={cn(
                      "text-xs sm:text-sm h-8 sm:h-9",
                      currentStatus === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''
                    )}
                    onClick={() => handleStatusChange('completed')}
                  >
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">Dominado</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={currentStatus === 'needs_review' ? 'default' : 'outline'}
                    className={cn(
                      "text-xs sm:text-sm h-8 sm:h-9",
                      currentStatus === 'needs_review' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                    )}
                    onClick={() => handleStatusChange('needs_review')}
                  >
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">Práctica</span>
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Material extra */}
          <div>
            <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              {t('progress.extraMaterial', 'Material Extra')}
            </h4>
            {materials.length > 0 ? (
              <ScrollArea className="h-24 sm:h-32">
                <div className="space-y-1.5 sm:space-y-2">
                  {materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleOpenMaterial(material.content_url)}
                      className="w-full p-1.5 sm:p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2 text-left"
                    >
                      <span className="flex-shrink-0">{getMaterialIcon(material.material_type)}</span>
                      <span className="flex-1 text-xs sm:text-sm truncate">{material.title}</span>
                      {material.content_url && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                {t('progress.noMaterials', 'No hay material extra')}
              </p>
            )}
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-medium">
              {t('progress.actions', 'Acciones')}
            </h4>
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start h-8 sm:h-9 text-xs sm:text-sm"
                onClick={handleTakePracticeTest}
              >
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('progress.takePracticeTest', 'Hacer examen de práctica')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start h-8 sm:h-9 text-xs sm:text-sm"
                onClick={handleScheduleExtraClass}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('progress.scheduleExtraClass', 'Agendar clase extra')}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
