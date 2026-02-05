-- Make chat-files bucket private to protect direct message attachments
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-files';