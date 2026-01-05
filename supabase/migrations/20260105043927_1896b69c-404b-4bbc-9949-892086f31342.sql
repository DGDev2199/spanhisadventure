-- Custom achievements created by admins/teachers
CREATE TABLE IF NOT EXISTS public.custom_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  points_reward INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  creator_role TEXT,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student achievements (awarded achievements)
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES custom_achievements(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(achievement_id, student_id)
);

-- Enable RLS
ALTER TABLE public.custom_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- RLS for custom_achievements
CREATE POLICY "Anyone can view achievements" ON public.custom_achievements
  FOR SELECT USING (true);

CREATE POLICY "Staff can create achievements" ON public.custom_achievements
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coordinator') OR 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Creators and admins can update achievements" ON public.custom_achievements
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    public.has_admin_or_coordinator_role(auth.uid())
  );

CREATE POLICY "Creators and admins can delete achievements" ON public.custom_achievements
  FOR DELETE USING (
    created_by = auth.uid() OR 
    public.has_admin_or_coordinator_role(auth.uid())
  );

-- RLS for student_achievements
CREATE POLICY "Anyone can view student achievements" ON public.student_achievements
  FOR SELECT USING (true);

CREATE POLICY "Staff can award achievements" ON public.student_achievements
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coordinator') OR 
    public.has_role(auth.uid(), 'teacher') OR
    public.has_role(auth.uid(), 'tutor')
  );

CREATE POLICY "Awarder and admins can delete student achievements" ON public.student_achievements
  FOR DELETE USING (
    awarded_by = auth.uid() OR 
    public.has_admin_or_coordinator_role(auth.uid())
  );

-- Create indexes
CREATE INDEX idx_custom_achievements_created_by ON public.custom_achievements(created_by);
CREATE INDEX idx_custom_achievements_is_global ON public.custom_achievements(is_global);
CREATE INDEX idx_student_achievements_student_id ON public.student_achievements(student_id);
CREATE INDEX idx_student_achievements_achievement_id ON public.student_achievements(achievement_id);