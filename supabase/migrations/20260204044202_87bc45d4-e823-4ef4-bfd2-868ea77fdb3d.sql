-- Agregar columnas para segundo profesor y segundo tutor
ALTER TABLE public.schedule_events 
ADD COLUMN IF NOT EXISTS teacher_id_2 UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS tutor_id_2 UUID REFERENCES profiles(id);

-- Comentarios descriptivos
COMMENT ON COLUMN schedule_events.teacher_id_2 IS 'Optional second teacher assigned to the event';
COMMENT ON COLUMN schedule_events.tutor_id_2 IS 'Optional second tutor assigned to the event';