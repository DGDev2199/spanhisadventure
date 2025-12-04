-- Create reviews table for teacher/tutor ratings
CREATE TABLE public.class_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.class_bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  staff_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate reviews
ALTER TABLE public.class_reviews ADD CONSTRAINT unique_booking_review UNIQUE (booking_id);

-- Enable RLS
ALTER TABLE public.class_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can create reviews for their completed bookings"
ON public.class_reviews FOR INSERT
WITH CHECK (
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM class_bookings 
    WHERE id = booking_id 
    AND student_id = auth.uid() 
    AND status = 'completed'
  )
);

CREATE POLICY "Students can view their own reviews"
ON public.class_reviews FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Staff can view reviews about them"
ON public.class_reviews FOR SELECT
USING (staff_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
ON public.class_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view all reviews"
ON public.class_reviews FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX idx_class_reviews_staff ON public.class_reviews(staff_id);
CREATE INDEX idx_class_reviews_student ON public.class_reviews(student_id);
CREATE INDEX idx_class_reviews_booking ON public.class_reviews(booking_id);