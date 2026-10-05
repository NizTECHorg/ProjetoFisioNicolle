-- ---------------------------------------------------------------------------
-- Migration 20 — Security Hardening & Access Revocation
-- Idempotente. Cole no SQL Editor do Supabase.
-- ---------------------------------------------------------------------------

-- 1. Revogação de Membro Ativo pelo Dono da Empresa (Broken Access Control fix)
create or replace function public.revoke_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_profile_id uuid;
  v_role text;
begin
  select m.organization_id, m.profile_id, m.role
    into v_org_id, v_profile_id, v_role
  from public.organization_memberships m
  where m.id = p_membership_id;

  if v_org_id is null then
    raise exception 'Membro não encontrado';
  end if;

  if not (select private.is_org_owner(v_org_id)) then
    raise exception 'Somente o dono da empresa pode revogar membros';
  end if;

  if v_role = 'owner' then
    raise exception 'Não é possível revogar o dono da organização';
  end if;

  update public.organization_memberships
  set status = 'rejected'
  where id = p_membership_id;

  update public.profiles
  set is_active = false
  where id = v_profile_id;
end;
$$;

revoke all on function public.revoke_membership(uuid) from public, anon;
grant execute on function public.revoke_membership(uuid) to authenticated;

-- 2. Atualização de RLS no bucket account-avatars: permitir visualização por colegas de equipe
drop policy if exists account_avatars_storage_select on storage.objects;

create policy account_avatars_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'account-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.can_view_profile(((storage.foldername(name))[1])::uuid))
    )
  );

-- 3. Desativar / Bloquear RPC legada admin_update_profile se existir no banco
create or replace function public.admin_update_profile(
  target_user_id uuid,
  new_role text default null,
  new_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Operação desativada por motivos de segurança.';
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, boolean) from public, anon, authenticated;

notify pgrst, 'reload schema';
