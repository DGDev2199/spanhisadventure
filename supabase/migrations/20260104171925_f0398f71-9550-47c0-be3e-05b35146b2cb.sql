-- Tabla para exámenes de reevaluación vinculados a temas específicos
CREATE TABLE IF NOT EXISTS public.topic_reevaluation_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES week_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Preguntas del examen de reevaluación
CREATE TABLE IF NOT EXISTS public.topic_reevaluation_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES topic_reevaluation_tests(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intentos del estudiante en el examen
CREATE TABLE IF NOT EXISTS public.topic_reevaluation_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES topic_reevaluation_tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER,
  answers JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  result_color TEXT
);

-- RLS Policies
ALTER TABLE topic_reevaluation_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_reevaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_reevaluation_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas para tests - Lectura para autenticados
CREATE POLICY "Anyone can view reevaluation tests" 
ON topic_reevaluation_tests FOR SELECT TO authenticated USING (true);

-- Políticas para tests - Gestión para admin/coordinator
CREATE POLICY "Admin and coordinators can insert reevaluation tests"
ON topic_reevaluation_tests FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Admin and coordinators can update reevaluation tests"
ON topic_reevaluation_tests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Admin and coordinators can delete reevaluation tests"
ON topic_reevaluation_tests FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

-- Políticas para preguntas - Lectura para autenticados
CREATE POLICY "Anyone can view reevaluation questions"
ON topic_reevaluation_questions FOR SELECT TO authenticated USING (true);

-- Políticas para preguntas - Gestión para admin/coordinator
CREATE POLICY "Admin and coordinators can insert reevaluation questions"
ON topic_reevaluation_questions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Admin and coordinators can update reevaluation questions"
ON topic_reevaluation_questions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Admin and coordinators can delete reevaluation questions"
ON topic_reevaluation_questions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator')
  )
);

-- Políticas para intentos - Estudiantes pueden ver y crear sus propios intentos
CREATE POLICY "Students can view own attempts"
ON topic_reevaluation_attempts FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own attempts"
ON topic_reevaluation_attempts FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attempts"
ON topic_reevaluation_attempts FOR UPDATE TO authenticated
USING (student_id = auth.uid());

-- Staff puede ver todos los intentos
CREATE POLICY "Staff can view all attempts"
ON topic_reevaluation_attempts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'coordinator', 'teacher', 'tutor')
  )
);