-- Add explicit foreign keys to teacher_tutor_messages
ALTER TABLE public.teacher_tutor_messages
DROP CONSTRAINT IF EXISTS teacher_tutor_messages_sender_id_fkey;

ALTER TABLE public.teacher_tutor_messages
ADD CONSTRAINT teacher_tutor_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for student_id if not exists
ALTER TABLE public.teacher_tutor_messages
DROP CONSTRAINT IF EXISTS teacher_tutor_messages_student_id_fkey;

ALTER TABLE public.teacher_tutor_messages
ADD CONSTRAINT teacher_tutor_messages_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;