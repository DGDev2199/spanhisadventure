-- Create table for teacher-tutor chat messages
CREATE TABLE public.teacher_tutor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  test_id UUID REFERENCES public.custom_tests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.teacher_tutor_messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Teachers can view messages for their students"
ON public.teacher_tutor_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

CREATE POLICY "Tutors can view messages for their students"
ON public.teacher_tutor_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

CREATE POLICY "Teachers can send messages for their students"
ON public.teacher_tutor_messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.teacher_id = auth.uid()
  ) AND
  sender_id = auth.uid()
);

CREATE POLICY "Tutors can send messages for their students"
ON public.teacher_tutor_messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tutor'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND student_profiles.tutor_id = auth.uid()
  ) AND
  sender_id = auth.uid()
);

CREATE POLICY "Teachers and tutors can mark messages as read"
ON public.teacher_tutor_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = teacher_tutor_messages.student_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- Create table for test templates
CREATE TABLE public.test_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'regular',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_templates ENABLE ROW LEVEL SECURITY;

-- Policies for test templates
CREATE POLICY "Users can view their own templates"
ON public.test_templates
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can view public templates"
ON public.test_templates
FOR SELECT
USING (is_public = true);

CREATE POLICY "Teachers can create templates"
ON public.test_templates
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND
  created_by = auth.uid()
);

CREATE POLICY "Teachers can update their own templates"
ON public.test_templates
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete their own templates"
ON public.test_templates
FOR DELETE
USING (created_by = auth.uid());

-- Create table for template questions
CREATE TABLE public.template_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.test_templates(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT,
  options JSONB,
  order_number INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_questions ENABLE ROW LEVEL SECURITY;

-- Policies for template questions
CREATE POLICY "Users can view questions for templates they can access"
ON public.template_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.test_templates
    WHERE test_templates.id = template_questions.template_id
    AND (test_templates.created_by = auth.uid() OR test_templates.is_public = true)
  )
);

CREATE POLICY "Teachers can manage questions for their templates"
ON public.template_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.test_templates
    WHERE test_templates.id = template_questions.template_id
    AND test_templates.created_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_teacher_tutor_messages_student ON public.teacher_tutor_messages(student_id);
CREATE INDEX idx_teacher_tutor_messages_sender ON public.teacher_tutor_messages(sender_id);
CREATE INDEX idx_teacher_tutor_messages_created ON public.teacher_tutor_messages(created_at);
CREATE INDEX idx_test_templates_created_by ON public.test_templates(created_by);
CREATE INDEX idx_template_questions_template ON public.template_questions(template_id);