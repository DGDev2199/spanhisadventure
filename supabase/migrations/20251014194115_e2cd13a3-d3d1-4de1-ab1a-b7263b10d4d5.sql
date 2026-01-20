-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'tutor', 'student');

-- Create levels enum
CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Create status enum
CREATE TYPE public.student_status AS ENUM ('active', 'out_of_school');

-- Create placement test status enum
CREATE TYPE public.test_status AS ENUM ('not_started', 'pending', 'completed');

-- User roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  allergies TEXT,
  diet TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Student profiles table (additional student-specific data)
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  level cefr_level,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room TEXT,
  status student_status DEFAULT 'active' NOT NULL,
  placement_test_status test_status DEFAULT 'not_started' NOT NULL,
  placement_test_written_score INTEGER,
  placement_test_oral_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Tutor sessions table
CREATE TABLE public.tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;

-- Schedules table (weekly schedule uploads)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Placement tests table
CREATE TABLE public.placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  level cefr_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Student profiles policies
CREATE POLICY "Students can view their own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view their assigned students"
  ON public.student_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Tutors can view their assigned students"
  ON public.student_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Admins can manage all student profiles"
  ON public.student_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_placement_test_status(
  _student_user_id uuid,
  _status test_status,
  _written_score integer DEFAULT NULL,
  _oral_completed boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE student_profiles
  SET
    placement_test_status = _status,
    placement_test_written_score = COALESCE(_written_score, placement_test_written_score),
    placement_test_oral_completed = COALESCE(_oral_completed, placement_test_oral_completed),
    updated_at = now()
  WHERE user_id = _student_user_id;
END;
$$;


-- Tasks policies
CREATE POLICY "Students can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view tasks they created"
  ON public.tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update their tasks"
  ON public.tasks FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Feedback policies
CREATE POLICY "Students can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND author_id = auth.uid());

CREATE POLICY "Tutors can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'tutor') AND author_id = auth.uid());

CREATE POLICY "Admins can manage all feedback"
  ON public.feedback FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Tutor sessions policies
CREATE POLICY "Students can view their own sessions"
  ON public.tutor_sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Tutors can manage their sessions"
  ON public.tutor_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Admins can manage all sessions"
  ON public.tutor_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Schedules policies
CREATE POLICY "Active students can view active schedules"
  ON public.schedules FOR SELECT
  USING (
    active = true AND 
    public.has_role(auth.uid(), 'student') AND
    EXISTS (
      SELECT 1 FROM public.student_profiles 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Teachers can view schedules"
  ON public.schedules FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Tutors can view schedules"
  ON public.schedules FOR SELECT
  USING (public.has_role(auth.uid(), 'tutor'));

CREATE POLICY "Admins can manage schedules"
  ON public.schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Placement tests policies
CREATE POLICY "Students can view placement tests"
  ON public.placement_tests FOR SELECT
  USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Admins can manage placement tests"
  ON public.placement_tests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();