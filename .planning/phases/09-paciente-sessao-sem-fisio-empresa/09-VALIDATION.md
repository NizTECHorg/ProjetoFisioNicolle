---
phase: 09
slug: paciente-sessao-sem-fisio-empresa
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-09-18
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Wave 0: **no Vitest / no new npm packages** (user + RESEARCH constraint). Automated gate = `npm run typecheck`. Behavioral coverage = manual UAT.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (typecheck only; Vitest declined — no new packages) |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~15–40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck`
- **Before `/gsd-verify-work`:** typecheck green + manual UAT matrix below
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | REQ-21 | T-09-01 | Zod factory branches by accountType; RLS unchanged | typecheck | `npm run typecheck` | ✅ tsc | ⬜ pending |
| 09-01-02 | 01 | 1 | REQ-21 | T-09-02 | empty therapist → SQL null, never '' | typecheck | `npm run typecheck` | ✅ tsc | ⬜ pending |
| 09-02-01 | 02 | 2 | REQ-21 | T-09-05 | omit gate only for empresa; null mapping on submit | typecheck | `npm run typecheck` | ✅ tsc | ⬜ pending |
| 09-02-02 | 02 | 2 | REQ-21 | T-09-06 | Sem profissional display; UX predicate not auth | typecheck + manual | `npm run typecheck` | ✅ tsc | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers automated sampling via TypeScript:

- [x] No Vitest install (user constraint: no new npm packages; RESEARCH optional Wave 0 declined)
- [x] `npm run typecheck` is the per-task automated verify
- [x] Manual UAT checklist documents REQ-21 acceptance behaviors

*Existing infrastructure covers phase requirements for automated feedback (typecheck). Unit schema tests deferred.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empresa creates patient without fisioterapeuta | REQ-21.1 | No E2E harness | Login empresa → Pacientes → Novo paciente → save without therapist field |
| Empresa saves session with empty profissional | REQ-21.2 | Shared form needs live auth | Ficha Evoluções or Painel atalho → leave Sem profissional → save; confirm row persists |
| UI shows Sem profissional; edit assigns later | REQ-21.3 | Visual + round-trip | List/viewer/Cadastro show Sem profissional; edit pick therapist → label updates |
| Autônomo/fisio still require therapist in editor | REQ-21.4 | Regression | Login non-empresa → empty profissional blocked; first therapist default still works |
| Null therapist + RLS write on own patient | REQ-21.5 | Hosted Supabase | Empresa session insert on own patient succeeds; no SQL policy changes |
| Phase 8 / Calendar Google untouched | D-06 | Scope guard | Confirm no diff under google-calendar / 08-* during execute |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (`npm run typecheck`)
- [x] Sampling continuity: every task has typecheck (no 3-task gap)
- [x] Wave 0: Vitest explicitly skipped; typecheck is the gate
- [x] No watch-mode flags
- [x] Feedback latency &lt; 60s
- [ ] `nyquist_compliant: true` set in frontmatter (after execute + UAT)

**Approval:** pending
