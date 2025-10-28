-- Drop existing policies if they exist (allow failure)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Teachers can view assigned tutors profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Tutors can view assigned teachers profiles" ON public.profiles;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create new policies without IF NOT EXISTS
CREATE POLICY "Teachers can view assigned tutors profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_profiles sp
    WHERE sp.teacher_id = auth.uid()
      AND sp.tutor_id = profiles.id
  )
);

CREATE POLICY "Tutors can view assigned teachers profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_profiles sp
    WHERE sp.tutor_id = auth.uid()
      AND sp.teacher_id = profiles.id
  )
);
