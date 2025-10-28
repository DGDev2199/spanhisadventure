-- Allow students to update their own placement test results
CREATE POLICY "Students can update their own placement test results"
ON public.student_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);