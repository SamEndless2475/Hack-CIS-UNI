# Persona 3 — Marketplace de equipos

Rama: `persona3/marketplace-equipos`
Tipo: feature nueva con flujo de aprobación. Resuelve el problema "no tengo equipo".

## 1. Objetivo

Que un hacker sin equipo pueda ver equipos abiertos, entender de qué trata cada uno y pedir unirse. Que el líder de cada equipo pueda aprobar o rechazar solicitudes. Y que un hacker que se registró individualmente no quede fuera del evento.

## 2. Qué existe hoy

- `app/register/page.tsx` — en el wizard, si el usuario elige "Unirme a equipo existente", aparece un `searchable-select` con `getExistingTeams()`.
- `lib/api.ts` → `getExistingTeams()` devuelve solo `{ id, name }`.
- El registro envía `team_create: false, team_id` al backend. **No hay forma de pedir unirse** después del registro: si el hacker elige un equipo al registrarse, entra directo, sin aprobación.
- Esto significa que hoy no hay "solicitud" ni "líder que aprueba". Esa es la gran brecha.

## 3. Alcance

### Dentro
1. Página `/teams` con listado de equipos abiertos.
2. Tarjeta por equipo: nombre, descripción, stack, nivel buscado, cupos libres.
3. Filtros: tecnología y nivel.
4. Botón **"Solicitar unirme"** (requiere estar registrado; ver sección 5).
5. Vista del líder: `/teams/mine` o sección dentro de un perfil, con solicitudes pendientes y botones aprobar/rechazar.
6. Estado de la solicitud visible para el hacker: pendiente / aceptado / rechazado.

### Fuera
- Chat entre miembros.
- Crear o editar equipo después del registro (fase 2, requiere endpoints PATCH no contemplados aún).
- Recomendaciones automáticas por IA.

## 4. Modelo de datos (propuesto en `contratos-api.md`)

```ts
// lib/types.ts — agregar (archivo compartido: avisar antes)
export interface TeamListing {
  id: string
  name: string
  description: string
  stack: string[]
  level_wanted: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Experto' | null
  slots_total: number
  slots_free: number
  is_open: boolean
}

export interface JoinRequest {
  id: string
  team_id: string
  hacker_id: string
  hacker_name: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
```

## 5. Reglas de negocio que hay que confirmar con backend

Estas reglas no están decididas. Hay que definirlas antes de programar la parte real:

1. **¿Quién puede pedir unirse?** Propuesta: cualquier hacker registrado que **no tenga equipo**.
2. **¿Cuántas solicitudes puede tener pendientes un hacker?** Propuesta: máximo 3, para evitar spam.
3. **¿Qué pasa si el equipo se llena mientras hay solicitudes pendientes?** Propuesta: las pendientes se rechazan automáticamente.
4. **¿Un hacker puede cambiar de equipo?** Propuesta: no, después del registro.
5. **¿Cómo se identifica al hacker que está logueado?** Hoy **no hay login**. Opciones:
   - a) Pedir `email` + `id` de hacker (el id vino del registro). Simple, pero débil.
   - b) Magic link por email (requiere backend y servicio de correo).
   - c) Dejarlo fuera de esta fase y que solo se vea la lista, sin botón de pedir unirse.

**Recomendación:** empezar con (c) para la UI pública, y decidir (a) o (b) en la reunión. Esta decisión es la más importante de la rama.

## 6. Diseño propuesto

### Archivos nuevos
- `app/teams/page.tsx` — listado público.
- `app/teams/[id]/page.tsx` — detalle del equipo con miembros y botón de solicitud.
- `app/teams/mine/page.tsx` — vista del líder (solicitudes). Puede quedar como placeholder con mock en fase 1.
- `lib/api-teams.ts` — `listTeams(filters)`, `getTeam(id)`, `requestToJoin(teamId, hackerId)`, `listJoinRequests(teamId)`, `respondJoinRequest(requestId, status)`. **Único punto de red.**
- `lib/mocks/teams.ts` — datos ficticios para desarrollo.
- `components/teams/team-card.tsx`
- `components/teams/team-filters.tsx`
- `components/teams/join-request-button.tsx`
- `components/teams/join-requests-list.tsx`

### Archivos a modificar
- `components/sections/navigation.tsx` — agregar link "Equipos" (**compartido**).
- `lib/types.ts` — tipos nuevos (**compartido**).

### No tocar
- `app/register/page.tsx`: el flujo de registro actual no se cambia en esta rama. Si después se quiere que el wizard ofrezca "ver equipos abiertos", es una mejora separada y se coordina con P1/P2.

## 7. Flujo de usuario

**Hacker sin equipo:**
1. Entra a `/teams`.
2. Filtra por tecnología o nivel.
3. Abre un equipo → ve descripción, stack, miembros, cupos.
4. Pulsa "Solicitar unirme" → confirmación → estado "Solicitud enviada".

**Líder de equipo:**
1. Entra a `/teams/mine`.
2. Ve solicitudes pendientes con nombre, universidad y nivel.
3. Aprueba o rechaza. Al aprobar, el cupo baja en 1.

## 8. Estados de UI

- Listado vacío: "No hay equipos abiertos con esos filtros." + botón limpiar.
- Equipo lleno: tarjeta visible con badge "Completo" y botón deshabilitado.
- Ya tienes equipo: en la vista del equipo, el botón se reemplaza por "Ya perteneces a un equipo".
- Solicitud ya enviada: botón cambia a "Solicitud pendiente".
- Error al enviar: mensaje en línea, no toast que desaparece rápido.

## 9. Riesgos

- **Sin login, cualquiera puede aprobar solicitudes de otro equipo** si la vista del líder no tiene autenticación. Mientras no haya auth real, la vista `/teams/mine` **solo puede existir como mock**, nunca conectada a datos reales.
- **Condición de carrera al aprobar**: dos aprobaciones simultáneas pueden pasar el límite de cupos. Esto se resuelve en backend (transacción), no en el frontend. Dejarlo anotado en `contratos-api.md`.
- **Equipos con nombre duplicado**: confirmar si el backend exige nombre único.

## 10. Criterios de aceptación

- [ ] `/teams` lista equipos desde `lib/api-teams.ts` (mock).
- [ ] Filtros por stack y nivel funcionan y se combinan.
- [ ] Detalle del equipo muestra cupos y estado.
- [ ] Botón de solicitud respeta los estados (lleno, ya tiene equipo, ya pidió).
- [ ] Vista del líder existe, aunque sea con mock, y está marcada como "no conectada a auth".
- [ ] Responsive y sin errores de consola en el flujo feliz.

## 11. Checklist de QA

- [ ] Equipo con 0 cupos libres: no se puede pedir unirse.
- [ ] Filtro sin resultados: mensaje claro.
- [ ] Nombre de equipo de 50 caracteres no rompe la tarjeta.
