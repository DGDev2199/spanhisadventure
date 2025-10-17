-- Create rooms table for managing available rooms
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Admins can manage all rooms
CREATE POLICY "Admins can manage all rooms"
ON public.rooms
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view rooms
CREATE POLICY "Teachers can view rooms"
ON public.rooms
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) AND active = true);

-- Students can view rooms
CREATE POLICY "Students can view rooms"
ON public.rooms
FOR SELECT
USING (has_role(auth.uid(), 'student'::app_role) AND active = true);

-- Tutors can view rooms
CREATE POLICY "Tutors can view rooms"
ON public.rooms
FOR SELECT
USING (has_role(auth.uid(), 'tutor'::app_role) AND active = true);

-- Trigger for updated_at
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();