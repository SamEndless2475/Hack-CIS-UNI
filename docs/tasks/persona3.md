# Persona 3 — Rama `persona3/marketplace-equipos`

## Objetivo
Resolver "no tengo equipo": una página pública donde ver equipos con cupos y pedir unirse.

## Tareas
1. Página nueva `app/teams/page.tsx`: listado de equipos (tarjetas con nombre, descripción corta, stack, cupos disponibles, nivel buscado).
2. Filtro por tecnología/nivel de experiencia.
3. Botón "Solicitar unirme" por equipo.
4. Vista para el líder del equipo: ver solicitudes pendientes y aprobar/rechazar.

## Dependencia externa (no bloquea el inicio)
El backend externo (`hack-cis-uni-backend`, fuera de este repo) hoy solo expone `{id, name}` por equipo vía `getExistingTeams()` en `lib/api.ts`. Para esta funcionalidad se necesita que el backend agregue: descripción, stack, cupos, y un endpoint de "solicitud de unión" con estado (pendiente/aprobado/rechazado).

**Mientras no esté ese endpoint:** construir la UI completa con datos mock (array local simulando la respuesta) para no bloquearse, y dejar la integración real marcada con un TODO claro.

## Archivos de referencia
- `lib/api.ts` (función `getExistingTeams`)
- `app/register/page.tsx` (flujo actual de elegir equipo existente)
