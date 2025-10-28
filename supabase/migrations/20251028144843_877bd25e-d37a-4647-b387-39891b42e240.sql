-- Allow teachers to view profiles of tutors assigned to their students
DO $$ BEGIN
  CREATE POLICY "Teachers can view tutors of their students" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.teacher_id = auth.uid() AND sp.tutor_id = profiles.id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow tutors to view profiles of teachers assigned to their students
DO $$ BEGIN
  CREATE POLICY "Tutors can view teachers of their students" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'tutor'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.tutor_id = auth.uid() AND sp.teacher_id = profiles.id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;