---
phase: 14
slug: pdf-ficha-visual-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-21
---

# Phase 14 — Validation Strategy

> Visual polish phase — typecheck gates code; success is visual UAT vs refs.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30–90s |

---

## Sampling Rate

- **After every task commit:** `npm run typecheck`
- **After every plan wave:** `npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full suite + visual UAT vs refs 01–04
- **Max feedback latency:** 120s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-* | 01 | 1 | REQ-26 | — | Tokens/fonts/header; no PHI invent | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 14-02-* | 02 | 2 | REQ-26.3–5 | — | Tables, EVA, dual-col, body map | typecheck + visual | `npm run typecheck` | ❌ | ⬜ pending |
| 14-03-* | 03 | 3 | REQ-26.6 | — | Evolução same chrome | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 14-04-* | 04 | 4 | REQ-26 | — | Visual UAT vs refs | manual | — | — | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Confirm `pdf-lib` already present (no new install)
- [ ] UAT checklist comparing export PDF pages to `refs/01`–`04`

*Existing typecheck/lint covers compile safety.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chapter titles + blocks match refs | REQ-26.1–2 | Visual | Export full ficha; side-by-side with refs |
| Checkbox grids / boxes / underlines | REQ-26.3 | Visual | Inspect dense blocks |
| Dual-col + tables + EVA + body map | REQ-26.4–5 | Visual | Select those blocks; verify layout |
| Evolução chrome | REQ-26.6 | Visual | Export Evolução multi-session |
| No invented blanks | REQ-26 | Visual | Unselected blocks absent |

---

## Validation Sign-Off

- [ ] Auto tasks have typecheck
- [ ] Visual UAT vs refs recorded
- [ ] `nyquist_compliant: true` after UAT pass

**Approval:** pending
