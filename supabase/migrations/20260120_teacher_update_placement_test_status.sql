-- Allow teachers to update placement test status of their students

CREATE POLICY "Teachers can update placement test status only"
ON public.student_profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher')
  AND teacher_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
);
