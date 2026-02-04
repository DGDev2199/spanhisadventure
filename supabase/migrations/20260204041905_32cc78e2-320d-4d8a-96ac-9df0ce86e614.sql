-- 1. Permitir a coordinadores UPDATE en profiles (para aprobar usuarios)
CREATE POLICY "Coordinators can update profiles for approval"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));

-- 2. Permitir a coordinadores gestionar student_progress_weeks
CREATE POLICY "Coordinators can manage all progress weeks"
ON public.student_progress_weeks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));

-- 3. Permitir a coordinadores gestionar student_progress_notes
CREATE POLICY "Coordinators can manage all progress notes"
ON public.student_progress_notes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'coordinator'))
WITH CHECK (has_role(auth.uid(), 'coordinator'));