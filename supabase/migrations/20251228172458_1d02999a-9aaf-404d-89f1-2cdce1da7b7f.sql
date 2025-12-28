-- Allow coordinators to view all user roles
CREATE POLICY "Coordinators can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordinator'::app_role));

-- Allow coordinators to manage non-admin roles (insert, update, delete)
CREATE POLICY "Coordinators can manage non-admin roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'coordinator'::app_role) 
  AND role != 'admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'coordinator'::app_role) 
  AND role != 'admin'::app_role
);