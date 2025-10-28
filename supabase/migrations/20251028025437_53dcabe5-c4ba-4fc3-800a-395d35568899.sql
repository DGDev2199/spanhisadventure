-- Add attachment_url column to tasks table
ALTER TABLE public.tasks ADD COLUMN attachment_url TEXT;

-- Create storage bucket for task attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for task attachments
CREATE POLICY "Teachers can upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' 
  AND has_role(auth.uid(), 'teacher'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can view their task attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND has_role(auth.uid(), 'teacher'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Students can view task attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND has_role(auth.uid(), 'student'::app_role)
);

CREATE POLICY "Teachers can delete their task attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND has_role(auth.uid(), 'teacher'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);