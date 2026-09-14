---
phase: 7
slug: galeria-de-imagens-na-ficha-do-paciente
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-14
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Product plans must not wait on a Vitest harness. Automated command this phase: lint + typecheck. SQL RLS, Storage, and gallery UAT stay manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Vitest is the intended runner (TESTING.md) but is not installed. |
| **Config file** | none — Wave 0 deferred (do not block product plans) |
| **Quick run command** | `npm run lint && npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` plus SQL Editor RLS checklist + browser UAT |
| **Estimated runtime** | ~20 seconds (lint+tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run typecheck`
- **After every plan wave:** Same; SQL Editor smoke if the wave touched `.sql`
- **Before `/gsd-verify-work`:** lint + typecheck green; SQL applied (table + private bucket); browser UAT of upload / filter / empresa read-only / HEIC reject
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 1 | REQ-19.1 *(proposed)* | — | Tab **Imagens**; `aba=imagens` | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 1 | REQ-19.5 *(proposed)* | T-07-01 / T-07-02 | Private bucket; table RLS `can_read_patient` / `can_write_patient` | source + SQL | grep SQL + SQL Editor | ❌ | ⬜ pending |
| TBD | TBD | 2 | REQ-19.2–19.4 *(proposed)* | T-07-03 | Signed URLs; description Zod max 500; avulsa XOR session | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 3 | REQ-19.6 *(proposed)* | T-07-01 | `canWrite` hides Adicionar/Editar/Excluir; no disabled-looking control | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 3 | REQ-19 MIME | T-07-04 | Zod rejects HEIC / oversize | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |

*Filled by planner/executor as PLAN.md tasks exist. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck/lint. Vitest install is **deferred** — product plans must not wait on the harness.

- [ ] Optional later: `vitest` + schema tests (MIME enum jpeg/png/webp, size cap, description max 500)
- [ ] Optional later: RLS JWT matrix as documented SQL comments only (do not mock RLS in the client)

*If none: "Existing infrastructure covers all phase requirements."* — lint + typecheck cover compile-time; Storage/RLS/UAT remain manual.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload JPEG + description + avulsa appears in grid | REQ-19.2–19.4 *(proposed)* | Storage + UI | Writer account, aba Imagens, Adicionar |
| Tie to a sessão; filter Avulsas hides it; filter sessão shows it | REQ-19.3 *(proposed)* | Interaction | Use an existing Evoluções session |
| Lightbox opens; description visible | REQ-19.2 / 19.4 *(proposed)* | Visual | Click thumbnail |
| Edit description; delete confirm removes from grid | Discretion | Modal + Storage | ConfirmDialog **Excluir** |
| HEIC / oversized file rejected in Portuguese | Discretion | Device MIME | iPhone or renamed file |
| Empresa colleague ficha: grid visible, no Adicionar/Excluir | REQ-19.6 *(proposed)* | Two accounts | Same consult banner path |
| Tab visible on 375px (scroll) | Discretion | Layout | Mobile viewport |
| SQL RLS matrix (table + storage.objects) | REQ-19.5 / 19.6 *(proposed)* | Do not mock RLS | SQL Editor as two JWTs |
| 413 → check Storage Settings global limit | Discretion | Dashboard | Only if phone JPEGs fail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
