-- Create table for class bookings/reservations
CREATE TABLE public.class_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_or_tutor_required CHECK (teacher_id IS NOT NULL OR tutor_id IS NOT NULL)
);

-- Create table for direct messages between students and their assigned staff
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS for class_bookings
CREATE POLICY "Students can view their own bookings"
ON class_bookings FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can create bookings"
ON class_bookings FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own bookings"
ON class_bookings FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view bookings for them"
ON class_bookings FOR SELECT
USING (has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update bookings for them"
ON class_bookings FOR UPDATE
USING (has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Tutors can view bookings for them"
ON class_bookings FOR SELECT
USING (has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Tutors can update bookings for them"
ON class_bookings FOR UPDATE
USING (has_role(auth.uid(), 'tutor') AND tutor_id = auth.uid());

CREATE POLICY "Admins can manage all bookings"
ON class_bookings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for direct_messages
CREATE POLICY "Users can view their own messages"
ON direct_messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages to assigned staff or students"
ON direct_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    -- Student sending to their assigned teacher/tutor
    (has_role(auth.uid(), 'student') AND (
      EXISTS (SELECT 1 FROM student_profiles WHERE user_id = auth.uid() AND (teacher_id = receiver_id OR tutor_id = receiver_id))
    )) OR
    -- Teacher sending to their assigned students
    (has_role(auth.uid(), 'teacher') AND (
      EXISTS (SELECT 1 FROM student_profiles WHERE teacher_id = auth.uid() AND user_id = receiver_id)
    )) OR
    -- Tutor sending to their assigned students
    (has_role(auth.uid(), 'tutor') AND (
      EXISTS (SELECT 1 FROM student_profiles WHERE tutor_id = auth.uid() AND user_id = receiver_id)
    ))
  )
);

CREATE POLICY "Users can update read status of received messages"
ON direct_messages FOR UPDATE
USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own sent messages"
ON direct_messages FOR DELETE
USING (sender_id = auth.uid());

CREATE POLICY "Admins can manage all messages"
ON direct_messages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_bookings;

-- Create indexes
CREATE INDEX idx_class_bookings_student ON class_bookings(student_id);
CREATE INDEX idx_class_bookings_teacher ON class_bookings(teacher_id);
CREATE INDEX idx_class_bookings_tutor ON class_bookings(tutor_id);
CREATE INDEX idx_class_bookings_date ON class_bookings(booking_date);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created ON direct_messages(created_at DESC);