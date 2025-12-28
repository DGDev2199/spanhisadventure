-- Add file columns to direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type TEXT;

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true);

-- Policy: Authenticated users can upload chat files
CREATE POLICY "Users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

-- Policy: Anyone can view chat files (since bucket is public)
CREATE POLICY "Users can view chat files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);