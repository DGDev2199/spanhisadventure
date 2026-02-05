import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';

interface ChatFileAttachmentProps {
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  isSender: boolean;
}

/**
 * Component to display chat file attachments with signed URLs.
 * Handles the private chat-files bucket by generating signed URLs on demand.
 */
export function ChatFileAttachment({ fileUrl, fileName, fileType, isSender }: ChatFileAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false);
      return;
    }

    const getSignedUrl = async () => {
      try {
        let filePath: string | null = null;

        // Check if this is our new format: chat-files://path
        if (fileUrl.startsWith('chat-files://')) {
          filePath = fileUrl.replace('chat-files://', '');
        } 
        // Check if this is an old public URL format
        else if (fileUrl.includes('/chat-files/')) {
          const match = fileUrl.match(/\/chat-files\/(.+)$/);
          if (match) {
            filePath = match[1];
          }
        }

        if (!filePath) {
          // Unknown format, try using URL directly (might be from another bucket)
          setSignedUrl(fileUrl);
          setLoading(false);
          return;
        }

        // Create a signed URL (1 hour expiry)
        const { data, error } = await supabase.storage
          .from('chat-files')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setSignedUrl(null);
      }
      setLoading(false);
    };

    getSignedUrl();
  }, [fileUrl]);

  if (!fileUrl || loading) {
    return null;
  }

  if (!signedUrl) {
    return (
      <div className={`p-2 rounded-md text-sm ${isSender ? 'bg-primary-foreground/20' : 'bg-background'}`}>
        <span className="text-muted-foreground">Archivo no disponible</span>
      </div>
    );
  }

  const isImage = fileType?.startsWith('image/');

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={signedUrl} 
          alt={fileName || 'Imagen adjunta'} 
          className="max-w-full max-h-48 rounded-md object-cover"
        />
      </a>
    );
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex items-center gap-2 p-2 rounded-md ${
        isSender ? 'bg-primary-foreground/20' : 'bg-background'
      }`}
    >
      <FileText className="h-4 w-4" />
      <span className="text-sm truncate">{fileName || 'Archivo adjunto'}</span>
    </a>
  );
}
