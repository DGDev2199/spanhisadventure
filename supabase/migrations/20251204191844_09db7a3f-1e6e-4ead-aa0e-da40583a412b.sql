-- Step 1: Add RLS INSERT policy for student_profiles
CREATE POLICY "Students can insert their own student profile" 
ON public.student_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Step 2: Repair existing students without student_profiles
INSERT INTO student_profiles (user_id, status, placement_test_status, student_type)
SELECT 
  p.id,
  'active',
  'not_started',
  'presencial'
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'student'
LEFT JOIN student_profiles sp ON p.id = sp.user_id
WHERE sp.id IS NULL;

-- Step 3: Create trigger to automatically create student_profiles when student role is assigned
CREATE OR REPLACE FUNCTION public.handle_new_student_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO student_profiles (user_id, status, placement_test_status, student_type)
    VALUES (NEW.user_id, 'active', 'not_started', 'presencial')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_role_created
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_role();