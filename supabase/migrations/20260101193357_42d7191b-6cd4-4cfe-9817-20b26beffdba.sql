-- Add status and review fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS score integer;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS student_notes text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS teacher_feedback text;

-- Add constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_status_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
      CHECK (status IN ('pending', 'submitted', 'reviewed'));
  END IF;
END $$;

-- Add is_teacher_guide to topic_materials
ALTER TABLE topic_materials ADD COLUMN IF NOT EXISTS is_teacher_guide boolean DEFAULT false;

-- Update existing completed tasks to 'reviewed' status
UPDATE tasks SET status = 'reviewed', score = 5 WHERE completed = true AND status IS NULL;