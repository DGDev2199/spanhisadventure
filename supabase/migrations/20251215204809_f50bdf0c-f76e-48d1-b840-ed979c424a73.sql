-- =============================================
-- FIX CRITICAL SECURITY ISSUES
-- =============================================

-- 1. Fix developer_settings RLS - restrict to admin only
DROP POLICY IF EXISTS "Anyone can read developer settings" ON developer_settings;
DROP POLICY IF EXISTS "Anyone can update developer settings" ON developer_settings;

CREATE POLICY "Only admins can manage developer settings"
ON developer_settings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Fix feature_flags RLS - allow read for authenticated, update only for admin
DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Anyone can update feature flags with correct pin" ON feature_flags;

CREATE POLICY "Authenticated users can read feature flags"
ON feature_flags FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update feature flags"
ON feature_flags FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert feature flags"
ON feature_flags FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete feature flags"
ON feature_flags FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. Fix notifications INSERT policy - use security definer function
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- The create_notification function already exists as SECURITY DEFINER
-- Just need to ensure only the function can insert (via triggers/RPC)
-- For now, restrict direct inserts to admins only as a safety measure
CREATE POLICY "Only admins can directly insert notifications"
ON notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));