-- Allow teachers to view placement test questions for reviewing student tests
CREATE POLICY "Teachers can view placement tests"
ON public.placement_tests
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));