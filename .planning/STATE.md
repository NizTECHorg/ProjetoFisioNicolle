---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready
stopped_at: Completed 03-03-PLAN.md
last_updated: "2026-09-09T20:26:48.458Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 8
  completed_plans: 4
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** Phase 3 — Tipos de conta e equipe

## Current Position

Phase: 3 (Tipos de conta e equipe) — EXECUTING
Plan: 4 of 7

- Phase: 3 — Tipos de conta e equipe
- Status: Ready to execute
- Progress: Phase 3 executing (3/7 plans, Wave 1 SQL applied, cadastro tipo/código shipped); Phase 2 (REQ-14) código pronto; Phase 1 (REQ-05) adiada

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

### Pending user action

- (adiado) Executar `supabase/patients-req05-evaluations.sql` no SQL Editor
- (adiado) Re-executar `supabase/patients-req14-goals.sql` se ainda não rodou a versão com em_andamento/concluido

### Roadmap Evolution

- Phase 2 added: Metas do tratamento (REQ-14)
- Phase 3 added: Tipos de conta e equipe (REQ-15)

## Session Continuity

Last session: 2026-09-09T20:26:48.437Z
Stopped at: Completed 03-03-PLAN.md
Resume file: None
