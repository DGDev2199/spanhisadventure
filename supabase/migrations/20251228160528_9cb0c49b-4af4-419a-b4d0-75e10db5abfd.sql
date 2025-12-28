-- Add missing foreign keys (skip if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extra_hours_created_by_fkey') THEN
    ALTER TABLE public.extra_hours
    ADD CONSTRAINT extra_hours_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extra_hours_approved_by_fkey') THEN
    ALTER TABLE public.extra_hours
    ADD CONSTRAINT extra_hours_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_extra_hours_user_id ON public.extra_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_hours_approved ON public.extra_hours(approved);
CREATE INDEX IF NOT EXISTS idx_extra_hours_created_at ON public.extra_hours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_hours_user_id ON public.staff_hours(user_id);