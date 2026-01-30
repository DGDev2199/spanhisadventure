-- =====================================================
-- Storage Policies for materials bucket
-- =====================================================

-- Policy for admin/coordinator to upload to materials
CREATE POLICY "Admins can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' 
  AND public.has_admin_or_coordinator_role(auth.uid())
);

-- Policy for admin/coordinator to read materials
CREATE POLICY "Admins can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' 
  AND public.has_admin_or_coordinator_role(auth.uid())
);

-- Policy for admin/coordinator to delete materials
CREATE POLICY "Admins can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' 
  AND public.has_admin_or_coordinator_role(auth.uid())
);

-- Staff (teachers/tutors) can read materials for guides
CREATE POLICY "Staff can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
);

-- =====================================================
-- FIX: Student Progress Weeks - Teachers as Tutors
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Teachers can view their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Teachers can manage their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Tutors can view their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Tutors can update their students progress" ON public.student_progress_weeks;

-- New unified policy: Staff (teachers/tutors) can VIEW students where they are teacher_id OR tutor_id
CREATE POLICY "Staff can view assigned students progress"
ON public.student_progress_weeks FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- New unified policy: Staff can MANAGE (INSERT/UPDATE/DELETE) students they are assigned to
CREATE POLICY "Staff can manage assigned students progress"
ON public.student_progress_weeks FOR ALL
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- =====================================================
-- FIX: Student Progress Notes - Same logic
-- =====================================================

DROP POLICY IF EXISTS "Teachers can view their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Teachers can manage their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Tutors can view their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Tutors can manage their students notes" ON public.student_progress_notes;

-- Staff can VIEW notes for their assigned students
CREATE POLICY "Staff can view assigned students notes"
ON public.student_progress_notes FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM public.student_progress_weeks
    JOIN public.student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- Staff can MANAGE notes for their assigned students
CREATE POLICY "Staff can manage assigned students notes"
ON public.student_progress_notes FOR ALL
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM public.student_progress_weeks
    JOIN public.student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);