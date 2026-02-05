
-- Fix public_staff_profiles to NOT expose hourly_rate/currency (financial data)
-- Staff can choose to display their rate publicly but it should be opt-in

DROP VIEW IF EXISTS public.public_staff_profiles;

CREATE VIEW public.public_staff_profiles
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.availability,
  p.experience,
  p.languages_spoken,
  p.timezone,
  p.staff_type,
  p.is_approved,
  p.is_public_profile,
  ur.role,
  -- Only show hourly_rate if the staff member has a public profile AND is viewing own or admin/coordinator
  CASE
    WHEN p.id = auth.uid() 
      OR has_admin_or_coordinator_role(auth.uid())
    THEN p.hourly_rate
    ELSE NULL
  END AS hourly_rate,
  CASE
    WHEN p.id = auth.uid() 
      OR has_admin_or_coordinator_role(auth.uid())
    THEN p.currency
    ELSE NULL
  END AS currency
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE p.is_approved = true 
  AND p.is_public_profile = true 
  AND ur.role IN ('teacher', 'tutor');

-- Update safe_profiles_view to include coordinator access to sensitive fields
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
  -- Sensitive fields: only visible to self, admin, or coordinator
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN email
    ELSE NULL
  END AS email,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN age
    ELSE NULL
  END AS age,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN nationality
    ELSE NULL
  END AS nationality,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN allergies
    ELSE NULL
  END AS allergies,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN diet
    ELSE NULL
  END AS diet,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN hourly_rate
    ELSE NULL
  END AS hourly_rate,
  CASE
    WHEN id = auth.uid() OR has_admin_or_coordinator_role(auth.uid()) 
    THEN currency
    ELSE NULL
  END AS currency,
  -- Admin-only fields
  CASE
    WHEN has_admin_or_coordinator_role(auth.uid()) 
    THEN approved_by
    ELSE NULL
  END AS approved_by,
  CASE
    WHEN has_admin_or_coordinator_role(auth.uid()) 
    THEN approved_at
    ELSE NULL
  END AS approved_at
FROM profiles;

-- Ensure public_profiles_minimal only has truly public, non-sensitive fields
DROP VIEW IF EXISTS public.public_profiles_minimal;

CREATE VIEW public.public_profiles_minimal
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  -- Only show bio if profile is public
  CASE 
    WHEN is_public_profile = true THEN bio
    ELSE NULL
  END AS bio,
  is_public_profile,
  show_followers,
  show_following
FROM profiles;

-- Grant appropriate access
GRANT SELECT ON public.public_staff_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles_view TO authenticated;
GRANT SELECT ON public.public_profiles_minimal TO authenticated;
GRANT SELECT ON public.public_profiles_minimal TO anon;

-- Add comments
COMMENT ON VIEW public.public_staff_profiles IS 'Public teacher/tutor profiles for browsing. Financial data (hourly_rate) only visible to self or admin/coordinator.';
COMMENT ON VIEW public.safe_profiles_view IS 'Profile view with field-level security. Sensitive data (email, nationality, diet, allergies) only visible to self, admin, or coordinator.';
COMMENT ON VIEW public.public_profiles_minimal IS 'Minimal profile data for social features. No sensitive fields exposed.';
