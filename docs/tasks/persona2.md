# Persona 2 — Refactor y calidad de código

Rama: `persona2/refactor-arquitectura`
Tipo: calidad de código. Es la rama con más riesgo de conflicto. Se divide en **parte A (segura, entra pronto)** y **parte B (estructural, entra al final)**.

## 1. Objetivo

Que el build deje de esconder errores, que haya un solo cliente de API, y que las dependencias reflejen lo que realmente usa el sitio.

## 2. Hallazgos verificados

- `next.config.mjs` tiene `typescript.ignoreBuildErrors: true` y `eslint.ignoreDuringBuilds: true`. **El build pasa aunque haya errores de tipos.** Esto oculta problemas reales.
- Dos clientes de API con el mismo propósito:
  - `lib/api.ts` — usado por `register`, `hacker-counter`, etc.
  - `lib/api-client.ts` — `apiClient.registerHacker`; **revisar si alguien lo usa**. Si no, eliminarlo.
- `components/registration-modal.tsx` — **no se importa en ningún lado.** Candidato a eliminar.
- `lib/fusion-image.ts` — script con `main()`, no es parte de la app. Candidato a eliminar o mover a `scripts/`.
- `package.json` incluye `expo`, `expo-gl`, `expo-file-system`, `react-native`, `expo-asset`. **Son para apps móviles, no para un sitio web Next.js.** Revisar si `spline-scene.tsx` o `three` los necesitan. Muy probablemente no.
- Muchas páginas usan `any` en respuestas de API.

## 3. Parte A — segura (entra pronto)

Solo cambios que no mueven archivos ni cambian comportamiento visible:

1. **Activar verificación de tipos en build.** Cambiar `ignoreBuildErrors` a `false`. Probablemente falle; entonces:
   - Listar todos los errores: `pnpm tsc --noEmit > errores.txt`.
   - Arreglar los que estén en archivos que tocan las demás ramas **solo si son triviales**.
   - Si son muchos, dejar activado solo para rutas nuevas con `// @ts-check` o un `tsconfig` aparte. No dejar el build roto para todos.
2. **Eliminar código sin uso confirmado:** `registration-modal.tsx`, `lib/api-client.ts` (si se confirma), `lib/fusion-image.ts`.
3. **Quitar dependencias sin uso.** Antes de quitar cada una: `grep -r "nombre-paquete" app components lib`. Quitar `expo*` y `react-native` si no aparecen.
   - Cuidado: cambiar `package.json` implica cambiar `pnpm-lock.yaml`. Avisar al equipo en el canal.
4. **Tipar respuestas de API:** reemplazar `any` en `lib/api.ts` por los tipos de `lib/types.ts`.

### Merge de la parte A
Mergear pronto (idealmente en 1-2 días). Las demás ramas se benefician de un build que sí valida tipos.

## 4. Parte B — estructural (entra al final)

**No hacer mientras haya otras ramas abiertas**: mover archivos genera conflictos en todas.

1. Unificar el cliente de API en un solo módulo `lib/api/` con subcarpetas por dominio: `education.ts`, `expertise.ts`, `teams.ts`, `hackers.ts`, `stats.ts`. Las nuevas features ya nacen con `lib/api-*.ts`; al final se consolidan en `lib/api/`.
2. Organizar `components/` por feature: `components/teams/`, `components/projects/`, `components/impact/`, `components/checkin/`, `components/banner/`. Las carpetas nuevas ya existen en sus ramas; esta parte ordena lo viejo.
3. Mover `components/sections/` a `components/landing/` si se decide.

## 5. Fuera de alcance
- Cambiar el diseño visual.
- Agregar tests unitarios (propuesta para después, ver sección 7).

## 6. Criterios de aceptación

- [ ] `pnpm build` pasa con `typescript.ignoreBuildErrors: false` (o los errores restantes están documentados y acotados).
- [ ] No quedan archivos sin importar, confirmado con grep.
- [ ] `package.json` sin dependencias móviles si no se usan.
- [ ] Ninguna página cambia su comportamiento visible en la parte A.

## 7. Propuesta para después (no bloquea)

Si sobra tiempo: agregar Vitest para `lib/banner/render.ts`, `lib/api-*.ts` y validaciones. Es lo que más valor da con menos esfuerzo, porque son funciones puras.

## 8. Cómo verificar

```bash
pnpm tsc --noEmit        # idealmente 0 errores
pnpm build
pnpm dev                 # recorrer /, /register, /sponsors, /Boot
```
