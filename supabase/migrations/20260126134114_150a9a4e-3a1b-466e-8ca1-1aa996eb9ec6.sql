-- Add is_alumni column to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS alumni_since TIMESTAMP WITH TIME ZONE;

-- Create daily_exercise_packs table for alumni daily exercises
CREATE TABLE IF NOT EXISTS public.daily_exercise_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exercises_data JSONB NOT NULL,
  analysis_summary TEXT,
  completed_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  expires_at DATE NOT NULL,
  streak_count INTEGER DEFAULT 0,
  UNIQUE(student_id, expires_at)
);

-- Enable RLS
ALTER TABLE public.daily_exercise_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_exercise_packs
-- Students can view their own packs
CREATE POLICY "Students can view own exercise packs" 
ON public.daily_exercise_packs FOR SELECT 
USING (student_id = auth.uid());

-- Students can update their own packs (for progress tracking)
CREATE POLICY "Students can update own exercise packs" 
ON public.daily_exercise_packs FOR UPDATE 
USING (student_id = auth.uid());

-- Allow inserts (edge function will insert via service role, but also allow students to trigger generation)
CREATE POLICY "Allow insert exercise packs" 
ON public.daily_exercise_packs FOR INSERT 
WITH CHECK (student_id = auth.uid());

-- Staff can view all exercise packs
CREATE POLICY "Staff can view all exercise packs" 
ON public.daily_exercise_packs FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinator') OR 
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'tutor')
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_exercise_packs_student_expires 
ON public.daily_exercise_packs(student_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_exercise_packs_student_completed 
ON public.daily_exercise_packs(student_id, is_completed);

-- Update RLS for student_profiles to allow staff to update is_alumni
-- Teachers can update is_alumni for their students
CREATE POLICY "Teachers can update student alumni status" 
ON public.student_profiles FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid()
);