-- Hack[CIS] UNI 2026 — esquema inicial
-- Proyecto Supabase: hack-cis-uni (uevcvgkvrttbnqiorrlt)
--
-- Decisiones asumidas (confirmar antes de aplicar en produccion):
--   - La identidad del hacker es su CORREO, verificado con Supabase Auth (OTP / magic link).
--     Por eso hackers.auth_user_id referencia auth.users.
--   - Solo se aceptan correos de dominios institucionales (tabla university_domains).
--   - El registro ocurre en dos pasos: (1) alta minima al verificar el correo,
--     (2) el hacker completa su perfil en el panel (profile_completed_at).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type hacker_level as enum ('Principiante', 'Intermedio', 'Avanzado', 'Experto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type join_request_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('draft', 'submitted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type institution_kind as enum ('publica', 'privada', 'instituto');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at automatico
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- Instituciones y sus dominios de correo (base del filtro de registro)
-- ---------------------------------------------------------------------------
create table if not exists institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  kind        institution_kind not null default 'privada',
  is_licensed boolean not null default true,
  -- Si es false, sus dominios existen en la tabla pero NO habilitan el registro.
  -- Sirve para abrir o cerrar el evento sin borrar datos: hoy los institutos
  -- (Tecsup, Senati, Cibertec) estan en false porque el evento es universitario.
  is_eligible boolean not null default true,
  created_at  timestamptz not null default now()
);

create unique index if not exists institutions_name_key on institutions (lower(name));

create table if not exists university_domains (
  domain         text primary key,
  institution_id uuid not null references institutions (id) on delete cascade,
  is_student     boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint university_domains_lowercase check (domain = lower(domain))
);

create index if not exists university_domains_institution_idx
  on university_domains (institution_id);

-- ---------------------------------------------------------------------------
-- Especialidades
-- ---------------------------------------------------------------------------
create table if not exists expertises (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists expertises_name_key on expertises (lower(name));

-- ---------------------------------------------------------------------------
-- Equipos
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  stack        text[] not null default '{}',
  level_wanted hacker_level,
  slots_total  smallint not null default 4 check (slots_total between 1 and 6),
  is_open      boolean not null default true,
  leader_id    uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists teams_name_key on teams (lower(name));

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at
  before update on teams
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Hackers
-- ---------------------------------------------------------------------------
create table if not exists hackers (
  id                   uuid primary key default gen_random_uuid(),
  auth_user_id         uuid unique references auth.users (id) on delete set null,

  -- identidad
  email                text not null,
  email_domain         text generated always as (split_part(lower(email), '@', 2)) stored,
  name                 text,
  lastname             text,
  phone                text,

  -- redes
  linkedin_url         text,
  github_url           text,
  discord_id           text,          -- pedido por Gerson (bot de Discord)
  discord_username     text,

  -- perfil
  level                hacker_level,
  institution_id       uuid references institutions (id) on delete set null,
  expertise_id         uuid references expertises (id) on delete set null,
  career               text,
  study_year           smallint check (study_year between 1 and 12),
  team_id              uuid references teams (id) on delete set null,

  -- carnet / banner
  photo_url            text,
  badge_role           text,          -- texto bajo el nombre en el carnet
  badge_number         integer generated always as identity,
  qr_token             uuid not null default gen_random_uuid(),

  -- estado
  profile_completed_at timestamptz,
  checked_in_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint hackers_email_format check (position('@' in email) > 1)
);

create unique index if not exists hackers_email_key    on hackers (lower(email));
create unique index if not exists hackers_qr_token_key on hackers (qr_token);
create unique index if not exists hackers_discord_id_key
  on hackers (discord_id) where discord_id is not null;
create index if not exists hackers_team_idx        on hackers (team_id);
create index if not exists hackers_institution_idx on hackers (institution_id);

drop trigger if exists hackers_set_updated_at on hackers;
create trigger hackers_set_updated_at
  before update on hackers
  for each row execute function set_updated_at();

alter table teams
  drop constraint if exists teams_leader_id_fkey;
alter table teams
  add constraint teams_leader_id_fkey
  foreign key (leader_id) references hackers (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Solicitudes para unirse a un equipo
-- ---------------------------------------------------------------------------
create table if not exists join_requests (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams (id) on delete cascade,
  hacker_id   uuid not null references hackers (id) on delete cascade,
  status      join_request_status not null default 'pending',
  message     text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (team_id, hacker_id)
);

create index if not exists join_requests_team_status_idx on join_requests (team_id, status);

-- ---------------------------------------------------------------------------
-- Proyectos
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams (id) on delete cascade,
  title           text not null,
  pitch           text,
  stack           text[] not null default '{}',
  repo_url        text,
  demo_url        text,
  video_url       text,
  cover_image_url text,
  status          project_status not null default 'draft',
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (team_id)
);

create index if not exists projects_status_idx on projects (status);

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Check-in (idempotente: un registro por hacker)
-- ---------------------------------------------------------------------------
create table if not exists checkins (
  id            uuid primary key default gen_random_uuid(),
  hacker_id     uuid not null unique references hackers (id) on delete cascade,
  staff_email   text,
  checked_in_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------
create table if not exists sponsors (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email        text not null,
  phone        text,
  plan         text,
  message      text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Staff (para /staff/scanner y el panel de administracion)
-- ---------------------------------------------------------------------------
create table if not exists staff (
  email      text primary key,
  full_name  text,
  created_at timestamptz not null default now(),
  constraint staff_email_lowercase check (email = lower(email))
);

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from staff s
    where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$fn$;

-- ---------------------------------------------------------------------------
-- Filtro de correo institucional
-- ---------------------------------------------------------------------------
create or replace function is_institutional_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from university_domains d
    join institutions i on i.id = d.institution_id
    where d.domain = split_part(lower(trim(p_email)), '@', 2)
      and i.is_eligible
  );
$fn$;

comment on function is_institutional_email is
  'true si el dominio del correo esta en university_domains. Usar en el registro.';

-- El formulario de registro valida el correo ANTES de que exista sesion,
-- asi que anon tiene que poder ejecutar estas dos.
grant execute on function is_institutional_email(text) to anon, authenticated;

-- Resuelve la institucion a partir del correo (para autocompletar el registro)
create or replace function institution_for_email(p_email text)
returns table (institution_id uuid, institution_name text, short_name text)
language sql
stable
security definer
set search_path = public
as $fn$
  select i.id, i.name, i.short_name
  from university_domains d
  join institutions i on i.id = d.institution_id
  where d.domain = split_part(lower(trim(p_email)), '@', 2)
    and i.is_eligible
  limit 1;
$fn$;

grant execute on function institution_for_email(text) to anon, authenticated;

-- El correo del hacker debe pertenecer a un dominio institucional
create or replace function enforce_institutional_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not is_institutional_email(new.email) then
    raise exception 'El correo % no pertenece a una universidad registrada', new.email
      using errcode = '23514';
  end if;
  return new;
end;
$fn$;

drop trigger if exists hackers_enforce_institutional_email on hackers;
create trigger hackers_enforce_institutional_email
  before insert or update of email on hackers
  for each row execute function enforce_institutional_email();

-- ---------------------------------------------------------------------------
-- Agregados publicos (sin datos personales)
--
-- OJO: tienen que ser funciones SECURITY DEFINER, no vistas. Con RLS activo,
-- un visitante anonimo no puede leer la tabla hackers, asi que una vista normal
-- le devolveria 0 en el contador del home. Estas funciones solo exponen
-- numeros agregados, nunca filas con datos personales.
-- ---------------------------------------------------------------------------
create or replace function get_public_stats()
returns table (
  hackers            bigint,
  teams              bigint,
  universities       bigint,
  projects_submitted bigint,
  checked_in         bigint,
  updated_at         timestamptz
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    (select count(*) from hackers),
    (select count(*) from teams),
    (select count(distinct institution_id) from hackers where institution_id is not null),
    (select count(*) from projects where status = 'submitted'),
    (select count(*) from checkins),
    now();
$fn$;

grant execute on function get_public_stats() to anon, authenticated;

create or replace function get_public_teams()
returns table (
  id           uuid,
  name         text,
  description  text,
  stack        text[],
  level_wanted hacker_level,
  slots_total  smallint,
  is_open      boolean,
  slots_free   integer
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    t.id,
    t.name,
    t.description,
    t.stack,
    t.level_wanted,
    t.slots_total,
    t.is_open,
    greatest(t.slots_total - (select count(*) from hackers h where h.team_id = t.id), 0)::integer
  from teams t
  order by t.is_open desc, t.created_at desc;
$fn$;

grant execute on function get_public_teams() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table institutions       enable row level security;
alter table university_domains enable row level security;
alter table expertises         enable row level security;
alter table teams              enable row level security;
alter table hackers            enable row level security;
alter table join_requests      enable row level security;
alter table projects           enable row level security;
alter table checkins           enable row level security;
alter table sponsors           enable row level security;
alter table staff              enable row level security;

-- Catalogos: lectura publica
drop policy if exists institutions_read on institutions;
create policy institutions_read on institutions for select using (true);

drop policy if exists university_domains_read on university_domains;
create policy university_domains_read on university_domains for select using (true);

drop policy if exists expertises_read on expertises;
create policy expertises_read on expertises for select using (true);

-- Equipos: lectura publica, escritura solo del lider
drop policy if exists teams_read on teams;
create policy teams_read on teams for select using (true);

drop policy if exists teams_insert on teams;
create policy teams_insert on teams for insert to authenticated with check (true);

drop policy if exists teams_update_leader on teams;
create policy teams_update_leader on teams for update to authenticated
  using (leader_id in (select id from hackers where auth_user_id = auth.uid()) or is_staff());

-- Hackers: cada quien ve y edita SOLO su fila; el staff ve todo
drop policy if exists hackers_select_own on hackers;
create policy hackers_select_own on hackers for select to authenticated
  using (auth_user_id = auth.uid() or is_staff());

drop policy if exists hackers_insert_own on hackers;
create policy hackers_insert_own on hackers for insert to authenticated
  with check (auth_user_id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists hackers_update_own on hackers;
create policy hackers_update_own on hackers for update to authenticated
  using (auth_user_id = auth.uid() or is_staff())
  with check (auth_user_id = auth.uid() or is_staff());

-- Solicitudes: las ve el solicitante y el lider del equipo
drop policy if exists join_requests_select on join_requests;
create policy join_requests_select on join_requests for select to authenticated
  using (
    hacker_id in (select id from hackers where auth_user_id = auth.uid())
    or team_id in (
      select t.id from teams t
      join hackers h on h.id = t.leader_id
      where h.auth_user_id = auth.uid()
    )
    or is_staff()
  );

drop policy if exists join_requests_insert on join_requests;
create policy join_requests_insert on join_requests for insert to authenticated
  with check (hacker_id in (select id from hackers where auth_user_id = auth.uid()));

drop policy if exists join_requests_update_leader on join_requests;
create policy join_requests_update_leader on join_requests for update to authenticated
  using (
    team_id in (
      select t.id from teams t
      join hackers h on h.id = t.leader_id
      where h.auth_user_id = auth.uid()
    )
    or is_staff()
  );

-- Proyectos: lectura publica solo si estan entregados
drop policy if exists projects_read_submitted on projects;
create policy projects_read_submitted on projects for select
  using (status = 'submitted' or is_staff());

drop policy if exists projects_write_team on projects;
create policy projects_write_team on projects for all to authenticated
  using (team_id in (select team_id from hackers where auth_user_id = auth.uid()) or is_staff())
  with check (team_id in (select team_id from hackers where auth_user_id = auth.uid()) or is_staff());

-- Check-in: solo staff
drop policy if exists checkins_staff on checkins;
create policy checkins_staff on checkins for all to authenticated
  using (is_staff()) with check (is_staff());

-- Sponsors: cualquiera puede postular, solo staff lee
drop policy if exists sponsors_insert on sponsors;
create policy sponsors_insert on sponsors for insert to anon, authenticated with check (true);

drop policy if exists sponsors_select_staff on sponsors;
create policy sponsors_select_staff on sponsors for select to authenticated using (is_staff());

-- Staff: solo staff se lee a si mismo
drop policy if exists staff_select on staff;
create policy staff_select on staff for select to authenticated using (is_staff());
