# Persona 2 — Rama `persona2/refactor-arquitectura`

Prioridad: **coordinar con el equipo antes de mover/renombrar archivos** (es la rama con más riesgo de choque con el resto).

## Objetivo
Mejorar la organización del código sin romper lo que ya funciona.

## Tareas sugeridas
1. Unificar los dos clientes de API que hoy coexisten (`lib/api.ts` y `lib/api-client.ts`) en un solo módulo consistente.
2. Revisar y activar `typescript.ignoreBuildErrors` / `eslint.ignoreDuringBuilds` en `next.config.mjs` — hoy están en `true`, lo que esconde errores reales de tipos y lint en el build.
3. Tipar correctamente las respuestas de API (hoy varios `any`), usando `lib/types.ts`.
4. Evaluar mover `components/sections/*` a una estructura por feature si el proyecto crece (coordinarlo bien, ya que todas las páginas nuevas van a crear sus propios componentes).
5. Revisar dependencias no usadas en `package.json` (hay librerías de `react-native`/`expo`/`three` que no parecen tener relación con un sitio web Next.js — confirmar si se usan en `spline-scene.tsx` o son resto de otro proyecto).

## Recomendación
Si el tiempo es corto, acotar esta rama a limpieza que no mueva archivos (puntos 1-3) y mergearla rápido. Dejar la reestructuración de carpetas (punto 4) para después de que las features nuevas ya estén integradas, para no generar conflictos masivos.
