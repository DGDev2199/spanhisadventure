-- Add foreign key names to allow proper joins in queries

-- Add foreign key constraint name for student_progress_weeks.completed_by
ALTER TABLE public.student_progress_weeks 
DROP CONSTRAINT IF EXISTS student_progress_weeks_completed_by_fkey;

ALTER TABLE public.student_progress_weeks
ADD CONSTRAINT student_progress_weeks_completed_by_fkey 
FOREIGN KEY (completed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key constraint name for student_progress_notes.created_by
ALTER TABLE public.student_progress_notes
DROP CONSTRAINT IF EXISTS student_progress_notes_created_by_fkey;

ALTER TABLE public.student_progress_notes
ADD CONSTRAINT student_progress_notes_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;