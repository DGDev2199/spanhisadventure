-- Create detailed staff hours tracking table
CREATE TABLE public.staff_hours_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  source_title TEXT,
  hours DECIMAL NOT NULL,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_staff_hours_detail_user_month ON public.staff_hours_detail(user_id, month_year);
CREATE INDEX idx_staff_hours_detail_source ON public.staff_hours_detail(source_type);

-- Enable RLS
ALTER TABLE public.staff_hours_detail ENABLE ROW LEVEL SECURITY;

-- Staff can view their own hours
CREATE POLICY "Staff can view own hours detail"
ON public.staff_hours_detail
FOR SELECT
USING (auth.uid() = user_id);

-- Admins and coordinators can view all
CREATE POLICY "Admins can view all hours detail"
ON public.staff_hours_detail
FOR SELECT
USING (has_admin_or_coordinator_role(auth.uid()));

-- Only system (via function) can insert/update/delete
CREATE POLICY "System can manage hours detail"
ON public.staff_hours_detail
FOR ALL
USING (has_admin_or_coordinator_role(auth.uid()));

-- Create comprehensive function for detailed hours calculation
CREATE OR REPLACE FUNCTION public.calculate_staff_hours_detailed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
  current_month DATE := date_trunc('month', CURRENT_DATE);
  calculated_total DECIMAL := 0;
  current_adjustment DECIMAL := 0;
BEGIN
  -- Delete existing details for current month (recalculate)
  DELETE FROM staff_hours_detail WHERE month_year = current_month;
  
  -- Loop through all teachers and tutors
  FOR staff_record IN 
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role IN ('teacher', 'tutor')
  LOOP
    -- Insert details from student_class_schedules (unique by group_session_id)
    INSERT INTO staff_hours_detail (user_id, month_year, source_type, source_id, source_title, hours, day_of_week, start_time, end_time)
    SELECT 
      staff_record.user_id,
      current_month,
      COALESCE(schedule_type, 'class'),
      id,
      CASE schedule_type
        WHEN 'class' THEN '📚 Clase'
        WHEN 'adventure' THEN '🏔️ Aventura'
        WHEN 'elective' THEN '🎨 Electiva'
        WHEN 'tutoring' THEN '👨‍🏫 Tutoría'
        ELSE '📚 Clase'
      END || ' - ' || CASE day_of_week
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
      END,
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0,
      day_of_week,
      start_time,
      end_time
    FROM (
      SELECT DISTINCT ON (
        COALESCE(group_session_id::text, id::text),
        day_of_week,
        start_time,
        end_time,
        COALESCE(teacher_id::text, ''),
        COALESCE(tutor_id::text, '')
      )
      id, schedule_type, day_of_week, start_time, end_time
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
    ) AS unique_schedules;
    
    -- Insert details from schedule_events
    INSERT INTO staff_hours_detail (user_id, month_year, source_type, source_id, source_title, hours, day_of_week, start_time, end_time)
    SELECT 
      staff_record.user_id,
      current_month,
      'event',
      id,
      '📅 ' || title,
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0,
      day_of_week,
      start_time,
      end_time
    FROM schedule_events
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND is_active = true;
    
    -- Insert details from completed class_bookings this month
    INSERT INTO staff_hours_detail (user_id, month_year, source_type, source_id, source_title, hours, day_of_week, start_time, end_time)
    SELECT 
      staff_record.user_id,
      current_month,
      'booking',
      id,
      '🎓 Reserva - ' || to_char(booking_date, 'DD/MM'),
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0,
      EXTRACT(DOW FROM booking_date)::INTEGER,
      start_time,
      end_time
    FROM class_bookings
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND status = 'completed'
    AND booking_date >= current_month
    AND booking_date < current_month + interval '1 month';
    
    -- Insert approved extra hours
    INSERT INTO staff_hours_detail (user_id, month_year, source_type, source_id, source_title, hours, day_of_week)
    SELECT 
      staff_record.user_id,
      current_month,
      'extra',
      id,
      '⏰ Horas Extra: ' || LEFT(justification, 50),
      hours,
      NULL
    FROM extra_hours
    WHERE user_id = staff_record.user_id
    AND approved = true
    AND created_at >= current_month
    AND created_at < current_month + interval '1 month';
    
    -- Calculate total from details
    SELECT COALESCE(SUM(hours), 0) INTO calculated_total
    FROM staff_hours_detail
    WHERE user_id = staff_record.user_id
    AND month_year = current_month;
    
    -- Get current manual adjustment
    SELECT COALESCE(manual_adjustment_hours, 0)
    INTO current_adjustment
    FROM staff_hours
    WHERE user_id = staff_record.user_id;
    
    -- Update staff_hours summary table
    INSERT INTO staff_hours (user_id, calculated_hours, manual_adjustment_hours, total_hours, last_calculated_at)
    VALUES (
      staff_record.user_id,
      calculated_total,
      COALESCE(current_adjustment, 0),
      calculated_total + COALESCE(current_adjustment, 0),
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