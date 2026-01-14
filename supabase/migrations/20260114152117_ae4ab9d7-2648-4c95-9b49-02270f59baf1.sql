-- Create a function to validate teacher updates on student_profiles
-- This prevents teachers from modifying placement test fields
CREATE OR REPLACE FUNCTION public.validate_teacher_student_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a teacher (not admin/coordinator), enforce field restrictions
  IF has_role(auth.uid(), 'teacher'::app_role) 
     AND NOT has_admin_or_coordinator_role(auth.uid()) THEN
    
    -- Prevent modification of placement test fields
    IF OLD.placement_test_answers IS DISTINCT FROM NEW.placement_test_answers THEN
      RAISE EXCEPTION 'Teachers cannot modify placement test answers';
    END IF;
    
    IF OLD.placement_test_status IS DISTINCT FROM NEW.placement_test_status THEN
      RAISE EXCEPTION 'Teachers cannot modify placement test status';
    END IF;
    
    IF OLD.placement_test_written_score IS DISTINCT FROM NEW.placement_test_written_score THEN
      RAISE EXCEPTION 'Teachers cannot modify placement test score';
    END IF;
    
    IF OLD.placement_test_oral_completed IS DISTINCT FROM NEW.placement_test_oral_completed THEN
      RAISE EXCEPTION 'Teachers cannot modify placement test oral status';
    END IF;
    
    IF OLD.initial_feedback IS DISTINCT FROM NEW.initial_feedback THEN
      RAISE EXCEPTION 'Teachers cannot modify initial feedback';
    END IF;
    
    -- Prevent teachers from reassigning students to different teachers/tutors
    IF OLD.teacher_id IS DISTINCT FROM NEW.teacher_id THEN
      RAISE EXCEPTION 'Teachers cannot reassign students to different teachers';
    END IF;
    
    IF OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
      RAISE EXCEPTION 'Teachers cannot reassign students to different tutors';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce field-level restrictions for teachers
DROP TRIGGER IF EXISTS validate_teacher_student_profile_update_trigger ON public.student_profiles;
CREATE TRIGGER validate_teacher_student_profile_update_trigger
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_teacher_student_profile_update();

-- Also create a secure view for teachers to access student profiles
-- This view excludes placement test answers (sensitive data)
CREATE OR REPLACE VIEW public.safe_student_profiles AS
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
  -- Exclude placement_test_answers, placement_test_written_score, 
  -- placement_test_oral_completed, initial_feedback for non-admin users
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