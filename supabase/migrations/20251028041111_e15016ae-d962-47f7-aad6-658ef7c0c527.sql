-- Fix foreign keys to point to profiles table instead of auth.users
ALTER TABLE public.teacher_tutor_messages
DROP CONSTRAINT IF EXISTS teacher_tutor_messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS teacher_tutor_messages_student_id_fkey;

-- Add correct foreign keys pointing to profiles
ALTER TABLE public.teacher_tutor_messages
ADD CONSTRAINT teacher_tutor_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_tutor_messages
ADD CONSTRAINT teacher_tutor_messages_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;