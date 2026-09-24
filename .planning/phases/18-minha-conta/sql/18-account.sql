-- REQ-29 foto e nome da própria conta. D-03, D-04.
-- Idempotente. O operador cola este arquivo no SQL Editor do Supabase e executa uma vez.
-- Aviso ao operador: não use supabase db push.
--
-- Bucket privado account-avatars. profiles.avatar_url guarda só o path
-- (primeiro segmento = id da conta, UUID, barra, UUID, .jpg ou .png ou .webp).
-- A coluna avatar_url já existe. Não criar photo_path. Não alterar public.patients.
-- Não dropar profiles_update_own. Sem política UPDATE neste bucket. Sem política para anon.
-- Não apagar objetos de storage. Se o bloco abaixo abortar, inspecionar a linha.
-- Não anular avatar_url em massa.

-- ---------------------------------------------------------------------------
-- 1. Bucket privado account-avatars. Nunca público.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'account-avatars',
  'account-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    public = false;

-- ---------------------------------------------------------------------------
-- 2. Legado fora do path aborta. O humano inspeciona. Sem UPDATE para null.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from public.profiles
    where avatar_url is not null
      and (
        avatar_url !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
        or split_part(avatar_url, '/', 1) is distinct from id::text
      )
  ) then
    raise exception 'profiles.avatar_url legado fora do path UUID/extensao. Inspecione a linha. Nao anule em massa.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Ponteiro da foto da conta. Null permanece sem foto.
-- CHECK amarra a pasta ao profiles.id e só aceita .jpg, .png ou .webp.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_avatar_url_shape;

alter table public.profiles
  add constraint profiles_avatar_url_shape
  check (
    avatar_url is null
    or (
      split_part(avatar_url, '/', 1) = id::text
      and avatar_url ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Storage RLS. Sempre bucket_id = 'account-avatars'.
-- Pasta = auth.uid(). Sem política UPDATE (sem upsert). Sem política para anon.
-- Não dropar políticas de outros buckets.
-- ---------------------------------------------------------------------------
drop policy if exists account_avatars_storage_select on storage.objects;
drop policy if exists account_avatars_storage_insert on storage.objects;
drop policy if exists account_avatars_storage_delete on storage.objects;
drop policy if exists account_avatars_storage_update on storage.objects;

create policy account_avatars_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create policy account_avatars_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create policy account_avatars_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

-- ---------------------------------------------------------------------------
-- 5. Coluna de UPDATE para authenticated: só full_name e avatar_url.
-- A policy de self-update permanece. Não revogar select, insert ou delete.
-- Não revogar service_role nem o owner.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from public, anon, authenticated;

grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Recarrega o schema do PostgREST.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
