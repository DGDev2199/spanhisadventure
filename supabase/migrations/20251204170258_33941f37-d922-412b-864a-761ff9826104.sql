-- Crear función helper para verificar admin o coordinador
CREATE OR REPLACE FUNCTION public.has_admin_or_coordinator_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'coordinator')
  )
$$;