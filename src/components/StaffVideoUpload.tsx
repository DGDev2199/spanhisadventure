import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffVideoUploadProps {
  userId: string | undefined;
  currentVideoUrl: string | null;
  onVideoChange: (url: string | null) => void;
}

export const StaffVideoUpload = ({ userId, currentVideoUrl, onVideoChange }: StaffVideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa MP4, WebM o MOV');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 104857600) {
      toast.error('El video es muy grande. Máximo 100MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/intro.${fileExt}`;

      // Delete existing video if any
      if (currentVideoUrl) {
        const oldPath = currentVideoUrl.split('/staff-videos/')[1];
        if (oldPath) {
          await supabase.storage.from('staff-videos').remove([oldPath]);
        }
      }

      // Upload new video
      const { error: uploadError } = await supabase.storage
        .from('staff-videos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('staff-videos')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ intro_video_url: publicUrl } as any)
        .eq('id', userId);

      if (updateError) throw updateError;

      onVideoChange(publicUrl);
      toast.success('Video subido correctamente');
    } catch (error: any) {
      toast.error('Error al subir video: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!userId || !currentVideoUrl) return;

    setDeleting(true);
    try {
      const filePath = currentVideoUrl.split('/staff-videos/')[1];
      if (filePath) {
        await supabase.storage.from('staff-videos').remove([filePath]);
      }

      await supabase
        .from('profiles')
        .update({ intro_video_url: null } as any)
        .eq('id', userId);

      onVideoChange(null);
      toast.success('Video eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar video');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        Video de Presentación
      </Label>
      
      {currentVideoUrl ? (
        <div className="space-y-2">
          <video
            src={currentVideoUrl}
            controls
            className="w-full rounded-lg max-h-48 bg-black"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Cambiar Video
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click para subir video de presentación
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM o MOV (máx. 100MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};
