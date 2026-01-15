-- Create practice_exercises table
CREATE TABLE public.practice_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('flashcard', 'conjugation', 'vocabulary')),
  topic_context TEXT,
  vocabulary_context TEXT,
  level TEXT DEFAULT 'A1',
  content JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create practice_assignments table
CREATE TABLE public.practice_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.practice_exercises(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create practice_attempts table
CREATE TABLE public.practice_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.practice_assignments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_exercises
CREATE POLICY "Staff can create exercises" ON public.practice_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'tutor', 'admin', 'coordinator'))
  );

CREATE POLICY "Staff can view all exercises" ON public.practice_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'tutor', 'admin', 'coordinator'))
  );

CREATE POLICY "Creators can update their exercises" ON public.practice_exercises
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their exercises" ON public.practice_exercises
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for practice_assignments
CREATE POLICY "Staff can create assignments" ON public.practice_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'tutor', 'admin', 'coordinator'))
  );

CREATE POLICY "Staff can view all assignments" ON public.practice_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'tutor', 'admin', 'coordinator'))
    OR student_id = auth.uid()
  );

CREATE POLICY "Students can update their own assignments" ON public.practice_assignments
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Assigners can delete assignments" ON public.practice_assignments
  FOR DELETE USING (assigned_by = auth.uid());

-- RLS Policies for practice_attempts
CREATE POLICY "Students can create their own attempts" ON public.practice_attempts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.practice_assignments WHERE id = assignment_id AND student_id = auth.uid())
  );

CREATE POLICY "Users can view relevant attempts" ON public.practice_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_assignments pa
      WHERE pa.id = assignment_id
      AND (pa.student_id = auth.uid() OR pa.assigned_by = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'coordinator'))
  );

-- Trigger for updated_at
CREATE TRIGGER update_practice_exercises_updated_at
  BEFORE UPDATE ON public.practice_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add feature flag
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled, phase)
VALUES ('practice_exercises', 'Ejercicios Prácticos', 'Sistema de ejercicios prácticos con IA (flashcards, conjugación, vocabulario)', false, 2)
ON CONFLICT (feature_key) DO NOTHING;

-- Create notification function for practice assignments
CREATE OR REPLACE FUNCTION public.notify_practice_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  exercise_title TEXT;
  assigner_name TEXT;
BEGIN
  SELECT title INTO exercise_title FROM practice_exercises WHERE id = NEW.exercise_id;
  SELECT full_name INTO assigner_name FROM profiles WHERE id = NEW.assigned_by;
  
  PERFORM create_notification(
    NEW.student_id,
    'Nuevo Ejercicio Asignado',
    COALESCE(assigner_name, 'Tu tutor') || ' te ha asignado: ' || COALESCE(exercise_title, 'Ejercicio de práctica'),
    'practice',
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_practice_assignment_trigger
  AFTER INSERT ON public.practice_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_practice_assignment();