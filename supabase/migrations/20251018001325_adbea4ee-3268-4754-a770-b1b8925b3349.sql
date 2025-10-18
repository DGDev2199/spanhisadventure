-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that handles profile creation/update with UPSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update profile (prevents duplicate key errors)
  INSERT INTO public.profiles (id, full_name, email, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    now()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();

  -- Insert user role only if it doesn't exist (student by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Insert student profile only if it doesn't exist
  INSERT INTO public.student_profiles (user_id, status, placement_test_status)
  VALUES (NEW.id, 'active', 'not_started')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on student_profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.student_profiles 
    ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;