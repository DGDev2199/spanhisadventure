import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProgramWeeks, useAllWeekTopics } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecurePDFViewer } from '@/components/curriculum';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Loader2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedPdf {
  url: string;
  title: string;
}

export const TeacherMaterialsPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: weeks = [] } = useProgramWeeks();
  const { data: allTopics = [] } = useAllWeekTopics();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);

  // Fetch user profile for watermark
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all materials including teacher guides
  const { data: allMaterials = [], isLoading } = useQuery({
    queryKey: ['all-topic-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_materials')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekId)) {
        newSet.delete(weekId);
      } else {
        newSet.add(weekId);
      }
      return newSet;
    });
  };

  const getTopicsForWeek = (weekId: string) => {
    return allTopics.filter(t => t.week_id === weekId);
  };

  const getMaterialsForTopic = (topicId: string) => {
    return allMaterials.filter(m => m.topic_id === topicId);
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

  const handleMaterialClick = async (material: { 
    content_url: string | null; 
    material_type: string; 
    title: string;
    is_teacher_guide: boolean;
  }) => {
    if (!material.content_url) return;

    // Check if it's a PDF teacher guide - open in secure viewer
    const isPdf = material.content_url.toLowerCase().endsWith('.pdf');
    const isTeacherGuide = material.is_teacher_guide;

    if (isPdf && isTeacherGuide) {
      // Check if it's a private material reference (bucket/path format)
      if (material.content_url.startsWith('materials/')) {
        // Generate a signed URL for private content
        const path = material.content_url.replace('materials/', '');
        const { data: signedUrl, error } = await supabase.storage
          .from('materials')
          .createSignedUrl(path, 3600); // 1 hour expiration
        
        if (error || !signedUrl?.signedUrl) {
          console.error('Error generating signed URL:', error);
          // Fallback to original URL if signed URL fails
          setSelectedPdf({
            url: material.content_url,
            title: material.title,
          });
        } else {
          setSelectedPdf({
            url: signedUrl.signedUrl,
            title: material.title,
          });
        }
      } else {
        // Use the URL directly for public or already-signed URLs
        setSelectedPdf({
          url: material.content_url,
          title: material.title,
        });
      }
    } else {
      // Open other materials in new tab
      window.open(material.content_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalGuides = weeks.reduce((acc, week) => {
    const topics = getTopicsForWeek(week.id);
    return acc + topics.reduce((t, topic) => 
      t + getMaterialsForTopic(topic.id).filter(m => m.is_teacher_guide).length, 0
    );
  }, 0);

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card>
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <BookOpen className="h-5 w-5 text-primary" />
                Materiales y Guías del Currículo
                {totalGuides > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {totalGuides} guías
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="ml-10">
                {isExpanded 
                  ? "Accede a los materiales extra y guías de enseñanza por tema"
                  : "Clic para ver materiales y guías del currículo"
                }
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {weeks.map((week) => {
                const isWeekExpanded = expandedWeeks.has(week.id);
                const topics = getTopicsForWeek(week.id);
                const totalMaterials = topics.reduce(
                  (acc, topic) => acc + getMaterialsForTopic(topic.id).length, 
                  0
                );
                const teacherGuides = topics.reduce(
                  (acc, topic) => acc + getMaterialsForTopic(topic.id).filter(m => m.is_teacher_guide).length,
                  0
                );

                return (
                  <Collapsible key={week.id} open={isWeekExpanded}>
                    <CollapsibleTrigger
                      onClick={() => toggleWeek(week.id)}
                      className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {isWeekExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          Semana {week.week_number}: {week.title}
                        </span>
                        <Badge className={cn("text-white text-xs", getLevelColor(week.level))}>
                          {week.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {teacherGuides > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {teacherGuides} guías
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {totalMaterials} materiales
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="pl-6 mt-2 space-y-2">
                      {topics.map((topic) => {
                        const materials = getMaterialsForTopic(topic.id);
                        const topicGuides = materials.filter(m => m.is_teacher_guide);
                        const studentMaterials = materials.filter(m => !m.is_teacher_guide);

                        if (materials.length === 0) return null;

                        return (
                          <div key={topic.id} className="border-l-2 border-muted pl-4 py-2">
                            <h4 className="font-medium text-sm mb-2">{topic.name}</h4>
                            
                            {/* Teacher Guides */}
                            {topicGuides.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  Guías del Profesor:
                                </p>
                                <div className="space-y-1">
                                  {topicGuides.map((material) => {
                                    const isPdf = material.content_url?.toLowerCase().endsWith('.pdf');
                                    return (
                                      <Button
                                        key={material.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start h-auto py-1.5 px-2 text-left bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50"
                                        onClick={() => handleMaterialClick(material)}
                                      >
                                        <span className="text-purple-600">{getMaterialIcon(material.material_type)}</span>
                                        <span className="flex-1 ml-2 text-sm truncate">{material.title}</span>
                                        {material.content_url && (
                                          isPdf ? (
                                            <Shield className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                          ) : (
                                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          )
                                        )}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Student Materials */}
                            {studentMaterials.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Material Extra:
                                </p>
                                <div className="space-y-1">
                                  {studentMaterials.map((material) => (
                                    <Button
                                      key={material.id}
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start h-auto py-1.5 px-2 text-left"
                                      onClick={() => handleMaterialClick(material)}
                                    >
                                      {getMaterialIcon(material.material_type)}
                                      <span className="flex-1 ml-2 text-sm truncate">{material.title}</span>
                                      {material.content_url && (
                                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {topics.every(topic => getMaterialsForTopic(topic.id).length === 0) && (
                        <p className="text-sm text-muted-foreground py-2">
                          No hay materiales para esta semana
                        </p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>

    {/* Secure PDF Viewer Modal */}
    <SecurePDFViewer
      open={!!selectedPdf}
      onClose={() => setSelectedPdf(null)}
      pdfUrl={selectedPdf?.url || ''}
      title={selectedPdf?.title || ''}
      userName={userProfile?.full_name || user?.email || 'Usuario'}
    />
  </>
  );
};
