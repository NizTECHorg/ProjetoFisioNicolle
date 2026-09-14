---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: milestone_complete
stopped_at: Milestone complete (Phase 5 was final phase)
last_updated: 2026-09-14T19:17:18.591Z
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 17
  completed_plans: 17
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** Milestone complete

## Current Position

Phase: 5
Plan: Not started

- Status: Phase complete — ready for verification
- Progress: Phase 5 plans 01–05 shipped (contracts, SQL, service, session editor, AutonomoFinancePage)

**Progress:** [██████████] 100%

## Accumulated Context

### Decisions

- Avaliação estruturada em `patient_evaluations` (Supabase) — Phase 1
- REQ-05 adiado: código existe; SQL/UAT ficam para depois
- Metas no Resumo; clique no card = concluído / em andamento — Phase 2
- Phase 3 não depende do SQL das fases anteriores
- [Phase 03]: Account types are autonomo | empresa | fisioterapeuta in account.ts, not EmployeeRole — Keep bakery Profile.role untouched; clinic gating uses AccountType
- [Phase 03]: canManageTeam / canWritePatient are UX-only; Plan 03-02 RLS is the authority — ASVS 4.1.1 — client predicates can be skipped; RLS must enforce D-05/D-07
- [Phase 03]: Org + membership interfaces (not extra columns only on profiles) — Accept/reject safety and join code live on org/membership, not a person-row
- [Phase 03]: Preserve bakery profiles.role='atendente' on handle_new_user; clinic type is account_type — Live dump inserts role; do not drop bakery column
- [Phase 03]: ALTER patients.created_by before private helpers (Postgres 42703) — CREATE FUNCTION validates body immediately; first Editor apply failed
- [Phase 03]: SQL Editor is the apply path; supabase/ copy is gitignored — Supabase CLI is not installed; hosted Editor is the only apply path
- [Phase 03]: Zod enum message covers empty Select so required_error stays without preprocess — Zod 3 forbids required_error + errorMap; preprocess broke zodResolver types
- [Phase 03]: Fisio stays on cadastro with pending copy; GuestRoute in 03-04 owns /aguardando — Plan 03-03 must not navigate; 03-04 owns pending session redirect
- [Phase 03]: team.service is the only org/membership client; no profiles.update — D-04 reject is RPC-only; T-03-03 no client membership insert
- [Phase 03]: Batch-resolve createdByName via one profiles select; do not JS-filter patients — RLS is the authority; empresa needs the name for Ficha de {nome} in 03-07
- [Phase 03]: Leave listActiveTherapists unchanged; RLS can_view_profile is the tenant scope — Plan 03-02 already scopes profiles SELECT to self or active org teammates
- [Phase 03]: Fisio + null membership is not authenticated; route that state to /aguardando — D-03 fail-closed: missing or failed membership must not grant clinic access
- [Phase 03]: isLoading stays true until profile AND membership fetches settle — Do not flip ready after profile alone; pending vs clinic depends on membership
- [Phase 03]: Waiting CTA is Sair da conta; rejected keeps Sair e voltar ao login — UI FLAG overrides UI-SPEC single-word Sair on waiting
- [Phase 03]: Equipe is drawer-only via clinicNavigationItems; mobileNavItems stays 4 items — UI-SPEC: Equipe is not on the bottom bar; empresa reaches it from the hamburger drawer
- [Phase 03]: FLAG CTAs Aceitar pedido, Recusar pedido, Voltar sem recusar; confirm Recusar e cancelar conta — UI FLAG overrides shorter Aceitar/Recusar/Voltar table copy
- [Phase 03]: Copiar código uses visible text plus aria-label; clipboard writes raw 8 characters — UI-SPEC primary persistent action plus FLAG aria-label; display is XXXX XXXX only
- [Phase 03]: Reject cancels through decide_membership RPC only; page never updates profiles — D-04 / T-03-12: RPC re-checks owner; TeamPage is UX only
- [Phase 03]: Forward canWrite through PatientEvaluationPanel because PhysicalEvaluationPanel is nested there, not PatientPage — PhysicalEvaluationPanel mounts inside EvaluationPanel; page-only canWrite would leave default true on exame físico.
- [Phase 03]: Hide write controls; do not disable buttons that look tappable — D-07 / UI-SPEC: disabled controls still look interactive and fail under RLS.
- [Phase 04]: Optional ToastAction on existing Zustand toast; 6000ms only when action present — D-03 Ver ficha without a second notification library
- [Phase 04]: writablePatients fail-closed when viewerId missing; canWritePatient UX-only — T-04-01; RLS remains authority
- [Phase 04]: Create-session/evaluation hooks take optional toastOptions; ficha callers unchanged — One success toast; TanStack hook onSuccess runs before mutate onSuccess
- [Phase 04]: PatientSessionEditorForm is the shared create/edit body; ficha Modal wraps it; dashboard will mount the form without the panel — REQ-16.2; dashboard mounts the form, not the list panel
- [Phase 04]: Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; shortcut chrome is prop-driven — D-03 one toast; D-02 cancel/submit labels as props
- [Phase 04]: PatientEvaluationEditorForm is the shared create/edit body; ficha wraps it inline; dashboard will mount the form without the panel — REQ-16.2; dashboard mounts the form, not the list panel
- [Phase 04]: Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; showInnerHeading and chrome labels are prop-driven — D-03 one toast; D-02 cancel/submit labels as props; Modal title owns Nova avaliação on the shortcut
- [Phase 04]: Optional draft prop preserves PDF import prefill after extract — draftFromPdf stays on the panel; form must accept create draft without fetching the evaluation list
- [Phase 04]: Shortcut wizard state lives in DashboardClinicalShortcut, not a URL query — D-01 stay on /painel until Ver ficha or Ir para pacientes
- [Phase 04]: Header click while overlay open resets to picker for that kind; editor cancel closes entirely — D-04 start from zero; D-02 cancel/X/Escape must not reopen picker
- [Phase 04]: Shortcut calls usePatients again on queryKey ['patients']; dashboard metrics stay unfiltered — Same cache as dashboard cards; empresa colleague rows remain in metrics
- [Phase 05]: Catalog form is name + positive BRL string, not two location-tied fees (D-02) — CONTEXT D-02 overrides ROADMAP two-fee wording
- [Phase 05]: canSeeFinance true only for autonomo; empresa and fisio are false; UX only (D-01) — ASVS 4.1.1 — client predicates can be skipped; Plan 05-02 RLS is the wall
- [Phase 05]: sessionFormSchema keeps place as optional clinical text and copies XOR/Pago superRefine (D-05, D-06, D-08) — Local stays clinical; catalog XOR avulso; Pago requires amount
- [Phase 05]: Boolean(priceId) treats a hidden archived catalog id as allocation; Pago without catalog or parseable avulso fails — Archived catalog snapshots must not become Avulso in Zod
- [Phase 05]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03)
- [Phase 05]: Dedicated autonomo_prices and autonomo_session_charges; no money columns on patient_sessions (T-05-01) — empresa already SELECTs patient_sessions via private.can_read_patient; money must not ride those rows
- [Phase 05]: Snapshot trigger preserve-not-recopy: same price_id UPDATE copies amount_brl and price_name from OLD without SELECT live catalog (D-04, D-07) — Catalog price edits must not rewrite existing charge snapshots or mark-paid updates
- [Phase 05]: FORCE RLS owner+autonomo; GRANT select/insert/update only; no DELETE policy (D-01, D-03) — Archive is UPDATE archived_at; empresa and fisio get 0 rows
- [Phase 05]: upsertSessionCharge omits client amount when priceId is set; skips write when both priceId and adHoc are empty (D-10 optional allocation) — Trigger copies catalog on INSERT; empty allocation must not insert a zero row
- [Phase 05]: markChargePaid is UPDATE is_paid only so the snapshot trigger preserve-not-recopy leaves amount_brl and price_name (D-04, D-07) — Same-price_id UPDATE must not recopy live catalog
- [Phase 05]: listFinanceRealizadas is realizadas only, no charge embed on the sessions query; empty array not fake rows (D-10, T-05-01) — empresa already SELECTs patient_sessions; money must not ride those rows
- [Phase 05]: invalidatePatient also invalidates queryKey ['finance'] so /financeiro does not stay stale (Pitfall 8) — Session writes would otherwise leave totals and realizadas cache stale
- [Phase 05]: createSession.mutate still accepts UpsertPatientSessionInput & { charge? }; update keeps { sessionId, input, evolutionId, charge? } so callers that omit charge compile — Locked 05-04 mutate API; Task 2 must not wrap as { input, charge }
- [Phase 05]: Archived priceId stays on a hidden input; Select is visual-only and never register('priceId') — Native Select omitting archived options would submit empty and rewrite snapshots as Avulso
- [Phase 05]: Skip upsert when both XOR fields are empty so an existing charge row is untouched — Clearing money is out of scope; empty allocation must not insert a zero row
- [Phase 05]: CalendarPage is unchanged; D-05 agenda money remains deferred — Allocate later from ficha, dashboard shortcut, or /financeiro
- [Phase 05]: Drawer-only Wallet Financeiro after clinic items; Equipe still empresa-only; mobileNavItems.length === 4 — D-01
- [Phase 05]: canSeeFinance Navigate to /pacientes silent, no toast; do not reuse FinancePage or canManageFinance — D-01
- [Phase 05]: Three totals from RPC formatCurrency; not derived from the realizadas list — D-08 D-09
- [Phase 05]: Catalog archives with ConfirmDialog; Completar valor XOR + Pago; Marcar como pago immediate — D-03 D-10

### Pending user action

- (adiado) Executar `supabase/patients-req05-evaluations.sql` no SQL Editor
- (adiado) Re-executar `supabase/patients-req14-goals.sql` se ainda não rodou a versão com em_andamento/concluido

### Roadmap Evolution

- Phase 2 added: Metas do tratamento (REQ-14)
- Phase 3 added: Tipos de conta e equipe (REQ-15)
- Phase 4 added: Atalhos no dashboard para criar evolução ou avaliação (REQ-16)
- Phase 5 added: Financeiro do autônomo — valores de consulta e arrecadação (REQ-17)

## Session Continuity

Last session: 2026-09-14T19:09:09.557Z
Stopped at: Phase 5 executed — awaiting human UAT
Resume file: .planning/phases/05-financeiro-autonomo/05-HUMAN-UAT.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 04 P01 | 3min | 3 tasks | 5 files |
| Phase 04 P02 | 3min | 2 tasks | 2 files |
| Phase 04 P03 | 3min | 2 tasks | 2 files |
| Phase 04 P04 | 3min | 2 tasks | 2 files |
| Phase 05 P01 | 3min | 2 tasks | 4 files |
| Phase 05 P02 | 10min | 2 tasks | 1 files |
| Phase 05 P03 | 2min | 2 tasks | 3 files |
| Phase 05 P04 | 4min | 2 tasks | 3 files |
| Phase 05 P05 | 4min | 3 tasks | 3 files |
