

# Plan: Corregir Flashcards Responsive + Visor PDF Seguro para Currículo

## Resumen

Se identificaron dos problemas principales:

1. **Flashcards con problemas de visualización en móvil**: El componente FlashcardExercise tiene problemas con la animación 3D de volteo que no funciona bien en todos los navegadores móviles.

2. **Visor de PDFs para guías del currículo**: Necesitan mostrar PDFs de guías de profesores en un modal tipo presentación, con medidas de protección contra capturas de pantalla.

---

## Problema 1: Flashcards Bugueadas en Móvil

### Análisis del problema

El componente actual usa CSS 3D transforms (`rotateY(180deg)`, `perspective`, `backface-visibility`) que pueden fallar en:
- Safari iOS (problemas conocidos con `preserve-3d`)
- Navegadores móviles antiguos
- Dispositivos con aceleración de hardware limitada

### Solución propuesta

Crear un sistema de flashcard más robusto con:
1. **Fallback para navegadores sin soporte 3D**: Usar animación de fade/scale en lugar de flip
2. **Mejorar el layout responsive**: Asegurar que los botones y contenido se ajusten bien
3. **Detectar soporte CSS 3D**: Si no soporta, usar animación alternativa

```tsx
// Detectar soporte de 3D transforms
const supports3D = window.CSS?.supports?.('transform-style', 'preserve-3d') ?? true;

// Si no soporta 3D, usar animación fade simple
{supports3D ? (
  // Animación 3D actual
) : (
  // Animación fade/scale simple
  <Card className={cn(
    "transition-all duration-300",
    isFlipped ? "scale-95 opacity-0" : "scale-100 opacity-100"
  )}>
    {isFlipped ? currentCard.back : currentCard.front}
  </Card>
)}
```

### Mejoras adicionales al responsive:
- Reducir altura de tarjeta en móvil: `h-40 sm:h-48 md:h-64`
- Botones de acción más grandes para touch: `min-h-[44px]` (recomendación Apple)
- Espaciado ajustado para pantallas pequeñas

---

## Problema 2: Visor de PDF Seguro para Currículo

### Análisis de requerimientos

El usuario quiere:
1. Mostrar PDFs como presentación en un modal
2. Proteger el contenido contra capturas de pantalla

### ⚠️ Realidad sobre protección de screenshots

**Es técnicamente imposible bloquear capturas de pantalla completamente** por estas razones:
- Los navegadores no exponen APIs para detectar o bloquear screenshots
- El sistema operativo controla la función de captura
- CSS `user-select: none` solo previene selección de texto
- JavaScript no puede detectar cuando se toma una captura

### Medidas de protección factibles

Aunque no podemos bloquear screenshots, sí podemos implementar **disuasivos**:

| Medida | Efectividad | Implementación |
|--------|-------------|----------------|
| **Marca de agua dinámica** | Alta | Superponer nombre/email del usuario sobre el PDF |
| **Deshabilitar clic derecho** | Baja | Solo disuade usuarios básicos |
| **Deshabilitar selección de texto** | Media | CSS `user-select: none` |
| **No permitir descarga** | Media | No mostrar botón de descarga, usar iframe |
| **Desenfoque al salir de foco** | Media | Si cambian de ventana, difuminar contenido |
| **URLs firmadas temporales** | Alta | URLs de Supabase que expiran en X minutos |

### Diseño del visor de PDF

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 Guía del Profesor - Verbos Reflexivos                    ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                      [PDF IFRAME]                         │ │
│  │                                                           │ │
│  │     ──────────────────────────────────────────────────    │ │
│  │         MARCA DE AGUA: "Visto por: Fernando López"        │ │
│  │               "29/01/2026 12:30 - Solo lectura"           │ │
│  │     ──────────────────────────────────────────────────    │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ◀ Anterior        Página 3 de 15        Siguiente ▶            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componente: SecurePDFViewer

```tsx
interface SecurePDFViewerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  userName: string;  // Para marca de agua
}

function SecurePDFViewer({ open, onClose, pdfUrl, title, userName }: SecurePDFViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);

  // Detectar si la ventana pierde el foco (posible screenshot)
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl h-[85vh]"
        onContextMenu={(e) => e.preventDefault()} // Deshabilitar clic derecho
      >
        <div 
          className={cn(
            "relative h-full select-none transition-all duration-200",
            isBlurred && "blur-xl"
          )}
        >
          {/* PDF iframe sin toolbar de descarga */}
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0"
          />
          
          {/* Marca de agua superpuesta */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="rotate-[-30deg] opacity-10 text-4xl font-bold text-center">
              <p>{userName}</p>
              <p className="text-lg">{new Date().toLocaleString()}</p>
              <p className="text-sm">Solo lectura - Contenido protegido</p>
            </div>
          </div>
        </div>
        
        {/* Advertencia de blur */}
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white font-bold">
              ⚠️ Contenido protegido - Regresa a la ventana para continuar
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Integración con TeacherMaterialsPanel

Modificar el botón de "Guías del Profesor" para abrir el visor seguro en lugar de `window.open`:

```tsx
// En lugar de:
onClick={() => material.content_url && window.open(material.content_url, '_blank')}

// Usar:
onClick={() => {
  if (material.material_type === 'document' && material.content_url?.endsWith('.pdf')) {
    setSelectedPdf({
      url: material.content_url,
      title: material.title
    });
  } else {
    window.open(material.content_url, '_blank');
  }
}}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/practice/FlashcardExercise.tsx` | MODIFICAR | Corregir animación 3D y mejorar responsive |
| `src/components/curriculum/SecurePDFViewer.tsx` | CREAR | Nuevo visor de PDF con protecciones |
| `src/components/TeacherMaterialsPanel.tsx` | MODIFICAR | Integrar visor seguro para guías PDF |

---

## Detalles Técnicos

### FlashcardExercise - Correcciones

1. **Usar WebkitBackfaceVisibility** para Safari
2. **Agregar fallback sin animación 3D** para navegadores no soportados
3. **Mejorar áreas de toque** (44px mínimo según Apple HIG)
4. **Reducir altura en móvil** para que todo quepa sin scroll

### SecurePDFViewer - Características

1. **Marca de agua dinámica** con nombre del usuario
2. **Blur al perder foco** de la ventana
3. **Sin botón de descarga** en el iframe (`#toolbar=0`)
4. **Deshabilitar clic derecho** para evitar "Guardar como"
5. **CSS `user-select: none`** para evitar copiar texto
6. **URLs temporales** (opcional futuro con Supabase signed URLs)

### Nota sobre la seguridad

Es importante comunicar al usuario que:
- Estas medidas son **disuasivos**, no bloqueos absolutos
- Un usuario determinado siempre puede tomar fotos con otro dispositivo
- La mejor protección es confiar en las personas con acceso
- Las marcas de agua ayudan a identificar la fuente si hay fugas

---

## Resumen de Cambios

| Problema | Solución |
|----------|----------|
| Flashcards no funcionan en móvil | Fallback sin 3D + mejor responsive |
| PDFs sin protección | Visor seguro con marca de agua y blur |
| Descarga de PDFs | Iframe sin toolbar + sin clic derecho |

