-- Fase 28 — Excluir paciente por completo
-- Rodar no SQL Editor do Supabase (idempotente). Não é migration.

-- ============================================================
-- Bloco 0 — Saída do passo 0 (preencher no plano 28-04)
-- ============================================================


-- ============================================================
-- Bloco 1 — Tombstone (sem PII: só UUIDs e data)
-- ============================================================
create table if not exists private.patient_deletion_tombstones (
  patient_id uuid primary key,
  deleted_by uuid not null,
  deleted_at timestamptz not null default now()
);

alter table private.patient_deletion_tombstones enable row level security;

revoke all on table private.patient_deletion_tombstones from public, anon, authenticated;

-- ============================================================
-- Bloco 2 — Exclusão definitiva, tudo-ou-nada (uma transação)
-- ============================================================
create or replace function public.delete_patient_full(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not (select private.can_write_patient(p_patient_id)) then
    raise exception 'operation_not_permitted' using errcode = '42501';
  end if;

  -- Netos (por sessão)
  delete from public.google_calendar_session_links
  where session_id in (select s.id from public.patient_sessions s where s.patient_id = p_patient_id);

  delete from public.autonomo_session_charges
  where session_id in (select s.id from public.patient_sessions s where s.patient_id = p_patient_id);

  -- Filhos (por paciente)
  delete from public.patient_session_evolutions where patient_id = p_patient_id;
  delete from public.patient_images where patient_id = p_patient_id;
  delete from public.patient_ai_reports where patient_id = p_patient_id;
  delete from public.patient_pain_logs where patient_id = p_patient_id;
  delete from public.patient_focus_areas where patient_id = p_patient_id;
  delete from public.patient_alerts where patient_id = p_patient_id;
  delete from public.patient_goals where patient_id = p_patient_id;
  delete from public.patient_evaluations where patient_id = p_patient_id;
  delete from public.board_cards where patient_id = p_patient_id;
  delete from public.patient_sessions where patient_id = p_patient_id;

  -- Tombstone libera a limpeza de storage depois que patients sumir
  insert into private.patient_deletion_tombstones (patient_id, deleted_by)
  values (p_patient_id, (select auth.uid()))
  on conflict (patient_id) do nothing;

  -- Raiz por último
  delete from public.patients where id = p_patient_id;
end;
$$;

revoke all on function public.delete_patient_full(uuid) from public, anon;
grant execute on function public.delete_patient_full(uuid) to authenticated;

-- ============================================================
-- Bloco 3 — Helper: só o autor limpa a pasta de um paciente apagado
-- ============================================================
create or replace function private.can_cleanup_deleted_patient_files(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from private.patient_deletion_tombstones t
    where t.patient_id = p_patient_id
      and t.deleted_by = (select auth.uid())
  );
$$;

revoke all on function private.can_cleanup_deleted_patient_files(uuid) from public, anon;
grant execute on function private.can_cleanup_deleted_patient_files(uuid) to authenticated;

-- ============================================================
-- Bloco 4 — Policies de limpeza de storage (só select/delete, só authenticated)
-- Permissivas: somam-se às existentes, que não são tocadas.
-- ============================================================
drop policy if exists patient_avatars_storage_cleanup_select on storage.objects;
drop policy if exists patient_avatars_storage_cleanup_delete on storage.objects;
drop policy if exists patient_images_storage_cleanup_select on storage.objects;
drop policy if exists patient_images_storage_cleanup_delete on storage.objects;
drop policy if exists patient_ai_reports_storage_cleanup_select on storage.objects;
drop policy if exists patient_ai_reports_storage_cleanup_delete on storage.objects;

create policy patient_avatars_storage_cleanup_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

create policy patient_avatars_storage_cleanup_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_cleanup_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_cleanup_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

create policy patient_ai_reports_storage_cleanup_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

create policy patient_ai_reports_storage_cleanup_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid))
  );

-- ============================================================
-- Bloco 5 — Finalizar exclusão (retry) e listar pendências
-- ============================================================
create or replace function public.finish_patient_deletion(p_patient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if exists (
    select 1
    from storage.objects o
    where o.bucket_id in ('patient-avatars', 'patient-images', 'patient-ai-reports')
      and o.name like p_patient_id::text || '/%'
  ) then
    return false;
  end if;

  delete from private.patient_deletion_tombstones
  where patient_id = p_patient_id
    and deleted_by = (select auth.uid());

  return found;
end;
$$;

revoke all on function public.finish_patient_deletion(uuid) from public, anon;
grant execute on function public.finish_patient_deletion(uuid) to authenticated;

create or replace function public.list_pending_patient_file_cleanups()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select t.patient_id
  from private.patient_deletion_tombstones t
  where t.deleted_by = (select auth.uid());
$$;

revoke all on function public.list_pending_patient_file_cleanups() from public, anon;
grant execute on function public.list_pending_patient_file_cleanups() to authenticated;

-- ============================================================
-- Checagens no SQL Editor (após Success)
-- ============================================================
-- select proname from pg_proc where proname = 'delete_patient_full';
-- select has_function_privilege('anon', 'public.delete_patient_full(uuid)', 'execute');          -- false
-- select has_function_privilege('authenticated', 'public.delete_patient_full(uuid)', 'execute'); -- true
-- select policyname from pg_policies where schemaname = 'storage' and policyname like '%_storage_cleanup_%'; -- 6 linhas
-- select has_table_privilege('authenticated', 'private.patient_deletion_tombstones', 'select');  -- false

-- ============================================================
-- Bloco 6 — Recarregar schema do PostgREST
-- ============================================================
notify pgrst, 'reload schema';
