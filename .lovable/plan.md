
# Plan: Arreglar PDF Móvil + Dashboards y Cards Responsive

## Problemas Identificados

### 1. PDF Viewer en Móvil No Funciona
**Causa raíz:** Los navegadores móviles (Safari iOS, Chrome Android) no soportan bien iframes con blob URLs para PDFs. El navegador muestra "Abrir" pero no puede renderizar el contenido.

**Solución:** Implementar react-pdf para renderizar PDFs página por página de forma nativa, con controles de navegación y zoom optimizados para táctil.

### 2. Dashboards y Cards No Responsive
Los siguientes componentes necesitan mejoras de responsividad:
- `WeeklyProgressGrid` - Cuadrícula de semanas muy pequeña en móvil
- `StudentProgressView` - Notas diarias difíciles de editar en móvil
- `DayProgressModal` - Modal de notas no optimizado para móvil
- `TopicActionsModal` - Ya está responsive, pero puede mejorar
- `QuickStatCard` y `StaffCard` - Cards del dashboard principal

---

## Parte 1: Arreglar SecurePDFViewer para Móvil

### Problema Técnico
Los navegadores móviles no renderizan PDFs en iframes con blob URLs. Necesitamos usar `react-pdf` (ya instalado en el proyecto) para renderizar cada página del PDF como un canvas.

### Cambios en `SecurePDFViewer.tsx`

```tsx
// Importaciones adicionales
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Para móvil, renderizar con react-pdf
const [numPages, setNumPages] = useState<number>(0);
const [currentPage, setCurrentPage] = useState(1);
const [scale, setScale] = useState(1);

// Nuevo renderizador móvil
const renderMobilePDFContent = () => (
  <div className="flex-1 overflow-auto relative">
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <span>Cargando PDF...</span>
      </div>
    )}
    
    {objectUrl && (
      <Document
        file={objectUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-4 text-center">Cargando documento...</div>}
        error={<div className="p-4 text-center text-red-500">Error al cargar el PDF</div>}
      >
        <Page
          pageNumber={currentPage}
          width={window.innerWidth - 32}
          className="mx-auto"
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    )}
    
    {/* Controles de navegación */}
    <div className="sticky bottom-0 bg-background/95 border-t p-2 flex items-center justify-center gap-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage <= 1}
      >
        ← Anterior
      </Button>
      <span className="text-sm">
        {currentPage} / {numPages}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
        disabled={currentPage >= numPages}
      >
        Siguiente →
      </Button>
    </div>
    
    {/* Watermark */}
    <PDFWatermarkOverlay userName={userName} currentTime={currentTime} />
  </div>
);

// En el render móvil, usar el nuevo componente
if (isMobile) {
  return (
    <Drawer open={open} onOpenChange={...}>
      <DrawerContent className="h-[95vh] flex flex-col">
        <DrawerHeader>...</DrawerHeader>
        {renderMobilePDFContent()}
      </DrawerContent>
    </Drawer>
  );
}
```

---

## Parte 2: WeeklyProgressGrid Responsive

### Cambios Principales

1. **Cuadrícula de semanas más grande en móvil:**
```tsx
// ANTES
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">

// DESPUÉS - Menos columnas y más espacio en móvil
<div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
```

2. **Botones de semana más grandes y táctiles:**
```tsx
<button
  className={cn(
    "relative p-3 sm:p-4 rounded-xl transition-all duration-200 border-2",
    "min-h-[72px] sm:min-h-[80px] touch-target", // Más altura
    // ... resto de clases
  )}
>
  {/* Número de semana más grande */}
  <div className="text-xl sm:text-2xl font-bold">{week.week_number}</div>
  
  {/* Badge de nivel */}
  <Badge className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 mt-1">
    {week.level}
  </Badge>
</button>
```

3. **Detalle de semana seleccionada mejorado:**
```tsx
{/* Topics grid - más columnas en tablet/desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  {/* TopicCards más grandes */}
</div>
```

---

## Parte 3: StudentProgressView Responsive

### Cambios en la Vista General

```tsx
{/* Header con stats - stack vertical en móvil */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
  <div className="space-y-1">
    <p className="text-sm sm:text-base font-medium">Progreso General</p>
    <p className="text-xl sm:text-2xl font-bold text-primary">
      {completedWeeks} / {totalWeeks} Semanas
    </p>
  </div>
  <div className="text-left sm:text-right">
    <p className="text-2xl sm:text-3xl font-bold text-secondary">{Math.round(progressPercentage)}%</p>
    <p className="text-xs text-muted-foreground">Completado</p>
  </div>
</div>

{/* Botones de acción - full width en móvil */}
<div className="flex flex-col sm:flex-row gap-2">
  <Button variant="outline" size="sm" className="flex-1 w-full sm:w-auto">
    <ArrowLeftRight className="h-4 w-4 mr-2" />
    Reasignar Nivel
  </Button>
  <Button variant="outline" size="sm" className="flex-1 w-full sm:w-auto">
    <UserMinus className="h-4 w-4 mr-2" />
    Marcar Alumni
  </Button>
</div>
```

### Grid de Notas Diarias

```tsx
{/* Grid de días - 1 columna en móvil, 2 en tablet, 4 en desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
  {DAYS.map((day) => (
    <div
      key={day}
      onClick={() => setSelectedDay(...)}
      className={cn(
        "p-4 rounded-lg border transition-all",
        "min-h-[80px] touch-target", // Más altura para táctil
        "cursor-pointer hover:border-primary hover:shadow-md",
        // ... resto de estilos
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <span className="font-semibold text-sm sm:text-base">{DAY_LABELS[day]}</span>
      </div>
      {/* Indicadores más visibles */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {hasTeacher && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
            <GraduationCap className="h-3.5 w-3.5" />
            Prof
          </span>
        )}
        {hasTutor && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
            <Users className="h-3.5 w-3.5" />
            Tutor
          </span>
        )}
      </div>
    </div>
  ))}
</div>
```

---

## Parte 4: DayProgressModal Responsive

### Usar Drawer en Móvil

```tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export const DayProgressModal = ({ ... }) => {
  const isMobile = useIsMobile();
  
  const content = (
    <div className="space-y-4 sm:space-y-6">
      {/* Campos de texto más grandes */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-green-600" />
          Temas de clase
        </Label>
        <Textarea
          value={classTopics}
          onChange={(e) => setClassTopics(e.target.value)}
          placeholder="Describe los temas..."
          rows={4}
          className="resize-none text-base" // Texto más grande
        />
      </div>
      {/* Repetir para otros campos... */}
    </div>
  );
  
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {dayLabel}
            </DrawerTitle>
            <DrawerDescription>
              {isEditable ? 'Registra el progreso' : 'Resumen del día'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {content}
          </div>
          <div className="flex gap-2 p-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {canSave ? 'Cancelar' : 'Cerrar'}
            </Button>
            {canSave && (
              <Button onClick={() => saveMutation.mutate()} className="flex-1">
                Guardar
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  
  // Desktop: Dialog normal
  return (
    <Dialog open={open} onOpenChange={...}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ... contenido existente ... */}
      </DialogContent>
    </Dialog>
  );
};
```

---

## Parte 5: Dashboard Cards Responsive

### QuickStatCard

```tsx
// Ajustar tamaños y espaciado
<Card className="shadow-md hover:shadow-lg transition-all duration-300">
  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-3 sm:p-4">
    <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">{title}</CardTitle>
    <div className="flex-shrink-0">{icon}</div>
  </CardHeader>
  <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
    <div className="text-xl sm:text-2xl font-bold text-primary truncate">
      {isLoading ? '...' : value}
    </div>
    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
      {subtitle}
    </p>
  </CardContent>
</Card>
```

### StaffCard

```tsx
// Botones de acción más táctiles
<div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
  {showChat && (
    <Button
      variant="outline"
      size="sm"
      onClick={onChat}
      className="h-9 sm:h-8 px-3 touch-target flex-1 sm:flex-none"
    >
      <MessageSquare className="h-4 w-4 sm:mr-1.5" />
      <span className="hidden sm:inline">Chat</span>
    </Button>
  )}
  {/* Repetir para otros botones... */}
</div>
```

---

## Parte 6: Admin/Teacher Dashboard Tables

### Tablas Scrollables Horizontalmente

```tsx
{/* Wrapper para scroll horizontal en móvil */}
<div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <Table className="min-w-[600px]">
    <TableHeader>
      <TableRow>
        <TableHead className="sticky left-0 bg-background z-10">Estudiante</TableHead>
        <TableHead>Nivel</TableHead>
        <TableHead>Profesor</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* Filas... */}
    </TableBody>
  </Table>
</div>
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `SecurePDFViewer.tsx` | Usar react-pdf para móvil con controles de navegación |
| `WeeklyProgressGrid.tsx` | Grid más grande, menos columnas en móvil |
| `StudentProgressView.tsx` | Grid de notas responsive, botones full-width |
| `DayProgressModal.tsx` | Usar Drawer en móvil, campos más grandes |
| `QuickStatCard.tsx` | Padding y fuentes responsive |
| `StaffCard.tsx` | Botones táctiles, layout flexible |
| `TopicCard.tsx` | Ya está bien, pequeños ajustes |
| `Dashboard.tsx` | Ajustar grid de stats |
| `AdminDashboard.tsx` | Tablas scrollables, cards responsive |
| `TeacherDashboard.tsx` | Mismo tratamiento que Admin |

---

## Clases CSS Útiles a Agregar

```css
/* En index.css */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 640px) {
  .safe-scroll {
    -webkit-overflow-scrolling: touch;
  }
}
```

---

## Beneficios

1. **PDFs funcionan en móvil** - Renderizado nativo con react-pdf
2. **Controles táctiles adecuados** - Mínimo 44px de altura
3. **Cuadrículas legibles** - Menos columnas = más espacio
4. **Modales adaptativos** - Drawers en móvil, Dialogs en desktop
5. **Edición de notas fácil** - Campos de texto grandes y accesibles
6. **Tablas scrollables** - Sin romper el layout en móvil
