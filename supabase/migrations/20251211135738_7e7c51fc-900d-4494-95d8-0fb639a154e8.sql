-- Add structured fields to student_progress_notes
ALTER TABLE public.student_progress_notes 
ADD COLUMN IF NOT EXISTS class_topics TEXT,
ADD COLUMN IF NOT EXISTS tutoring_topics TEXT,
ADD COLUMN IF NOT EXISTS vocabulary TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,
ADD COLUMN IF NOT EXISTS challenges TEXT;