import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
}

export const SaveAsTemplateDialog = ({ open, onOpenChange, testId }: SaveAsTemplateDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      // Get test data
      const { data: test, error: testError } = await supabase
        .from('custom_tests')
        .select('*, test_questions(*)')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('test_templates')
        .insert({
          title: templateName,
          description: test.description,
          test_type: test.test_type,
          created_by: user.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Copy questions
      const questionsToInsert = test.test_questions.map((q: any) => ({
        template_id: template.id,
        question_type: q.question_type,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        options: q.options,
        order_number: q.order_number,
        points: q.points
      }));

      const { error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({ title: 'Template guardado exitosamente' });
      onOpenChange(false);
      setTemplateName('');
      setIsPublic(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ title: 'Error al guardar template', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre del Template</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej: Examen de Gramática A1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <Label htmlFor="public">Hacer público (otros profesores pueden usarlo)</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!templateName.trim() || isSaving} className="flex-1">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
