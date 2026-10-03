# Persona 6 — Rama `persona6/dashboard-impacto`

## Objetivo
Mostrar métricas de impacto en vivo en el home — convence a sponsors y da sensación de evento grande/activo.

## Tareas
1. Ampliar el patrón de `components/hacker-counter.tsx` (ya hace polling cada 30s al backend externo) a un set de métricas: # hackers, # equipos, # universidades distintas, # proyectos entregados.
2. Nuevo componente `components/impact-dashboard.tsx` con las tarjetas/contadores.
3. Integrarlo en `app/page.tsx`, cerca de `HeroSection` o `DetailsSection`.
4. Usar `components/animated-counter.tsx` (ya existe) para la animación de cada número.

## Dependencia externa (no bloquea el inicio)
`# universidades distintas` y `# proyectos entregados` pueden no estar disponibles como endpoint directo todavía. **Mientras no estén:** usar datos mock o derivar lo que sí esté disponible (ej. contar universidades a partir de `education/` si el endpoint lo permite).

## Archivos de referencia
- `components/hacker-counter.tsx`
- `components/animated-counter.tsx`
- `lib/api.ts`
