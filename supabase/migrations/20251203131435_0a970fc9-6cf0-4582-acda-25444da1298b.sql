-- Drop the existing constraint
ALTER TABLE public.student_progress_weeks DROP CONSTRAINT student_progress_weeks_week_number_check;

-- Add new constraint that allows both regular weeks (1-12) and special weeks (100+)
ALTER TABLE public.student_progress_weeks ADD CONSTRAINT student_progress_weeks_week_number_check 
CHECK (week_number >= 1);