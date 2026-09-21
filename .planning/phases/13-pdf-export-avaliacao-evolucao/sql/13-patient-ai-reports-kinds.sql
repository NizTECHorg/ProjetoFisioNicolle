-- REQ-25 Phase 13 kinds avaliacao/evolucao. Idempotente. Cole no SQL Editor.
-- NÃO use supabase db push. NÃO DROP can_*. NÃO DELETE FROM storage.objects.
-- NÃO tornar bucket patient-ai-reports público. NÃO DROP SELECT/DELETE policies.
-- Estende CHECK kind + INSERT WITH CHECK (D-06). Legado geral/sessao permanece.

-- ---------------------------------------------------------------------------
-- Probe opcional (após Success). Não é asserção.
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.patient_ai_reports'::regclass
--   and conname like 'patient_ai_reports_kind%';
-- Esperado: kind in (geral, sessao, avaliacao, evolucao);
-- kind_session: geral|avaliacao|evolucao ⇒ session_id IS NULL; sessao livre (SET NULL).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. kind CHECK — geral | sessao | avaliacao | evolucao (REQ-25.5, D-06).
-- Sem backfill: rows legado kind='geral' ficam como Geral na lista.
-- ---------------------------------------------------------------------------
alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_ck
  check (kind in ('geral', 'sessao', 'avaliacao', 'evolucao'));

-- ---------------------------------------------------------------------------
-- 2. kind ↔ session_id XOR (Pitfall 3 / D-06).
-- geral|avaliacao|evolucao exigem session_id IS NULL.
-- sessao mantém legado nullable após ON DELETE SET NULL.
-- ---------------------------------------------------------------------------
alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_session_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_session_ck check (
    (kind in ('geral', 'avaliacao', 'evolucao') and session_id is null)
    or (kind = 'sessao')
  );

-- ---------------------------------------------------------------------------
-- 3. INSERT WITH CHECK — can_write_patient + XOR na criação (T-13-01).
-- SELECT/DELETE inalterados. sessao ainda exige patient_sessions do mesmo paciente.
-- ---------------------------------------------------------------------------
drop policy if exists patient_ai_reports_insert on public.patient_ai_reports;

create policy patient_ai_reports_insert
  on public.patient_ai_reports
  for insert
  to authenticated
  with check (
    (select private.can_write_patient(patient_id))
    and (
      (
        kind in ('geral', 'avaliacao', 'evolucao')
        and session_id is null
      )
      or (
        kind = 'sessao'
        and session_id is not null
        and exists (
          select 1
          from public.patient_sessions s
          where s.id = session_id
            and s.patient_id = patient_ai_reports.patient_id
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Recarrega o schema do PostgREST (idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (após Success) — D-06 / REQ-25.5:
-- 1. kind='avaliacao' com session_id NULL → INSERT ok (can_write)
-- 2. kind='evolucao' com session_id NULL → INSERT ok (can_write)
-- 3. kind='avaliacao' com session_id NOT NULL → CHECK fail
-- 4. kind='foo' → CHECK fail
-- 5. Phase 3 can_* helpers unchanged; bucket permanece privado
-- ---------------------------------------------------------------------------
