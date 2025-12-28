-- Allow coordinators to view all extra hours requests
CREATE POLICY "Coordinators can view all extra hours"
ON public.extra_hours
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role));

-- Allow coordinators to approve extra hours (UPDATE)
CREATE POLICY "Coordinators can approve extra hours"
ON public.extra_hours
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'coordinator'::app_role));

-- Allow coordinators to reject/delete extra hours (DELETE)
CREATE POLICY "Coordinators can delete extra hours"
ON public.extra_hours
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role));