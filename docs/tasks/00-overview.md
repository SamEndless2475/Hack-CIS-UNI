# Reestructuración y nuevas funcionalidades — Hack[CIS] 2026

Resumen para la reunión de equipo. 7 personas, 7 ramas, todas parten de `main`.

## Ramas y responsables

| Persona | Rama | Tarea |
|---|---|---|
| 1 | `persona1/fix-bugs-generales` | Arreglar ruta vacía `generate-images`, rutas muertas (`/api/hacker`, `/api/backend/[...path]`), limpiar referencias a la API key expuesta |
| 2 | `persona2/refactor-arquitectura` | Reestructurar carpetas, limpiar código muerto, estandarizar llamadas a API |
| 3 | `persona3/marketplace-equipos` | Página `/teams`: ver equipos con cupos, pedir unirse, aprobación del líder |
| 4 | `persona4/galeria-proyectos` | Página `/proyectos`: tarjetas públicas con pitch, stack y demo/repo de cada equipo |
| 5 | `persona5/banner-linkedin` | Generador de banner/certificado post-registro + flujo de "compartir en LinkedIn" |
| 6 | `persona6/dashboard-impacto` | Métricas en vivo en el home: # hackers, # equipos, # universidades, # proyectos |
| 7 | `persona7/checkin-qr` | QR de asistencia al registrarse + certificado digital de participación |

Detalle de cada tarea en `docs/tasks/personaN.md`.

## Prioridad para que todo funcione sin errores

1. **Urgente, fuera de ramas:** rotar la API key que estaba expuesta en `FLYER_GENERATOR_README.md`. Se asume ya invalidada/reemplazada.
2. **Bloqueante para todos:** copiar `.env.example` a `.env.local` y completar los valores reales antes de correr el proyecto (`pnpm install && pnpm dev`).
3. **Mergear primero `persona1/fix-bugs-generales`**: toca archivos puntuales y aislados, bajo riesgo de choque con el resto. Debe entrar a `main` rápido para que todos trabajen sobre una base limpia.
4. **Coordinar `persona2/refactor-arquitectura`**: es la rama con más riesgo de conflicto porque puede mover/renombrar archivos. Acordar en la reunión si acota el alcance (solo limpieza, sin mover carpetas) para mergear rápido, o si se deja para el final cuando las features ya estén mergeadas.
5. **`persona3` a `persona7` pueden arrancar en paralelo desde ya**: son páginas nuevas que no tocan código existente, bajo riesgo de conflicto entre ellas.
6. **Dependencia externa (no bloquea el inicio):** `persona3` (marketplace) y `persona4` (galería) necesitan datos que el backend externo (`hack-cis-uni-backend`, fuera de este repo) no expone todavía (estado de solicitud de equipo, descripción/stack del proyecto). Mientras se gestiona ese endpoint con quien mantiene el backend, construir la UI con datos mock.

## Flujo de trabajo

```bash
pnpm install
cp .env.example .env.local   # completar con las keys reales
git checkout persona1/fix-bugs-generales   # o la rama que corresponda
pnpm dev
```

- Cada persona trabaja solo en su rama.
- Al terminar, Pull Request hacia `main` (no mergear directo).
- Avisar en el grupo antes de tocar archivos compartidos (`lib/consts.ts`, `lib/types.ts`, `components/sections/navigation.tsx`, `app/globals.css`) para evitar conflictos.
