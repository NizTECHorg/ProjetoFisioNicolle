---
phase: 4
slug: atalhos-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed. Gates: ESLint 9 + `tsc --noEmit`. Optional Vitest only if planner adds `src/**/*.test.ts` per TESTING.md |
| **Config file** | none — Wave 0 optional |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full suite green + manual overlay pass on `/painel`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | REQ-16.1 | — | Header shows Nova evolução + Nova avaliação | manual | Browser `/painel` | ❌ | ⬜ pending |
| TBD | TBD | TBD | REQ-16.2 | — | Picker then existing session/evaluation form; no second CRUD | manual | Overlay fields | ❌ | ⬜ pending |
| TBD | TBD | TBD | REQ-16.3 | T-04-01 | Picker omits non-writable patients | unit or typecheck | `canWritePatient` / helper | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REQ-16.4 | — | Shortcuts visible for write-capable clinic types | manual | Three account types | ❌ | ⬜ pending |
| TBD | TBD | TBD | D-01 | — | Save closes overlay, URL `/painel` | manual | Save from shortcut | ❌ | ⬜ pending |
| TBD | TBD | TBD | D-02 | — | Cancel/X/Escape closes all | manual | | ❌ | ⬜ pending |
| TBD | TBD | TBD | D-03 | T-04-02 | Ver ficha uses safe `?aba=` path | unit or typecheck | `patientFichaPath` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-04 | — | No “Salvar e registrar outra” | manual | | ❌ | ⬜ pending |
| TBD | TBD | TBD | ASVS V4 | T-04-01 | RLS still blocks teammate write | manual / SQL | Do not mock RLS | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Planner fills Task ID / Plan / Wave when PLAN.md files exist. Executor updates Status.

---

## Wave 0 Requirements

- [ ] Optional: `src/lib/dashboardShortcut.ts` + `src/lib/dashboardShortcut.test.ts` — `writablePatients`, `filterPatientsByName`, `patientFichaPath` (only if planner adds Vitest)
- [ ] Optional: `src/stores/toast.store.test.ts` — action + duration; existing `toast(msg, tone)` still works
- [ ] Do **not** add Playwright this phase
- [ ] Do **not** add Testing Library unless a `.test.tsx` is unavoidable
- [ ] If skipping Vitest: Wave 0 test files skipped; gates remain typecheck + lint + browser verification

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Header CTAs on `/painel` | REQ-16.1 | No E2E runner | Open dashboard; see Nova evolução (primary) and Nova avaliação |
| Overlay reuses existing editors | REQ-16.2 | Visual/form parity | Pick patient; session form is Agendar/Realizada; evaluation form is existing fields |
| Empresa picker omits colleagues | REQ-16.3 / D-07 | Needs two accounts | Empresa account: colleague patients absent from picker, not disabled |
| Save returns to dashboard | D-01 | Browser | Save; URL stays `/painel`; one success toast |
| Cancel closes everything | D-02 | Browser | Cancel/X/Escape; no picker leftover; no success toast |
| Ver ficha | D-03 | Browser | Click toast action; land on `/pacientes/:id?aba=evolucoes` or `?aba=avaliacao` |
| Next record = click again | D-04 | Browser | After save, no “Salvar e registrar outra”; reopen from header |
| RLS teammate write | ASVS V4 | Cannot mock RLS | Empresa cannot insert session/evaluation on teammate patient_id |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
