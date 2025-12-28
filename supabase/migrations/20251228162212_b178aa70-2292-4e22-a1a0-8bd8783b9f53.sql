-- Crear bucket para archivos de tareas
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Teachers pueden subir archivos a su carpeta
CREATE POLICY "Teachers can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' 
  AND public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuarios autenticados pueden leer los archivos de tareas
CREATE POLICY "Authenticated users can read task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-attachments');

-- Política: Teachers pueden eliminar sus propios archivos
CREATE POLICY "Teachers can delete own task attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);