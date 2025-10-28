-- Create custom_tests table for teacher-created tests
CREATE TABLE public.custom_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_questions table
CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.custom_tests(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'free_text')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_number INTEGER NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_assignments table
CREATE TABLE public.test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.custom_tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded')),
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  feedback TEXT,
  UNIQUE(test_id, student_id)
);

-- Create test_answers table
CREATE TABLE public.test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.test_assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.custom_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_tests
CREATE POLICY "Teachers can manage their own tests"
  ON public.custom_tests
  FOR ALL
  USING (has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage all tests"
  ON public.custom_tests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view tests assigned to them"
  ON public.custom_tests
  FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.test_assignments
      WHERE test_assignments.test_id = custom_tests.id
      AND test_assignments.student_id = auth.uid()
    )
  );

-- RLS Policies for test_questions
CREATE POLICY "Teachers can manage questions for their tests"
  ON public.test_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_tests
      WHERE custom_tests.id = test_questions.test_id
      AND custom_tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all questions"
  ON public.test_questions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view questions for assigned tests"
  ON public.test_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.test_assignments
      WHERE test_assignments.test_id = test_questions.test_id
      AND test_assignments.student_id = auth.uid()
    )
  );

-- RLS Policies for test_assignments
CREATE POLICY "Teachers can manage assignments for their tests"
  ON public.test_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_tests
      WHERE custom_tests.id = test_assignments.test_id
      AND custom_tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments"
  ON public.test_assignments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view and update their own assignments"
  ON public.test_assignments
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own assignment status"
  ON public.test_assignments
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for test_answers
CREATE POLICY "Students can manage their own answers"
  ON public.test_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.test_assignments
      WHERE test_assignments.id = test_answers.assignment_id
      AND test_assignments.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their tests"
  ON public.test_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.test_assignments ta
      JOIN public.custom_tests ct ON ct.id = ta.test_id
      WHERE ta.id = test_answers.assignment_id
      AND ct.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update grading for their tests"
  ON public.test_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.test_assignments ta
      JOIN public.custom_tests ct ON ct.id = ta.test_id
      WHERE ta.id = test_answers.assignment_id
      AND ct.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all answers"
  ON public.test_answers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for test attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-attachments', 'test-attachments', false);

-- Storage policies for test attachments
CREATE POLICY "Teachers can upload test attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'test-attachments' AND
    has_role(auth.uid(), 'teacher'::app_role) AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can view their own attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'test-attachments' AND
    (
      has_role(auth.uid(), 'teacher'::app_role) AND
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Students can view test attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'test-attachments' AND
    has_role(auth.uid(), 'student'::app_role)
  );

CREATE POLICY "Admins can manage all test attachments"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'test-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on custom_tests
CREATE TRIGGER update_custom_tests_updated_at
  BEFORE UPDATE ON public.custom_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();