-- Ensure the existing policy for teachers to update their students covers all necessary fields
DROP POLICY IF EXISTS "Teachers can update their students" ON public.student_profiles;

CREATE POLICY "Teachers can update their students"
ON public.student_profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND teacher_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND teacher_id = auth.uid()
);