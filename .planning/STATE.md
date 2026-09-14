---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready
stopped_at: Phase 4 UI-SPEC approved
last_updated: "2026-09-14T14:00:35.093Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 8
  completed_plans: 8
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** Phase 4 — Atalhos no dashboard (REQ-16); em seguida Phase 5 financeiro autônomo (REQ-17)

## Current Position

- Phase: 4 — Atalhos no dashboard
- Status: Ready to discuss
- Progress: Phase 3 7/7 shipped (UAT humano pendente); Phase 4/5 no roadmap, ainda sem plano

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

### Pending user action

- (adiado) Executar `supabase/patients-req05-evaluations.sql` no SQL Editor
- (adiado) Re-executar `supabase/patients-req14-goals.sql` se ainda não rodou a versão com em_andamento/concluido

### Roadmap Evolution

- Phase 2 added: Metas do tratamento (REQ-14)
- Phase 3 added: Tipos de conta e equipe (REQ-15)
- Phase 4 added: Atalhos no dashboard para criar evolução ou avaliação (REQ-16)
- Phase 5 added: Financeiro do autônomo — valores de consulta e arrecadação (REQ-17)

## Session Continuity

Last session: 2026-09-14T14:00:35.075Z
Stopped at: Phase 4 UI-SPEC approved
Resume file: .planning/phases/04-atalhos-dashboard/04-UI-SPEC.md
