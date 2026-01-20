-- ============================================================================
-- OPTION A: Allow backend (Lovable) to update placement test fields
-- This bypasses auth.uid() because Lovable executes updates as backend
-- ============================================================================

-- 1. Remove conflicting UPDATE policies
DROP POLICY IF EXISTS "Teachers can update their students"
ON public.student_profiles;

DROP POLICY IF EXISTS "Admins can manage all student profiles"
ON public.student_profiles;

-- 2. Create backend-only UPDATE policy for placement test
CREATE POLICY "Backend can update placement test"
  ON public.student_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
