-- ============================================================================
-- FUNCTION: update_placement_test_status
-- Purpose: Allow backend (Lovable) to update placement test fields safely
-- Context: Lovable does not provide auth.uid(), so RLS-based updates fail
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_placement_test_status(
  _student_user_id uuid,
  _status test_status,
  _written_score integer DEFAULT NULL,
  _oral_completed boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_profiles
  SET
    placement_test_status = _status,
    placement_test_written_score = COALESCE(
      _written_score,
      placement_test_written_score
    ),
    placement_test_oral_completed = COALESCE(
      _oral_completed,
      placement_test_oral_completed
    ),
    updated_at = now()
  WHERE user_id = _student_user_id;
END;
$$;

-- ============================================================================
-- OPTIONAL BUT RECOMMENDED: Prevent direct UPDATEs (force usage of function)
-- ============================================================================

REVOKE UPDATE ON public.student_profiles FROM anon, authenticated;
