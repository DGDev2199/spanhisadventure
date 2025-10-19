-- Allow students to view their assigned teacher's profile
CREATE POLICY "Students can view their assigned teacher profile"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = auth.uid()
    AND student_profiles.teacher_id = profiles.id
  )
);

-- Allow students to view their assigned tutor's profile
CREATE POLICY "Students can view their assigned tutor profile"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = auth.uid()
    AND student_profiles.tutor_id = profiles.id
  )
);

-- Allow teachers to view their assigned students' profiles
CREATE POLICY "Teachers can view their assigned students profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.teacher_id = auth.uid()
    AND student_profiles.user_id = profiles.id
  )
);

-- Allow tutors to view their assigned students' profiles
CREATE POLICY "Tutors can view their assigned students profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.tutor_id = auth.uid()
    AND student_profiles.user_id = profiles.id
  )
);