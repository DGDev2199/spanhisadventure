-- Add gamification feature flag
INSERT INTO feature_flags (feature_key, feature_name, description, is_enabled, phase)
VALUES ('gamification', 'Sistema de Gamificación', 'Puntos, insignias, ranking y progreso semanal', true, 1)
ON CONFLICT (feature_key) DO NOTHING;

-- Add topic_id column to schedule_events for topic-based class scheduling
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES week_topics(id) ON DELETE SET NULL;

-- Add topic_id column to class_bookings for online topic-based bookings
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES week_topics(id) ON DELETE SET NULL;