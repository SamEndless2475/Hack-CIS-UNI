# Persona 6 — Dashboard de impacto

Rama: `persona6/dashboard-impacto`
Tipo: feature nueva, lectura pública, con polling.

## 1. Objetivo

Mostrar en el home métricas en vivo del evento. Sirve para tres cosas:
- Dar sensación de evento grande y activo (FOMO positivo).
- Convencer a sponsors con datos reales de alcance.
- Ser contenido compartible (captura de pantalla para redes).

## 2. Qué existe hoy

- `components/hacker-counter.tsx` — consulta `user/count` cada 30 s, guarda el último valor en `localStorage` (para mostrar algo mientras carga). **Único dato real hoy.**
- `components/animated-counter.tsx` — anima un número hasta `end`.
- `components/gradient-text.tsx` — texto con degradado para los números.
- `components/sections/details-section.tsx` y `hero-section.tsx` — candidatos para ubicar el dashboard.
- `app/page.tsx` monta las secciones en orden fijo.

## 3. Métricas propuestas

| Métrica | Fuente hoy | Fuente futura | Prioridad |
|---|---|---|---|
| Hackers registrados | `user/count` ✅ | igual | Alta |
| Equipos formados | — | `stats/` 🟡 | Alta |
| Universidades distintas | — | `stats/` 🟡 (o derivar de `education/`) | Alta |
| Proyectos entregados | — | `stats/` 🟡 | Media (solo después de la entrega) |
| Países / ciudades | — | `stats/` 🟡 | Baja |

Regla: **si un dato no tiene fuente real, no se muestra con número inventado.** Mejor ocultar la tarjeta que mostrar un mock al público.

Para desarrollo local, usar un flag `NEXT_PUBLIC_IMPACT_MOCK=true` que active datos de prueba. En producción debe estar en `false`.

## 4. Diseño propuesto

### Archivos nuevos
- `lib/api-impact.ts` — `getImpactStats(): Promise<ImpactStats>`. Hace `fetch` a `stats/` y si no existe, combina `user/count` con mock. Único punto de cambio para la fase 2.
- `lib/types.ts` — agregar `ImpactStats` (**archivo compartido: avisar antes**).
- `hooks/use-impact-stats.ts` — hook con polling de 30 s, pausa cuando la pestaña está oculta (`document.visibilityState`), y limpia el intervalo al desmontar.
- `components/impact/impact-dashboard.tsx` — grid de tarjetas.
- `components/impact/impact-card.tsx` — una tarjeta: icono, número animado, etiqueta.

### Archivos a modificar
- `app/page.tsx` — agregar `<ImpactDashboard />` en una posición fija. **Único archivo que toca esta persona fuera de su carpeta.**
- `components/hacker-counter.tsx` — **no borrarlo todavía.** Si `ImpactDashboard` lo reemplaza, se elimina en el PR final, no antes, para no romper nada en la transición.

### Sobre `localStorage`
El valor guardado sirve solo para mostrar algo mientras carga la primera respuesta. No es fuente de verdad. Mantener el comportamiento actual pero con clave propia (`hackcis_impact_v1`) para no mezclar con la clave vieja.

## 5. Estados de la UI

- **Cargando (primera vez):** esqueleto con números en `—`, no `0`. Un `0` parece dato real.
- **Cargado:** números animados.
- **Error:** mantener el último valor conocido con indicador discreto "actualizado hace X min". No mostrar error rojo al público.
- **Sin datos de una métrica:** esa tarjeta no se renderiza.

## 6. Accesibilidad y rendimiento

- Los números animados deben tener el valor final en texto para lectores de pantalla (`aria-live="polite"` solo en el valor final, no en cada frame).
- Respetar `prefers-reduced-motion`: sin animación, mostrar el número directo.
- No crear intervalos duplicados si el componente se monta dos veces (cuidado en React 18 StrictMode, que monta dos veces en desarrollo).

## 7. Criterios de aceptación

- [ ] Muestra al menos 1 métrica real (hackers) desde el backend existente.
- [ ] Ninguna cifra inventada visible en producción (flag de mock desactivado).
- [ ] Polling pausa cuando la pestaña está oculta.
- [ ] Sin intervalos duplicados en desarrollo (StrictMode).
- [ ] Responsive: 2 columnas en móvil, 4 en escritorio.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Funciona si el backend responde 500: se muestra el último valor, sin pantalla rota.

## 8. Riesgos

- **Cifras infladas o engañosas:** si `universidades` se deriva de `education/` y ese endpoint incluye universidades sin participantes, el número miente. Acordar con backend qué cuenta.
- **Carga del backend en Render:** polling cada 30 s desde muchos navegadores puede saturar el plan gratuito. Subir a 60 s o usar caché en el servidor (route handler con `revalidate`).
- **CORS / URL:** usar `NEXT_PUBLIC_URL_BACKEND_HACK_CIS` con el mismo fallback que `hacker-counter.tsx`, pero centralizado en `lib/api-impact.ts`.

## 9. Checklist de QA

- [ ] Con backend apagado: no hay pantalla en blanco ni error en consola visible al usuario.
- [ ] Con backend lento (throttling en DevTools): el esqueleto se ve, no parpadea.
- [ ] Cambiar de pestaña y volver: no se disparan 10 requests de golpe.
