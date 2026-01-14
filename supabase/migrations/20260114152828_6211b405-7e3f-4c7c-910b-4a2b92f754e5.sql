-- Fix SECURITY DEFINER views by recreating them with security_invoker = true
-- This ensures RLS policies of the querying user are enforced, not the view creator

-- 1. Recreate safe_profiles_view with security_invoker = true
DROP VIEW IF EXISTS public.safe_profiles_view;

CREATE VIEW public.safe_profiles_view
WITH (security_invoker = true)
AS
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
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN email
    ELSE NULL::text
  END AS email,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN age
    ELSE NULL::integer
  END AS age,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN nationality
    ELSE NULL::text
  END AS nationality,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN allergies
    ELSE NULL::text
  END AS allergies,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN diet
    ELSE NULL::text
  END AS diet,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN hourly_rate
    ELSE NULL::numeric
  END AS hourly_rate,
  CASE
    WHEN id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN currency
    ELSE NULL::text
  END AS currency,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN approved_by
    ELSE NULL::uuid
  END AS approved_by,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN approved_at
    ELSE NULL::timestamp with time zone
  END AS approved_at
FROM profiles;

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles_view TO authenticated;

-- 2. Recreate staff_bookings_view with security_invoker = true
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
  topic_id,
  CASE
    WHEN teacher_id = auth.uid() OR tutor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN staff_earnings
    ELSE NULL::numeric
  END AS staff_earnings,
  CASE
    WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN price
    ELSE NULL::numeric
  END AS price,
  CASE
    WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN platform_fee
    ELSE NULL::numeric
  END AS platform_fee,
  CASE
    WHEN student_id = auth.uid() OR teacher_id = auth.uid() OR tutor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN payment_status
    ELSE NULL::text
  END AS payment_status,
  CASE
    WHEN student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN paid_at
    ELSE NULL::timestamp with time zone
  END AS paid_at
FROM class_bookings;

-- Grant appropriate permissions
GRANT SELECT ON public.staff_bookings_view TO authenticated;

-- 3. Recreate user_rankings with security_invoker = true
DROP VIEW IF EXISTS public.user_rankings;

CREATE VIEW public.user_rankings
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  COALESCE(sum(up.points), 0::bigint)::integer AS total_points,
  count(DISTINCT ub.badge_id)::integer AS badge_count,
  rank() OVER (ORDER BY COALESCE(sum(up.points), 0::bigint) DESC)::integer AS rank
FROM profiles p
LEFT JOIN user_points up ON p.id = up.user_id
LEFT JOIN user_badges ub ON p.id = ub.user_id
JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'student'::app_role
GROUP BY p.id, p.full_name, p.avatar_url;

-- Grant appropriate permissions
GRANT SELECT ON public.user_rankings TO authenticated;