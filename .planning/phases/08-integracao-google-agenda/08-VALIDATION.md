---
phase: 8
slug: integracao-google-agenda
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-18
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — prefer Vitest if Wave 0 adds tests; otherwise lint+typecheck |
| **Config file** | none — Wave 0 decides |
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
| TBD | TBD | 1 | REQ-20 | T-08-* | No refresh in localStorage; EF vault | typecheck | `npm run typecheck` | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | REQ-20.2 | — | Session → event mapper | unit (if Vitest) | `npx vitest run` mapper | ❌ W0 | ⬜ pending |
| TBD | TBD | 1 | REQ-20.5 | T-08-* | 401/403 → PT reconnect copy | unit (if Vitest) | mapGoogleCalendarError | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Planner fills concrete Task IDs when PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] Decide: add Vitest now vs defer automated tests (no runner in `package.json` today)
- [ ] `mapSessionToGoogleEvent` (+ test if Vitest)
- [ ] `mapGoogleCalendarError` (+ test if Vitest)
- [ ] Human checklist: Google Cloud OAuth + Calendar API + Supabase Google provider + Manual Linking + Edge Function secrets
- [ ] CSP note: prefer EF-only Google calls

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
