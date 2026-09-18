---
phase: 8
slug: integracao-google-agenda
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-18
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — deferred Vitest (no new packages this phase); lint + typecheck |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` |
| **Estimated runtime** | ~20–40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run lint && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green + manual UAT connect → export month → reconnect
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 01 | 1 | REQ-20.4 | T-08-02 | No token fields on DTOs | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 08-01-T2 | 01 | 1 | REQ-20.5 / D-08 | T-08-01 T-08-03 | Mapper allow-list + PT errors | lint+typecheck | `npm run lint && npm run typecheck` | ✅ | ⬜ pending |
| 08-02-T1 | 02 | 1 | REQ-20.3 / D-09 | T-08-04 T-08-05 | Secrets revoke; link PK | file+diff+grep | dual-path SQL gates in PLAN | ✅ | ⬜ pending |
| 08-02-T2 | 02 | 1 | REQ-20.3 | T-08-04 | Auth cannot SELECT secrets | manual | SQL Editor checklist | ✅ | ⬜ pending |
| 08-03-T1 | 03 | 2 | REQ-20.2 / REQ-20.3 | T-08-07–12 | EF vault + RLS export | file+grep | function source gates in PLAN | ✅ | ⬜ pending |
| 08-03-T2 | 03 | 2 | REQ-20.3 | T-08-07 T-08-12 | Deploy + Function secrets | manual | Dashboard/CLI deploy checklist | ✅ | ⬜ pending |
| 08-04-T1 | 04 | 3 | REQ-20.1 / REQ-20.3 | T-08-08 T-08-11 | linkIdentity + no localStorage tokens | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 08-04-T2 | 04 | 3 | REQ-20.5 | T-08-03 | Hooks toast PT reconnect | lint+typecheck | `npm run lint && npm run typecheck` | ✅ | ⬜ pending |
| 08-05-T1 | 05 | 4 | REQ-20.1–20.5 / D-03 | T-08-13 T-08-14 | Export-only strip | lint+typecheck | `npm run lint && npm run typecheck` | ✅ | ⬜ pending |
| 08-05-T2 | 05 | 4 | REQ-20 | — | Live OAuth/export UAT | manual | VALIDATION manual table | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Decide: defer Vitest (no new packages); gate on lint+typecheck + manual UAT
- [x] `mapSessionToGoogleEvent` planned in 08-01 (pure; tests deferred)
- [x] `mapGoogleCalendarError` planned in 08-01
- [x] Human checklist: Google Cloud OAuth + Calendar API + Supabase Google provider + Manual Linking + Edge Function secrets (08-03 Task 2)
- [x] CSP note: prefer EF-only Google calls (08-03) — page CSP may stay unchanged

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Connect / disconnect Google from `/agenda` | REQ-20.1 | OAuth UI + Google consent | Login → Agenda → Conectar → approve → see connected email → Desconectar |
| Export month sessions to Google Calendar | REQ-20.2 | Live Google API | With connection active, export visible month; verify events in Google Calendar |
| Token revoke → reconnect path | REQ-20.5 | Live token state | Revoke app in Google Account → export → Portuguese error → reconnect |
| Secrets table not readable by authenticated | REQ-20.3 | SQL / RLS | As authenticated user, SELECT on secrets table fails; service_role only |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 / human-check dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Vitest deferred intentionally)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
