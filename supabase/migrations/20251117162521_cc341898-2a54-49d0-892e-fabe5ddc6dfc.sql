-- Add new fields to profiles table for role-based registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[], -- Array of languages
ADD COLUMN IF NOT EXISTS availability TEXT, -- For teachers/tutors
ADD COLUMN IF NOT EXISTS experience TEXT, -- For teachers/tutors
ADD COLUMN IF NOT EXISTS study_objectives TEXT; -- For students

-- Add comment to clarify the fields
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone for scheduling';
COMMENT ON COLUMN public.profiles.languages_spoken IS 'Languages the user speaks';
COMMENT ON COLUMN public.profiles.availability IS 'Availability schedule for teachers/tutors';
COMMENT ON COLUMN public.profiles.experience IS 'Teaching/tutoring experience for teachers/tutors';
COMMENT ON COLUMN public.profiles.study_objectives IS 'Learning objectives for students';