-- 1) Create custom_tests table (if not exists)
CREATE TABLE IF NOT EXISTS public.custom_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER,
  test_type TEXT NOT NULL CHECK (test_type IN ('regular','final')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE public.custom_tests
    ADD CONSTRAINT custom_tests_teacher_fk
    FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable RLS
ALTER TABLE public.custom_tests ENABLE ROW LEVEL SECURITY;

-- Policies for custom_tests
DO $$ BEGIN
  CREATE POLICY "Admins can manage all custom tests" ON public.custom_tests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Teachers can manage their tests" ON public.custom_tests
  FOR ALL USING (public.has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_tests_teacher ON public.custom_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_custom_tests_created_at ON public.custom_tests(created_at);


-- 2) Create teacher_tutor_messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.teacher_tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT,
  test_id UUID,
  task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE public.teacher_tutor_messages
    ADD CONSTRAINT ttm_student_fk
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.teacher_tutor_messages
    ADD CONSTRAINT ttm_sender_fk
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.teacher_tutor_messages
    ADD CONSTRAINT ttm_test_fk
    FOREIGN KEY (test_id) REFERENCES public.custom_tests(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.teacher_tutor_messages
    ADD CONSTRAINT ttm_task_fk
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ttm_student_created ON public.teacher_tutor_messages(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ttm_sender ON public.teacher_tutor_messages(sender_id);

-- Enable RLS
ALTER TABLE public.teacher_tutor_messages ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_tutor_messages
DO $$ BEGIN
  CREATE POLICY "Admins can manage all chat messages" ON public.teacher_tutor_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Teachers/tutors can view messages for students assigned to them
DO $$ BEGIN
  CREATE POLICY "Participants can view messages" ON public.teacher_tutor_messages
  FOR SELECT USING (
    (
      public.has_role(auth.uid(), 'teacher'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.student_profiles sp
        WHERE sp.user_id = teacher_tutor_messages.student_id AND sp.teacher_id = auth.uid()
      )
    ) OR (
      public.has_role(auth.uid(), 'tutor'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.student_profiles sp
        WHERE sp.user_id = teacher_tutor_messages.student_id AND sp.tutor_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Teachers/tutors can insert messages for their assigned students (and must be the sender)
DO $$ BEGIN
  CREATE POLICY "Participants can send messages" ON public.teacher_tutor_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      (
        public.has_role(auth.uid(), 'teacher'::app_role) AND
        EXISTS (
          SELECT 1 FROM public.student_profiles sp
          WHERE sp.user_id = teacher_tutor_messages.student_id AND sp.teacher_id = auth.uid()
        )
      ) OR (
        public.has_role(auth.uid(), 'tutor'::app_role) AND
        EXISTS (
          SELECT 1 FROM public.student_profiles sp
          WHERE sp.user_id = teacher_tutor_messages.student_id AND sp.tutor_id = auth.uid()
        )
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sender can delete their own messages
DO $$ BEGIN
  CREATE POLICY "Sender can delete own messages" ON public.teacher_tutor_messages
  FOR DELETE USING (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Allow authenticated users to read teacher/tutor roles so dropdowns populate
DO $$ BEGIN
  CREATE POLICY "Authenticated can view teacher/tutor roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (role IN ('teacher'::app_role, 'tutor'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Enable realtime for chat messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_tutor_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;