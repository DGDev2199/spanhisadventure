-- Fix RLS policies for student_profiles to allow tutors to see teacher info
DROP POLICY IF EXISTS "Tutors can view their assigned students" ON public.student_profiles;

CREATE POLICY "Tutors can view their assigned students with full info"
ON public.student_profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND 
  (tutor_id = auth.uid())
);

-- Update schedule_events policies to allow admins full control
DROP POLICY IF EXISTS "Admins can manage all schedule events" ON public.schedule_events;

CREATE POLICY "Admins can manage all schedule events"
ON public.schedule_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));