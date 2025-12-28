-- Update safe_profiles_view to restrict sensitive data ONLY to profile owner and admins
DROP VIEW IF EXISTS safe_profiles_view;

CREATE VIEW safe_profiles_view AS
SELECT 
    id,
    full_name,
    avatar_url,
    bio,
    timezone,
    languages_spoken,
    availability,
    experience,
    study_objectives,
    staff_type,
    is_approved,
    is_public_profile,
    show_followers,
    show_following,
    social_links,
    created_at,
    updated_at,
    -- Email: ONLY owner and admins
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN email 
        ELSE NULL 
    END AS email,
    -- Sensitive data: ONLY owner and admins
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN age 
        ELSE NULL 
    END AS age,
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN nationality 
        ELSE NULL 
    END AS nationality,
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN allergies 
        ELSE NULL 
    END AS allergies,
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN diet 
        ELSE NULL 
    END AS diet,
    -- Financial data: owner and admins
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN hourly_rate 
        ELSE NULL 
    END AS hourly_rate,
    CASE 
        WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN currency 
        ELSE NULL 
    END AS currency,
    -- Admin-only data
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) 
        THEN approved_by 
        ELSE NULL 
    END AS approved_by,
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) 
        THEN approved_at 
        ELSE NULL 
    END AS approved_at
FROM profiles;

-- Update staff_bookings_view to allow staff_earnings visible to involved staff OR admins
DROP VIEW IF EXISTS staff_bookings_view;

CREATE VIEW staff_bookings_view AS
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
    -- Staff earnings: visible to involved staff OR admins
    CASE 
        WHEN teacher_id = auth.uid() OR tutor_id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN staff_earnings 
        ELSE NULL 
    END AS staff_earnings,
    -- Financial data: only student involved or admin
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN price 
        ELSE NULL 
    END AS price,
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN platform_fee 
        ELSE NULL 
    END AS platform_fee,
    -- Payment status: visible to all involved parties
    CASE 
        WHEN student_id = auth.uid() OR teacher_id = auth.uid() 
             OR tutor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN payment_status 
        ELSE NULL 
    END AS payment_status,
    CASE 
        WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) 
        THEN paid_at 
        ELSE NULL 
    END AS paid_at
FROM class_bookings;