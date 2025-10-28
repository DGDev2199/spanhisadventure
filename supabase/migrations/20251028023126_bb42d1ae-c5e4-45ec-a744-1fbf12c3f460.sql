-- Create schedule_events table for weekly calendar
CREATE TABLE public.schedule_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'tutoring', 'activity', 'exam', 'break')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level TEXT, -- CEFR level this event is for (e.g., 'A1', 'A2')
  color TEXT DEFAULT '#3b82f6', -- Hex color for calendar display
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_schedule_events_day ON public.schedule_events(day_of_week);
CREATE INDEX idx_schedule_events_teacher ON public.schedule_events(teacher_id);
CREATE INDEX idx_schedule_events_tutor ON public.schedule_events(tutor_id);
CREATE INDEX idx_schedule_events_level ON public.schedule_events(level);
CREATE INDEX idx_schedule_events_active ON public.schedule_events(is_active);

-- Enable RLS
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_events
CREATE POLICY "Admins can manage all schedule events"
  ON public.schedule_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their schedule events"
  ON public.schedule_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher'::app_role) AND
    (teacher_id = auth.uid() OR teacher_id IS NULL) AND
    is_active = true
  );

CREATE POLICY "Tutors can view their schedule events"
  ON public.schedule_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'tutor'::app_role) AND
    (tutor_id = auth.uid() OR tutor_id IS NULL) AND
    is_active = true
  );

CREATE POLICY "Students can view events for their level"
  ON public.schedule_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role) AND
    is_active = true AND
    (
      level IS NULL OR
      EXISTS (
        SELECT 1
        FROM public.student_profiles sp
        WHERE sp.user_id = auth.uid()
        AND sp.level::text = schedule_events.level
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_schedule_events_updated_at
  BEFORE UPDATE ON public.schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for schedule_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_events;