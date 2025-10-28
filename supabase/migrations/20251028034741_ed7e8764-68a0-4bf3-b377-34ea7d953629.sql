-- Fix update_staff_hours function to handle NULL values properly
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
  -- Calculate hours from schedule - ensure never NULL
  calculated_hrs := COALESCE(calculate_staff_hours_from_schedule(staff_user_id), 0);
  
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
      -- Get existing manual adjustment or default to 0
      SELECT COALESCE(manual_adjustment_hours, 0) INTO manual_adj
      FROM staff_hours
      WHERE user_id = staff_user_id;
      
      -- If no record exists yet, default to 0
      IF manual_adj IS NULL THEN
        manual_adj := 0;
      END IF;
    END IF;
    
    -- Calculate new total, ensure never NULL
    new_total := COALESCE(calculated_hrs, 0) + COALESCE(manual_adj, 0);
  END IF;
  
  -- Insert or update staff_hours with guaranteed non-NULL values
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
    COALESCE(new_total, 0), 
    COALESCE(manual_adj, 0), 
    COALESCE(calculated_hrs, 0),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_hours = COALESCE(EXCLUDED.total_hours, 0),
    manual_adjustment_hours = COALESCE(EXCLUDED.manual_adjustment_hours, 0),
    calculated_hours = COALESCE(EXCLUDED.calculated_hours, 0),
    last_calculated_at = now(),
    updated_at = now();
END;
$$;