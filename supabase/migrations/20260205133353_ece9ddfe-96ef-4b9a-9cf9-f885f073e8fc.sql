
-- First, drop existing SELECT policies that might be too permissive
-- and recreate them with more restrictive access

-- Create a function to check if user can view another user's sensitive data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User viewing own profile
    _viewer_id = _profile_id
    -- Admin or coordinator
    OR has_admin_or_coordinator_role(_viewer_id)
$$;

-- Create a more secure view that ONLY exposes non-sensitive public fields
-- This view should be used by all public-facing queries (followers, social features, etc.)
DROP VIEW IF EXISTS public.public_profiles_minimal;

CREATE VIEW public.public_profiles_minimal 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  is_public_profile,
  show_followers,
  show_following
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles_minimal TO authenticated;
GRANT SELECT ON public.public_profiles_minimal TO anon;

-- Add comment explaining purpose
COMMENT ON VIEW public.public_profiles_minimal IS 'Minimal profile data for public display (followers, social features). Does NOT expose email, nationality, diet, allergies, or other sensitive fields.';
