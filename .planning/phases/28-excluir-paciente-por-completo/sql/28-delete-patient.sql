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
