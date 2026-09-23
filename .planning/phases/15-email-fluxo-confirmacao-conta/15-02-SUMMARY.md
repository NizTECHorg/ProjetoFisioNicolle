---
phase: 15-email-fluxo-confirmacao-conta
plan: 02
subsystem: auth
tags: [supabase-auth, emailRedirectTo, implicit-flow, gotrue, fluxo]

requires:
  - phase: 15-email-fluxo-confirmacao-conta
    provides: D-07 replan — production origin and confirm-on-any-device, not PKCE
provides:
  - env.appUrl rejects localhost, loopback, .local, and non-https overrides
  - Supabase client pinned to flowType implicit
  - /auth/confirm copy for an already-used or expired link
affects:
  - 15-03 confirm template ConfirmationURL
  - 15-04 Dashboard allow-list and VITE_APP_URL check

tech-stack:
  added: []
  patterns:
    - Auth email redirect origin is PRODUCTION_APP_URL unless VITE_APP_URL is https and non-local
    - Typed OTP verify is a single verifyOtp; multi-type fallback only when the URL has no type

key-files:
  created: []
  modified:
    - src/config/env.ts
    - src/lib/supabase/client.ts
    - src/lib/auth/confirmCallback.ts
    - src/pages/auth/AuthConfirmPage.tsx

key-decisions:
  - "emailRedirectTo origin is https://fluxofisio.vercel.app unless VITE_APP_URL is an https non-local origin"
  - "flowType stays implicit so GoTrue /auth/v1/verify confirms without a PKCE code verifier"
  - "A spent confirm link tells the user to enter with e-mail and senha instead of a dead error"

patterns-established:
  - "Never window.location.origin for Auth emailRedirectTo"
  - "Consumed confirm result is optional on the failure branch so AuthProvider stays unchanged"

requirements-completed: []  # REQ-27 stays open; 15-02 is the SPA precondition. Full mark after 15-04.

duration: 3min
completed: 2026-09-23
---

# Phase 15 Plan 02: Production confirm redirect and implicit flow Summary

**Signup `emailRedirectTo` is pinned to `https://fluxofisio.vercel.app/auth/confirm`, the Supabase client stays on implicit flow so GoTrue can confirm from any device, and a spent link tells the user to sign in with e-mail and senha.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-23T22:52:37Z
- **Completed:** 2026-09-23T22:55:52Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- `resolveAppUrl` accepts `VITE_APP_URL` only when it parses as `https:` and the host is not `localhost`, `127.0.0.1`, `::1` / `[::1]`, or `*.local`; every other value falls back to `https://fluxofisio.vercel.app`
- `signUpWithEmail` still sends `emailRedirectTo: ${env.appUrl}/auth/confirm` with no `window.location`
- `flowType: 'implicit'` stays pinned, with `detectSessionInUrl`, `persistSession`, and `autoRefreshToken` unchanged
- An explicit OTP `type` is verified once; `error_code` `otp_expired` / `access_denied` (query or hash) and expired/already-used verify errors set `consumed` and the confirm page asks the user to enter with e-mail and senha

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin the production origin used by Auth e-mail links** - `96ec26a` (feat)
2. **Task 2: Lock the implicit flow and handle an already-used confirm link** - `db39ee0` (feat)

**Plan metadata:** docs(15-02) close-out commit

## Files Created/Modified

- `src/config/env.ts` — `PRODUCTION_APP_URL` plus https non-local override check for `env.appUrl`
- `src/lib/supabase/client.ts` — implicit-flow comment stating why PKCE rolled confirmation back
- `src/lib/auth/confirmCallback.ts` — single-type `verifyOtp` and optional `consumed` on failure
- `src/pages/auth/AuthConfirmPage.tsx` — Portuguese copy for an already-used or expired link, existing login button

`src/services/auth.service.ts` was verified and left unchanged. `src/services/googleCalendar.service.ts`, `src/routes/index.tsx`, and `src/providers/AuthProvider.tsx` were not modified.

## Decisions Made

- A mistaken or local `VITE_APP_URL` must not become `emailRedirectTo`. Only an https origin that is not localhost, loopback, or `.local` overrides production.
- PKCE stays off. The confirm CTA hits GoTrue `/auth/v1/verify`, which confirms the account server-side and issues the session in the hash without a code verifier from the signup browser.
- Spent links (`otp_expired`, `access_denied`, or a verify error that says the link expired or was already used) use a distinct page message: the account may already be confirmed, so try e-mail and senha, and cadastre again only if login is refused. Error strings still pass through `mapAuthError`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 15-03 (Confirm signup template uses `{{ .ConfirmationURL }}` so GoTrue verifies before the redirect). REQ-27 stays unchecked: this plan is the SPA precondition; Dashboard SMTP, template paste, and a new cadastro UAT remain in 15-03 and 15-04.

## Self-Check: PASSED

- FOUND: src/config/env.ts
- FOUND: src/lib/supabase/client.ts
- FOUND: src/lib/auth/confirmCallback.ts
- FOUND: src/pages/auth/AuthConfirmPage.tsx
- FOUND: 96ec26a
- FOUND: db39ee0
- `PRODUCTION_APP_URL` is `https://fluxofisio.vercel.app`
- `flowType: 'implicit'` is present; `window.location` is absent from `src/config/env.ts` and `src/services/auth.service.ts`

---
*Phase: 15-email-fluxo-confirmacao-conta*
*Completed: 2026-09-23*
