
# Plan: Mejoras en Gestionar Curriculo - CRUD de Materiales, Mobile y i18n

## Problemas Identificados

1. **Falta CRUD completo de materiales**: Actualmente solo se puede agregar y eliminar. No hay opcion para **editar** (modificar titulo, tipo, URL, o cambiar si es guia del profesor).

2. **Modal de PDF no abre en movil**: El `SecurePDFViewer` usa un `Dialog` de escritorio que no funciona bien en pantallas pequenas.

3. **ManageCurriculumDialog no es responsive**: Layout de dos columnas fijo, campos pequenos, botones dificiles de tocar.

4. **Falta i18n**: Todas las cadenas del curriculo estan en espanol sin soporte para ingles.

---

## Solucion Propuesta

### 1. Agregar Edicion de Materiales

**Archivo:** `src/components/ManageCurriculumDialog.tsx`

Cambios:
- Agregar estado `editingMaterial` para almacenar el material en edicion
- Crear boton de editar (icono lapiz) junto al boton de eliminar en cada material
- Reutilizar el formulario de agregar material pero con datos precargados
- Agregar funcion `handleUpdateMaterial` que haga `UPDATE` en `topic_materials`

```typescript
// Nuevo estado
const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);

// Funcion para editar
const handleUpdateMaterial = async () => {
  await supabase
    .from('topic_materials')
    .update({
      title: materialTitle,
      material_type: materialType,
      content_url: materialUrl,
      is_teacher_guide: isTeacherGuide,
    })
    .eq('id', editingMaterial.id);
};
```

### 2. Hacer SecurePDFViewer Responsive (Mobile Drawer)

**Archivo:** `src/components/curriculum/SecurePDFViewer.tsx`

Cambios:
- Importar `useIsMobile` hook
- Importar `Drawer` components de vaul
- Renderizar `Drawer` en movil, `Dialog` en escritorio
- El drawer abre desde abajo y ocupa toda la pantalla

```typescript
// Logica condicional
const isMobile = useIsMobile();

if (isMobile) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="h-[95vh]">
        {/* Contenido del visor PDF */}
      </DrawerContent>
    </Drawer>
  );
}

return (
  <Dialog>...</Dialog>
);
```

### 3. Hacer ManageCurriculumDialog Responsive

**Archivo:** `src/components/ManageCurriculumDialog.tsx`

Cambios:
- En movil: layout de una columna con tabs para alternar entre semanas y temas
- Botones con `min-h-[44px]` para area tactil adecuada
- Usar `Sheet` (desde el lateral) en lugar de `Dialog` en movil para mejor UX
- Ajustar `ScrollArea` para alturas dinamicas

```typescript
// Layout responsive
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* En movil se apilan, en desktop lado a lado */}
</div>
```

### 4. Agregar Traducciones i18n para Curriculo

**Archivos:** 
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`

Nueva seccion `curriculum`:

```json
// en.json
"curriculum": {
  "manage": "Manage Curriculum",
  "weeksAndTopics": "Weeks and Topics",
  "extraMaterials": "Extra Materials",
  "programWeeks": "Program Weeks",
  "selectWeek": "Select a week",
  "topicsFor": "Topics - Week",
  "addTopic": "Add Topic",
  "topicName": "Topic name",
  "topicDescription": "Description (optional)",
  "noTopics": "No topics. Add one below.",
  "studentMaterial": "Student Material",
  "teacherGuide": "Teacher Guide",
  "addMaterial": "Add Material",
  "editMaterial": "Edit Material",
  "materialTitle": "Material title",
  "materialType": "Type",
  "document": "Document",
  "video": "Video",
  "link": "Link",
  "exercise": "Exercise",
  "contentUrl": "Content (URL or upload file)",
  "save": "Save",
  "cancel": "Cancel",
  "existingMaterials": "Existing Materials",
  "noMaterials": "No materials. Add one from the Weeks and Topics tab.",
  "guide": "Guide",
  "visibleToStudents": "Visible to students",
  "hiddenFromStudents": "Hidden from students (teacher only)",
  "topicAdded": "Topic added",
  "topicDeleted": "Topic deleted",
  "weekUpdated": "Week updated",
  "materialAdded": "Material added",
  "guideAdded": "Teacher guide added",
  "materialDeleted": "Material deleted",
  "guideDeleted": "Teacher guide deleted",
  "materialUpdated": "Material updated",
  "guideUpdated": "Teacher guide updated",
  "createReevaluation": "Create re-evaluation test",
  "reevaluationCreated": "Re-evaluation test created"
}
```

```json
// es.json
"curriculum": {
  "manage": "Gestionar Curriculo",
  "weeksAndTopics": "Semanas y Temas",
  "extraMaterials": "Material Extra",
  "programWeeks": "Semanas del Programa",
  "selectWeek": "Selecciona una semana",
  "topicsFor": "Temas - Semana",
  "addTopic": "Agregar Tema",
  "topicName": "Nombre del tema",
  "topicDescription": "Descripcion (opcional)",
  "noTopics": "No hay temas. Agrega uno abajo.",
  "studentMaterial": "Material del Estudiante",
  "teacherGuide": "Guia del Profesor",
  "addMaterial": "Agregar Material",
  "editMaterial": "Editar Material",
  "materialTitle": "Titulo del material",
  "materialType": "Tipo",
  "document": "Documento",
  "video": "Video",
  "link": "Enlace",
  "exercise": "Ejercicio",
  "contentUrl": "Contenido (URL o subir archivo)",
  "save": "Guardar",
  "cancel": "Cancelar",
  "existingMaterials": "Materiales Existentes",
  "noMaterials": "No hay materiales. Agrega uno desde la pestana Semanas y Temas.",
  "guide": "Guia",
  "visibleToStudents": "Visible para estudiantes",
  "hiddenFromStudents": "Oculto para estudiantes (solo profesores)",
  "topicAdded": "Tema agregado",
  "topicDeleted": "Tema eliminado",
  "weekUpdated": "Semana actualizada",
  "materialAdded": "Material agregado",
  "guideAdded": "Guia del profesor agregada",
  "materialDeleted": "Material eliminado",
  "guideDeleted": "Guia del profesor eliminada",
  "materialUpdated": "Material actualizado",
  "guideUpdated": "Guia del profesor actualizada",
  "createReevaluation": "Crear examen de reevaluacion",
  "reevaluationCreated": "Examen de reevaluacion creado"
}
```

---

## Resumen de Cambios por Archivo

| Archivo | Cambios |
|---------|---------|
| `ManageCurriculumDialog.tsx` | +Edicion de materiales, +Responsive layout, +i18n |
| `SecurePDFViewer.tsx` | +Drawer para movil, +useIsMobile |
| `TeacherMaterialsPanel.tsx` | +Responsive mejorado, +i18n |
| `en.json` | +Seccion curriculum (30+ claves) |
| `es.json` | +Seccion curriculum (30+ claves) |

---

## Flujo de Usuario Mejorado

1. **En movil**: El modal de curriculo abre como Sheet lateral o drawer desde abajo
2. **Editar material**: Click en icono de lapiz, se carga el formulario con datos existentes
3. **Cambiar tipo de guia**: Switch para alternar entre material de estudiante y guia del profesor
4. **Ver PDF en movil**: Drawer de pantalla completa con visor de PDF

---

## Beneficios

- CRUD completo para materiales (Crear, Leer, Actualizar, Eliminar)
- Experiencia movil nativa con drawers/sheets
- Traducciones completas para usuarios de habla inglesa
- Botones con area tactil adecuada (44px minimo)
- Consistencia con el resto de la aplicacion
