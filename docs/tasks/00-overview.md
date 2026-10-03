# Plataforma de impacto Hack[CIS] 2026 — Plan de trabajo

7 personas, 7 ramas, cada una con su documento detallado en `docs/tasks/`.
Este plan **no es lineal**: la mayoría de tareas arranca el día 1 en paralelo. Solo hay pocas dependencias reales, listadas abajo.

## Mapa de documentos

| Persona | Rama | Documento | Tipo de trabajo |
|---|---|---|---|
| 1 | `persona1/fix-bugs-generales` | [persona1.md](persona1.md) | Limpieza y estabilidad |
| 2 | `persona2/refactor-arquitectura` | [persona2.md](persona2.md) | Calidad de código y build |
| 3 | `persona3/marketplace-equipos` | [persona3.md](persona3.md) | Feature nueva |
| 4 | `persona4/galeria-proyectos` | [persona4.md](persona4.md) | Feature nueva |
| 5 | `persona5/banner-linkedin` | [persona5.md](persona5.md) | Feature nueva |
| 6 | `persona6/dashboard-impacto` | [persona6.md](persona6.md) | Feature nueva |
| 7 | `persona7/checkin-qr` | [persona7.md](persona7.md) | Feature nueva |

Contratos de API compartidos: [contratos-api.md](contratos-api.md). **Léelo antes de tocar cualquier llamada de red.**

---

## Tracks: qué puede avanzar sin esperar a nadie

Todo lo que está aquí puede empezar el día 1:

- **Track UI nueva (independiente):** P3 (`/teams`), P4 (`/proyectos`), P5 (generador de banner), P6 (dashboard), P7 (QR + scanner). Cada una crea rutas o componentes nuevos, y usa **mocks** detrás de `lib/api-*.ts`.
- **Track base:** P1 (bugs) y P2 (refactor). Corren en paralelo, pero sus cambios entran a `main` lo antes posible.

## Dependencias reales (las únicas)

```
P1 (bugs) ──────────────► merge a main  (todos rebasan después)
P2 (refactor, solo lo no destructivo) ─► merge a main  (idem)

P5 (banner) ─┐
P7 (QR)     ─┴─► ambos tocan components/success-modal.tsx
                 → acordar: P7 es dueño del archivo; P5 expone
                   <BannerGenerator /> como componente aparte y lo
                   monta desde success-modal con una sola línea.

P3, P4, P7 ──► agregan links en components/sections/navigation.tsx
                 → cada uno agrega su link en un commit pequeño;
                   el último en mergear resuelve el conflicto.

P6 ──► toca app/page.tsx. Ningún otro persona lo toca.
```

Los endpoints reales (contratos-api.md) **no bloquean** a nadie: todos desarrollan con mock y cambian en una segunda fase.

## Reglas para no pisarse

1. **Un archivo compartido = un dueño.** Ver tabla en [contratos-api.md](contratos-api.md) y los documentos individuales.
2. **Archivos compartidos** (`lib/types.ts`, `lib/consts.ts`, `components/sections/navigation.tsx`, `app/globals.css`): cambios pequeños, avisar en el grupo antes.
3. **Commits pequeños y frecuentes**, no un commit gigante al final.
4. **PR a `main`**, mínimo 1 revisión de otra persona. Nadie mergea su propia rama sola.
5. **Antes de abrir PR:** `pnpm build` debe pasar y la página nueva debe verse bien en móvil (ancho 375px) y escritorio.
6. **Rebase diario** desde `main` para no acumular conflictos: `git fetch && git rebase origin/main`.

## Definición de "terminado" (aplica a todas)

- [ ] Funciona con datos mock **y** tiene un único punto de cambio para la API real.
- [ ] Estados vacíos, carga y error manejados (no pantallas en blanco).
- [ ] Sin `console.error` nuevos en el flujo feliz.
- [ ] Textos en español, consistentes con el resto del sitio.
- [ ] Documento de la persona actualizado con lo que realmente quedó hecho.

## Orden sugerido de merges (no obligatorio)

1. `persona1/fix-bugs-generales` — estabilidad.
2. `persona2/refactor-arquitectura` — parte no destructiva.
3. Features en el orden que estén listas: P4, P3, P6, P5, P7.
4. Segunda fase: cambiar mocks por endpoints reales cuando backend los entregue.
5. P2 reestructuración de carpetas, si se decide hacer, al final.

## Antes de la reunión: decisiones que hay que tomar

- ¿Quién habla con el equipo de backend para pedir los endpoints de [contratos-api.md](contratos-api.md)?
- ¿Se puede tener `develop` como rama de integración o seguimos con PRs directos a `main`?
- ¿Qué pasa con la key de Gemini que estuvo en el README: ¿ya fue rotada?
