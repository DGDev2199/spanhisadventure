-- Create video_calls table to track call history
CREATE TABLE public.video_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  student_id UUID NOT NULL,
  room_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

-- Teachers can view and insert their own calls
CREATE POLICY "Teachers can view their calls"
ON public.video_calls
FOR SELECT
USING (has_role(auth.uid(), 'teacher') AND caller_id = auth.uid());

CREATE POLICY "Teachers can insert their calls"
ON public.video_calls
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher') AND caller_id = auth.uid());

CREATE POLICY "Teachers can update their calls"
ON public.video_calls
FOR UPDATE
USING (has_role(auth.uid(), 'teacher') AND caller_id = auth.uid());

-- Tutors can view and insert their own calls
CREATE POLICY "Tutors can view their calls"
ON public.video_calls
FOR SELECT
USING (has_role(auth.uid(), 'tutor') AND caller_id = auth.uid());

CREATE POLICY "Tutors can insert their calls"
ON public.video_calls
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tutor') AND caller_id = auth.uid());

CREATE POLICY "Tutors can update their calls"
ON public.video_calls
FOR UPDATE
USING (has_role(auth.uid(), 'tutor') AND caller_id = auth.uid());

-- Admin and Coordinator can view all calls
CREATE POLICY "Admins can manage all calls"
ON public.video_calls
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Coordinators can view all calls"
ON public.video_calls
FOR SELECT
USING (has_role(auth.uid(), 'coordinator'));

-- Add indexes for better performance
CREATE INDEX idx_video_calls_caller_id ON public.video_calls(caller_id);
CREATE INDEX idx_video_calls_student_id ON public.video_calls(student_id);
CREATE INDEX idx_video_calls_started_at ON public.video_calls(started_at DESC);