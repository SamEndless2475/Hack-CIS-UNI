-- Bucket para las fotos del carnet.
--
-- Es publico en lectura (el carnet se comparte en redes, la foto tiene que
-- cargar sin sesion) pero cada hacker solo puede escribir dentro de su propia
-- carpeta: badge-photos/<hacker_id>/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'badge-photos',
  'badge-photos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- La carpeta tiene que ser el id del hacker que tiene la sesion abierta.
create or replace function owns_badge_folder(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from hackers h
    where h.auth_user_id = auth.uid()
      and h.id::text = split_part(p_path, '/', 1)
  );
$fn$;

grant execute on function owns_badge_folder(text) to authenticated;

drop policy if exists badge_photos_public_read on storage.objects;
create policy badge_photos_public_read on storage.objects
  for select
  using (bucket_id = 'badge-photos');

drop policy if exists badge_photos_insert_own on storage.objects;
create policy badge_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'badge-photos' and owns_badge_folder(name));

drop policy if exists badge_photos_update_own on storage.objects;
create policy badge_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'badge-photos' and owns_badge_folder(name))
  with check (bucket_id = 'badge-photos' and owns_badge_folder(name));

drop policy if exists badge_photos_delete_own on storage.objects;
create policy badge_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'badge-photos' and owns_badge_folder(name));
