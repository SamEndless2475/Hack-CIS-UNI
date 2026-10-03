# Contratos de API compartidos

Backend externo: `hack-cis-uni-backend.onrender.com/api/v1/` (repo aparte, no está en este proyecto).

**Estado de cada endpoint:**
- ✅ **EXISTE** — ya lo consume el frontend hoy.
- 🟡 **PROPUESTO** — no existe. Se necesita pedírselo al equipo de backend. Mientras tanto cada feature usa mocks detrás de un módulo, para poder cambiar a la API real sin tocar componentes.

Regla del equipo: **ningún componente llama `fetch` directo a un endpoint nuevo.** Cada feature expone funciones en `lib/` (ej. `lib/api-teams.ts`, `lib/api-projects.ts`, `lib/api-impact.ts`, `lib/api-checkin.ts`). Con esto, cambiar de mock a real es tocar un solo archivo.

---

## Existentes (✅)

| Método | Ruta | Uso actual | Archivo |
|---|---|---|---|
| GET | `education/?search=` | Buscar universidades | `lib/api.ts` |
| POST | `education/` | Crear universidad | `lib/api.ts` |
| GET | `expertise/?search=` | Buscar especialidades | `lib/api.ts` |
| GET | `team/` | Listar equipos (solo `{id, name}`) | `lib/api.ts` |
| POST | `hacker/` | Registrar hacker (individual o con equipo) | `app/register/page.tsx` |
| GET | `user/count` | Total de hackers (`{ total }`) | `components/hacker-counter.tsx` |

---

## Propuestos (🟡)

### Equipos (Persona 3)
| Método | Ruta | Body / Respuesta |
|---|---|---|
| GET | `team/` | Ampliar cada item con: `description`, `stack: string[]`, `level_wanted`, `slots_total`, `slots_free`, `is_open`, `leader_id` |
| GET | `team/{id}` | Detalle del equipo + miembros `[{id, name, level}]` |
| POST | `team/{id}/join-requests` | `{ hacker_id }` → crea solicitud `pending` |
| GET | `team/{id}/join-requests` | Solo para el líder: lista de solicitudes |
| PATCH | `join-requests/{id}` | `{ status: "accepted" \| "rejected" }` — descuenta cupo si acepta |

### Proyectos / Galería (Persona 4)
| Método | Ruta | Body / Respuesta |
|---|---|---|
| GET | `project/?status=submitted` | Lista pública: `id, title, pitch, stack, team_name, cover_image_url, repo_url, demo_url, video_url, university` |
| GET | `project/{id}` | Detalle, incluye `team: {id, name, members_count}` |
| POST | `project/` | Entrega de equipo: `team_id, title, pitch, stack, repo_url, demo_url, video_url, cover_image_url` |

### Impacto (Persona 6)
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `stats/` | `{ hackers, teams, universities, projects_submitted, countries?, updated_at }` |

Mientras no exista, `user/count` (✅) cubre solo `hackers`. Las demás métricas usan mock.

### Check-in (Persona 7)
| Método | Ruta | Body / Respuesta |
|---|---|---|
| GET | `hacker/{id}` | Ampliar con: `team_id`, `checkin_at`, `qr_token` |
| POST | `checkin/` | `{ hacker_id, staff_id }` → `{ checkin_at }`. Idempotente: si ya hizo check-in, responde 200 con la fecha original |

### Banner / Certificado (Persona 5)
No requiere endpoints. Usa datos que ya tiene el formulario (`name`, `education` seleccionada, `team_name`).

---

## Formato de error (todos los endpoints nuevos)
```json
{ "success": false, "message": "texto legible", "errors": { "campo": ["detalle"] } }
```
Es el mismo formato que ya usa `ApiResponse` en `lib/api.ts`. Los `status` esperados: 400 validación, 404 no existe, 409 conflicto (ej. equipo lleno), 500 error interno.
