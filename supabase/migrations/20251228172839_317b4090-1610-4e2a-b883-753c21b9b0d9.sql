-- Allow coordinators to view all student profiles
CREATE POLICY "Coordinators can view all student profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role));

-- Allow coordinators to update student profiles (assign teacher/tutor/room)
CREATE POLICY "Coordinators can update student profiles"
ON public.student_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'coordinator'::app_role));