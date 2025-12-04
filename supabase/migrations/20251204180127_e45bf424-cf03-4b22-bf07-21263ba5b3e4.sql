-- FASE 1: Crear enum para modalidad de estudiante
CREATE TYPE student_modality AS ENUM ('presencial', 'online');

-- Agregar columna student_type a student_profiles
ALTER TABLE student_profiles 
ADD COLUMN student_type student_modality NOT NULL DEFAULT 'presencial';

-- FASE 2: Agregar campos de aprobación a profiles
ALTER TABLE profiles 
ADD COLUMN is_approved BOOLEAN DEFAULT false,
ADD COLUMN approved_by UUID,
ADD COLUMN approved_at TIMESTAMPTZ;

-- FASE 3: Política RLS para que usuarios autenticados vean perfiles básicos en el feed
CREATE POLICY "Authenticated users can view basic profiles for feed"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- FASE 4: Habilitar realtime para post_reactions (post_comments ya está)
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;

-- FASE 5: Crear tabla para solicitudes de clase (estudiantes online)
CREATE TABLE class_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  teacher_id UUID REFERENCES profiles(id),
  tutor_id UUID REFERENCES profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('teacher', 'tutor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT at_least_one_target CHECK (teacher_id IS NOT NULL OR tutor_id IS NOT NULL)
);

-- RLS para class_requests
ALTER TABLE class_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create their own requests"
ON class_requests FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own requests"
ON class_requests FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view requests for them"
ON class_requests FOR SELECT
USING (has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Tutors can view requests for them"
ON class_requests FOR SELECT
USING (has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Teachers can update requests for them"
ON class_requests FOR UPDATE
USING (has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Tutors can update requests for them"
ON class_requests FOR UPDATE
USING (has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Admins can manage all class requests"
ON class_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Índices para mejor rendimiento
CREATE INDEX idx_class_requests_student ON class_requests(student_id);
CREATE INDEX idx_class_requests_teacher ON class_requests(teacher_id);
CREATE INDEX idx_class_requests_tutor ON class_requests(tutor_id);
CREATE INDEX idx_class_requests_status ON class_requests(status);
CREATE INDEX idx_profiles_is_approved ON profiles(is_approved);