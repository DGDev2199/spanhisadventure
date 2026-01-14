-- Fix the safe_student_profiles view to use SECURITY INVOKER instead of SECURITY DEFINER
-- Drop and recreate without SECURITY DEFINER (default is INVOKER)
DROP VIEW IF EXISTS public.safe_student_profiles;

CREATE VIEW public.safe_student_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  student_type,
  status,
  level,
  teacher_id,
  tutor_id,
  room,
  placement_test_status,
  -- Exclude placement_test_answers entirely (sensitive data)
  -- Only show scores to the student themselves or admins/coordinators
  CASE 
    WHEN auth.uid() = user_id OR has_admin_or_coordinator_role(auth.uid())
    THEN placement_test_written_score
    ELSE NULL
  END as placement_test_written_score,
  CASE 
    WHEN auth.uid() = user_id OR has_admin_or_coordinator_role(auth.uid())
    THEN placement_test_oral_completed
    ELSE NULL
  END as placement_test_oral_completed,
  created_at,
  updated_at
FROM public.student_profiles;