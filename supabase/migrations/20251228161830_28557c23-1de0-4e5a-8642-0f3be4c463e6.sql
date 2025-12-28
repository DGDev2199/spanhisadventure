-- Eliminar los foreign keys existentes (apuntan a auth.users)
ALTER TABLE public.extra_hours DROP CONSTRAINT IF EXISTS extra_hours_user_id_fkey;
ALTER TABLE public.extra_hours DROP CONSTRAINT IF EXISTS extra_hours_created_by_fkey;
ALTER TABLE public.extra_hours DROP CONSTRAINT IF EXISTS extra_hours_approved_by_fkey;

-- Crear foreign keys hacia profiles
ALTER TABLE public.extra_hours
ADD CONSTRAINT extra_hours_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.extra_hours
ADD CONSTRAINT extra_hours_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.extra_hours
ADD CONSTRAINT extra_hours_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;