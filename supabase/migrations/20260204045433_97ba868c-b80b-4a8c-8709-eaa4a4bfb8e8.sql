-- Add columns for event details and attachments
ALTER TABLE public.schedule_events
ADD COLUMN details_info TEXT,
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT,
ADD COLUMN elective_option_1 TEXT,
ADD COLUMN elective_option_2 TEXT;

-- Comments
COMMENT ON COLUMN schedule_events.details_info IS 'Detailed information about the event (instructions, what to bring, etc.)';
COMMENT ON COLUMN schedule_events.attachment_url IS 'URL path to attached PDF in materials bucket';
COMMENT ON COLUMN schedule_events.attachment_name IS 'Display name of the attachment file';
COMMENT ON COLUMN schedule_events.elective_option_1 IS 'First elective option (e.g., Cultural - Cooking)';
COMMENT ON COLUMN schedule_events.elective_option_2 IS 'Second elective option (e.g., Grammar - Subjunctive)';

-- Create table for student elective selections
CREATE TABLE public.student_elective_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  selected_option INTEGER NOT NULL CHECK (selected_option IN (1, 2)),
  selected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, event_id, event_date)
);

-- Enable RLS
ALTER TABLE public.student_elective_selections ENABLE ROW LEVEL SECURITY;

-- Students can manage their own selections
CREATE POLICY "Students can view own selections"
  ON public.student_elective_selections
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own selections"
  ON public.student_elective_selections
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own selections"
  ON public.student_elective_selections
  FOR UPDATE USING (auth.uid() = student_id);

-- Staff can view all selections
CREATE POLICY "Staff can view all selections"
  ON public.student_elective_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coordinator', 'teacher', 'tutor')
    )
  );