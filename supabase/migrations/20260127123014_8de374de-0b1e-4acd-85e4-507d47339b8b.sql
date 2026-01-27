-- ===========================================
-- Fix RLS policies for staff operations
-- ===========================================

-- 1. FIX: Mark as Alumni - Allow admin/coordinator and teachers (as teacher OR tutor)
DROP POLICY IF EXISTS "Teachers can update student alumni status" ON public.student_profiles;

CREATE POLICY "Staff can update student alumni status" 
ON public.student_profiles FOR UPDATE 
USING (
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
)
WITH CHECK (
  public.has_admin_or_coordinator_role(auth.uid())
  OR
  (public.has_role(auth.uid(), 'teacher') AND (teacher_id = auth.uid() OR tutor_id = auth.uid()))
);

-- 2. FIX: Schedule Events - Allow teachers and tutors to create and update their own events
CREATE POLICY "Teachers can create schedule events"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

CREATE POLICY "Tutors can create schedule events"
ON public.schedule_events FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);

CREATE POLICY "Teachers can update own schedule events"
ON public.schedule_events FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher')
  AND created_by = auth.uid()
);

CREATE POLICY "Tutors can update own schedule events"
ON public.schedule_events FOR UPDATE
USING (
  public.has_role(auth.uid(), 'tutor')
  AND created_by = auth.uid()
);

CREATE POLICY "Coordinators can manage schedule events"
ON public.schedule_events FOR ALL
USING (public.has_role(auth.uid(), 'coordinator'));

-- 3. FIX: Student Schedule Assignments - Allow teachers and tutors to assign students
CREATE POLICY "Teachers can assign students to events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND assigned_by = auth.uid()
);

CREATE POLICY "Tutors can assign students to events"
ON public.student_schedule_assignments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tutor')
  AND assigned_by = auth.uid()
);

CREATE POLICY "Coordinators can manage student schedule assignments"
ON public.student_schedule_assignments FOR ALL
USING (public.has_role(auth.uid(), 'coordinator'));