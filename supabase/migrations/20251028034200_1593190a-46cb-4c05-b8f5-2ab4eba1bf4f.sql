-- Create table for staff hours tracking
CREATE TABLE IF NOT EXISTS public.staff_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  manual_adjustment_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calculated_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for hours history/log
CREATE TABLE IF NOT EXISTS public.staff_hours_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours_change DECIMAL(10, 2) NOT NULL,
  change_type TEXT NOT NULL, -- 'calculated', 'manual_adjustment', 'reset'
  description TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_hours_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_hours
CREATE POLICY "Admins can manage all staff hours"
  ON public.staff_hours
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their own hours"
  ON public.staff_hours
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher') 
    AND user_id = auth.uid()
  );

CREATE POLICY "Tutors can view their own hours"
  ON public.staff_hours
  FOR SELECT
  USING (
    has_role(auth.uid(), 'tutor') 
    AND user_id = auth.uid()
  );

-- RLS Policies for staff_hours_log
CREATE POLICY "Admins can view all hours logs"
  ON public.staff_hours_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their own hours logs"
  ON public.staff_hours_log
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher') 
    AND user_id = auth.uid()
  );

CREATE POLICY "Tutors can view their own hours logs"
  ON public.staff_hours_log
  FOR SELECT
  USING (
    has_role(auth.uid(), 'tutor') 
    AND user_id = auth.uid()
  );

-- Function to calculate hours from schedule events
CREATE OR REPLACE FUNCTION public.calculate_staff_hours_from_schedule(staff_user_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_weekly_hours DECIMAL(10, 2);
  event_duration DECIMAL(10, 2);
BEGIN
  -- Calculate total hours from schedule_events where staff is assigned
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
  ), 0) INTO total_weekly_hours
  FROM schedule_events
  WHERE (teacher_id = staff_user_id OR tutor_id = staff_user_id)
    AND is_active = true;
  
  RETURN total_weekly_hours;
END;
$$;

-- Function to update staff hours
CREATE OR REPLACE FUNCTION public.update_staff_hours(
  staff_user_id UUID,
  manual_hours DECIMAL DEFAULT NULL,
  should_reset BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_hrs DECIMAL(10, 2);
  manual_adj DECIMAL(10, 2);
  new_total DECIMAL(10, 2);
BEGIN
  -- Calculate hours from schedule
  calculated_hrs := calculate_staff_hours_from_schedule(staff_user_id);
  
  -- Handle reset
  IF should_reset THEN
    manual_adj := 0;
    new_total := calculated_hrs;
    
    -- Log the reset
    INSERT INTO staff_hours_log (user_id, hours_change, change_type, description, changed_by)
    VALUES (staff_user_id, -new_total, 'reset', 'Horas reseteadas por admin', auth.uid());
  ELSE
    -- Use provided manual hours or existing
    IF manual_hours IS NOT NULL THEN
      manual_adj := manual_hours;
      
      -- Log manual adjustment
      INSERT INTO staff_hours_log (user_id, hours_change, change_type, description, changed_by)
      VALUES (staff_user_id, manual_hours, 'manual_adjustment', 'Ajuste manual por admin', auth.uid());
    ELSE
      -- Get existing manual adjustment
      SELECT COALESCE(manual_adjustment_hours, 0) INTO manual_adj
      FROM staff_hours
      WHERE user_id = staff_user_id;
    END IF;
    
    new_total := calculated_hrs + manual_adj;
  END IF;
  
  -- Insert or update staff_hours
  INSERT INTO staff_hours (
    user_id, 
    total_hours, 
    manual_adjustment_hours, 
    calculated_hours,
    last_calculated_at,
    updated_at
  )
  VALUES (
    staff_user_id, 
    new_total, 
    manual_adj, 
    calculated_hrs,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_hours = new_total,
    manual_adjustment_hours = manual_adj,
    calculated_hours = calculated_hrs,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- Function to recalculate all staff hours (called when schedule changes)
CREATE OR REPLACE FUNCTION public.recalculate_all_staff_hours()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Get all teachers and tutors
  FOR staff_record IN 
    SELECT DISTINCT user_id 
    FROM user_roles 
    WHERE role IN ('teacher', 'tutor')
  LOOP
    PERFORM update_staff_hours(staff_record.user_id, NULL, false);
  END LOOP;
END;
$$;

-- Trigger to update hours when schedule_events change
CREATE OR REPLACE FUNCTION public.trigger_recalculate_staff_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate for affected teacher
  IF TG_OP = 'DELETE' THEN
    IF OLD.teacher_id IS NOT NULL THEN
      PERFORM update_staff_hours(OLD.teacher_id, NULL, false);
    END IF;
    IF OLD.tutor_id IS NOT NULL THEN
      PERFORM update_staff_hours(OLD.tutor_id, NULL, false);
    END IF;
  ELSE
    IF NEW.teacher_id IS NOT NULL THEN
      PERFORM update_staff_hours(NEW.teacher_id, NULL, false);
    END IF;
    IF NEW.tutor_id IS NOT NULL THEN
      PERFORM update_staff_hours(NEW.tutor_id, NULL, false);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on schedule_events
DROP TRIGGER IF EXISTS update_staff_hours_on_schedule_change ON public.schedule_events;
CREATE TRIGGER update_staff_hours_on_schedule_change
  AFTER INSERT OR UPDATE OR DELETE ON public.schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_staff_hours();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_hours_user_id ON public.staff_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_hours_log_user_id ON public.staff_hours_log(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_teacher_id ON public.schedule_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_tutor_id ON public.schedule_events(tutor_id);