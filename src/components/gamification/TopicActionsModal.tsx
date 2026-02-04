import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
import { BookingDialog } from "@/components/BookingDialog";
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  ClipboardList,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Palette
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
  const navigate = useNavigate();
  const { data: materials = [] } = useTopicMaterials(topic.id);
  const { data: allProgress = [] } = useStudentTopicProgress(studentId);
  const updateProgress = useUpdateTopicProgress();
  
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  
  const currentProgress = allProgress.find(p => p.topic_id === topic.id);
  const currentStatus = currentProgress?.status || 'not_started';
  const currentColor = currentProgress?.color as 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange' | 'gray' | null | undefined;

  // Fetch student's assigned teacher
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile-for-booking', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('teacher_id, tutor_id')
        .eq('user_id', studentId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch teacher info if assigned
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile-for-booking', studentProfile?.teacher_id],
    queryFn: async () => {
      if (!studentProfile?.teacher_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', studentProfile.teacher_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentProfile?.teacher_id
  });

  // Fetch re-evaluation test for this specific topic
  const { data: reevaluationTest } = useQuery({
    queryKey: ['topic-reevaluation-test', topic.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_reevaluation_tests')
        .select('id, title')
        .eq('topic_id', topic.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

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

  const handleColorChange = async (newColor: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange' | 'gray') => {
    if (!user) return;
    try {
      // Si es gray, es un reset - pasamos null como color
      const colorToSave = newColor === 'gray' ? null : newColor;
      
      await updateProgress.mutateAsync({
        studentId,
        topicId: topic.id,
        color: colorToSave,
        updatedBy: user.id,
      });
      
      // Award points when topic is marked as green or purple (mastered/excellent)
      if ((newColor === 'green' || newColor === 'purple') && currentColor !== 'green' && currentColor !== 'purple') {
        const points = newColor === 'purple' ? 15 : 10;
        await supabase.from('user_points').insert({
          user_id: studentId,
          points,
          reason: newColor === 'purple' ? 'topic_excellent' : 'topic_mastered',
          related_id: topic.id,
        });
        toast.success(t('progress.colorUpdated', 'Color de evaluación actualizado') + ` (+${points} pts)`);
      } else {
        toast.success(t('progress.colorUpdated', 'Color de evaluación actualizado'));
      }
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
    if (!teacherProfile) {
      toast.error(t('progress.noTeacherAssigned', 'No tienes un profesor asignado'));
      return;
    }
    setShowBookingDialog(true);
  };

  const handleTakeReevaluationTest = () => {
    if (!reevaluationTest) {
      toast.info(t('progress.noReevaluationTest', 'Este tema aún no tiene examen de reevaluación'));
      return;
    }
    
    onOpenChange(false);
    navigate(`/take-reevaluation-test/${reevaluationTest.id}`);
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

          {/* Color assignment and status change (for staff) */}
          {isEditable && (
            <>
              <Separator />
              
              {/* Color selector */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium flex items-center gap-1">
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                  Asignar color de evaluación:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'purple' ? 'ring-2 ring-purple-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#a855f7' }}
                    onClick={() => handleColorChange('purple')}
                    title="Excelente"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'green' ? 'ring-2 ring-green-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#22c55e' }}
                    onClick={() => handleColorChange('green')}
                    title="Dominado"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'orange' ? 'ring-2 ring-orange-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#f97316' }}
                    onClick={() => handleColorChange('orange')}
                    title="En camino"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'yellow' ? 'ring-2 ring-yellow-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#eab308' }}
                    onClick={() => handleColorChange('yellow')}
                    title="Necesita práctica"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'blue' ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#3b82f6' }}
                    onClick={() => handleColorChange('blue')}
                    title="En progreso"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                      currentColor === 'red' ? 'ring-2 ring-red-600 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#ef4444' }}
                    onClick={() => handleColorChange('red')}
                    title="Dificultad"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full border-2 border-dashed",
                      !currentColor ? 'ring-2 ring-gray-400 ring-offset-2' : ''
                    )}
                    style={{ backgroundColor: '#9ca3af' }}
                    onClick={() => handleColorChange('gray')}
                    title="Sin evaluar / Reset"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  🟣 Excelente • 🟢 Dominado • 🟠 En camino • 🟡 Práctica • 🔵 Progreso • 🔴 Dificultad • ⚪ Reset
                </p>
              </div>

              <Separator />
              
              {/* Status change */}
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
                onClick={handleTakeReevaluationTest}
                disabled={!reevaluationTest}
              >
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {reevaluationTest 
                    ? t('progress.takeRevaluationTest', 'Hacer examen de reevaluación')
                    : t('progress.noReevaluationTest', 'Sin examen de reevaluación')
                  }
                </span>
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

      {/* Booking Dialog */}
      {teacherProfile && (
        <BookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          staffId={teacherProfile.id}
          staffName={teacherProfile.full_name}
          staffAvatar={teacherProfile.avatar_url}
          staffRole="teacher"
        />
      )}
    </Dialog>
  );
};
