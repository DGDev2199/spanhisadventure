-- Add group_session_id column to identify group classes
ALTER TABLE student_class_schedules 
ADD COLUMN IF NOT EXISTS group_session_id UUID DEFAULT NULL;

-- Create index for better performance on group queries
CREATE INDEX IF NOT EXISTS idx_student_class_schedules_group_session_id 
ON student_class_schedules(group_session_id) 
WHERE group_session_id IS NOT NULL;

-- Update the calculate_staff_hours function to properly handle group classes
-- Group classes should only count ONCE per session, not once per student
CREATE OR REPLACE FUNCTION calculate_staff_hours()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
  calculated_hours DECIMAL := 0;
  schedule_hours DECIMAL := 0;
  event_hours DECIMAL := 0;
  booking_hours DECIMAL := 0;
  approved_extra DECIMAL := 0;
  current_adjustment DECIMAL := 0;
BEGIN
  -- Loop through all teachers and tutors
  FOR staff_record IN 
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role IN ('teacher', 'tutor')
  LOOP
    -- Reset hours for each staff member
    schedule_hours := 0;
    event_hours := 0;
    booking_hours := 0;
    approved_extra := 0;
    current_adjustment := 0;
    
    -- Calculate hours from student_class_schedules
    -- Use DISTINCT ON with group_session_id to count group sessions only ONCE
    SELECT COALESCE(SUM(session_hours), 0) INTO schedule_hours
    FROM (
      SELECT DISTINCT ON (
        COALESCE(group_session_id::text, id::text),
        day_of_week,
        start_time,
        end_time,
        COALESCE(teacher_id::text, ''),
        COALESCE(tutor_id::text, '')
      )
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 AS session_hours
      FROM student_class_schedules
      WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
      AND is_active = true
      ORDER BY 
        COALESCE(group_session_id::text, id::text),
        day_of_week,
        start_time,
        end_time,
        COALESCE(teacher_id::text, ''),
        COALESCE(tutor_id::text, ''),
        created_at DESC
    ) AS unique_sessions;
    
    -- Calculate hours from schedule_events
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0), 0)
    INTO event_hours
    FROM schedule_events
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND is_active = true;
    
    -- Calculate hours from completed class_bookings (this month)
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0), 0)
    INTO booking_hours
    FROM class_bookings
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND status = 'completed'
    AND booking_date >= date_trunc('month', CURRENT_DATE)
    AND booking_date < date_trunc('month', CURRENT_DATE) + interval '1 month';
    
    -- Get approved extra hours
    SELECT COALESCE(SUM(hours), 0)
    INTO approved_extra
    FROM extra_hours
    WHERE user_id = staff_record.user_id
    AND approved = true;
    
    -- Get current manual adjustment
    SELECT COALESCE(manual_adjustment_hours, 0)
    INTO current_adjustment
    FROM staff_hours
    WHERE user_id = staff_record.user_id;
    
    -- Calculate total (use schedule_hours + event_hours for weekly recurring, booking_hours for actual completed)
    calculated_hours := schedule_hours + event_hours + approved_extra;
    
    -- Insert or update staff_hours
    INSERT INTO staff_hours (user_id, calculated_hours, manual_adjustment_hours, total_hours, last_calculated_at)
    VALUES (
      staff_record.user_id,
      calculated_hours,
      current_adjustment,
      calculated_hours + current_adjustment,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      calculated_hours = EXCLUDED.calculated_hours,
      total_hours = EXCLUDED.calculated_hours + staff_hours.manual_adjustment_hours,
      last_calculated_at = NOW(),
      updated_at = NOW();
      
  END LOOP;
END;
$$;