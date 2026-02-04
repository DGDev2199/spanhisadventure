

# Plan: Arreglar Ejercicios Prácticos - Responsive y Asignación

## Resumen del Problema

Se han identificado **dos problemas** distintos en el sistema de ejercicios prácticos:

1. **Problema de diseño (Panel del Profesor)**: El panel "Ejercicios Prácticos" tiene una altura fija de 300px para el área de scroll, lo que hace que los botones de acción (Practicar, Asignar, Eliminar) queden cortados en dispositivos móviles, tablets y pantallas pequeñas de escritorio.

2. **Problema de asignación**: Al intentar asignar ejercicios a estudiantes, la lista de estudiantes puede aparecer vacía porque la consulta usa la tabla `profiles` directamente, la cual está protegida por RLS y no permite a profesores/tutores ver los perfiles de sus estudiantes directamente.

---

## Solución Propuesta

### Parte 1: Hacer el Panel de Ejercicios Prácticos Responsive

**Archivo afectado:** `src/components/practice/PracticeSessionPanel.tsx`

**Cambios:**
- Importar el hook `useIsMobile` para detectar dispositivos móviles
- Reemplazar la altura fija `h-[300px]` del `ScrollArea` con alturas dinámicas:
  - **Móvil**: Eliminar `ScrollArea` y dejar que el contenido fluya naturalmente
  - **Desktop**: Mantener `max-h-[350px]` con scroll interno
- Agregar espaciador al final del contenido para evitar que el último botón quede cortado

### Parte 2: Corregir la Consulta de Asignación de Ejercicios

**Archivo afectado:** `src/components/practice/AssignExerciseDialog.tsx`

**Cambios:**
- Cambiar la consulta de `profiles` a `safe_profiles_view` (vista que respeta los permisos RLS)
- Esto permitirá que profesores y tutores vean los nombres de sus estudiantes asignados

---

## Detalles Técnicos

### PracticeSessionPanel.tsx - Cambios

```text
Línea 1-8: Agregar import de useIsMobile
Línea 14: Declarar const isMobile = useIsMobile();
Línea 150: Cambiar ScrollArea de altura fija a condicional móvil/desktop
```

Lógica condicional:
- Si es móvil: Mostrar lista sin scroll interno (flujo natural)
- Si es desktop: Mantener ScrollArea con max-h-[350px]
- Agregar div espaciador de 2px al final para garantizar visibilidad del último botón

### AssignExerciseDialog.tsx - Cambios

```text
Línea 89-96: Cambiar consulta de 'profiles' a 'safe_profiles_view'
```

La vista `safe_profiles_view` ya existe y está configurada para respetar los permisos de visualización de perfiles según las políticas RLS establecidas.

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/components/practice/PracticeSessionPanel.tsx` | Responsive layout |
| `src/components/practice/AssignExerciseDialog.tsx` | Fix de consulta RLS |

---

## Beneficios

1. Los botones de "Practicar", "Asignar" y "Eliminar" serán accesibles en todos los dispositivos
2. La asignación de ejercicios funcionará correctamente para profesores y tutores
3. El diseño se adaptará automáticamente al tamaño de pantalla del usuario

