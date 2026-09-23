---
phase: 15-email-fluxo-confirmacao-conta
verified: 2026-09-23T23:27:24Z
status: passed
score: 11/11 must-haves verified
overrides_applied: 0
---

# Phase 15: E-mail Fluxo de confirmação de conta Verification Report

**Phase Goal:** O e-mail de autorização/confirmação na criação de conta é personalizado da Fluxo (marca + copy), enviado por um e-mail próprio do operador por enquanto — sem depender do remetente/template genérico do Supabase.
**Verified:** 2026-09-23T23:27:24Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

A new signup sends `emailRedirectTo` to `https://fluxofisio.vercel.app/auth/confirm`. Localhost, loopback, `.local`, and `http` overrides are rejected. The paste-ready templates use a bare `{{ .ConfirmationURL }}`, so GoTrue verifies the account on `/auth/v1/verify` before that redirect. The Supabase client stays on implicit flow, and `/auth/confirm` is a public route. The operator replied only `approved` on 2026-09-23. The runbook marks REQ-27.1–27.7 Pass from that reply and states that the confirmation timestamp, the click device, and a separate sign-in sentence were not supplied. Those three values are not in this report.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Cadastro dispara e-mail de confirmação com marca/copy Fluxo | ✓ VERIFIED | `RegisterPage` calls `signUpWithEmail`. `templates/confirm-signup.html` is Fluxo-branded (`#0b1d36`, copy in PT-BR, CTA “Confirmar e-mail”). Runbook REQ-27.5 is Pass from the operator reply `approved` on 2026-09-23. |
| 2 | Remetente é endereço próprio do operador (SMTP custom no Supabase) | ✓ VERIFIED | `docs/ops/auth-email-smtp.md` documents Custom SMTP, sender name `Fluxo`, and sender `<OPERATOR_EMAIL>`. REQ-27.5 is Pass from the same reply. No mailbox address was written into git. |
| 3 | Link de confirmação abre https://fluxofisio.vercel.app (nunca localhost) e confirma a conta | ✓ VERIFIED | `emailRedirectTo: \`${env.appUrl}/auth/confirm\`` in `src/services/auth.service.ts`. `PRODUCTION_APP_URL` is `https://fluxofisio.vercel.app`. Templates href is `{{ .ConfirmationURL }}` with no `token_hash`, `{{ .SiteURL }}`, or localhost. `flowType: 'implicit'` in `src/lib/supabase/client.ts`. Route `/auth/confirm` mounts `AuthConfirmPage` outside `GuestRoute`. REQ-27.1–27.3 are Pass from `approved`. |
| 4 | Depois do clique, o usuário entra com e-mail e senha (`email_confirmed_at` preenchido) | ✓ VERIFIED | Implicit verify plus `detectSessionInUrl` establishes the session from the redirect hash. A consumed link (`otp_expired`, `access_denied`, or an already-used verify error) tells the user to sign in with e-mail and senha. REQ-27.3 and REQ-27.4 are Pass from `approved`. The notes say the timestamp and a separate sign-in sentence were not supplied; they were not invented. |
| 5 | Runbook no repo documenta SMTP + templates + URL configuration no Dashboard | ✓ VERIFIED | `docs/ops/auth-email-smtp.md` (205 lines) covers Custom SMTP, paste from `confirm-signup.html` / `reset-password.html`, Site URL `https://fluxofisio.vercel.app`, the three production Redirect URLs, and `VITE_APP_URL`. |
| 6 | Reset de senha (se ativo) segue a mesma marca; convites de equipe fora | ✓ VERIFIED | `templates/reset-password.html` uses the same brand and a bare `{{ .ConfirmationURL }}`. Runbook section “Out of scope” and step “Invite User: leave untouched”. REQ-27.6 is Pass from `approved`. |
| 7 | `emailRedirectTo` stays on the production origin when cadastro runs against a local or `http` `VITE_APP_URL` | ✓ VERIFIED | `resolveAppUrl` in `src/config/env.ts` accepts an override only for `https` hosts that are not `localhost`, `127.0.0.1`, `::1` / `[::1]`, or `*.local`. Replica of that function returned the production origin for empty, localhost, `127.0.0.1`, `http`, `.local`, and malformed values. |
| 8 | The Supabase client keeps implicit flow so confirm does not need a PKCE verifier from the signup device | ✓ VERIFIED | `src/lib/supabase/client.ts` sets `flowType: 'implicit'` with `detectSessionInUrl: true`. No `window.location` in `src/config/env.ts` or `src/services/auth.service.ts`. |
| 9 | Landing on `/auth/confirm` with an already-used link tells the user to sign in with e-mail and password | ✓ VERIFIED | `confirmCallback.ts` sets `consumed` for `otp_expired`, `access_denied`, and expired/already-used verify errors. `AuthConfirmPage.tsx` renders the sign-in instruction and a button to the login route. |
| 10 | Neither e-mail template builds a link the SPA must finish client-side | ✓ VERIFIED | Both template anchors and fallback lines are the bare `{{ .ConfirmationURL }}`. Grep found no `token_hash`, `{{ .SiteURL }}`, `localhost`, or `127.0.0.1` in either file. |
| 11 | The runbook keeps SMTP credentials as placeholders and says pre-fix links are dead | ✓ VERIFIED | Placeholders `<OPERATOR_EMAIL>`, `<APP_PASSWORD>`, `<BREVO_SMTP_KEY>` only. Section 7 says links mailed before the fix are dead and a new cadastro is required. `{{ .SiteURL }}` and `http://localhost:5173/**` are absent. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `docs/ops/auth-email-smtp.md` | Operator runbook for SMTP, templates, URL configuration, and UAT | ✓ VERIFIED | 205 lines. Contains Custom SMTP, production Site URL, three Redirect URLs, `VITE_APP_URL`, and REQ-27.1–27.7 marked Pass. Wired from the phase templates by filename. |
| `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html` | Paste-ready Confirm signup body | ✓ VERIFIED | 22 lines. Fluxo wordmark, one CTA, bare `{{ .ConfirmationURL }}` in the href and the fallback line. |
| `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html` | Paste-ready Reset password body | ✓ VERIFIED | Same CTA rule and brand tokens; recovery copy. |
| `src/config/env.ts` | Production origin plus override validation | ✓ VERIFIED | `PRODUCTION_APP_URL = 'https://fluxofisio.vercel.app'`. Used by `signUpWithEmail`. |
| `src/lib/supabase/client.ts` | Implicit-flow auth config | ✓ VERIFIED | `flowType: 'implicit'`. Client is the `supabase` proxy used by auth. |
| `src/lib/auth/confirmCallback.ts` | Single-type verify plus consumed-link result | ✓ VERIFIED | `verifyOtp` once when `type` is present; `consumed` on spent links. Called from `AuthProvider` and `AuthConfirmPage`. |
| `src/pages/auth/AuthConfirmPage.tsx` | Landing copy for confirmed and already-used links | ✓ VERIFIED | Mounted at `/auth/confirm`. Renders working, success, consumed, and error states from `confirmFromInitialUrl`. |
| `.planning/phases/15-email-fluxo-confirmacao-conta/15-VALIDATION.md` | Per-task map for plans 02, 03, and 04 | ✓ VERIFIED | Rows 15-02, 15-03, and 15-04 exist. `nyquist_compliant: true`. UAT row points at runbook section 8. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `RegisterPage.tsx` | `signUpWithEmail` | submit handler | WIRED | `await signUpWithEmail(data)` then confirmation toast when `needsEmailConfirmation` |
| `src/services/auth.service.ts` | `src/config/env.ts` | `emailRedirectTo: \`${env.appUrl}/auth/confirm\`` | WIRED | Grep match on that exact expression |
| `src/lib/supabase/client.ts` | GoTrue verify | `flowType: 'implicit'` | WIRED | Implicit flow with `detectSessionInUrl: true` |
| `AuthConfirmPage.tsx` | `confirmFromInitialUrl` | `useEffect` | WIRED | Result drives success, consumed, and error copy |
| `docs/ops/auth-email-smtp.md` | `templates/confirm-signup.html` | paste instruction | WIRED | Runbook names `confirm-signup.html` |
| Confirm signup template | GoTrue `/auth/v1/verify` | bare `{{ .ConfirmationURL }}` | WIRED | Href and visible fallback are the bare variable |
| `vercel.json` | `/auth/confirm` | SPA rewrite to `/index.html` | WIRED | `/(.*)` → `/index.html`, so the production host can serve the confirm route |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `AuthConfirmPage.tsx` | `status` / `message` | `confirmFromInitialUrl()` → `supabase.auth.verifyOtp` or `getSession` | Yes — session or OTP result from the URL, not a hardcoded success | ✓ FLOWING |
| `signUpWithEmail` | `emailRedirectTo` | `env.appUrl` from `PRODUCTION_APP_URL` or a validated https override | Yes — origin is computed, not a localhost literal | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Production origin, redirect, implicit flow, bare CTA, no SiteURL/token_hash/localhost allow-list | Plan 15-04 grep gate | All assertions printed OK | ✓ PASS |
| Local and `http` app URLs fall back to production | Replica of `resolveAppUrl` (same rules as `src/config/env.ts` lines 19–40) | 9/9 cases returned `https://fluxofisio.vercel.app` | ✓ PASS |
| UAT record commit | `git log -1 c388e47` | `c388e47` `docs(15-04): record operator approval of confirm UAT` | ✓ PASS |
| Live inbox click and Dashboard `email_confirmed_at` | Not run | No server or inbox access in this pass | — covered by the recorded `approved` reply, not re-executed |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `probe-*.sh` declared in phase 15 plans or summaries | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-27 | 15-01, 15-02, 15-03, 15-04 | E-mail de confirmação de conta com marca Fluxo (remetente próprio) | ✓ SATISFIED | Acceptance 1–2: Fluxo templates plus Custom SMTP runbook; live From row REQ-27.5 Pass from `approved`. Acceptance 3: redirect is `https://fluxofisio.vercel.app/auth/confirm`, implicit verify, confirm route, REQ-27.1–27.4 Pass. Acceptance 4: `docs/ops/auth-email-smtp.md`. Acceptance 5: reset template branded; Invite User documented as out of scope. |

No other requirement ID appears in any phase 15 plan `requirements:` field. REQUIREMENTS.md maps only REQ-27 to Phase 15. The traceability cell still says “In Progress”; that bookkeeping line was not treated as a product gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/pages/auth/AuthConfirmPage.tsx` | 10 | Comment still mentions a `token_hash` template href | ℹ️ Info | The live templates do not use `token_hash`. The page still handles an implicit hash and a `token_hash` query if one arrives. |
| `docs/ops/auth-email-smtp.md` | 18 | Preflight says the verify link uses `type=email` | ℹ️ Info | The CTA is `{{ .ConfirmationURL }}`, which GoTrue fills. The parenthetical does not change the pasted href. |

No `TBD`, `FIXME`, or `XXX` markers in the phase deliverables. No SMTP password was added. UAT notes do not invent a timestamp, a device, or a sign-in sentence.

### Human Verification Required

None. The blocking human gate in plan 15-04 was answered with the word `approved` on 2026-09-23. Commit `c388e47` records that reply. Timestamp, click device, and a separate sign-in sentence were not in the reply and are not required to be filled in after the fact.

### Gaps Summary

No gap blocks the phase goal. The code sends every new signup confirm redirect to `https://fluxofisio.vercel.app/auth/confirm`, rejects a local origin, and confirms through GoTrue’s verify URL under implicit flow. The live Dashboard and inbox checks rest on the operator’s blanket approval, recorded honestly as Pass without the extra details the plan had asked the operator to include.

---

_Verified: 2026-09-23T23:27:24Z_
_Verifier: Claude (gsd-verifier)_
