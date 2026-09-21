---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: phase_15_planned
stopped_at: Planned 15-01…15-03 (email Fluxo confirmação)
last_updated: "2026-09-21T23:15:00.000Z"
progress:
  total_phases: 15
  completed_phases: 6
  total_plans: 58
  completed_plans: 44
  percent: 43
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** Phase 15 — E-mail Fluxo de confirmação de conta (planned)

## Current Position

Phase: 15 (email-fluxo-confirmacao-conta) — PLANNED
Plan: 0 of 3

- Status: 3 plans created (15-01…15-03); next `/gsd-execute-phase 15`
- Progress: CONTEXT + RESEARCH + PATTERNS + VALIDATION + PLANs ready; Dashboard SMTP human gate in 15-02

**Progress:** Phase 15 planned — execute next (Phase 14 still pending execution if not started)

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
- [Phase 06]: FOCUS_REGION_KEYS is the locked UI-SPEC 30-key tuple; RESEARCH 38-key draft unused (D-08) — UI-SPEC catalog wins over RESEARCH 38-key table
- [Phase 06]: focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS); keys are not duplicated in patient.schema.ts — Single tuple is the write-time catalog lock
- [Phase 06]: _l/_r map to the patient's left/right: front view mirrors, back view does not — Clinical body map convention
- [Phase 06]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03/05)
- [Phase 06]: region_key stays nullable; leftover label-only rows are not SET NOT NULL or backfilled (D-09, Pitfall 8) — Front/back share Portuguese labels; leftovers must stay readable
- [Phase 06]: Phase 3 patient_focus_areas_select/insert/update/delete policies left intact; no DROP/CREATE POLICY (D-09, D-10) — T-06-01: existing can_write_patient RLS remains the write wall
- [Phase 06]: Focus writes use throwIfFocusError + mapDbError; existing throwIfError stays for other patient CRUD — Pitfall 9, T-06-01
- [Phase 06]: Unmark DELETEs the patient_focus_areas row; empty state is focusAreas.length === 0 — D-06
- [Phase 06]: INSERT 23505 unique race returns marked without Já existe um registro — Pitfall 7
- [Phase 06]: useTogglePatientFocusArea closes over ficha patientId; mutate argument is regionKey only — T-06-02
- [Phase 06]: Chip is the only write control; path click never calls mutate (D-06)
- [Phase 06]: HOVER_OPEN_MS = 500 for fine hover; coarse/touch and prefers-reduced-motion open immediately (D-05)
- [Phase 06]: When !canWrite the chip is unmounted, paths omit tabIndex, cursor-default, no hover preview (D-10)
- [Phase 06]: Coarse pointerleave does not close the chip so a finger-lift cannot dismiss before the second tap
- [Phase 07]: MAX_BATCH_FILES is 10 so later lote UI can reject the surplus
- [Phase 07]: sessionRemoved is the D-07 flag; sessionId null alone does not distinguish avulsa-original vs órfã
- [Phase 07]: mapStorageError permission path reuses mapDbError with code 42501 so copy stays Você não tem permissão para esta ação.
- [Phase 07]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03/05/06)
- [Phase 07]: session_id ON DELETE SET NULL so deleting a sessão does not delete photos (D-06) — Photos remain on the ficha as avulsa; client must not CASCADE delete storage objects
- [Phase 07]: session_removed boolean default false; BEFORE DELETE on patient_sessions sets it true (D-07) — Do not use UPDATE OF session_id on patient_images; that would fight Editar avulsa
- [Phase 07]: Table and storage.objects policies call private.can_read_patient / can_write_patient; Phase 3 helpers are not rewritten (D-11) — ASVS 4.1.1 — RLS remains the write wall; empresa is not a writer
- [Phase 07]: Export invalidatePatient from usePatients so image mutations share the same key set as session delete — Plain helper, not a hook; usePatients.ts already has allowConstantExport
- [Phase 07]: Path is patientId/randomUUID.ext with upsert false; never user filenames — T-07-05: service builds the Storage path from the route patient id plus crypto.randomUUID
- [Phase 07]: Batch upload skips invalid MIME/size files and returns successes; throws first mapped message only if none succeed — D-04: one bad file must not abort the lote; Portuguese copy still surfaces when every file fails
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Fail-closed canWrite default false on PatientImagesPanel (Pitfall 6 — do not copy Evoluções default true) — A missed canWrite prop must not show write chrome; Evoluções default true is the analog pitfall.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Empty/filter-empty states are heading-only this plan so copy never points at a missing Adicionar button — Adicionar imagem ships in 07-05; UI-SPEC empty body would instruct tapping a button that is not mounted.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: D-07: tile always Avulsa for null/orphan sessionId; lightbox shows Sessão removida. when sessionRemoved — CONTEXT wins over UI-SPEC; tile stays Avulsa including orphans until Editar save in 07-05.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Tirar foto mounts only when matchMedia (max-width: 767px); Escolher arquivos is first focus and has multiple without capture — D-01: Tailwind md is 768px; CONTEXT < ~768px. Camera capture=environment must not sit on the gallery input.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Compartilhar uses navigator.share with a File from the signed-URL blob and is hidden when share or canShare files is missing; never clipboard signed URL — D-10/D-12: share bytes, not a durable URL; AbortError from dismiss is silent.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Empty and filter-empty bodies instruct Adicionar only when canWrite; ConfirmDialog cancelLabel is Voltar — D-11 hide-write; UI-SPEC empty body would mislead consult-only users; image ConfirmDialog must not ship Cancelar.
- [Phase 08]: Import GOOGLE_CALENDAR_COPY into mapGoogleCalendarError to avoid copy drift — Single source for UI-SPEC reconnect/network/export strings
- [Phase 08]: DEFAULT_EVENT_DURATION_MS = 60 minutes; timeZone America/Sao_Paulo — Claude discretion locked in plan interfaces
- [Phase 08]: Omit location when place is empty or em dash placeholder — CalendarSession uses — as empty place sentinel
- [Phase 08]: SQL Editor only for Google Calendar schema; never supabase db push — Supabase CLI not installed; /supabase/ gitignored; same dual-path as Phase 5/7
- [Phase 08]: google_calendar_secrets REVOKE ALL from authenticated with no GRANT — REQ-20.3 / T-08-04 — tokens only via Edge Function service_role
- [Phase 08]: session_links PK (user_id, session_id); no google_event_id on patient_sessions — D-09 / Pitfall 5 — per-user event links for idempotent re-export

### Pending user action

- (adiado) Executar `supabase/patients-req05-evaluations.sql` no SQL Editor
- (adiado) Re-executar `supabase/patients-req14-goals.sql` se ainda não rodou a versão com em_andamento/concluido

### Roadmap Evolution

- Phase 2 added: Metas do tratamento (REQ-14)
- Phase 3 added: Tipos de conta e equipe (REQ-15)
- Phase 4 added: Atalhos no dashboard para criar evolução ou avaliação (REQ-16)
- Phase 5 added: Financeiro do autônomo — valores de consulta e arrecadação (REQ-17)
- Phase 6 added: Silhueta de áreas de foco — marcar partes do corpo na ficha (REQ-18)
- Phase 7 added: Galeria de imagens na ficha do paciente
- Phase 8 added: Integração Google Agenda — exportar sessões da agenda da aplicação para o Google Calendar

## Session Continuity

Last session: 2026-09-18T22:30:20.256Z
Stopped at: Completed 08-02-PLAN.md
Resume file: None

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
| Phase 06 P01 | 7min | 2 tasks | 4 files |
| Phase 06 P02 | 9min | 2 tasks | 1 files |
| Phase 06 P03 | 4min | 2 tasks | 2 files |
| Phase 06 P04 | 6min | 2 tasks | 2 files |
| Phase 07 P01 | 5min | 2 tasks | 3 files |
| Phase 07 P02 | 7min | 2 tasks | 1 files |
| Phase 07 P03 | 3min | 2 tasks | 3 files |
| Phase 07 P04 | 4min | 3 tasks | 4 files |
| Phase 07-galeria-de-imagens-na-ficha-do-paciente P05 | 5min | 2 tasks | 1 files |
| Phase 08 P01 | 5min | 2 tasks | 4 files |
| Phase 08 P02 | 6min | 2 tasks | 2 files |
