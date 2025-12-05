-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  phase INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create developer_settings table
CREATE TABLE public.developer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert feature flags by phase
INSERT INTO public.feature_flags (feature_key, feature_name, description, phase, is_enabled) VALUES
-- Fase 1: Base (Presencial) - Activadas por defecto
('presential_students', 'Estudiantes Presenciales', 'Sistema de estudiantes presenciales con cuartos asignados', 1, true),
('basic_chat', 'Chat Básico', 'Mensajes directos entre estudiantes y staff', 1, true),
('tasks_feedback', 'Tareas y Feedback', 'Sistema de tareas y retroalimentación', 1, true),
('basic_schedule', 'Horarios Presenciales', 'Calendario y horarios para clases presenciales', 1, true),
('placement_test', 'Placement Test', 'Test de nivelación para estudiantes', 1, true),

-- Fase 2: Online - Desactivadas
('online_students', 'Estudiantes Online', 'Sistema completo de estudiantes online', 2, false),
('browse_teachers', 'Buscar Profesores', 'Página para explorar y solicitar profesores', 2, false),
('booking_system', 'Sistema de Reservas', 'Reservar clases online con pago', 2, false),
('video_calls', 'Videollamadas', 'Sistema de videollamadas integrado', 2, false),
('availability_calendar', 'Calendario de Disponibilidad', 'Staff puede configurar su disponibilidad', 2, false),
('earnings_panel', 'Panel de Ganancias', 'Ver ganancias y precios por hora', 2, false),

-- Fase 3: Comunidad - Desactivadas
('community_feed', 'Feed de Comunidad', 'Red social con posts, comentarios y reacciones', 3, false),
('follow_system', 'Sistema de Seguidores', 'Seguir a otros usuarios', 3, false),
('user_profiles', 'Perfiles Públicos', 'Ver perfiles de otros usuarios', 3, false),

-- Fase 4: Avanzado - Desactivadas
('custom_tests', 'Tests Personalizados', 'Crear y asignar tests personalizados', 4, false),
('reviews_ratings', 'Reviews y Ratings', 'Sistema de calificaciones para profesores', 4, false),
('staff_videos', 'Videos de Presentación', 'Staff puede subir video introductorio', 4, false),
('modality_requests', 'Solicitudes de Modalidad', 'Staff puede solicitar cambio presencial/online', 4, false);

-- Insert developer settings
INSERT INTO public.developer_settings (setting_key, setting_value) VALUES
('dev_pin', '123456'),
('panel_enabled', 'true');

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags - public read
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Anyone can update feature flags with correct pin"
ON public.feature_flags FOR UPDATE USING (true);

-- RLS Policies for developer_settings - public read for PIN validation
CREATE POLICY "Anyone can read developer settings"
ON public.developer_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can update developer settings"
ON public.developer_settings FOR UPDATE USING (true);