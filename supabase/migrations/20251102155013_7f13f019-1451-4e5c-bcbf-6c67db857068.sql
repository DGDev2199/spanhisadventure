-- Create table for student class schedules (separate from weekly calendar)
CREATE TABLE public.student_class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  teacher_id UUID NULL,
  tutor_id UUID NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('class', 'tutoring')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_staff_assignment CHECK (
    (schedule_type = 'class' AND teacher_id IS NOT NULL AND tutor_id IS NULL) OR
    (schedule_type = 'tutoring' AND tutor_id IS NOT NULL AND teacher_id IS NULL)
  )
);

-- Enable RLS
ALTER TABLE public.student_class_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all class schedules"
ON public.student_class_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own class schedules"
ON public.student_class_schedules
FOR SELECT
USING (student_id = auth.uid() AND is_active = true);

CREATE POLICY "Teachers can view their students class schedules"
ON public.student_class_schedules
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  teacher_id = auth.uid() AND
  is_active = true
);

CREATE POLICY "Tutors can view their students tutoring schedules"
ON public.student_class_schedules
FOR SELECT
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND
  tutor_id = auth.uid() AND
  is_active = true
);

-- Add trigger for updated_at
CREATE TRIGGER update_student_class_schedules_updated_at
BEFORE UPDATE ON public.student_class_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update calculate_staff_hours function to include student_class_schedules
CREATE OR REPLACE FUNCTION public.calculate_staff_hours()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  staff_record RECORD;
  calculated_hours numeric;
  extra_hours_total numeric;
BEGIN
  -- Loop through all staff (teachers and tutors)
  FOR staff_record IN 
    SELECT DISTINCT user_id 
    FROM user_roles 
    WHERE role IN ('teacher', 'tutor')
  LOOP
    -- Calculate hours from schedule_events
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ), 0) INTO calculated_hours
    FROM schedule_events
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND is_active = true;
    
    -- Add hours from student_class_schedules
    calculated_hours := calculated_hours + COALESCE((
      SELECT SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
      )
      FROM student_class_schedules
      WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
      AND is_active = true
    ), 0);
    
    -- Calculate approved extra hours
    SELECT COALESCE(SUM(hours), 0) INTO extra_hours_total
    FROM extra_hours
    WHERE user_id = staff_record.user_id
    AND approved = true;
    
    -- Update or insert staff_hours record
    INSERT INTO staff_hours (
      user_id, 
      calculated_hours, 
      manual_adjustment_hours,
      total_hours,
      last_calculated_at
    )
    VALUES (
      staff_record.user_id,
      calculated_hours,
      extra_hours_total,
      calculated_hours + extra_hours_total,
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      calculated_hours = EXCLUDED.calculated_hours,
      manual_adjustment_hours = EXCLUDED.manual_adjustment_hours,
      total_hours = EXCLUDED.total_hours,
      last_calculated_at = EXCLUDED.last_calculated_at,
      updated_at = now();
  END LOOP;
END;
$$;

-- Create trigger to recalculate hours when student_class_schedules changes
CREATE TRIGGER trigger_recalculate_hours_on_class_schedule_change
AFTER INSERT OR UPDATE OR DELETE ON public.student_class_schedules
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_calculate_staff_hours();