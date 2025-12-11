-- Add columns to track who filled each field
ALTER TABLE student_progress_notes 
ADD COLUMN IF NOT EXISTS class_topics_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS tutoring_topics_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS vocabulary_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS achievements_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS challenges_by uuid REFERENCES profiles(id);

-- Create function to notify student when progress notes are added/updated
CREATE OR REPLACE FUNCTION public.notify_progress_note_update()
RETURNS TRIGGER AS $$
DECLARE
  week_record RECORD;
  staff_name TEXT;
  student_id_val UUID;
  has_new_content BOOLEAN := FALSE;
BEGIN
  -- Get the week record to find the student_id
  SELECT * INTO week_record FROM student_progress_weeks WHERE id = NEW.week_id;
  
  IF week_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  student_id_val := week_record.student_id;
  
  -- Get the staff name who made the update
  SELECT full_name INTO staff_name FROM profiles WHERE id = NEW.created_by;
  
  -- Check if there's any new content (comparing with old values for updates)
  IF TG_OP = 'INSERT' THEN
    has_new_content := (NEW.class_topics IS NOT NULL OR NEW.tutoring_topics IS NOT NULL OR 
                        NEW.vocabulary IS NOT NULL OR NEW.achievements IS NOT NULL OR 
                        NEW.challenges IS NOT NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    has_new_content := (
      (NEW.class_topics IS DISTINCT FROM OLD.class_topics) OR
      (NEW.tutoring_topics IS DISTINCT FROM OLD.tutoring_topics) OR
      (NEW.vocabulary IS DISTINCT FROM OLD.vocabulary) OR
      (NEW.achievements IS DISTINCT FROM OLD.achievements) OR
      (NEW.challenges IS DISTINCT FROM OLD.challenges)
    );
  END IF;
  
  -- Only notify if there's actual new content and the updater is not the student
  IF has_new_content AND NEW.created_by != student_id_val THEN
    PERFORM create_notification(
      student_id_val,
      'Notas de Progreso Actualizadas',
      COALESCE(staff_name, 'Tu profesor/tutor') || ' ha agregado notas de progreso para el día ' || 
      CASE NEW.day_type
        WHEN 'tuesday' THEN 'Martes'
        WHEN 'wednesday' THEN 'Miércoles'
        WHEN 'thursday' THEN 'Jueves'
        WHEN 'friday' THEN 'Viernes'
        ELSE NEW.day_type
      END,
      'progress',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for progress notes notifications
DROP TRIGGER IF EXISTS on_progress_note_update ON student_progress_notes;
CREATE TRIGGER on_progress_note_update
  AFTER INSERT OR UPDATE ON student_progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION notify_progress_note_update();