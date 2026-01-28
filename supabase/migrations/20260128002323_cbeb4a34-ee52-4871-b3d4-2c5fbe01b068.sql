-- ===========================================
-- Fix RLS for student_class_schedules - Allow teachers and tutors to INSERT
-- ===========================================

-- Teachers can create class schedules for students where they are the teacher
CREATE POLICY "Teachers can create class schedules"
ON public.student_class_schedules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
  AND (teacher_id = auth.uid() OR tutor_id = auth.uid())
);

-- Tutors can create tutoring schedules for students where they are the tutor  
CREATE POLICY "Tutors can create tutoring schedules"
ON public.student_class_schedules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
  AND (tutor_id = auth.uid() OR teacher_id = auth.uid())
);

-- Coordinators can manage all class schedules
CREATE POLICY "Coordinators can manage all class schedules"
ON public.student_class_schedules FOR ALL
USING (public.has_role(auth.uid(), 'coordinator'));

-- Teachers can update schedules they created
CREATE POLICY "Teachers can update own class schedules"
ON public.student_class_schedules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

-- Tutors can update schedules they created
CREATE POLICY "Tutors can update own class schedules"
ON public.student_class_schedules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);

-- Improve SELECT policies to show schedules where staff is teacher OR tutor
DROP POLICY IF EXISTS "Teachers can view their students class schedules" ON public.student_class_schedules;
DROP POLICY IF EXISTS "Tutors can view their students tutoring schedules" ON public.student_class_schedules;

CREATE POLICY "Teachers can view all their schedules"
ON public.student_class_schedules FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher')
  AND is_active = true
  AND (teacher_id = auth.uid() OR tutor_id = auth.uid() OR created_by = auth.uid())
);

CREATE POLICY "Tutors can view all their schedules"
ON public.student_class_schedules FOR SELECT
USING (
  public.has_role(auth.uid(), 'tutor')
  AND is_active = true
  AND (tutor_id = auth.uid() OR teacher_id = auth.uid() OR created_by = auth.uid())
);