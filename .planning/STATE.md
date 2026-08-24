# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-23)

**Core value:** Documentar cada atendimento (sessão + evolução) e manter futuros na Agenda.

**Current focus:** REQ-08 — Evoluções por sessão (implementação)

## Current Position

- Phase: REQ-08 (brownfield feature)
- Status: código entregue; aguardando SQL no Supabase + UAT
- Progress: UI + service + seeds SQL prontos

## Accumulated Context

### Decisions

- Sessão + evolução 1:1
- Toggle Agendar / Realizada
- Estado + condutas obrigatórios
- Profissional selecionável (profiles)
- Futuras em `patient_sessions` (Agenda)
- Seeds só no SQL; lista UI vazia sem fake cards

### Pending user action

- Executar `supabase/patients-req08-evolutions.sql` no SQL Editor

## Session Continuity

Last session: 2026-08-23 — sintetizou PROJECT.md e implementou aba Evoluções + CRUD + SQL seeds.
