---
phase: 3
slug: tipos-de-conta-e-equipe
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None. Gates: ESLint 9 + `tsc --noEmit` (TypeScript 5.8.3) |
| **Config file** | `eslint.config.js`, `tsconfig.json` — no vitest/jest config |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run lint && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green + SQL applied + UAT of the four success criteria
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-02-T1 | 03-02 | 1 | REQ-15 | T-03-08 | Inspect live `handle_new_user` before replacing | manual | SQL Editor dump | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03-03 | 2 | REQ-15.1 | T-03-04 | Cadastro exige tipo autônomo/empresa/fisioterapeuta | schema / typecheck | `npm run typecheck` | ✅ auth.schema.ts | ⬜ pending |
| 03-03-T1 | 03-03 | 2 | REQ-15.1 | T-03-04 | Fisio sem código falha Zod | schema / typecheck | `npm run typecheck` | ✅ auth.schema.ts | ⬜ pending |
| 03-05-T2 | 03-05 | 4 | REQ-15.2 | T-03-12 | Empresa vê `/equipe` com código + pendentes | manual UAT | — | — | ⬜ pending |
| 03-04-T3 | 03-04 | 3 | REQ-15.3 | T-03-06, T-03-10, T-03-11 | Fisio pendente autentica mas não acessa clínica | manual + RLS | SQL Editor as pending JWT | ❌ | ⬜ pending |
| 03-05-T2 | 03-05 | 4 | REQ-15.4 | T-03-02 | Autônomo não vê Equipe | manual UAT | — | — | ⬜ pending |
| 03-02-T3 | 03-02 | 1 | REQ-15.5 | T-03-03 | Tipos e vínculos no Supabase | manual | Table Editor after signup | — | ⬜ pending |
| 03-02-T2 / 03-07-T2 | 03-02, 03-07 | 1 / 4 | D-05 / D-07 | T-03-01, T-03-05 | Fisio B cannot SELECT A's patient; empresa cannot UPDATE A's patient | RLS / manual | SQL Editor allow/deny | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Planner must replace TBD task IDs after PLAN.md exists. Automated coverage cannot prove RLS without CLI or a hosted test project — verification steps must include explicit SQL Editor cases (anon, pending fisio, fisio A, fisio B, empresa owner).

---

## Wave 0 Requirements

- [ ] Inspect live `handle_new_user` (blocks SQL authoring) — not a test file
- [ ] Do **not** add Vitest in this phase (no package legitimacy run). Schema unit files are a `/gsd-add-tests` follow-up.
- [ ] Shared fixtures: none

Existing lint/typecheck infrastructure covers compile-time gates. RLS and account-type flows require SQL Editor + UAT.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cadastro exige tipo | REQ-15.1 | No Vitest this phase | Submit register without tipo; expect Zod error. Submit each tipo; persist `account_type`. |
| Fisio sem código falha | REQ-15.1 | No Vitest this phase | Select fisioterapeuta, omit join code; expect Zod error. |
| Empresa vê `/equipe` | REQ-15.2 | UI + RLS | Login as empresa; nav shows Equipe; page shows copyable code + pending list. |
| Fisio pendente bloqueado | REQ-15.3 | Auth gate + RLS | Login as pending fisio; land on `/aguardando`; clinic routes redirect; REST SELECT patients denied. |
| Autônomo sem Equipe | REQ-15.4 | UI visibility | Login as autônomo; Equipe absent from nav; `/equipe` redirects. |
| Tipos e vínculos persistidos | REQ-15.5 | Live DB not in git | After signup, Table Editor shows org/membership rows matching tipo. |
| Isolamento de pacientes | D-05 / D-07 | RLS | Fisio B cannot SELECT A's patient; empresa can SELECT but cannot UPDATE A's patient. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
