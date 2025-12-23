-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view basic profiles for feed" ON public.profiles;

-- Create a restrictive policy for viewing public profile info (only non-sensitive fields)
-- This policy allows viewing basic info for public profiles (avatar, bio, name)
-- The actual field filtering will be done in application code, but we restrict to public profiles only
CREATE POLICY "Users can view public profiles basic info"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own full profile
  auth.uid() = id
  OR
  -- View public profiles only
  (is_public_profile = true)
  OR
  -- Teachers can view profiles of their assigned students
  (has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND sp.teacher_id = auth.uid()
  ))
  OR
  -- Tutors can view profiles of their assigned students
  (has_role(auth.uid(), 'tutor') AND EXISTS (
    SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND sp.tutor_id = auth.uid()
  ))
  OR
  -- Students can view their assigned teacher's profile
  (has_role(auth.uid(), 'student') AND EXISTS (
    SELECT 1 FROM student_profiles sp WHERE sp.user_id = auth.uid() AND sp.teacher_id = profiles.id
  ))
  OR
  -- Students can view their assigned tutor's profile
  (has_role(auth.uid(), 'student') AND EXISTS (
    SELECT 1 FROM student_profiles sp WHERE sp.user_id = auth.uid() AND sp.tutor_id = profiles.id
  ))
  OR
  -- Admins can view all profiles
  has_role(auth.uid(), 'admin')
  OR
  -- Coordinators can view all profiles
  has_role(auth.uid(), 'coordinator')
);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure admins can manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'));