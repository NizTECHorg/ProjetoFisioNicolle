# Phase 20: Esqueci minha senha - Research

**Researched:** 2026-09-29
**Domain:** Supabase Auth password recovery (SPA forgot-password + recovery session → new password)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

> No CONTEXT.md for this phase — user chose continue without discuss-phase. Scope below is **inferred from REQ-31 acceptance + orchestrator constraints** (treat as locked for planning).

### Locked Decisions (inferred)

- **REQ-31.1:** On the login screen there is a clear path **Esqueci minha senha**.
- **REQ-31.2:** Submitting an e-mail triggers the reset message; the UI **must not reveal** whether the address is registered.
- **REQ-31.3:** The e-mail link opens the app and allows saving a **new** password.
- **REQ-31.4:** After success, the old password no longer signs in; the new one does.
- **REQ-31.5:** Logged-in password change on **Minha conta** (with current password) stays as Phase 18 delivered — this phase is **unauthenticated forgot-password only**. Do not merge the two flows.
- Custom SMTP + Auth templates already exist; Reset password template is branded Fluxo with bare `{{ .ConfirmationURL }}`. Do not invent new SMTP secrets in git.
- Auth `flowType` stays **implicit** (not PKCE). Do not change `flowType` in `src/lib/supabase/client.ts`.
- Site URL and Redirect URLs remain production-only (`https://fluxofisio.vercel.app` + allow-list from Phase 15). `emailRedirectTo` / recovery `redirectTo` uses `env.appUrl` / production origin — never localhost.
- Landing for confirm/recovery remains **`/auth/confirm`**.
- Never `supabase db push`. SQL Editor only if SQL is needed (**likely none** for Auth recovery).
- Nyquist: `npm run typecheck` + **manual hosted Auth email proof**. No Vitest.

### Claude's Discretion (inferred — no discuss-phase)

- Exact routes for the “pedir e-mail” screen and the “nova senha” UI (new page vs branch of `AuthConfirmPage`).
- Portuguese copy for success / error / anti-enumeration messages (must not enumerate).
- Client-side rate-limit keys for recovery requests.
- How to detect recovery mode (`type=recovery` in URL vs `PASSWORD_RECOVERY` auth event vs both).
- Whether to `signOut` after a successful recovery password write before returning to login (REQ-31 wording “entrar de novo” favors sign-out then login).

### Deferred Ideas (OUT OF SCOPE)

- Changing Phase 18 `changePassword` / `current_password` / hosted oracle flag behavior.
- New SMTP providers, secrets in git, or template redesign (template already shipped in Phase 15).
- Invite User / team invite mailer.
- Switching Auth to PKCE.
- Adding localhost to Redirect URLs.
- Vitest / Playwright for this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-31 | Esqueci minha senha — login path, e-mail Fluxo de redefinição, link abre o app para senha nova; senha antiga deixa de entrar; Minha conta logged-in path untouched | `resetPasswordForEmail` + existing Reset password template; land on `/auth/confirm`; recovery session → `updateUser({ password })` **without** `current_password`; anti-enumeration success copy; keep `changePassword` on `/conta` separate |
</phase_requirements>

## Summary

Phase 20 adds the **missing SPA half** of password recovery. Phase 15 already configured Custom SMTP and the Fluxo **Reset password** template with a bare `{{ .ConfirmationURL }}`; GoTrue verifies on `/auth/v1/verify` then redirects to production `/auth/confirm`. There is still **no** `resetPasswordForEmail` call site, no “Esqueci minha senha” UI on `LoginPage`, and `AuthConfirmPage` always treats a successful callback as **signup e-mail confirmation** (toast + navigate to `/`). With an implicit recovery session, that would push an authenticated user through `GuestRoute` into the clinic **without** choosing a new password — which fails REQ-31.3–4. [VERIFIED: codebase grep + AuthConfirmPage + GuestRoute; CITED: supabase.com/docs/guides/auth/passwords]

The standard stack is already in the repo: `@supabase/supabase-js@2.117.1`, `env.appUrl`, `passwordSchema`, `mapAuthError`, `AuthLayout`, public `/auth/confirm`. Implementation is three client pieces: (1) request form → `resetPasswordForEmail(email, { redirectTo: \`${env.appUrl}/auth/confirm\` })` with identical success UX for known/unknown e-mails; (2) recovery-aware landing that collects new + confirm password and calls `updateUser({ password })` **without** `current_password` (GoTrue skips the current-password wall when `session.IsRecovery()`); (3) then sign out and return to login so the person “entra de novo.” Do not reuse `changePassword`. Do not add packages, SMTP secrets, or SQL. [CITED: supabase/auth `user.go` recovery skip; CITED: passwords guide anti-enumeration]

**Primary recommendation:** Add GuestRoute `/esqueci-senha` for the e-mail request; keep recovery `redirectTo` on `/auth/confirm`; branch `AuthConfirmPage` (or a sibling public route navigated only after recovery detection) to a new-password form; add `requestPasswordReset` + `setPasswordFromRecovery` in `auth.service.ts`; leave `/conta` + `changePassword` untouched.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| “Esqueci minha senha” entry + e-mail form | Browser / Client | — | UX on login; no server page |
| Send recovery e-mail | Supabase Auth API | Browser (SDK call) | `resetPasswordForEmail` is Auth-owned; SPA only triggers it |
| Fluxo Reset password HTML / SMTP From | Ops / Supabase Dashboard | Repo templates (already paste-ready) | Phase 15; no new secrets in git |
| Verify link + recovery session | Supabase Auth (`/auth/v1/verify`) | Browser (`detectSessionInUrl`, implicit) | Bare `ConfirmationURL`; flowType stays implicit |
| Choose + persist new password | Browser / Client | Supabase Auth `updateUser` | Recovery session already authenticated; no `current_password` |
| Anti-enumeration response | Browser / Client + Auth API | — | SDK returns success when user missing; UI must match |
| Logged-in password change | Browser (`/conta`) | Auth `updateUser` + `current_password` | Phase 18 — out of scope to change |
| Redirect allow-list / Site URL | Ops / Dashboard | `env.appUrl` | Production-only; already documented |

## Standard Stack

### Core

| Library / Surface | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| `@supabase/supabase-js` | **2.117.1** (pinned in package.json; registry latest 2.117.2) | `resetPasswordForEmail`, `updateUser`, session | Already in app; pin kept for Phase 18 `current_password` typing — **do not bump** this phase unless forced [VERIFIED: package.json + `npm view`] |
| Supabase Auth Reset password template | Dashboard (repo: `templates/reset-password.html`) | Fluxo-branded recovery mail | Already UAT-passed in Phase 15 [VERIFIED: docs/ops/auth-email-smtp.md] |
| Zod `passwordSchema` | existing `src/schemas/auth.schema.ts` | New-password strength rules | Same rules as cadastro / Minha conta new password [VERIFIED: auth.schema.ts] |
| `env.appUrl` | `src/config/env.ts` | Recovery `redirectTo` origin | Rejects localhost; production `https://fluxofisio.vercel.app` [VERIFIED: env.ts] |

### Supporting

| Library / Pattern | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| `react-hook-form` + `zodResolver` | existing | Forms for e-mail request + new password | Match Login/Register/Account patterns |
| `AuthLayout` | existing | Auth chrome | All guest auth pages |
| `mapAuthError` / client `checkRateLimit` | existing | PT-BR errors + browser rate limit | Wrap Auth errors; add `auth:recovery:*` keys |
| `confirmFromInitialUrl` | existing | Consume verify / hash tokens once | Keep for link landing; extend detection for recovery |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Branch `/auth/confirm` for recovery password form | New Dashboard redirect `/auth/redefinir-senha` | Extra Redirect URL allow-list entry + ops risk; avoid unless UX forces it |
| `updateUser({ password })` on recovery | Reuse `changePassword` with `current_password` | User does not know old password; wrong wall [CITED: GoTrue skips current password only when `session.IsRecovery()`] |
| Custom Edge Function mailer | Dashboard Auth mailer | Out of scope; SMTP already works |
| PKCE + `exchangeCodeForSession` | Stay on implicit | Locked: Phase 15 fixed cross-device confirm with implicit + bare ConfirmationURL |

**Installation:**

```bash
# No new packages — reuse @supabase/supabase-js@2.117.1 already pinned
```

**Version verification:** `@supabase/supabase-js@2.117.1` present in package.json; `npm view @supabase/supabase-js version` → `2.117.2` (do not auto-upgrade this phase). No `postinstall` script on the pinned package. [VERIFIED: npm registry]

## Package Legitimacy Audit

> No external packages are installed for this phase.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | N/A — no installs |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

*slopcheck not run against new packages because none are recommended.*

## Architecture Patterns

### System Architecture Diagram

```text
[LoginPage]
    │ Link "Esqueci minha senha"
    ▼
[ForgotPasswordPage /esqueci-senha]  (GuestRoute)
    │ submit e-mail
    ▼
[auth.service.requestPasswordReset]
    │ supabase.auth.resetPasswordForEmail(email, { redirectTo: env.appUrl + '/auth/confirm' })
    ▼
[Supabase Auth + Custom SMTP]
    │ Fluxo Reset password template → {{ .ConfirmationURL }}
    ▼
[GoTrue /auth/v1/verify?type=recovery]
    │ establishes recovery session; redirects
    ▼
[/auth/confirm]  (public; outside GuestRoute)
    │ detectSessionInUrl / confirmFromInitialUrl
    │ type=recovery OR PASSWORD_RECOVERY
    ├─ signup path (unchanged) → "E-mail confirmado" → /
    └─ recovery path → New password form
            │ updateUser({ password })  // NO current_password
            │ signOut()
            ▼
        [LoginPage]  → sign in with NEW password only
```

### Recommended Project Structure

```
src/
├── pages/auth/
│   ├── LoginPage.tsx              # add Esqueci minha senha link
│   ├── ForgotPasswordPage.tsx     # NEW — e-mail request (or equivalent name)
│   └── AuthConfirmPage.tsx        # branch recovery → set-password UI
├── services/auth.service.ts       # requestPasswordReset + setPasswordFromRecovery
├── schemas/auth.schema.ts         # forgotPasswordSchema + recoveryPasswordSchema
├── lib/auth/confirmCallback.ts    # export recovery detection hint if needed
├── routes/index.tsx               # GuestRoute /esqueci-senha
└── config/env.ts                  # reuse appUrl (no change expected)
```

### Pattern 1: Request reset without enumeration

**What:** Call `resetPasswordForEmail` and always show the same success copy when `error` is null **or** when Auth intentionally hides existence. Never probe `profiles` / `auth.users` first.  
**When to use:** Forgot-password submit (REQ-31.2).  
**Example:**

```typescript
// Source: https://supabase.com/docs/guides/auth/passwords
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${env.appUrl}/auth/confirm`,
})
// UI: "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha."
```

### Pattern 2: Set password on recovery session (not Minha conta)

**What:** After recovery session is present, `updateUser({ password: newPassword })` only. Do **not** pass `current_password`. Do **not** call `changePassword`. Prefer `signOut` after success so REQ-31 “entrar de novo” holds.  
**When to use:** Only after recovery link / `PASSWORD_RECOVERY`.  
**Example:**

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
const { error } = await supabase.auth.updateUser({ password: newPassword })
if (error) throw new Error(mapAuthError(error))
await supabase.auth.signOut()
```

### Pattern 3: Keep signup confirm UX intact

**What:** Signup success on `/auth/confirm` stays “E-mail confirmado…”. Recovery must not reuse that copy or auto-navigate into the clinic before the password form.  
**When to use:** Branching `AuthConfirmPage` (or post-detect navigate to a public set-password route **without** changing Dashboard redirect).

### Anti-Patterns to Avoid

- **Reusing `changePassword`:** Requires `current_password`; recovery users do not have it. GoTrue only skips the wall on recovery sessions. [CITED: supabase/auth user.go]
- **Pre-checking e-mail existence:** Reintroduces enumeration (REQ-31.2). [CITED: passwords guide; community write-ups]
- **Changing `flowType` to PKCE:** Breaks Phase 15 cross-device ConfirmationURL behavior. [VERIFIED: client.ts comment + Phase 15 decisions]
- **Localhost in `redirectTo` / Dashboard allow-list:** Rejected by `env.appUrl` and Phase 15 runbook. [VERIFIED: env.ts; docs/ops/auth-email-smtp.md]
- **Treating recovery success as signup confirm + `navigate('/')`:** `GuestRoute` will admit authenticated clinic access without a new password. [VERIFIED: GuestRoute + AuthConfirmPage]
- **Inventing SMTP secrets or new templates in git:** Template already exists; secrets stay in Dashboard. [VERIFIED: runbook]
- **Linking Minha conta to “esqueci a senha”:** Phase 18 explicitly forbids that path on AccountPage; keep separation (REQ-31.5). [VERIFIED: 18-06-PLAN automated grep]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Send reset e-mail | Custom SMTP from Vite / Edge Function | `supabase.auth.resetPasswordForEmail` + Dashboard SMTP | Auth owns tokens, rate limits, templates |
| Verify recovery token | Hand-rolled JWT parse | GoTrue `/verify` via bare `ConfirmationURL` + existing confirm helpers | Phase 15 already fixed this |
| Password strength | Ad-hoc rules | Existing `passwordSchema` | Same product rules everywhere |
| Anti-enumeration | Custom “user exists?” query | SDK silent success + identical UI copy | Official Auth behavior |
| Current-password wall on recovery | Client `if` to skip | Recovery session + `updateUser({ password })` only | Server skips check when `IsRecovery()` |

**Key insight:** The hard part is **routing/session UX**, not mail delivery. Mail and template are done; the planner must stop recovery sessions from entering the clinic before a new password is set, and must not touch Phase 18’s logged-in wall.

## Common Pitfalls

### Pitfall 1: Recovery session hits GuestRoute → clinic without new password

**What goes wrong:** Link lands, session is set, `AuthConfirmPage` navigates to `/`, `GuestRoute` sees `isAuthenticated` and sends the user into `/pacientes` (or `from`) still on the **old** password semantics / without completing reset.  
**Why it happens:** Confirm page was written for signup only.  
**How to avoid:** Detect recovery before signup success path; show set-password UI on a public route; only after `updateUser` + preferred `signOut` send them to login.  
**Warning signs:** UAT can open clinic from the reset e-mail without typing a new password.

### Pitfall 2: Reusing `changePassword` / requiring current password

**What goes wrong:** Form asks for senha atual; user cannot proceed; or `current_password_required` if someone forces the Phase 18 API.  
**Why it happens:** Phase 18 is the only password write pattern in the repo.  
**How to avoid:** New service function for recovery only; schema without `currentPassword`. Hosted flag remains fine for `/conta` because GoTrue skips it on recovery sessions. [CITED: user.go `!session.IsRecovery()`]

### Pitfall 3: E-mail enumeration in UI or errors

**What goes wrong:** Different toast for “user not found” vs success, or pre-query profiles.  
**Why it happens:** Copying register’s duplicate-e-mail messaging.  
**How to avoid:** One success message; map only transport/rate-limit errors; never tell the user the address is unknown. [CITED: supabase.com/docs/guides/auth/passwords]

### Pitfall 4: Wrong / consumed link copy

**What goes wrong:** `mapAuthError` expired-link branch says “Cadastre-se de novo…” — wrong for recovery.  
**Why it happens:** Message was written for signup confirm. [VERIFIED: mapAuthError]  
**How to avoid:** Recovery UI uses dedicated copy (“Peça um novo link em Esqueci minha senha”) without changing signup wording, or branch by context before displaying `mapAuthError` result.

### Pitfall 5: `typesToTry` fallback omits `recovery`

**What goes wrong:** If a `token_hash` arrives **without** `type`, verify loops signup/email/magiclink/invite and never tries `recovery`.  
**Why it happens:** `typesToTry(null)` excludes `recovery`. [VERIFIED: confirmCallback.ts]  
**How to avoid:** Prefer relying on GoTrue bare ConfirmationURL (type supplied by Auth) + hash `type=recovery`; if keeping token_hash fallbacks, include `recovery` when the page is in reset mode. Do not weaken signup confirm by blindly trying recovery first on every confirm.

### Pitfall 6: Changing flowType or redirect allow-list

**What goes wrong:** PKCE or localhost redirect reopens Phase 15 bugs.  
**How to avoid:** Leave `client.ts` auth options alone; reuse `env.appUrl` + `/auth/confirm` only.

### Pitfall 7: SMTP / rate-limit 500 on reset

**What goes wrong:** Misconfigured SMTP returns 500; `mapAuthError` may say “e-mail de confirmação”.  
**How to avoid:** Recovery-specific error copy when calling reset; operator checks Auth logs per runbook; client rate-limit keys reduce spam. [VERIFIED: mapAuthError SMTP branch; runbook rate limits ~30/h with custom SMTP]

## Code Examples

### Request password reset

```typescript
// Source: https://supabase.com/docs/guides/auth/passwords
// Adapt to auth.service.ts — sanitize email, rate-limit, mapAuthError
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/auth/confirm`,
  })
  if (error) throw new Error(mapAuthError(error))
  // Always show the same success UI when error is null
}
```

### Complete recovery with new password

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // Show set-password form; then:
    // await supabase.auth.updateUser({ password: newPassword })
  }
})
```

### Schema sketch (discretion — planner names)

```typescript
// Reuse passwordSchema; do NOT require currentPassword
export const recoveryPasswordSchema = z
  .object({
    password: z.string(), // empty → "Informe a nova senha." like Phase 18
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .superRefine(/* passwordSchema + match */)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dashboard-only reset / no SPA UI | SPA `resetPasswordForEmail` + recovery `updateUser` | Phase 20 | REQ-31 |
| Generic Supabase reset mail | Fluxo template + Custom SMTP | Phase 15 (2026-09-23) | Brand already done |
| SPA-built confirm links / PKCE | Bare `ConfirmationURL` + implicit | Phase 15 replan | Keep for recovery |

**Deprecated/outdated:**

- Building custom `{{ .SiteURL }}/auth/confirm?token_hash=…` CTAs for this project’s mailer — Phase 15 rejected that pattern for cross-device verify. Recovery must keep the bare ConfirmationURL template. [VERIFIED: runbook + reset-password.html]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | After successful recovery password write, product intent is `signOut` then login (“entrar de novo”) rather than staying in a recovery session inside the clinic | Discretion / Pattern 2 | Planner may leave user logged in; still meets REQ-31.4 if old password fails, but UX differs |
| A2 | Hosted Reset password template is already pasted and active in the live project (Phase 15 UAT Pass on REQ-27.6) | Summary | If Dashboard drifted, UAT mail won’t be Fluxo-branded — ops paste from repo template |
| A3 | GoTrue recovery sessions skip `security_update_password_require_current_password` via `session.IsRecovery()` on current hosted Auth | Pattern 2 | If a future Auth version regresses, recovery `updateUser({ password })` fails with `current_password_required` — UAT must prove write works |

**If this table is empty:** N/A — three assumptions remain for discuss/planner confirmation.

## Open Questions

1. **Set-password UI placement**
   - What we know: `/auth/confirm` is the locked redirect landing; signup UX already lives there.
   - What's unclear: Branch in-page vs navigate to `/auth/redefinir-senha` after detecting recovery (no Dashboard change if client-only navigate).
   - Recommendation: Prefer branching `/auth/confirm` (or client navigate to a new **public** route) **without** changing Dashboard Redirect URLs.

2. **Phase 18 hosted flag status**
   - What we know: Oracle to enable `security_update_password_require_current_password` is still pending human action.
   - What's unclear: Whether it is already ON in production.
   - Recommendation: Recovery UAT must prove `updateUser({ password })` **without** `current_password` succeeds on a recovery session either way; do not turn the flag off for this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | typecheck / build | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| `@supabase/supabase-js` | Auth SDK | ✓ | 2.117.1 pinned | — |
| Hosted Supabase Auth + Custom SMTP | Reset e-mail delivery | ✓ (ops — Phase 15 UAT) | project-hosted | Operator re-checks runbook; no secrets in repo |
| Vitest | automated unit tests | ✗ | — | `npm run typecheck` + manual hosted Auth proof |

**Missing dependencies with no fallback:** none for SPA work.

**Missing dependencies with fallback:** Vitest → typecheck + manual Auth e-mail UAT (as specified).

**Step 2.6 note:** No new CLIs. Operator Dashboard access required for hosted UAT only (not for code execution).

## Validation Architecture

> `workflow.nyquist_validation` is absent in `.planning/config.json` → treat as **enabled**. Project constraint for this phase: **no Vitest**; gate = typecheck + hosted Auth proof. [VERIFIED: config.json; TESTING.md; user additional_context]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (TypeScript `tsc` + ESLint); no Vitest |
| Config file | none — see Wave 0 |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-31.1 | Login shows Esqueci minha senha → request screen | manual + static grep | `npm run typecheck` + `rg "Esqueci minha senha" src/pages/auth` | ❌ Wave 0 (UI not built) |
| REQ-31.2 | Same success UX whether e-mail exists; no existence probe | manual hosted + static | `npm run typecheck`; grep forbids profiles lookup before reset | ❌ |
| REQ-31.3 | Reset link opens app; new password form works | **manual hosted Auth** | — (human) | ❌ |
| REQ-31.4 | Old password fails; new password signs in | **manual hosted Auth** | — (human) | ❌ |
| REQ-31.5 | `/conta` `changePassword` still uses `current_password` | static | `rg "current_password" src/services/auth.service.ts` + typecheck | ✅ existing Phase 18 |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** Full suite green + human hosted proof (request mail → open link on production → set password → old fails / new works; Minha conta path unchanged)

### Wave 0 Gaps

- [ ] No Vitest files — **do not add** for this phase
- [ ] Manual UAT checklist in plan SUMMARY / USER-SETUP style: production `fluxofisio.vercel.app`, real inbox, confirm Fluxo Reset template still active
- [ ] Framework install: none

*(Wave 0 test files skipped; gates remain typecheck + lint + hosted Auth email proof.)*

### Suggested human UAT script (for planner)

1. From production login, open Esqueci minha senha; submit a **registered** e-mail → identical success copy; receive Fluxo “Redefina sua senha Fluxo”.
2. Submit an **unregistered** e-mail → **same** success copy; no “não cadastrado”.
3. Open link (phone or second browser) → lands on Fluxo `/auth/confirm` (no localhost) → set new password meeting `passwordSchema`.
4. Sign in with **old** password fails; **new** succeeds.
5. While logged in, Minha conta still requires senha atual to change password (regression).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth recovery + password policies via `passwordSchema` |
| V3 Session Management | yes | Recovery session ephemeral; prefer `signOut` after password set; `persistSession` unchanged |
| V4 Access Control | no* | No new RLS; clinic access must not be granted as a substitute for completing reset (*UX gate via public routes) |
| V5 Input Validation | yes | Zod e-mail + `passwordSchema`; sanitize e-mail like login/register |
| V6 Cryptography | no | Do not hand-roll hashing — Auth stores password hashes |

### Known Threat Patterns for Supabase Auth recovery

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| E-mail enumeration via reset | Information disclosure | Identical success UX; no pre-lookup; trust SDK silent no-op [CITED: passwords guide] |
| Recovery link → clinic without password change | Elevation of privilege / bypass | Branch confirm UX; require `updateUser({ password })` before clinic entry |
| Reuse logged-in changePassword without current password | Elevation | Separate `setPasswordFromRecovery`; leave Phase 18 wall intact |
| Open redirect / localhost redirect | Spoofing | `env.appUrl` + production allow-list only |
| SMTP secret leakage | Information disclosure | Secrets only in Dashboard; runbook placeholders |
| Brute reset spam | Denial of service | Client `auth:recovery:*` rate limit + Auth/SMTP server limits |
| Consumed link (mail scanner) | Tampering / availability | Clear “link already used / expired → request again” copy (not signup copy) |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` is **empty / absent** in this workspace — no extra rule files to enforce. [VERIFIED: glob `.cursor/rules`]

Relevant project conventions from prior phases / ops docs that planners must honor:

- SQL apply path = Supabase SQL Editor only; never `supabase db push` (N/A if no SQL).
- No SMTP secrets in git (`docs/ops/auth-email-smtp.md`).
- Nyquist for auth phases = typecheck (+ lint) and human hosted proof, not Vitest.
- Preserve Phase 15 Auth URL / flowType decisions.

## Sources

### Primary (HIGH confidence)

- https://supabase.com/docs/guides/auth/passwords — `resetPasswordForEmail` anti-enumeration; redirectTo; `updateUser` after recovery
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail — API + `PASSWORD_RECOVERY` example
- https://github.com/supabase/auth/blob/master/internal/api/user.go — `UpdatePasswordRequireCurrentPassword` skipped when `session.IsRecovery()`
- Codebase: `LoginPage.tsx`, `AuthConfirmPage.tsx`, `confirmCallback.ts`, `auth.service.ts`, `client.ts`, `env.ts`, `routes/index.tsx`, `ProtectedRoute.tsx` / `GuestRoute`, `auth.schema.ts`, `mapAuthError`
- `docs/ops/auth-email-smtp.md` + `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html`
- Phase 18 plans/summaries — `changePassword` + `current_password` must stay separate

### Secondary (MEDIUM confidence)

- https://supabase.com/docs/guides/auth/password-security — current password / reauthentication flags (context for Phase 18 coexistence)
- Auth-js issue #590 / community notes — reset returns success when user missing (aligned with official guide)

### Tertiary (LOW confidence)

- None retained as planning blockers

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — official Auth APIs + existing pinned SDK verified
- Architecture: **HIGH** — gap and GuestRoute pitfall verified in codebase; recovery skip of current_password cited from GoTrue source
- Pitfalls: **HIGH** — confirm-page signup assumption and enumeration are concrete

**Research date:** 2026-09-29  
**Valid until:** ~2026-10-29 (Auth APIs stable; re-check if `@supabase/supabase-js` major bump or GoTrue recovery/`IsRecovery` behavior changes)

## Graph Context

`graphify` is **disabled** in this project (`gsd-tools graphify status` → not enabled). No graph relationships injected.
