import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get a signed URL for chat files stored in the private chat-files bucket.
 * Returns a signed URL that expires after 1 hour.
 */
export function useChatFileUrl(fileUrl: string | null): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setSignedUrl(null);
      return;
    }

    // Check if this is a chat-files URL that needs signing
    const isChatFilesUrl = fileUrl.includes('/chat-files/');
    
    if (!isChatFilesUrl) {
      // Not a chat file, use the URL directly
      setSignedUrl(fileUrl);
      return;
    }

    // Extract the file path from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/chat-files/user-id/filename
    // We need to extract: user-id/filename
    const match = fileUrl.match(/\/chat-files\/(.+)$/);
    
    if (!match) {
      // Couldn't parse, return original
      setSignedUrl(fileUrl);
      return;
    }

    const filePath = match[1];

    // Create a signed URL
    const getSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('chat-files')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL for chat file:', error);
          setSignedUrl(null);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setSignedUrl(null);
      }
    };

    getSignedUrl();
  }, [fileUrl]);

  return signedUrl;
}

/**
 * Utility function to upload a file and get a signed URL back.
 * Use this when uploading new chat files.
 */
export async function uploadChatFile(
  file: File,
  userId: string
): Promise<{ signedUrl: string; filePath: string } | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-files')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading chat file:', uploadError);
    throw uploadError;
  }

  // Create a signed URL for the uploaded file
  const { data, error: signError } = await supabase.storage
    .from('chat-files')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (signError) {
    console.error('Error creating signed URL:', signError);
    throw signError;
  }

  return {
    signedUrl: data.signedUrl,
    filePath,
  };
}
