-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Users can view public profiles basic info" ON public.profiles;

-- Create a more restrictive policy - no public profile access through main table
CREATE POLICY "Users can view authorized profiles only"
ON public.profiles
FOR SELECT
USING (
  -- Users can see their own profile
  auth.uid() = id
  OR
  -- Teachers can see their assigned students
  (has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.user_id = profiles.id AND sp.teacher_id = auth.uid()
  ))
  OR
  -- Tutors can see their assigned students
  (has_role(auth.uid(), 'tutor') AND EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.user_id = profiles.id AND sp.tutor_id = auth.uid()
  ))
  OR
  -- Students can see their assigned teacher
  (has_role(auth.uid(), 'student') AND EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.user_id = auth.uid() AND sp.teacher_id = profiles.id
  ))
  OR
  -- Students can see their assigned tutor
  (has_role(auth.uid(), 'student') AND EXISTS (
    SELECT 1 FROM public.student_profiles sp 
    WHERE sp.user_id = auth.uid() AND sp.tutor_id = profiles.id
  ))
  OR
  -- Admins and coordinators can see all
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'coordinator')
);

-- Create a secure view for public browsing (teachers/tutors listing)
-- This only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.public_staff_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.availability,
  p.experience,
  p.languages_spoken,
  p.timezone,
  p.hourly_rate,
  p.currency,
  p.is_approved,
  ur.role
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE 
  p.is_approved = true 
  AND p.is_public_profile = true
  AND ur.role IN ('teacher', 'tutor');

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_staff_profiles TO authenticated;