-- Update the validation function to allow teachers to assign levels when placement test is pending
CREATE OR REPLACE FUNCTION validate_teacher_student_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a teacher (not admin/coordinator), enforce field restrictions
  IF has_role(auth.uid(), 'teacher'::app_role) 
     AND NOT has_admin_or_coordinator_role(auth.uid()) THEN
    
    -- Allow teachers to update placement test fields ONLY when assigning level (status is 'pending')
    -- This is the case when a teacher is reviewing the placement test and assigning a level
    IF OLD.placement_test_status = 'pending'::test_status THEN
      -- Teachers CAN modify these fields when assigning level after placement test
      -- They can change: level, placement_test_status (to 'completed'), placement_test_oral_completed, initial_feedback
      
      -- But still prevent modification of answers and written score
      IF OLD.placement_test_answers IS DISTINCT FROM NEW.placement_test_answers THEN
        RAISE EXCEPTION 'Teachers cannot modify placement test answers';
      END IF;
      
      IF OLD.placement_test_written_score IS DISTINCT FROM NEW.placement_test_written_score THEN
        RAISE EXCEPTION 'Teachers cannot modify placement test score';
      END IF;
      
      -- Prevent teachers from reassigning students to different teachers/tutors
      IF OLD.teacher_id IS DISTINCT FROM NEW.teacher_id THEN
        RAISE EXCEPTION 'Teachers cannot reassign students to different teachers';
      END IF;
      
      IF OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
        RAISE EXCEPTION 'Teachers cannot reassign students to different tutors';
      END IF;
    ELSE
      -- When status is NOT pending, apply all restrictions
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
      
      IF OLD.teacher_id IS DISTINCT FROM NEW.teacher_id THEN
        RAISE EXCEPTION 'Teachers cannot reassign students to different teachers';
      END IF;
      
      IF OLD.tutor_id IS DISTINCT FROM NEW.tutor_id THEN
        RAISE EXCEPTION 'Teachers cannot reassign students to different tutors';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;