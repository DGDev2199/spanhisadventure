import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmitTaskPayload {
  taskId: string;
  studentNotes?: string;
}

export const useSubmitTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, studentNotes }: SubmitTaskPayload) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'submitted',
          student_notes: studentNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success('Tarea enviada correctamente');

      // Refresca tareas del estudiante
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });

      // Refresca panel del profesor
      queryClient.invalidateQueries({ queryKey: ['teacher-submitted-tasks'] });
    },

    onError: (error: any) => {
      toast.error('Error al enviar la tarea');
      console.error(error);
    },
  });
};
