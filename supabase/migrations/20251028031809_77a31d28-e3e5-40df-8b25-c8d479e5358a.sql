-- Drop existing policy if it exists and create new one for teachers to view placement tests
DROP POLICY IF EXISTS "Teachers can view placement tests" ON public.placement_tests;
CREATE POLICY "Teachers can view placement tests"
ON public.placement_tests
FOR SELECT
USING (public.has_role(auth.uid(), 'teacher'));