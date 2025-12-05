-- Add privacy and bio fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_followers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_following BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Create user_follows table for follower system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can see follows involving them"
ON public.user_follows FOR SELECT USING (
  follower_id = auth.uid() OR following_id = auth.uid()
);

CREATE POLICY "Users can see public follows"
ON public.user_follows FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_follows.following_id 
    AND show_followers = true
  )
);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE USING (follower_id = auth.uid());

-- Create staff_modality_requests table
CREATE TABLE IF NOT EXISTS public.staff_modality_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_modality TEXT NOT NULL,
  requested_modality TEXT NOT NULL CHECK (requested_modality IN ('presencial', 'online', 'both')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on staff_modality_requests
ALTER TABLE public.staff_modality_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_modality_requests
CREATE POLICY "Staff can view their own modality requests"
ON public.staff_modality_requests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can create modality requests"
ON public.staff_modality_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and coordinators can view all modality requests"
ON public.staff_modality_requests FOR SELECT USING (
  public.has_admin_or_coordinator_role(auth.uid())
);

CREATE POLICY "Admins and coordinators can update modality requests"
ON public.staff_modality_requests FOR UPDATE USING (
  public.has_admin_or_coordinator_role(auth.uid())
);

-- Create notification trigger for new followers
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT full_name INTO follower_name FROM profiles WHERE id = NEW.follower_id;
  
  PERFORM create_notification(
    NEW.following_id,
    'Nuevo Seguidor',
    COALESCE(follower_name, 'Un usuario') || ' ha comenzado a seguirte',
    'follow',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new follower notification
DROP TRIGGER IF EXISTS on_new_follower ON public.user_follows;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Create notification trigger for modality request approval
CREATE OR REPLACE FUNCTION public.notify_modality_request_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Solicitud de Modalidad Aprobada',
      'Tu solicitud para cambiar a modalidad ' || NEW.requested_modality || ' ha sido aprobada',
      'modality',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Solicitud de Modalidad Rechazada',
      'Tu solicitud para cambiar a modalidad ' || NEW.requested_modality || ' ha sido rechazada',
      'modality',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for modality request status change
DROP TRIGGER IF EXISTS on_modality_request_update ON public.staff_modality_requests;
CREATE TRIGGER on_modality_request_update
  AFTER UPDATE ON public.staff_modality_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_modality_request_update();