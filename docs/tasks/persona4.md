# Persona 4 — Galería de proyectos

Rama: `persona4/galeria-proyectos`
Tipo: feature nueva, lectura pública. Es la vitrina del evento: lo que se ve después de la entrega.

## 1. Objetivo

Mostrar públicamente los proyectos entregados por los equipos. Sirve para:
- Dar reconocimiento a los equipos (lo que más comparten los hackers).
- Mostrar resultados a sponsors y a la universidad.
- Crear contenido compartible después del evento.

**Importante:** esta galería es **de exhibición**, no de evaluación. El puntaje de jueces va en otro lugar (ver "Fuera de alcance").

## 2. Qué existe hoy

- `components/sections/project-submissions-section.tsx` — **solo texto estático** con las reglas de entrega (video demo máximo 2 min en YouTube, repo, etc.). No tiene formulario ni llamadas a backend.
- `components/sections/evaluation-section.tsx` y `agenda-section.tsx` — también estáticos, comentados en `app/page.tsx`.
- Ningún endpoint de proyectos existe en el backend.

## 3. Alcance de la rama

### Dentro
1. Página `/proyectos` con listado de tarjetas.
2. Búsqueda por título/equipo y filtro por tecnología.
3. Página de detalle `/proyectos/[id]` con descripción, stack, enlaces y miembros.
4. Estado vacío y de carga.
5. Enlace en la navegación (coordinar con P3, P7 — ver `00-overview.md`).

### Fuera (otra rama o fase posterior)
- Formulario de entrega de proyecto (los equipos entregan desde otra vista, fase 2).
- Puntajes de jueces.
- Votos del público (se puede agregar después; si se hace, separar claramente del puntaje).

## 4. Datos de cada tarjeta

Según `contratos-api.md` (propuesto):

| Campo | Obligatorio | Notas |
|---|---|---|
| `title` | Sí | Máx. 80 caracteres |
| `team_name` | Sí | |
| `pitch` | Sí | 1-2 frases, máx. 200 caracteres |
| `stack` | No | Array de strings, mostrar máx. 4 chips + "+N" |
| `university` | No | |
| `cover_image_url` | No | Sin imagen, usar placeholder con iniciales del equipo |
| `repo_url`, `demo_url`, `video_url` | No | Mostrar solo los que existan |

## 5. Diseño propuesto

### Archivos nuevos
- `app/proyectos/page.tsx` — listado. Client component por los filtros.
- `app/proyectos/[id]/page.tsx` — detalle. Puede ser server component con `fetch` y `revalidate`.
- `lib/api-projects.ts` — `listProjects(filters)`, `getProject(id)`. **Único punto que llama a la red.**
- `lib/mocks/projects.ts` — datos de prueba (8-10 proyectos ficticios). Se borra o se deja fuera del build de producción en la fase 2.
- `components/projects/project-card.tsx`
- `components/projects/project-grid.tsx`
- `components/projects/project-filters.tsx`
- `components/projects/project-empty-state.tsx`

### Archivos a modificar
- `lib/types.ts` — agregar `Project` (**compartido**).
- `components/sections/navigation.tsx` — agregar link "Proyectos" (**compartido**, coordinar).

### No tocar
- `project-submissions-section.tsx`: se puede dejar tal cual o enlazar a `/proyectos` desde ahí. Decisión de la persona 4 y el equipo.

## 6. Flujo de usuario

1. Entra a `/proyectos` desde la navegación.
2. Ve tarjetas. Puede buscar por texto y filtrar por tecnología.
3. Clic en una tarjeta → `/proyectos/[id]`.
4. En el detalle: pitch, stack, enlaces (repo, demo, video) y miembros del equipo.
5. Botón "Volver a proyectos" y, si se quiere, "Compartir" (`navigator.share` con fallback a copiar enlace).

## 7. Estados

- **Cargando:** esqueletos de tarjeta (6 en la grilla).
- **Vacío antes de la entrega:** mensaje "Los proyectos aparecerán aquí cuando los equipos hagan su entrega." **No** mostrar una grilla vacía sin explicación.
- **Vacío por filtro:** "No hay proyectos con ese filtro" + botón limpiar.
- **Error de red:** mensaje y botón reintentar.
- **Proyecto no existe (detalle):** página 404 propia, no la genérica de Next.

## 8. Seguridad y contenido

- Los enlaces de `repo_url`, `demo_url`, `video_url` vienen de usuarios. **Validar que empiecen por `https://`** antes de renderizarlos como `<a href>`, para evitar `javascript:` URLs.
- Usar `target="_blank" rel="noopener noreferrer"`.
- El pitch y el título son texto plano: React escapa por defecto. No usar `dangerouslySetInnerHTML`.
- Imágenes de portada: solo `https://` y con `next/image` configurado, o `<img>` con `loading="lazy"`. Nota: `next.config.mjs` tiene `images.unoptimized: true`, así que no hay optimización automática.

## 9. Accesibilidad

- Tarjeta completa clickeable con un solo enlace (no anidar enlaces dentro de enlaces).
- Chips de tecnología con texto, no solo color.
- Buscador con `label` visible o `aria-label`.

## 10. Criterios de aceptación

- [ ] `/proyectos` lista proyectos desde `lib/api-projects.ts` (con mock).
- [ ] Búsqueda y filtro funcionan juntos.
- [ ] `/proyectos/[id]` muestra detalle o 404 propio.
- [ ] Enlaces externos validados como `https://`.
- [ ] Estado vacío explica por qué no hay proyectos.
- [ ] Responsive: 1 columna en móvil, 2 en tablet, 3 en escritorio.
- [ ] Sin errores de consola en el flujo feliz.

## 11. Riesgos

- **Backend sin endpoint de proyectos:** toda la rama corre con mock. Riesgo de que la fase 2 cambie la forma de los datos: por eso el tipo `Project` vive en `lib/types.ts` y el mock sigue exactamente ese tipo.
- **Proyectos sin datos completos:** muchas tarjetas se verán vacías. Diseñar la tarjeta para que se vea bien con solo título y equipo.
- **Contenido ofensivo o spam en pitch:** responsabilidad de moderación. Dejar a cargo del backend o de staff; la UI no filtra.

## 12. Checklist de QA

- [ ] Con 0, 1, 3 y 30 proyectos: la grilla se ve bien en todos.
- [ ] Título de 80 caracteres sin romper la tarjeta.
- [ ] Proyecto sin imagen usa placeholder.
- [ ] Enlace `http://` o `javascript:` no se renderiza como enlace.
