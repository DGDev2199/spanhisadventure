-- Fix 1: Create secure function for students to get test questions without correct answers
CREATE OR REPLACE FUNCTION public.get_test_questions_for_student(p_test_id uuid)
RETURNS TABLE (
  id uuid,
  test_id uuid,
  question_type text,
  question_text text,
  options jsonb,
  points int,
  order_number int,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify student has assignment for this test
  IF NOT EXISTS (
    SELECT 1 FROM test_assignments 
    WHERE test_id = p_test_id 
      AND student_id = auth.uid()
      AND status IN ('assigned', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Access denied: No active assignment found';
  END IF;

  -- Return questions without correct_answer column
  RETURN QUERY
  SELECT 
    tq.id, 
    tq.test_id, 
    tq.question_type, 
    tq.question_text,
    tq.options, 
    tq.points, 
    tq.order_number, 
    tq.created_at
  FROM test_questions tq
  WHERE tq.test_id = p_test_id
  ORDER BY tq.order_number;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: Make storage bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'student-audio-responses';

-- Fix 3: Add RLS policies for storage bucket
-- Students can upload their own audio (folder structure: user_id/filename)
CREATE POLICY "Students can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-audio-responses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can read their own audio
CREATE POLICY "Students can read own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-audio-responses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can read all audio responses
CREATE POLICY "Teachers can read all audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-audio-responses' AND
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Admins can manage all audio
CREATE POLICY "Admins can manage all audio"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'student-audio-responses' AND
  has_role(auth.uid(), 'admin'::app_role)
);