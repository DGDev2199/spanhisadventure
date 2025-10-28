-- Add new fields to placement_tests for audio questions
ALTER TABLE public.placement_tests ADD COLUMN question_type TEXT NOT NULL DEFAULT 'text' CHECK (question_type IN ('text', 'audio_response', 'audio_listen'));
ALTER TABLE public.placement_tests ADD COLUMN audio_url TEXT;

-- Add comment to explain fields
COMMENT ON COLUMN public.placement_tests.question_type IS 'Type of question: text (multiple choice), audio_response (record answer), audio_listen (listen and write)';
COMMENT ON COLUMN public.placement_tests.audio_url IS 'URL to audio file for audio_listen type questions';

-- Create storage bucket for placement test audios
INSERT INTO storage.buckets (id, name, public)
VALUES ('placement-audios', 'placement-audios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for placement test audios
CREATE POLICY "Admins can upload placement audios"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'placement-audios' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view placement audios"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'placement-audios');

CREATE POLICY "Admins can delete placement audios"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'placement-audios' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for student audio responses
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-audio-responses', 'student-audio-responses', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student audio responses
CREATE POLICY "Students can upload their audio responses"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-audio-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Students can view their own audio responses"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-audio-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can view student audio responses"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-audio-responses' 
  AND has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Admins can view all student audio responses"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-audio-responses' 
  AND has_role(auth.uid(), 'admin'::app_role)
);