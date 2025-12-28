import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Save,
  FileText,
  Video,
  Link as LinkIcon,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManageCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageCurriculumDialog = ({ open, onOpenChange }: ManageCurriculumDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: weeks = [] } = useProgramWeeks();
  const { data: allTopics = [] } = useAllWeekTopics();

  const [selectedWeek, setSelectedWeek] = useState<ProgramWeek | null>(null);
  const [editingTopic, setEditingTopic] = useState<WeekTopic | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  
  // Material form
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<string>("document");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialTopicId, setMaterialTopicId] = useState<string | null>(null);

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
        });
      
      if (error) throw error;
      
      toast.success(t('curriculum.materialAdded', 'Material agregado'));
      setMaterialTitle("");
      setMaterialUrl("");
      setAddingMaterial(false);
      setMaterialTopicId(null);
      queryClient.invalidateQueries({ queryKey: ['topic-materials'] });
    } catch (error) {
      toast.error(t('errors.generic', 'Error al agregar material'));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t('curriculum.manage', 'Gestionar Currículo')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="weeks" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="weeks">Semanas y Temas</TabsTrigger>
            <TabsTrigger value="materials">Material Extra</TabsTrigger>
          </TabsList>

          <TabsContent value="weeks" className="mt-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(85vh-140px)]">
              {/* Weeks list */}
              <div className="flex flex-col min-h-0">
                <h3 className="font-medium mb-3 flex-shrink-0">Semanas del Programa</h3>
                <ScrollArea className="flex-1 border rounded-lg p-2">
                  <div className="space-y-2">
                    {weeks.map((week) => (
                      <button
                        key={week.id}
                        onClick={() => setSelectedWeek(week)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors",
                          selectedWeek?.id === week.id 
                            ? "bg-primary/10 border-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Semana {week.week_number}: {week.title}
                          </span>
                          <Badge className={cn("text-white text-xs", getLevelColor(week.level))}>
                            {week.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTopicsForWeek(week.id).length} temas
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Topics for selected week */}
              <div className="flex flex-col min-h-0">
                <h3 className="font-medium mb-3 flex-shrink-0">
                  {selectedWeek 
                    ? `Temas - Semana ${selectedWeek.week_number}` 
                    : 'Selecciona una semana'}
                </h3>
                {selectedWeek ? (
                  <ScrollArea className="flex-1 border rounded-lg p-2">
                    <div className="space-y-3">
                      {/* Existing topics */}
                      <div className="space-y-2">
                        {getTopicsForWeek(selectedWeek.id).map((topic) => (
                          <div
                            key={topic.id}
                            className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                          >
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
                                onClick={() => {
                                  setMaterialTopicId(topic.id);
                                  setAddingMaterial(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
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
                        ))}
                        {getTopicsForWeek(selectedWeek.id).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay temas. Agrega uno abajo.
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Add new topic - inside ScrollArea */}
                      <div className="space-y-3 pb-2">
                        <h4 className="text-sm font-medium">Agregar Tema</h4>
                        <Input
                          placeholder="Nombre del tema (ej: Verbos reflexivos)"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                        />
                        <Textarea
                          placeholder="Descripción (opcional)"
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
                          Agregar Tema
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex-1 border rounded-lg flex items-center justify-center text-muted-foreground">
                    Selecciona una semana para ver sus temas
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para agregar material, selecciona una semana en la pestaña anterior y usa el botón + en cada tema.
              </p>

              {addingMaterial && materialTopicId && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="font-medium">Agregar Material Extra</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        placeholder="Título del material"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={materialType} onValueChange={setMaterialType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="document">📄 Documento</SelectItem>
                          <SelectItem value="video">🎥 Video</SelectItem>
                          <SelectItem value="link">🔗 Enlace</SelectItem>
                          <SelectItem value="exercise">📝 Ejercicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>URL del contenido</Label>
                    <Input
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMaterial} disabled={!materialTitle.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setAddingMaterial(false);
                      setMaterialTopicId(null);
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
