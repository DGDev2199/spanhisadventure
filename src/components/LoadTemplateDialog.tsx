import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, Lock } from 'lucide-react';

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const LoadTemplateDialog = ({ open, onOpenChange, onSelectTemplate }: LoadTemplateDialogProps) => {
  const { user } = useAuth();

  const { data: templates } = useQuery({
    queryKey: ['test-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_templates')
        .select(`
          *,
          creator:profiles!test_templates_created_by_fkey(full_name),
          template_questions(count)
        `)
        .or(`created_by.eq.${user?.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cargar Template</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-4">
            {templates?.map((template: any) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || 'Sin descripción'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={template.test_type === 'final' ? 'destructive' : 'default'}>
                        {template.test_type === 'final' ? 'Final' : 'Regular'}
                      </Badge>
                      {template.is_public ? (
                        <Badge variant="secondary">
                          <Globe className="h-3 w-3 mr-1" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="h-3 w-3 mr-1" />
                          Privado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <div>Creado por: {template.creator?.full_name}</div>
                      <div>
                        Preguntas: {template.template_questions?.[0]?.count || 0}
                      </div>
                      <div>
                        Fecha: {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button onClick={() => handleSelect(template.id)}>
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!templates || templates.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No hay templates disponibles
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
