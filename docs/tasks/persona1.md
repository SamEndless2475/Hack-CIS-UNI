# Persona 1 — Fixes y estabilidad

Rama: `persona1/fix-bugs-generales`
Tipo: limpieza y correcciones. **Es la primera rama en entrar a `main`**, porque todas las demás parten de una base más limpia.

## 1. Objetivo

Eliminar lo que hoy está roto, a medio hacer o expone datos sensibles, para que las demás ramas no hereden problemas.

## 2. Hallazgos verificados

| # | Problema | Dónde | Severidad |
|---|---|---|---|
| 1 | API key de Gemini escrita en texto plano | `FLYER_GENERATOR_README.md` línea 33 | **Crítica** |
| 2 | Ruta vacía, responde 405 | `app/api/hacker/generate-images/route.ts` (0 bytes) | Media |
| 3 | Ruta mock que simula guardar en BD, nadie la llama | `app/api/hacker/route.ts` | Media |
| 4 | Proxy a Google Apps Script sin uso desde el frontend | `app/api/backend/[...path]/route.ts` | Media |
| 5 | `NEXT_PUBLIC_` en clave de Gemini: visible en el navegador | `lib/neobanana-service.ts` línea 4 | Alta |
| 6 | Nombres de variables de entorno inconsistentes entre archivos | varios | Baja |
| 7 | Cliente de API duplicado (`lib/api.ts` y `lib/api-client.ts`) | `lib/` | Baja (P2 lo unifica) |
| 8 | Sin `.env.example` en el repo (se agregó en `main`) | raíz | Resuelto |

Hallazgo 1 ya se intentó corregir solo en documentación. **Que la key esté en el historial de git significa que hay que rotarla**, quitar el archivo no basta.

## 3. Tareas

### 3.1 Seguridad (prioridad máxima)
1. Confirmar con el equipo que la key de `FLYER_GENERATOR_README.md` **fue revocada** en Google Cloud/AI Studio. Sin esto, el resto no importa.
2. Quitar la key del README. Reemplazar por `NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY=<tu-key>` como ejemplo.
3. Revisar que `.env` y `.env.local` no estén versionados: `git ls-files | grep env`.
4. Documentar en el README principal que la key de cliente es visible y debe tener cuota y restricción de dominio en Google Cloud.

### 3.2 Rutas muertas
1. `generate-images/route.ts`: **eliminar la carpeta completa.** Está vacía y nadie la llama.
2. `api/hacker/route.ts`: **eliminar.** Su lógica de validación (Zod) puede moverse a `lib/validations.ts` si hace falta, pero no como ruta.
3. `api/backend/[...path]/route.ts`: **eliminar** o documentar si el equipo lo quiere para algo futuro. Decidir en la reunión.

Verificar antes de borrar: `grep -r "api/hacker" --include=*.ts --include=*.tsx` y `grep -r "api/backend"`.

### 3.3 Clave de Gemini en cliente
`lib/neobanana-service.ts` usa `NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY`. Cualquiera puede leerla en el bundle. **No resolverlo en esta rama** (requiere mover la generación al servidor, cambio grande). Documentarlo y dejar la tarea abierta para P5.

### 3.4 Variables de entorno
- Tabla única en `.env.example` (ya existe).
- Agregar a `docs/tasks/00-overview.md` cuál variable usa cada parte del código.
- `URL_BACKEND_HACK_CIS` (sin `NEXT_PUBLIC_`): hoy solo la lee `lib/api-client.ts`. Verificar si ese archivo se usa; si no, la variable sobra.

## 4. Fuera de alcance
- Mover la generación de IA al servidor (sería una rama propia).
- Reestructurar carpetas (P2).
- Cambiar el comportamiento de ninguna página.

## 5. Cómo verificar

```bash
pnpm build                       # debe pasar
pnpm dev                         # / , /register , /sponsors , /Boot responden 200
git grep -n "AIza"               # no debe devolver resultados
```

## 6. Criterios de aceptación

- [ ] `git grep "AIza"` no devuelve nada en la rama.
- [ ] Ninguna ruta vacía ni sin uso en `app/api/`.
- [ ] `pnpm build` pasa sin cambios de comportamiento en las páginas.
- [ ] Este documento y `00-overview.md` reflejan lo que quedó hecho.

## 7. Nota para el historial

Quitar la key en un commit **no la elimina del historial**. Si la key sigue activa en algún momento, la única solución real es revocarla. Limpiar el historial con `git filter-repo` es posible pero reescribe commits compartidos: no hacerlo sin acuerdo de todo el equipo.
