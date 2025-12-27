-- Drop and recreate the view with SECURITY INVOKER to fix the security definer warning
DROP VIEW IF EXISTS public.staff_bookings_view;

CREATE VIEW public.staff_bookings_view
WITH (security_invoker = true)
AS
SELECT 
    id,
    student_id,
    teacher_id,
    tutor_id,
    booking_date,
    start_time,
    end_time,
    status,
    meeting_url,
    notes,
    created_at,
    updated_at,
    -- Staff can see their own earnings but not price breakdown
    CASE 
        WHEN teacher_id = auth.uid() OR tutor_id = auth.uid() THEN staff_earnings
        ELSE NULL
    END as staff_earnings,
    -- Only students and admins see full payment details
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN price
        ELSE NULL
    END as price,
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN platform_fee
        ELSE NULL
    END as platform_fee,
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN payment_status
        ELSE NULL
    END as payment_status,
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN paid_at
        ELSE NULL
    END as paid_at
FROM public.class_bookings;

-- Grant access to authenticated users (RLS on base table still applies)
GRANT SELECT ON public.staff_bookings_view TO authenticated;