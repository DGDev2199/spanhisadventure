-- 1. Add staff_type column to profiles for teachers/tutors
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS staff_type text DEFAULT 'presencial' CHECK (staff_type IN ('presencial', 'online'));

-- 2. Create post-media storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media', 
  'post-media', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/zip', 'application/x-rar-compressed'];

-- 3. Drop existing storage policies for post-media bucket
DROP POLICY IF EXISTS "Authenticated users can upload to post-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post-media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own post-media files" ON storage.objects;

-- 4. Create storage policies for post-media bucket
CREATE POLICY "Authenticated users can upload to post-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view post-media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Users can delete own post-media files"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Fix student Pauline Ale to be online (based on query results)
UPDATE public.student_profiles 
SET student_type = 'online' 
WHERE user_id = '0bc7da3c-d5f9-431d-9a09-dbf9e606f04f';

-- 6. Enable realtime for video_calls to track duration
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;