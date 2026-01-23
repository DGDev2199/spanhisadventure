-- Allow users with teacher role to ALSO view student_profiles where they are assigned as tutor
-- This fixes the case where a staff member is acting as tutor but currently logged/typed as 'teacher'

CREATE POLICY "Teachers can view students they tutor"
ON public.student_profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND tutor_id = auth.uid()
);
