-- ============================================
-- FIX: Recreate correct foreign key between student_profiles and profiles
-- ============================================

-- 1️⃣ Asegurarse de que la columna user_id sea del tipo correcto
ALTER TABLE public.student_profiles
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 2️⃣ Eliminar constraint vieja si aún existe
ALTER TABLE public.student_profiles
DROP CONSTRAINT IF EXISTS student_profiles_user_id_profiles_fkey;

-- 3️⃣ Crear de nuevo la relación correcta
ALTER TABLE public.student_profiles
ADD CONSTRAINT student_profiles_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles (id)
ON DELETE CASCADE;

-- 4️⃣ Verificar que profiles.id sea UUID (por seguridad)
ALTER TABLE public.profiles
ALTER COLUMN id TYPE uuid USING id::uuid;
