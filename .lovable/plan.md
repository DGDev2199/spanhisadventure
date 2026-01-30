
# Plan: Corregir Problemas de Visor PDF, Subida de Archivos y RLS de Progreso

## Resumen de Problemas Identificados

1. **Screenshot se toma antes del blur**: El método actual de blur solo reacciona cuando la ventana pierde foco, pero el PrintScreen captura antes de que JavaScript pueda reaccionar.

2. **No se pueden subir PDFs**: La subida de archivos usa el bucket `task-attachments` pero podría tener problemas de políticas de storage.

3. **Profesor como tutor no puede ver progreso**: Las políticas RLS de `student_progress_weeks` y `student_progress_notes` solo verifican `teacher_id` **O** `tutor_id`, pero NO permiten a un profesor que es asignado como `tutor_id` acceder (porque la política de teacher solo verifica `teacher_id`).

---

## Solución 1: Mejorar Protección contra Screenshots

El método actual de "blur al perder foco" tiene una limitación: la tecla PrintScreen captura la pantalla **antes** de que JavaScript pueda reaccionar.

### Estrategia mejorada:

| Técnica | Descripción | Efectividad |
|---------|-------------|-------------|
| **Interceptar keydown** | Detectar PrintScreen (keyCode 44) y bloquear inmediatamente | Media-Alta |
| **Blur preventivo** | Mantener difuminado y solo mostrar mientras hay interacción activa | Alta |
| **Capa protectora con CSS** | Usar `mix-blend-mode` para que screenshots capturen colores alterados | Media |
| **Copiar al portapapeles algo vacío** | Al detectar PrintScreen, copiar una imagen vacía al clipboard | Media |

### Implementación en SecurePDFViewer:

```tsx
// Detectar PrintScreen y blur preventivo
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // PrintScreen = keyCode 44
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      setIsBlurred(true);
      
      // Intentar limpiar el clipboard
      navigator.clipboard.writeText('').catch(() => {});
      
      // Mostrar advertencia
      toast.warning('Capturas de pantalla no permitidas');
      
      // Desblur después de 2 segundos
      setTimeout(() => setIsBlurred(false), 2000);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyDown, true);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyDown, true);
  };
}, []);
```

Adicionalmente, agregar CSS protector:

```css
/* Dificultar capturas */
.pdf-protected {
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none; /* Solo el contenedor, no el iframe */
}

/* Al imprimir, ocultar el contenido */
@media print {
  .pdf-container {
    visibility: hidden !important;
  }
}
```

---

## Solución 2: Corregir Subida de PDFs

### Problema identificado:
El bucket `materials` existe pero es **privado** (`public: false`). El código actual sube a `task-attachments` que es público, pero la URL generada podría no funcionar correctamente para algunos archivos.

### Solución:
1. Cambiar para usar el bucket `materials` (privado) para guías de profesores
2. Usar URLs firmadas (signed URLs) con expiración para mayor seguridad
3. Agregar políticas de storage correctas

### Migración SQL para políticas de storage:

```sql
-- Política para permitir a admin/coordinador subir a materials
CREATE POLICY "Admins can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' 
  AND public.has_admin_or_coordinator_role(auth.uid())
);

-- Política para permitir a admin/coordinador ver materials
CREATE POLICY "Admins can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' 
  AND public.has_admin_or_coordinator_role(auth.uid())
);

-- Staff puede ver materials (para guías)
CREATE POLICY "Staff can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
);
```

### Cambios en ManageCurriculumDialog.tsx:

```tsx
// Usar signed URL para materials privados
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validar tipo de archivo
  const allowedTypes = ['application/pdf', 'video/mp4', 'image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('Tipo de archivo no permitido. Use PDF, MP4, PNG o JPG.');
    return;
  }

  setIsUploading(true);
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `material-${Date.now()}.${fileExt}`;
    
    // Usar bucket correcto según tipo de material
    const bucketName = isTeacherGuide ? 'materials' : 'task-attachments';
    const filePath = isTeacherGuide 
      ? `teacher-guides/${fileName}` 
      : `materials/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Para materials privados, guardar solo el path (usaremos signed URLs)
    if (isTeacherGuide) {
      setMaterialUrl(`${bucketName}/${filePath}`);
    } else {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      setMaterialUrl(urlData.publicUrl);
    }

    toast.success('Archivo subido correctamente');
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Error al subir archivo');
  } finally {
    setIsUploading(false);
  }
};
```

---

## Solución 3: Corregir RLS para Profesores como Tutores

### Problema detectado:

Las políticas RLS actuales para `student_progress_weeks` y `student_progress_notes` son:

- **Teachers**: Solo verifican `student_profiles.teacher_id = auth.uid()`
- **Tutors**: Solo verifican `student_profiles.tutor_id = auth.uid()`

Cuando un profesor es asignado como **tutor** de un estudiante:
- No entra en la política de "teacher" porque `teacher_id != auth.uid()`
- No entra en la política de "tutor" porque tiene rol `teacher`, no `tutor`

### Solución:
Modificar las políticas para usar lógica OR que verifique ambos roles y ambas columnas.

### Migración SQL:

```sql
-- =====================================================
-- FIX: Student Progress Weeks - Teachers as Tutors
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Teachers can view their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Teachers can manage their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Tutors can view their students progress" ON public.student_progress_weeks;
DROP POLICY IF EXISTS "Tutors can update their students progress" ON public.student_progress_weeks;

-- New unified policy: Staff (teachers/tutors) can VIEW students where they are teacher_id OR tutor_id
CREATE POLICY "Staff can view assigned students progress"
ON public.student_progress_weeks FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- New unified policy: Staff can MANAGE (INSERT/UPDATE/DELETE) students they are assigned to
CREATE POLICY "Staff can manage assigned students progress"
ON public.student_progress_weeks FOR ALL
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM student_profiles
    WHERE student_profiles.user_id = student_progress_weeks.student_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- =====================================================
-- FIX: Student Progress Notes - Same logic
-- =====================================================

DROP POLICY IF EXISTS "Teachers can view their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Teachers can manage their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Tutors can view their students notes" ON public.student_progress_notes;
DROP POLICY IF EXISTS "Tutors can manage their students notes" ON public.student_progress_notes;

-- Staff can VIEW notes for their assigned students
CREATE POLICY "Staff can view assigned students notes"
ON public.student_progress_notes FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);

-- Staff can MANAGE notes for their assigned students
CREATE POLICY "Staff can manage assigned students notes"
ON public.student_progress_notes FOR ALL
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'tutor'))
  AND EXISTS (
    SELECT 1 FROM student_progress_weeks
    JOIN student_profiles ON student_profiles.user_id = student_progress_weeks.student_id
    WHERE student_progress_weeks.id = student_progress_notes.week_id
    AND (student_profiles.teacher_id = auth.uid() OR student_profiles.tutor_id = auth.uid())
  )
);
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/curriculum/SecurePDFViewer.tsx` | Agregar detección de PrintScreen, CSS de protección, blur preventivo |
| `src/components/ManageCurriculumDialog.tsx` | Usar bucket `materials` para guías, validar tipos de archivo |
| `src/components/TeacherMaterialsPanel.tsx` | Usar signed URLs para materials privados |
| Nueva migración SQL | Corregir políticas RLS de progress + políticas de storage |

---

## Detalles Técnicos

### SecurePDFViewer - Protección Mejorada

1. **Listener de keydown global** con `capture: true` para interceptar antes
2. **Limpiar clipboard** al detectar PrintScreen
3. **CSS `@media print`** para ocultar contenido al imprimir
4. **Advertencia visual** cuando se detecta intento de captura

### RLS - Lógica Unificada

La nueva política usa:
```sql
(has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'tutor'))
AND (teacher_id = auth.uid() OR tutor_id = auth.uid())
```

Esto permite que:
- Un profesor asignado como teacher_id pueda acceder
- Un profesor asignado como tutor_id también pueda acceder
- Un tutor asignado como tutor_id pueda acceder
- Un tutor asignado como teacher_id (raro pero posible) también pueda acceder

### Storage - Signed URLs

Para el bucket `materials` (privado), usar:
```typescript
const { data } = await supabase.storage
  .from('materials')
  .createSignedUrl(filePath, 3600); // Expira en 1 hora
```

---

## Resumen de Correcciones

| Problema | Causa | Solución |
|----------|-------|----------|
| Screenshot captura antes del blur | `window.blur` es tardío | Interceptar `keydown` con PrintScreen |
| No puedo subir PDFs | Posible problema de bucket/políticas | Usar bucket correcto + validación de tipos |
| Profesor como tutor sin acceso | RLS solo verifica un rol/columna | Nueva política con OR para ambos |
