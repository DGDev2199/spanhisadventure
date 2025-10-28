-- Drop existing problematic policies
DROP POLICY IF EXISTS "Students can view tests assigned to them" ON public.custom_tests;
DROP POLICY IF EXISTS "Teachers can manage assignments for their tests" ON public.test_assignments;
DROP POLICY IF EXISTS "Teachers can update grading for their tests" ON public.test_answers;
DROP POLICY IF EXISTS "Teachers can view answers for their tests" ON public.test_answers;
DROP POLICY IF EXISTS "Teachers can manage questions for their tests" ON public.test_questions;

-- Create security definer function to check if user is teacher of a test
CREATE OR REPLACE FUNCTION public.is_teacher_of_test(_user_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.custom_tests
    WHERE id = _test_id
      AND teacher_id = _user_id
  )
$$;

-- Create security definer function to check if test is assigned to student
CREATE OR REPLACE FUNCTION public.is_test_assigned_to_student(_user_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_assignments
    WHERE test_id = _test_id
      AND student_id = _user_id
  )
$$;

-- Create security definer function to get teacher_id from assignment_id
CREATE OR REPLACE FUNCTION public.get_teacher_id_from_assignment(_assignment_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ct.teacher_id
  FROM public.test_assignments ta
  JOIN public.custom_tests ct ON ct.id = ta.test_id
  WHERE ta.id = _assignment_id
  LIMIT 1
$$;

-- Recreate policies using security definer functions

-- Custom tests policy for students
CREATE POLICY "Students can view tests assigned to them"
ON public.custom_tests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND is_test_assigned_to_student(auth.uid(), id)
);

-- Test assignments policy for teachers
CREATE POLICY "Teachers can manage assignments for their tests"
ON public.test_assignments
FOR ALL
TO authenticated
USING (is_teacher_of_test(auth.uid(), test_id))
WITH CHECK (is_teacher_of_test(auth.uid(), test_id));

-- Test answers policies for teachers
CREATE POLICY "Teachers can view answers for their tests"
ON public.test_answers
FOR SELECT
TO authenticated
USING (get_teacher_id_from_assignment(assignment_id) = auth.uid());

CREATE POLICY "Teachers can update grading for their tests"
ON public.test_answers
FOR UPDATE
TO authenticated
USING (get_teacher_id_from_assignment(assignment_id) = auth.uid())
WITH CHECK (get_teacher_id_from_assignment(assignment_id) = auth.uid());

-- Test questions policy for teachers
CREATE POLICY "Teachers can manage questions for their tests"
ON public.test_questions
FOR ALL
TO authenticated
USING (is_teacher_of_test(auth.uid(), test_id))
WITH CHECK (is_teacher_of_test(auth.uid(), test_id));