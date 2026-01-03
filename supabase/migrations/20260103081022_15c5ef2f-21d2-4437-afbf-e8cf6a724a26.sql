-- Agregar campo color para que el profesor califique visualmente cada tema
ALTER TABLE student_topic_progress 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- Comentario: Los colores serán: 'green' (dominado), 'yellow' (necesita práctica), 
-- 'red' (dificultad), 'blue' (en progreso), null (no evaluado)