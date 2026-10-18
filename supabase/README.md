# Base de datos — Hack[CIS] UNI 2026

Proyecto Supabase: **hack-cis-uni** (`uevcvgkvrttbnqiorrlt`), región West US (Oregon), plan Free, compute `nano`.

> Estado al 2026-10-17: el proyecto está **vacío** (0 migraciones, 0 backups, sin repo conectado).
> Estas migraciones **todavía no se han aplicado**: nadie con acceso las ha corrido aún.

## Migraciones

| Archivo | Qué hace |
|---|---|
| `20261017000001_init.sql` | Tablas, tipos, triggers, funciones y políticas RLS |
| `20261017000002_seed_universities.sql` | 107 instituciones y 113 dominios de correo verificados por DNS |

## Cómo aplicarlas

### Opción A — desde el dashboard (la más rápida, no necesita instalar nada)

1. Entra a **SQL Editor** en el dashboard del proyecto.
2. Pega el contenido de `20261017000001_init.sql` y ejecútalo.
3. Repite con `20261017000002_seed_universities.sql`.

Los scripts son idempotentes (`if not exists`, `on conflict do nothing`): se pueden
correr dos veces sin romper nada.

### Opción B — con la CLI (deja registro de migraciones y permite `db diff`)

```bash
npx supabase login                      # abre el navegador, genera el access token
npx supabase link --project-ref uevcvgkvrttbnqiorrlt
npx supabase db push
```

## Modelo de datos

```
institutions ──< university_domains      (filtro de correo institucional)
expertises
teams ──< join_requests >── hackers      (hackers.team_id = equipo actual)
teams ──  projects                       (1 proyecto por equipo)
hackers ── checkins                      (1 check-in por hacker, idempotente)
sponsors                                 (formulario de /sponsors)
staff                                    (quién puede escanear QR y ver el panel)
```

### Decisiones que están codificadas aquí

- **La identidad es el correo.** `hackers.auth_user_id` apunta a `auth.users`, así que
  la verificación se hace con Supabase Auth (OTP / magic link). No hay DNI ni contraseña.
- **Solo correos institucionales.** El trigger `hackers_enforce_institutional_email`
  rechaza cualquier correo cuyo dominio no esté en `university_domains`. No se puede
  saltar desde el cliente: la regla vive en la base de datos.
- **Registro en dos pasos.** Al verificar el correo se crea la fila mínima; el resto del
  perfil se completa después en el panel y se marca con `profile_completed_at`.
- **`discord_id`** está en `hackers` (lo pidió Gerson para el bot de Discord), con índice
  único parcial para que no se repita pero sí pueda ser `null`.

### Filtro de correo

```sql
select is_institutional_email('kevin.pinto.a@uni.pe');  -- true
select is_institutional_email('kevin@gmail.com');       -- false
select * from institution_for_email('alguien@pucp.edu.pe');
```

Los 113 dominios fueron verificados uno por uno con `nslookup -type=MX <dominio> 8.8.8.8`:
todos devolvieron registros MX reales, es decir, existen y pueden recibir correo.
Se descartaron 5 candidatos que no resolvieron (`uncas.edu.pe`, `unifsl.edu.pe`,
`unfs.edu.pe`, `upal.edu.pe`, `ula.edu.pe`).

**Para agregar una universidad que falte**, inserta la fila en `institutions` y su dominio
en `university_domains`. No hay que tocar código: el filtro lee la tabla.

### Agregados públicos

El contador del home y el dashboard no leen las tablas directamente (RLS lo impediría
para visitantes anónimos). Usan dos funciones `security definer` que solo devuelven
números, nunca datos personales:

```sql
select * from get_public_stats();   -- hackers, teams, universities, projects, checked_in
select * from get_public_teams();   -- equipos con cupos libres calculados
```

## Lo que falta decidir antes de aplicar

- El sitio hoy apunta a `hack-cis-uni-backend.onrender.com` (repo aparte), que está
  respondiendo **503**. Hay que decidir si el frontend pasa a hablar directo con Supabase
  o si el backend de Render sigue en medio usando Supabase como su base.
- Quién entra en la tabla `staff` (correos del equipo organizador).
