# Persona 1 — Rama `persona1/fix-bugs-generales`

Prioridad: **la primera en mergear a `main`.**

## Objetivo
Dejar el proyecto sin cabos sueltos conocidos antes de que arranquen las features nuevas.

## Tareas
1. Completar o eliminar `app/api/hacker/generate-images/route.ts` (está vacío, sin handlers, nadie lo llama — decidir si se implementa o se borra).
2. Eliminar o conectar `app/api/hacker/route.ts` — hoy es un mock que simula guardar en base de datos pero el frontend real nunca lo llama (el registro va directo al backend externo vía `lib/api.ts`). Si no se va a usar, eliminarlo evita confusión.
3. Eliminar o conectar `app/api/backend/[...path]/route.ts` — proxy a un Google Apps Script que tampoco llama nadie del frontend.
4. Confirmar que la API key de `FLYER_GENERATOR_README.md` ya fue rotada/invalidada y quitar cualquier rastro de key real de archivos versionados.
5. Revisar consistencia de nombres de variables de entorno (`URL_BACKEND_HACK_CIS` vs `NEXT_PUBLIC_URL_BACKEND_HACK_CIS`) y documentar cuál usa cada archivo.

## Archivos principales
- `app/api/hacker/generate-images/route.ts`
- `app/api/hacker/route.ts`
- `app/api/backend/[...path]/route.ts`
- `FLYER_GENERATOR_README.md`
