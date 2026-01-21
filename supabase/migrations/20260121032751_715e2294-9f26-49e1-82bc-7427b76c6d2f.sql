-- Drop any existing policy with the old name 
DROP POLICY IF EXISTS "Teachers can update placement test status only" ON public.student_profiles;
DROP POLICY IF EXISTS "Teachers can assign level to pending students" ON public.student_profiles;

-- Create a proper policy that allows teachers to update students with pending placement tests
-- This covers the case where teacher_id might not be assigned yet
CREATE POLICY "Teachers can assign level to pending students"
ON public.student_profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND placement_test_status = 'pending'::test_status
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
);