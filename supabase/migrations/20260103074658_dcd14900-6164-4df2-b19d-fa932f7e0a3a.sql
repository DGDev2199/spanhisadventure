-- Permitir que estudiantes actualicen sus propias tareas (enviar)
CREATE POLICY "Students can submit their own tasks"
ON public.tasks
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id = auth.uid()
);