-- Create table for extra hours with justification
CREATE TABLE IF NOT EXISTS public.extra_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours numeric NOT NULL,
  justification text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz
);

-- Enable RLS
ALTER TABLE public.extra_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for extra_hours
CREATE POLICY "Staff can view their own extra hours"
ON public.extra_hours FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Staff can create extra hours"
ON public.extra_hours FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'tutor'::app_role))
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can manage all extra hours"
ON public.extra_hours FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table to link students with their specific schedule events
CREATE TABLE IF NOT EXISTS public.student_schedule_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_event_id uuid NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, schedule_event_id)
);

-- Enable RLS
ALTER TABLE public.student_schedule_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_schedule_assignments
CREATE POLICY "Admins can manage all student schedule assignments"
ON public.student_schedule_assignments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their schedule assignments"
ON public.student_schedule_assignments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view their students schedule assignments"
ON public.student_schedule_assignments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.user_id = student_schedule_assignments.student_id
    AND sp.teacher_id = auth.uid()
  )
);

-- Function to calculate staff hours from schedule events
CREATE OR REPLACE FUNCTION calculate_staff_hours()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- Calculate hours from schedule_events for this staff member
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ), 0) INTO calculated_hours
    FROM schedule_events
    WHERE (teacher_id = staff_record.user_id OR tutor_id = staff_record.user_id)
    AND is_active = true;
    
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

-- Function to trigger staff hours recalculation
CREATE OR REPLACE FUNCTION trigger_calculate_staff_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_staff_hours();
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS schedule_events_staff_hours_trigger ON schedule_events;
DROP TRIGGER IF EXISTS extra_hours_staff_hours_trigger ON extra_hours;

-- Create trigger on schedule_events
CREATE TRIGGER schedule_events_staff_hours_trigger
AFTER INSERT OR UPDATE OR DELETE ON schedule_events
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_calculate_staff_hours();

-- Create trigger on extra_hours
CREATE TRIGGER extra_hours_staff_hours_trigger
AFTER INSERT OR UPDATE OR DELETE ON extra_hours
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_calculate_staff_hours();

-- Add unique constraint to staff_hours if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_hours_user_id_key'
  ) THEN
    ALTER TABLE staff_hours ADD CONSTRAINT staff_hours_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Initial calculation of all staff hours
SELECT calculate_staff_hours();