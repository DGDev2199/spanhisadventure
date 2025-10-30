-- Create student_progress_weeks table
CREATE TABLE IF NOT EXISTS public.student_progress_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  week_theme TEXT NOT NULL DEFAULT '',
  week_objectives TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, week_number)
);

-- Create student_progress_notes table
CREATE TABLE IF NOT EXISTS public.student_progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.student_progress_weeks(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL CHECK (day_type IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'strengths', 'weaknesses')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_id, day_type)
);

-- Enable RLS
ALTER TABLE public.student_progress_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_progress_weeks

-- Students can view their own progress
CREATE POLICY "Students can view their own progress"
ON public.student_progress_weeks
FOR SELECT
USING (auth.uid() = student_id);

-- Teachers can view their students' progress
CREATE POLICY "Teachers can view their students progress"
ON public.student_progress_weeks
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

-- Tutors can view their students' progress
CREATE POLICY "Tutors can view their students progress"
ON public.student_progress_weeks
FOR SELECT
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

-- Admins can manage all progress
CREATE POLICY "Admins can manage all progress"
ON public.student_progress_weeks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can create and update their students' progress
CREATE POLICY "Teachers can manage their students progress"
ON public.student_progress_weeks
FOR ALL
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

-- Tutors can update their students' progress
CREATE POLICY "Tutors can update their students progress"
ON public.student_progress_weeks
FOR UPDATE
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

-- RLS Policies for student_progress_notes

-- Students can view their own notes
CREATE POLICY "Students can view their own notes"
ON public.student_progress_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_progress_weeks
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND student_progress_weeks.student_id = auth.uid()
  )
);

-- Teachers can view their students' notes
CREATE POLICY "Teachers can view their students notes"
ON public.student_progress_notes
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

-- Tutors can view their students' notes
CREATE POLICY "Tutors can view their students notes"
ON public.student_progress_notes
FOR SELECT
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

-- Admins can manage all notes
CREATE POLICY "Admins can manage all notes"
ON public.student_progress_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can manage their students' notes
CREATE POLICY "Teachers can manage their students notes"
ON public.student_progress_notes
FOR ALL
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND student_profiles.teacher_id = auth.uid()
  )
);

-- Tutors can manage their students' notes
CREATE POLICY "Tutors can manage their students notes"
ON public.student_progress_notes
FOR ALL
USING (
  has_role(auth.uid(), 'tutor'::app_role) AND
  EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND student_profiles.tutor_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_student_progress_weeks_updated_at
BEFORE UPDATE ON public.student_progress_weeks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_notes_updated_at
BEFORE UPDATE ON public.student_progress_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();