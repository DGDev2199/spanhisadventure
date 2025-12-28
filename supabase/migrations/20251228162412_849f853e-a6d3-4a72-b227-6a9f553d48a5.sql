-- Agregar columna attachment_url a la tabla tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_url text;

-- Dropear foreign keys existentes que apuntan a auth.users
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_student_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_teacher_id_fkey;

-- Recrear foreign keys apuntando a public.profiles
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;