-- Remove the problematic trigger that always creates presencial students
DROP TRIGGER IF EXISTS on_student_role_created ON user_roles;
DROP FUNCTION IF EXISTS public.handle_new_student_role();