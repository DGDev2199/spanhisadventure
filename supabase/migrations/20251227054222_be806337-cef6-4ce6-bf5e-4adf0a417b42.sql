-- Fix profiles table RLS policies to restrict access to only authorized relationships
-- Remove the overly broad policy that allows wider access

-- Drop the problematic policy with OR conditions that may expose data
DROP POLICY IF EXISTS "Users can view authorized profiles only" ON public.profiles;

-- The following granular policies already exist and are correct:
-- 1. "Admins can manage all profiles" - admin full access
-- 2. "Admins can view all profiles" - admin read access  
-- 3. "Admins can update all profiles" - admin update access
-- 4. "Users can view their own profile" - own profile access
-- 5. "Users can update their own profile" - own profile update
-- 6. "Students can view their assigned teacher profile" - teacher relationship
-- 7. "Students can view their assigned tutor profile" - tutor relationship
-- 8. "Teachers can view their assigned students profiles" - student relationship
-- 9. "Tutors can view their assigned students profiles" - student relationship
-- 10. "Teachers can view tutors of their students" - cross-staff visibility
-- 11. "Tutors can view teachers of their students" - cross-staff visibility

-- Add coordinator access policy (was included in the dropped policy)
CREATE POLICY "Coordinators can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'coordinator'::app_role));