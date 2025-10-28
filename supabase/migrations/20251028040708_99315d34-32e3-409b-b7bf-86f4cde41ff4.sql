-- Update teacher_tutor_messages to support tasks and allow deletion
ALTER TABLE public.teacher_tutor_messages 
ADD COLUMN task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Update RLS policies to allow deletion
CREATE POLICY "Teachers can delete messages"
ON public.teacher_tutor_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

CREATE POLICY "Tutors can delete messages"
ON public.teacher_tutor_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

-- Enable realtime for teacher_tutor_messages
ALTER TABLE public.teacher_tutor_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_tutor_messages;