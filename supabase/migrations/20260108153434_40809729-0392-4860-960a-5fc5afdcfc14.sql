-- Drop existing restrictive policies
DROP POLICY IF EXISTS "System can insert points" ON public.user_points;
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;

-- Create new policies that allow staff to insert points for students
CREATE POLICY "Staff can insert points for students" ON public.user_points
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  public.has_admin_or_coordinator_role(auth.uid()) OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'tutor')
);

-- Create new policies that allow staff to insert badges for students
CREATE POLICY "Staff can insert badges for students" ON public.user_badges
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  public.has_admin_or_coordinator_role(auth.uid()) OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'tutor')
);