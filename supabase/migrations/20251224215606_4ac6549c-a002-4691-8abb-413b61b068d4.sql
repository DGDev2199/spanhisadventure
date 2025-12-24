-- Recreate the view with SECURITY INVOKER (default, safer)
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
  p.hourly_rate,
  p.currency,
  p.is_approved,
  ur.role
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE 
  p.is_approved = true 
  AND p.is_public_profile = true
  AND ur.role IN ('teacher', 'tutor');

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_staff_profiles TO authenticated;