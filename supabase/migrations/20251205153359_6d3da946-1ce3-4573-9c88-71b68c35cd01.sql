-- Add tariff fields to profiles for teachers/tutors
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add payment fields to class_bookings
ALTER TABLE class_bookings 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_earnings DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create platform_earnings table for tracking
CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES class_bookings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  staff_earnings DECIMAL(10,2) NOT NULL,
  staff_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on platform_earnings
ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;

-- Admin can manage all earnings
CREATE POLICY "Admins can manage all earnings"
ON platform_earnings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view their own earnings
CREATE POLICY "Staff can view their own earnings"
ON platform_earnings FOR SELECT
USING (staff_id = auth.uid());