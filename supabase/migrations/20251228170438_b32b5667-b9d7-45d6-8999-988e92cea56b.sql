-- Tabla de badges/insignias
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  criteria_type text NOT NULL,
  criteria_value int NOT NULL,
  points_reward int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabla de badges obtenidos por usuarios
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Tabla de puntos (transacciones)
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Programa curricular (plantilla de semanas)
CREATE TABLE public.program_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number int NOT NULL UNIQUE,
  level text NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Temas de cada semana
CREATE TABLE public.week_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_number int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Material extra por tema
CREATE TABLE public.topic_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.week_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  material_type text NOT NULL,
  content_url text,
  content_text text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Progreso del estudiante por tema
CREATE TABLE public.student_topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.week_topics(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE(student_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (public read)
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_badges
CREATE POLICY "Users can view all badges earned" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_admin_or_coordinator_role(auth.uid()));

-- RLS Policies for user_points
CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id OR public.has_admin_or_coordinator_role(auth.uid()));
CREATE POLICY "System can insert points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_admin_or_coordinator_role(auth.uid()));

-- RLS Policies for program_weeks
CREATE POLICY "Program weeks viewable by authenticated" ON public.program_weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage program weeks" ON public.program_weeks FOR ALL USING (public.has_admin_or_coordinator_role(auth.uid()));

-- RLS Policies for week_topics
CREATE POLICY "Topics viewable by authenticated" ON public.week_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage topics" ON public.week_topics FOR ALL USING (public.has_admin_or_coordinator_role(auth.uid()));

-- RLS Policies for topic_materials
CREATE POLICY "Materials viewable by authenticated" ON public.topic_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage materials" ON public.topic_materials FOR ALL USING (public.has_admin_or_coordinator_role(auth.uid()));

-- RLS Policies for student_topic_progress
CREATE POLICY "Students can view own progress" ON public.student_topic_progress FOR SELECT USING (auth.uid() = student_id OR public.has_admin_or_coordinator_role(auth.uid()) OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'));
CREATE POLICY "Staff can update student progress" ON public.student_topic_progress FOR ALL USING (public.has_admin_or_coordinator_role(auth.uid()) OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'));
CREATE POLICY "Students can update own progress" ON public.student_topic_progress FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own progress" ON public.student_topic_progress FOR INSERT WITH CHECK (auth.uid() = student_id OR public.has_admin_or_coordinator_role(auth.uid()) OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'));

-- Vista de ranking
CREATE OR REPLACE VIEW public.user_rankings AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(up.points), 0)::int as total_points,
  COUNT(DISTINCT ub.badge_id)::int as badge_count,
  RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC)::int as rank
FROM public.profiles p
LEFT JOIN public.user_points up ON p.id = up.user_id
LEFT JOIN public.user_badges ub ON p.id = ub.user_id
JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'student'
GROUP BY p.id, p.full_name, p.avatar_url;

-- Badges iniciales
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value, points_reward) VALUES
('Primera Tarea', 'Completaste tu primera tarea', '✅', 'tasks_completed', 1, 10),
('Estudiante Aplicado', 'Completaste 10 tareas', '📚', 'tasks_completed', 10, 50),
('Primera Semana', 'Terminaste tu primera semana', '🎯', 'weeks_completed', 1, 25),
('Mes Completo', 'Completaste 4 semanas', '🌟', 'weeks_completed', 4, 100),
('Examen Perfecto', 'Sacaste 100% en un examen', '💯', 'test_perfect', 1, 50),
('Racha de 7 días', 'Entraste 7 días seguidos', '🔥', 'login_streak', 7, 30),
('Nivel A2', 'Alcanzaste el nivel A2', '🥉', 'level_reached', 2, 100),
('Nivel B1', 'Alcanzaste el nivel B1', '🥈', 'level_reached', 3, 150),
('Nivel B2', 'Alcanzaste el nivel B2', '🥇', 'level_reached', 4, 200);

-- Semanas del programa
INSERT INTO public.program_weeks (week_number, level, title, description) VALUES
(1, 'A1', 'Introducción y Presente', 'Verbos regulares en presente, saludos'),
(2, 'A1', 'La vida diaria', 'Verbos reflexivos, rutinas'),
(3, 'A2', 'El pasado reciente', 'Pretérito perfecto, participios'),
(4, 'A2', 'Contar historias', 'Pretérito indefinido'),
(5, 'B1', 'Expresar opiniones', 'Subjuntivo presente (introducción)'),
(6, 'B1', 'Hipótesis', 'Condicional, si clauses'),
(7, 'B2', 'Argumentar', 'Subjuntivo avanzado'),
(8, 'B2', 'El mundo laboral', 'Vocabulario profesional, formal'),
(9, 'C1', 'Matices del idioma', 'Modismos, expresiones coloquiales'),
(10, 'C1', 'Debate y discusión', 'Argumentación avanzada'),
(11, 'C2', 'Español literario', 'Textos literarios, análisis'),
(12, 'C2', 'Maestría', 'Perfeccionamiento, proyecto final');

-- Trigger para actualizar updated_at
CREATE TRIGGER update_program_weeks_updated_at
  BEFORE UPDATE ON public.program_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_topic_progress_updated_at
  BEFORE UPDATE ON public.student_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();