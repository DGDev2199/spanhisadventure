-- Allow teachers to delete tasks they created
CREATE POLICY "Teachers can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid());