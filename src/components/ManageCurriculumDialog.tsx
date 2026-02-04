import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useProgramWeeks, 
  useAllWeekTopics,
  type ProgramWeek,
  type WeekTopic 
} from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { CreateTopicReevaluationTestDialog } from "@/components/CreateTopicReevaluationTestDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Save,
  FileText,
  Video,
  Link as LinkIcon,
  ClipboardList,
  Upload,
  Loader2,
  GraduationCap,
  BookMarked,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManageCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TopicMaterial {
  id: string;
  topic_id: string;
  title: string;
  material_type: string;
  content_url: string | null;
  is_teacher_guide: boolean;
  created_at: string;
}

export const ManageCurriculumDialog = ({ open, onOpenChange }: ManageCurriculumDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: weeks = [] } = useProgramWeeks();
  const { data: allTopics = [] } = useAllWeekTopics();

  const [selectedWeek, setSelectedWeek] = useState<ProgramWeek | null>(null);
  const [editingTopic, setEditingTopic] = useState<WeekTopic | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  
  // Week editing state
  const [editingWeek, setEditingWeek] = useState<ProgramWeek | null>(null);
  const [editWeekTitle, setEditWeekTitle] = useState("");
  const [editWeekDesc, setEditWeekDesc] = useState("");
  const [editWeekLevel, setEditWeekLevel] = useState("");
  
  // Re-evaluation test dialog
  const [showCreateTestDialog, setShowCreateTestDialog] = useState(false);
  const [selectedTopicForTest, setSelectedTopicForTest] = useState<WeekTopic | null>(null);
  
  // Material form
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TopicMaterial | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<string>("document");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialTopicId, setMaterialTopicId] = useState<string | null>(null);
  const [isTeacherGuide, setIsTeacherGuide] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [materialTab, setMaterialTab] = useState<'student' | 'teacher'>('student');
  
  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'weeks' | 'topics'>('weeks');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query to check which topics have re-evaluation tests
  const { data: topicTests = [] } = useQuery({
    queryKey: ['topic-reevaluation-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_reevaluation_tests')
        .select('topic_id');
      if (error) throw error;
      return data || [];
    }
  });

  // Query to get all materials
  const { data: allMaterials = [] } = useQuery({
    queryKey: ['topic-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_materials')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TopicMaterial[];
    }
  });

  const getMaterialsForTopic = (topicId: string) => {
    return allMaterials.filter(m => m.topic_id === topicId);
  };

  const hasReevaluationTest = (topicId: string) => {
    return topicTests.some(t => t.topic_id === topicId);
  };

  const getTopicsForWeek = (weekId: string) => {
    return allTopics.filter(t => t.week_id === weekId);
  };

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      'A1': 'bg-emerald-500',
      'A2': 'bg-green-500',
      'B1': 'bg-blue-500',
      'B2': 'bg-indigo-500',
      'C1': 'bg-purple-500',
      'C2': 'bg-pink-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const handleAddTopic = async () => {
    if (!selectedWeek || !newTopicName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('week_topics')
        .insert({
          week_id: selectedWeek.id,
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || null,
          order_number: getTopicsForWeek(selectedWeek.id).length,
        });
      
      if (error) throw error;
      
      toast.success(t('curriculum.topicAdded', 'Tema agregado'));
      setNewTopicName("");
      setNewTopicDesc("");
      queryClient.invalidateQueries({ queryKey: ['all-week-topics'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al agregar tema'));
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const { error } = await supabase
        .from('week_topics')
        .delete()
        .eq('id', topicId);
      
      if (error) throw error;
      
      toast.success(t('curriculum.topicDeleted', 'Tema eliminado'));
      queryClient.invalidateQueries({ queryKey: ['all-week-topics'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al eliminar tema'));
    }
  };

  const handleEditWeek = (week: ProgramWeek) => {
    setEditingWeek(week);
    setEditWeekTitle(week.title || "");
    setEditWeekDesc(week.description || "");
    setEditWeekLevel(week.level || "A1");
  };

  const handleSaveWeek = async () => {
    if (!editingWeek) return;
    
    try {
      const { error } = await supabase
        .from('program_weeks')
        .update({
          title: editWeekTitle.trim(),
          description: editWeekDesc.trim() || null,
          level: editWeekLevel,
        })
        .eq('id', editingWeek.id);
      
      if (error) throw error;
      
      toast.success(t('curriculum.weekUpdated', 'Semana actualizada'));
      setEditingWeek(null);
      queryClient.invalidateQueries({ queryKey: ['program-weeks'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al actualizar semana'));
    }
  };

  const handleCancelEditWeek = () => {
    setEditingWeek(null);
    setEditWeekTitle("");
    setEditWeekDesc("");
    setEditWeekLevel("");
  };

  const handleAddMaterial = async () => {
    if (!materialTopicId || !materialTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('topic_materials')
        .insert({
          topic_id: materialTopicId,
          title: materialTitle.trim(),
          material_type: materialType,
          content_url: materialUrl.trim() || null,
          is_teacher_guide: isTeacherGuide,
        });
      
      if (error) throw error;
      
      toast.success(isTeacherGuide 
        ? t('curriculum.guideAdded', 'Guía del profesor agregada')
        : t('curriculum.materialAdded', 'Material del estudiante agregado'));
      resetMaterialForm();
      queryClient.invalidateQueries({ queryKey: ['topic-materials'] });
      queryClient.invalidateQueries({ queryKey: ['all-topic-materials'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al agregar material'));
    }
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !materialTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('topic_materials')
        .update({
          title: materialTitle.trim(),
          material_type: materialType,
          content_url: materialUrl.trim() || null,
          is_teacher_guide: isTeacherGuide,
        })
        .eq('id', editingMaterial.id);
      
      if (error) throw error;
      
      toast.success(isTeacherGuide 
        ? t('curriculum.guideUpdated', 'Guía del profesor actualizada')
        : t('curriculum.materialUpdated', 'Material actualizado'));
      resetMaterialForm();
      queryClient.invalidateQueries({ queryKey: ['topic-materials'] });
      queryClient.invalidateQueries({ queryKey: ['all-topic-materials'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al actualizar material'));
    }
  };

  const handleEditMaterial = (material: TopicMaterial) => {
    setEditingMaterial(material);
    setMaterialTitle(material.title);
    setMaterialType(material.material_type);
    setMaterialUrl(material.content_url || "");
    setIsTeacherGuide(material.is_teacher_guide);
    setMaterialTopicId(material.topic_id);
    setAddingMaterial(true);
  };

  const resetMaterialForm = () => {
    setMaterialTitle("");
    setMaterialUrl("");
    setMaterialType("document");
    setAddingMaterial(false);
    setEditingMaterial(null);
    setMaterialTopicId(null);
    setIsTeacherGuide(false);
  };

  const handleDeleteMaterial = async (materialId: string, contentUrl: string | null, isGuide: boolean) => {
    try {
      // Delete from storage if it's an uploaded file
      if (contentUrl) {
        if (contentUrl.startsWith('materials/')) {
          const path = contentUrl.replace('materials/', '');
          await supabase.storage.from('materials').remove([path]);
        } else if (contentUrl.includes('task-attachments') && contentUrl.includes('materials/')) {
          // Extract path from public URL
          const pathMatch = contentUrl.match(/materials\/[^?]+/);
          if (pathMatch) {
            await supabase.storage.from('task-attachments').remove([pathMatch[0]]);
          }
        }
      }

      // Delete the database record
      const { error } = await supabase
        .from('topic_materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
      
      toast.success(isGuide 
        ? t('curriculum.guideDeleted', 'Guía del profesor eliminada')
        : t('curriculum.materialDeleted', 'Material eliminado'));
      queryClient.invalidateQueries({ queryKey: ['topic-materials'] });
      queryClient.invalidateQueries({ queryKey: ['all-topic-materials'] });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error(t('errors.generic', 'Error al eliminar material'));
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'exercise': return <ClipboardList className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'video/mp4', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('curriculum.invalidFileType', 'Tipo de archivo no permitido. Use PDF, MP4, PNG o JPG.'));
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('curriculum.fileTooLarge', 'El archivo es demasiado grande. Máximo 50MB.'));
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `material-${Date.now()}.${fileExt}`;
      
      // Use 'materials' bucket for teacher guides (private), 'task-attachments' for student materials (public)
      const bucketName = isTeacherGuide ? 'materials' : 'task-attachments';
      const filePath = isTeacherGuide 
        ? `teacher-guides/${fileName}` 
        : `materials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // For private materials, store the bucket/path reference (we'll use signed URLs)
      // For public materials, get the public URL
      if (isTeacherGuide) {
        // Store as reference for signed URL generation later
        setMaterialUrl(`${bucketName}/${filePath}`);
      } else {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        setMaterialUrl(urlData.publicUrl);
      }

      toast.success(t('curriculum.fileUploaded', 'Archivo subido correctamente'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('errors.uploadFailed', 'Error al subir archivo'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Render content shared by both Dialog and Sheet
  const renderContent = () => (
    <Tabs defaultValue="weeks" className="w-full flex-1 flex flex-col overflow-hidden">
      <TabsList className={cn(
        "grid w-full grid-cols-2 flex-shrink-0",
        isMobile && "h-12"
      )}>
        <TabsTrigger value="weeks" className={cn(isMobile && "min-h-[44px] text-sm")}>
          {t('curriculum.weeksAndTopics', 'Semanas y Temas')}
        </TabsTrigger>
        <TabsTrigger value="materials" className={cn(isMobile && "min-h-[44px] text-sm")}>
          {t('curriculum.extraMaterials', 'Material Extra')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weeks" className="mt-4 flex-1 overflow-hidden">
        {isMobile ? (
          // Mobile: Single column with navigation
          <div className="flex flex-col h-full">
            {mobileView === 'weeks' ? (
              <div className="flex flex-col h-full">
                <h3 className="font-medium mb-3 flex-shrink-0">
                  {t('curriculum.programWeeks', 'Semanas del Programa')}
                </h3>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    {weeks.map((week) => (
                      <div
                        key={week.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors",
                          selectedWeek?.id === week.id 
                            ? "bg-primary/10 border-primary" 
                            : "hover:bg-muted active:bg-muted"
                        )}
                      >
                        {editingWeek?.id === week.id ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs">{t('curriculum.title', 'Título')}</Label>
                              <Input
                                value={editWeekTitle}
                                onChange={(e) => setEditWeekTitle(e.target.value)}
                                placeholder={t('curriculum.weekTitlePlaceholder', 'Título de la semana')}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">{t('curriculum.description', 'Descripción')}</Label>
                              <Textarea
                                value={editWeekDesc}
                                onChange={(e) => setEditWeekDesc(e.target.value)}
                                placeholder={t('curriculum.descriptionOptional', 'Descripción (opcional)')}
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">{t('curriculum.level', 'Nivel')}</Label>
                              <Select value={editWeekLevel} onValueChange={setEditWeekLevel}>
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A1">A1 - Principiante</SelectItem>
                                  <SelectItem value="A2">A2 - Elemental</SelectItem>
                                  <SelectItem value="B1">B1 - Intermedio</SelectItem>
                                  <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                                  <SelectItem value="C1">C1 - Avanzado</SelectItem>
                                  <SelectItem value="C2">C2 - Maestría</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveWeek} className="min-h-[44px] flex-1">
                                <Save className="h-4 w-4 mr-2" />
                                {t('common.save', 'Guardar')}
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEditWeek} className="min-h-[44px] flex-1">
                                {t('common.cancel', 'Cancelar')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedWeek(week);
                              setMobileView('topics');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {t('curriculum.week', 'Semana')} {week.week_number}: {week.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-white text-xs", getLevelColor(week.level))}>
                                  {week.level}
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWeek(week);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTopicsForWeek(week.id).length} {t('curriculum.topics', 'temas')}
                            </p>
                            {week.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {week.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMobileView('weeks')}
                    className="min-h-[44px]"
                  >
                    ← {t('common.back', 'Volver')}
                  </Button>
                  <h3 className="font-medium">
                    {t('curriculum.topicsFor', 'Temas - Semana')} {selectedWeek?.week_number}
                  </h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-2">
                    {/* Existing topics */}
                    <div className="space-y-2">
                      {selectedWeek && getTopicsForWeek(selectedWeek.id).map((topic) => {
                        const topicMaterials = getMaterialsForTopic(topic.id);
                        return (
                        <div
                          key={topic.id}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{topic.name}</p>
                              {topic.description && (
                                <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Materials list for this topic */}
                          {topicMaterials.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                {t('curriculum.existingMaterials', 'Materiales')} ({topicMaterials.length}):
                              </p>
                              {topicMaterials.map((material) => (
                                <div 
                                  key={material.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg text-sm",
                                    material.is_teacher_guide 
                                      ? "bg-purple-50 dark:bg-purple-950/30" 
                                      : "bg-blue-50 dark:bg-blue-950/30"
                                  )}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {material.is_teacher_guide ? (
                                      <BookMarked className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                    ) : (
                                      <GraduationCap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    )}
                                    <span className="truncate text-xs">{material.title}</span>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => handleEditMaterial(material)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteMaterial(
                                        material.id, 
                                        material.content_url, 
                                        material.is_teacher_guide
                                      )}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[44px] flex-1"
                              onClick={() => {
                                setMaterialTopicId(topic.id);
                                setIsTeacherGuide(false);
                                setAddingMaterial(true);
                              }}
                            >
                              <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />
                              {t('curriculum.studentMaterial', 'Estudiante')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[44px] flex-1"
                              onClick={() => {
                                setMaterialTopicId(topic.id);
                                setIsTeacherGuide(true);
                                setAddingMaterial(true);
                              }}
                            >
                              <BookMarked className="h-4 w-4 mr-2 text-purple-500" />
                              {t('curriculum.teacherGuide', 'Guía')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                "min-h-[44px]",
                                hasReevaluationTest(topic.id) 
                                  ? "text-green-500" 
                                  : "text-amber-500"
                              )}
                              onClick={() => {
                                setSelectedTopicForTest(topic);
                                setShowCreateTestDialog(true);
                              }}
                            >
                              {hasReevaluationTest(topic.id) ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <ClipboardList className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[44px] text-destructive"
                              onClick={() => handleDeleteTopic(topic.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );})}
                      {selectedWeek && getTopicsForWeek(selectedWeek.id).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t('curriculum.noTopics', 'No hay temas. Agrega uno abajo.')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Add new topic */}
                    <div className="space-y-3 pb-4">
                      <h4 className="text-sm font-medium">{t('curriculum.addTopic', 'Agregar Tema')}</h4>
                      <Input
                        placeholder={t('curriculum.topicNamePlaceholder', 'Nombre del tema (ej: Verbos reflexivos)')}
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        className="min-h-[44px]"
                      />
                      <Textarea
                        placeholder={t('curriculum.topicDescription', 'Descripción (opcional)')}
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        rows={2}
                      />
                      <Button 
                        onClick={handleAddTopic}
                        disabled={!newTopicName.trim()}
                        className="w-full min-h-[44px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('curriculum.addTopic', 'Agregar Tema')}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        ) : (
          // Desktop: Two columns side by side
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(85vh-160px)]">
            {/* Weeks list */}
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium mb-3 flex-shrink-0">
                {t('curriculum.programWeeks', 'Semanas del Programa')}
              </h3>
              <ScrollArea className="h-[calc(85vh-220px)] border rounded-lg p-2">
                <div className="space-y-2">
                  {weeks.map((week) => (
                    <div
                      key={week.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        selectedWeek?.id === week.id 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-muted"
                      )}
                    >
                      {editingWeek?.id === week.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('curriculum.title', 'Título')}</Label>
                            <Input
                              value={editWeekTitle}
                              onChange={(e) => setEditWeekTitle(e.target.value)}
                              placeholder={t('curriculum.weekTitlePlaceholder', 'Título de la semana')}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('curriculum.description', 'Descripción')}</Label>
                            <Textarea
                              value={editWeekDesc}
                              onChange={(e) => setEditWeekDesc(e.target.value)}
                              placeholder={t('curriculum.descriptionOptional', 'Descripción (opcional)')}
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('curriculum.level', 'Nivel')}</Label>
                            <Select value={editWeekLevel} onValueChange={setEditWeekLevel}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A1">A1 - Principiante</SelectItem>
                                <SelectItem value="A2">A2 - Elemental</SelectItem>
                                <SelectItem value="B1">B1 - Intermedio</SelectItem>
                                <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                                <SelectItem value="C1">C1 - Avanzado</SelectItem>
                                <SelectItem value="C2">C2 - Maestría</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveWeek}>
                              <Save className="h-3 w-3 mr-1" />
                              {t('common.save', 'Guardar')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEditWeek}>
                              {t('common.cancel', 'Cancelar')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer"
                          onClick={() => setSelectedWeek(week)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {t('curriculum.week', 'Semana')} {week.week_number}: {week.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-white text-xs", getLevelColor(week.level))}>
                                {week.level}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditWeek(week);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTopicsForWeek(week.id).length} {t('curriculum.topics', 'temas')}
                          </p>
                          {week.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {week.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Topics for selected week */}
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium mb-3 flex-shrink-0">
                {selectedWeek 
                  ? `${t('curriculum.topicsFor', 'Temas - Semana')} ${selectedWeek.week_number}` 
                  : t('curriculum.selectWeek', 'Selecciona una semana')}
              </h3>
              {selectedWeek ? (
                <ScrollArea className="h-[calc(85vh-220px)] border rounded-lg p-2">
                  <div className="space-y-3">
                    {/* Existing topics */}
                    <div className="space-y-2">
                      {getTopicsForWeek(selectedWeek.id).map((topic) => {
                        const topicMaterials = getMaterialsForTopic(topic.id);
                        return (
                        <div
                          key={topic.id}
                          className="p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{topic.name}</p>
                              {topic.description && (
                                <p className="text-xs text-muted-foreground">{topic.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title={t('curriculum.addStudentMaterial', 'Agregar material del estudiante')}
                                onClick={() => {
                                  setMaterialTopicId(topic.id);
                                  setIsTeacherGuide(false);
                                  setAddingMaterial(true);
                                }}
                              >
                                <GraduationCap className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title={t('curriculum.addTeacherGuide', 'Agregar guía del profesor')}
                                onClick={() => {
                                  setMaterialTopicId(topic.id);
                                  setIsTeacherGuide(true);
                                  setAddingMaterial(true);
                                }}
                              >
                                <BookMarked className="h-4 w-4 text-purple-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8",
                                  hasReevaluationTest(topic.id) 
                                    ? "text-green-500" 
                                    : "text-amber-500"
                                )}
                                title={hasReevaluationTest(topic.id) 
                                  ? t('curriculum.reevaluationCreated', 'Examen de reevaluación creado')
                                  : t('curriculum.createReevaluation', 'Crear examen de reevaluación')
                                }
                                onClick={() => {
                                  setSelectedTopicForTest(topic);
                                  setShowCreateTestDialog(true);
                                }}
                              >
                                {hasReevaluationTest(topic.id) ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <ClipboardList className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteTopic(topic.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Materials list for this topic */}
                          {topicMaterials.length > 0 && (
                            <div className="mt-2 space-y-1 border-t pt-2">
                              {topicMaterials.map((material) => (
                                <div 
                                  key={material.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded text-sm",
                                    material.is_teacher_guide 
                                      ? "bg-purple-50 dark:bg-purple-950/30" 
                                      : "bg-blue-50 dark:bg-blue-950/30"
                                  )}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {material.is_teacher_guide ? (
                                      <BookMarked className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                    ) : (
                                      <GraduationCap className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                    )}
                                    <span className="truncate text-xs">{material.title}</span>
                                    {material.is_teacher_guide && (
                                      <Badge variant="outline" className="text-[10px] text-purple-600 px-1 py-0">
                                        {t('curriculum.guide', 'Guía')}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-0.5 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => handleEditMaterial(material)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => handleDeleteMaterial(
                                        material.id, 
                                        material.content_url, 
                                        material.is_teacher_guide
                                      )}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );})}
                      {getTopicsForWeek(selectedWeek.id).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t('curriculum.noTopics', 'No hay temas. Agrega uno abajo.')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Add new topic - inside ScrollArea */}
                    <div className="space-y-3 pb-2">
                      <h4 className="text-sm font-medium">{t('curriculum.addTopic', 'Agregar Tema')}</h4>
                      <Input
                        placeholder={t('curriculum.topicNamePlaceholder', 'Nombre del tema (ej: Verbos reflexivos)')}
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                      />
                      <Textarea
                        placeholder={t('curriculum.topicDescription', 'Descripción (opcional)')}
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        rows={2}
                      />
                      <Button 
                        onClick={handleAddTopic}
                        disabled={!newTopicName.trim()}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('curriculum.addTopic', 'Agregar Tema')}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 border rounded-lg flex items-center justify-center text-muted-foreground">
                  {t('curriculum.selectWeekToView', 'Selecciona una semana para ver sus temas')}
                </div>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="materials" className="mt-4 flex-1 overflow-hidden">
        <div className={cn(
          "flex flex-col space-y-4",
          isMobile ? "h-[calc(100vh-200px)]" : "h-[calc(85vh-200px)]"
        )}>
          <p className="text-sm text-muted-foreground flex-shrink-0">
            {t('curriculum.materialInstructions', 'Para agregar material, selecciona una semana en la pestaña anterior y usa los botones en cada tema:')}
            <span className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-blue-600">
                <GraduationCap className="h-4 w-4" /> {t('curriculum.studentMaterial', 'Material del estudiante')}
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <BookMarked className="h-4 w-4" /> {t('curriculum.teacherGuide', 'Guía del profesor')}
              </span>
            </span>
          </p>

          {addingMaterial && materialTopicId && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3 flex-shrink-0">
              <h4 className="font-medium flex items-center gap-2">
                {editingMaterial ? (
                  <>
                    <Edit2 className="h-4 w-4 text-primary" />
                    {t('curriculum.editMaterial', 'Editar Material')}
                  </>
                ) : isTeacherGuide ? (
                  <>
                    <BookMarked className="h-4 w-4 text-purple-500" />
                    {t('curriculum.addTeacherGuide', 'Agregar Guía del Profesor')}
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    {t('curriculum.addStudentMaterial', 'Agregar Material del Estudiante')}
                  </>
                )}
              </h4>
              
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted">
                <Switch 
                  id="teacher-guide"
                  checked={isTeacherGuide} 
                  onCheckedChange={setIsTeacherGuide} 
                />
                <Label htmlFor="teacher-guide" className="text-sm cursor-pointer">
                  {isTeacherGuide 
                    ? `🔒 ${t('curriculum.hiddenFromStudents', 'Guía del profesor (no visible para estudiantes)')}` 
                    : `📚 ${t('curriculum.visibleToStudents', 'Material del estudiante (visible para todos)')}`}
                </Label>
              </div>
              
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                <div className="space-y-2">
                  <Label>{t('curriculum.materialTitle', 'Título')}</Label>
                  <Input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder={t('curriculum.materialTitlePlaceholder', 'Título del material')}
                    className={cn(isMobile && "min-h-[44px]")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('curriculum.materialType', 'Tipo')}</Label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger className={cn(isMobile && "min-h-[44px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="document">📄 {t('curriculum.document', 'Documento')}</SelectItem>
                      <SelectItem value="video">🎥 {t('curriculum.video', 'Video')}</SelectItem>
                      <SelectItem value="link">🔗 {t('curriculum.link', 'Enlace')}</SelectItem>
                      <SelectItem value="exercise">📝 {t('curriculum.exercise', 'Ejercicio')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('curriculum.contentUrl', 'Contenido (URL o subir archivo)')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    placeholder="https://... o sube un documento"
                    className={cn("flex-1", isMobile && "min-h-[44px]")}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(isMobile && "min-h-[44px] min-w-[44px]")}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.mp4"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial} 
                  disabled={!materialTitle.trim()}
                  className={cn(isMobile && "min-h-[44px] flex-1")}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save', 'Guardar')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetMaterialForm}
                  className={cn(isMobile && "min-h-[44px] flex-1")}
                >
                  {t('common.cancel', 'Cancelar')}
                </Button>
              </div>
            </div>
          )}

          {/* List of all materials grouped by week/topic */}
          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-2 flex-shrink-0">
              {t('curriculum.existingMaterials', 'Materiales Existentes')}
            </h4>
            <ScrollArea className="h-[calc(100%-28px)] border rounded-lg p-2">
              <div className="space-y-3">
                {weeks.map((week) => {
                  const weekTopics = getTopicsForWeek(week.id);
                  const weekMaterials = weekTopics.flatMap(t => getMaterialsForTopic(t.id));
                  
                  if (weekMaterials.length === 0) return null;
                  
                  return (
                    <div key={week.id} className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground">
                        {t('curriculum.week', 'Semana')} {week.week_number}: {week.title}
                      </h5>
                      {weekTopics.map((topic) => {
                        const materials = getMaterialsForTopic(topic.id);
                        if (materials.length === 0) return null;
                        
                        return (
                          <div key={topic.id} className="pl-3 border-l-2 border-muted space-y-1">
                            <p className="text-xs font-medium">{topic.name}</p>
                            {materials.map((material) => (
                              <div 
                                key={material.id} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg text-sm",
                                  material.is_teacher_guide 
                                    ? "bg-purple-50 dark:bg-purple-950/30" 
                                    : "bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {material.is_teacher_guide ? (
                                    <BookMarked className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                  ) : (
                                    getMaterialIcon(material.material_type)
                                  )}
                                  <span className="truncate">{material.title}</span>
                                  {material.is_teacher_guide && (
                                    <Badge variant="outline" className="text-xs text-purple-600 flex-shrink-0">
                                      {t('curriculum.guide', 'Guía')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("h-7 w-7", isMobile && "h-9 w-9")}
                                    onClick={() => handleEditMaterial(material)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("h-7 w-7 text-destructive", isMobile && "h-9 w-9")}
                                    onClick={() => handleDeleteMaterial(
                                      material.id, 
                                      material.content_url, 
                                      material.is_teacher_guide
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {allMaterials.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('curriculum.noMaterials', 'No hay materiales. Agrega uno desde la pestaña "Semanas y Temas".')}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile: Use Sheet, Desktop: Use Dialog
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
            <SheetHeader className="p-4 pb-2 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {t('curriculum.manage', 'Gestionar Currículo')}
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-hidden p-4">
              {renderContent()}
            </div>
          </SheetContent>
        </Sheet>

        {/* Create Re-evaluation Test Dialog */}
        {selectedTopicForTest && (
          <CreateTopicReevaluationTestDialog
            open={showCreateTestDialog}
            onOpenChange={(open) => {
              setShowCreateTestDialog(open);
              if (!open) setSelectedTopicForTest(null);
            }}
            topicId={selectedTopicForTest.id}
            topicName={selectedTopicForTest.name}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('curriculum.manage', 'Gestionar Currículo')}
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>

      {/* Create Re-evaluation Test Dialog */}
      {selectedTopicForTest && (
        <CreateTopicReevaluationTestDialog
          open={showCreateTestDialog}
          onOpenChange={(open) => {
            setShowCreateTestDialog(open);
            if (!open) setSelectedTopicForTest(null);
          }}
          topicId={selectedTopicForTest.id}
          topicName={selectedTopicForTest.name}
        />
      )}
    </>
  );
};
