# Phase 15: E-mail Fluxo de confirmação de conta - Research

**Researched:** 2026-09-21  
**Domain:** Supabase Auth Custom SMTP + Auth Email Templates (ops/config; minimal SPA)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### D-01 — Marca Fluxo no e-mail de confirmação
O e-mail disparado na criação de conta (confirm signup / “autorização”) deve ter copy e visual da **Fluxo** — não o template padrão “Supabase Auth” / remetente `@*.supabase.co`.

#### D-02 — Remetente provisório = e-mail próprio do operador
Por enquanto o From/SMTP usa um **e-mail pessoal do Artur** (ou outro que ele indicar na execução). Troca futura para domínio `@fluxo…` é **adiada**. Credenciais SMTP ficam só no Supabase Dashboard / secrets — **nunca** no repo nem em `.env` commitado.

#### D-03 — Preferir Custom SMTP + Auth Email Templates do Supabase
Não construir mailer próprio no app (SendGrid SDK, Edge Function de e-mail, etc.) nesta fase, salvo research provar bloqueio. Configurar:
1. Custom SMTP no projeto Supabase
2. Templates Auth (Confirm signup; Reset password se ativo) com HTML/texto Fluxo
3. Site URL / Redirect URLs já usados pelo `emailRedirectTo` do `signUpWithEmail`

#### D-04 — App code mínimo
Alterar código da SPA só se necessário para: copy pós-cadastro alinhada ao novo e-mail, redirect URL, ou runbook. Não mudar RLS, `handle_new_user`, nem fluxo de tipos de conta.

#### D-05 — Escopo de templates
- **In:** Confirm signup (obrigatório); Reset password (mesmo visual, se a feature estiver ligada)
- **Out:** Convite de equipe / invite mailer; e-mails de marketing; white-label por clínica

#### D-06 — Documentação operacional entregue no repo
Runbook em `.planning/` ou `docs/` (escolha do planner): passos Dashboard (SMTP host/port/user/pass, From name “Fluxo”, From email), variáveis de template (`{{ .ConfirmationURL }}` etc.), checklist de teste de cadastro real.

### Claude's Discretion
- Provedor SMTP concreto (Gmail App Password vs Resend vs outro) — research recomenda; execução usa o que o operador tiver
- Layout HTML do template (simples, tipografia clara, CTA único; sem overdesign)
- Se “magic link” vs token confirm precisa de nota no runbook
- Exact From display name (`Fluxo` vs `Fluxo <email>`)

### Deferred Ideas (OUT OF SCOPE)
- Domínio de e-mail profissional (`@fluxo…`) + SPF/DKIM/DMARC
- White-label / From por organização
- Convites de equipe por e-mail
- Mailer in-app / Edge Function transacional
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-27 | E-mail de confirmação de conta com marca Fluxo (remetente próprio) | Custom SMTP + Dashboard Confirm signup / Reset password templates; keep existing `signUp` + `emailRedirectTo` + PKCE; runbook documents Dashboard steps and secrets boundary; no invite mailer |
</phase_requirements>

## Summary

Phase 15 is almost entirely **Supabase Dashboard operations**, not application feature work. Cadastro already calls `supabase.auth.signUp` with `emailRedirectTo: ${window.location.origin}/` and the SPA already completes the session via PKCE + `detectSessionInUrl: true`. The gap is identity: default Supabase SMTP is demo-only (team addresses only, ~2 msg/hour) and templates look like generic Auth mail. [CITED: supabase.com/docs/guides/auth/auth-smtp]

No blocker was found against D-03. Custom SMTP + Auth Email Templates is the supported production path; the Send Email Auth Hook is an advanced escape hatch only if SMTP is impossible — not needed here. [CITED: supabase.com/docs/guides/auth/auth-smtp]

**Primary recommendation:** Configure Custom SMTP with the operator’s personal mailbox (prefer **Gmail App Password via `smtp.gmail.com`** for zero new accounts, or **Brevo SMTP + verified single sender** if Google SMTP fails); set sender name `Fluxo`; replace Confirm signup (and Reset password) HTML with a minimal Fluxo-branded template using `{{ .ConfirmationURL }}`; ship a runbook under `docs/`; optionally tweak RegisterPage success copy — do not add npm packages or an in-app mailer.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SMTP credentials & From identity | Ops / Supabase Dashboard | — | Auth server sends mail; secrets must not enter SPA or git [VERIFIED: codebase INTEGRATIONS.md + CONTEXT D-02] |
| Auth email HTML/subject templates | Supabase Auth (Dashboard or Management API) | Repo runbook (source of truth for copy) | Templates live in project Auth config, not Vite assets [CITED: supabase.com/docs/guides/auth/auth-email-templates] |
| Trigger confirm email on signup | Browser / Client | API / Backend (Supabase Auth) | `signUpWithEmail` already triggers Auth mailer [VERIFIED: src/services/auth.service.ts] |
| Verify link + establish session | Supabase Auth API | Browser / Client | Link hits `/auth/v1/verify` then redirects to SPA; `detectSessionInUrl` + PKCE finish login [CITED: ConfirmationURL docs; VERIFIED: client.ts] |
| Post-confirm account bootstrap | Database / Storage | — | Existing `handle_new_user` on `auth.users` — out of phase scope [VERIFIED: INTEGRATIONS.md] |
| Operator runbook | Repo docs | — | D-06 deliverable; no runtime dependency |
| SPA copy after signup | Browser / Client | — | Optional one-line message alignment (D-04) |

## Standard Stack

### Core

| Library / Surface | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Supabase Auth Custom SMTP | Hosted project setting | Deliver Auth emails via operator SMTP | Official production path; any SMTP service [CITED: supabase.com/docs/guides/auth/auth-smtp] |
| Supabase Auth Email Templates (Go templates) | Dashboard / Management API `mailer_templates_*` | Confirm signup + Reset password HTML/subject | Official branding surface; variables documented [CITED: supabase.com/docs/guides/auth/auth-email-templates] |
| `@supabase/supabase-js` | ^2.49.8 (lockfile may resolve newer) | Existing signup / session | Already integrated; no version bump required for this phase [VERIFIED: package.json] |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Gmail SMTP (`smtp.gmail.com`) | n/a | Interim From = personal Gmail | Operator has Gmail + 2FA + App Password; fastest path for D-02 [CITED: supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y] |
| Brevo SMTP (`smtp-relay.brevo.com`) | n/a | Interim SMTP with single-sender verify | If Gmail SMTP fails or deliverability is poor; verify personal address as sender [CITED: supabase.com/docs/guides/auth/auth-smtp lists Brevo; Brevo help senders] |
| Supabase Auth logs | Dashboard | Debug handover failures | First step when mail does not arrive [CITED: supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails…] |
| Management API `PATCH /v1/projects/{ref}/config/auth` | n/a | Optional automation of SMTP/templates | Prefer Dashboard for this phase (human secrets); API is documented fallback [CITED: auth-smtp + auth-email-templates] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dashboard Custom SMTP | Send Email Auth Hook | More control (React Email, queues) — **deferred** by D-03 / deferred ideas |
| Gmail App Password | Resend SMTP | Resend **requires a verified domain** as prerequisite — misaligned with “personal email for now” [CITED: resend.com/docs/send-with-supabase-smtp] |
| Gmail App Password | Brevo / SendGrid / SES | Better reputation when domain exists; for interim personal From, Brevo single-sender is the best *listed* alternative if Gmail fails |
| `{{ .ConfirmationURL }}` | Custom SPA `/auth/confirm` + `TokenHash` | Needed for SSR/prefetch workarounds; this Vite SPA already works with default verify URL — do not invent a confirm route [CITED: auth-email-templates Limitations] |

**Installation:**

```bash
# No npm packages for this phase.
```

**Version verification:** No new packages. Existing `@supabase/supabase-js` remains the client; Auth SMTP/templates are Dashboard configuration, not registry packages.

## Package Legitimacy Audit

> No external packages are recommended for this phase.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | N/A — no installs |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

*slopcheck was not required (zero recommended installs).*

## Architecture Patterns

### System Architecture Diagram

```text
[RegisterPage]
    → signUpWithEmail (auth.service)
        → supabase.auth.signUp({ email, password, options: { data, emailRedirectTo: origin+"/" } })
            → Supabase Auth
                → (if Confirm email ON) render Go template "Confirm signup"
                → SMTP (Custom SMTP credentials)
                → Recipient inbox (From: "Fluxo" <operator@…>)
            → returns { user, session: null } when confirmation required
                → RegisterPage: "verifique seu e-mail…"

[Recipient clicks CTA]
    → {{ .ConfirmationURL }}
        = https://{project}.supabase.co/auth/v1/verify?token=…&type=email&redirect_to={RedirectTo}
            → Auth verifies token
            → Redirect to SPA origin (/) with session fragments/params
                → supabase-js PKCE + detectSessionInUrl
                → AuthProvider / GuestRoute → existing account-type flow
                    (autonomo | empresa | fisioterapeuta /aguardando)
```

### Recommended Project Structure

```
docs/
└── ops/
    └── auth-email-smtp.md          # D-06 runbook (SMTP + templates + UAT checklist)

.planning/phases/15-email-fluxo-confirmacao-conta/
├── 15-CONTEXT.md
├── 15-RESEARCH.md                  # this file
└── (optional) templates/
    ├── confirm-signup.html         # paste-ready HTML for Dashboard (non-secret)
    └── reset-password.html         # same brand; paste if recovery stays enabled

src/pages/auth/RegisterPage.tsx     # optional copy-only tweak
src/services/auth.service.ts        # DO NOT change signup/redirect/metadata unless redirect allow-list forces it
```

Planner may place the runbook under `.planning/ops/` instead of `docs/ops/` — either satisfies D-06; prefer `docs/ops/` so operators find it outside GSD phase folders.

### Pattern 1: Dashboard Custom SMTP (no app mailer)

**What:** Enable Custom SMTP; set host/port/user/pass; sender email = operator address; sender name = `Fluxo`.  
**When to use:** Always for this phase (locked D-03).  
**Example fields (Gmail interim):**

```text
Enable Custom SMTP: ON
Sender email: artur@gmail.com          # must match SMTP user for Gmail
Sender name: Fluxo
Host: smtp.gmail.com
Port: 587                              # or 465
Username: artur@gmail.com
Password: <16-char Google App Password>
```

Source: [CITED: supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y]

### Pattern 2: Confirm signup template with ConfirmationURL

**What:** Replace subject + body; single CTA; Portuguese Fluxo copy; use exact Go variable casing.  
**When to use:** Confirm signup (required); Reset password (same visual).  
**Example:**

```html
<!-- Source: https://supabase.com/docs/guides/auth/auth-email-templates -->
<h2 style="color:#0b1d36;font-family:Arial,Helvetica,sans-serif;">Confirme sua conta na Fluxo</h2>
<p style="color:#102038;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;">
  Recebemos um pedido de cadastro. Clique no botão abaixo para confirmar seu e-mail e continuar.
</p>
<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#0b1d36;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-weight:600;">
    Confirmar e-mail
  </a>
</p>
<p style="color:#5a6b80;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
  Se você não criou uma conta na Fluxo, ignore este e-mail.
</p>
```

Subject recommendation: `Confirme sua conta na Fluxo`.

Brand tokens from SPA (`src/index.css`): forest `#0b1d36`, ink `#102038`, muted `#5a6b80`. Prefer **web-safe fonts in email** (Arial/Helvetica); do not rely on Plus Jakarta / Cormorant loading in mail clients. [VERIFIED: src/index.css]

### Pattern 3: Keep SPA confirmation flow unchanged

**What:** Leave `emailRedirectTo`, PKCE, and `detectSessionInUrl` as-is.  
**When to use:** Always unless redirect allow-list rejects the origin.  
**Example (existing — do not rewrite):**

```typescript
// Source: src/services/auth.service.ts (verified in-repo)
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name, account_type, join_code },
    emailRedirectTo: `${window.location.origin}/`,
  },
})
```

Ensure Dashboard **Site URL** and **Redirect URLs** include production and local origins used by `emailRedirectTo` (same pattern as Phase 08 Google Calendar redirect allow-list). [VERIFIED: INTEGRATIONS.md; Phase 08 plans]

### Anti-Patterns to Avoid

- **In-app SendGrid/Resend SDK or Edge Function mailer:** Violates D-03; deferred explicitly.
- **Appending query params to `{{ .ConfirmationURL }}`:** Auth builds the URL; appended fragments are not merged and Studio warns about this. [CITED: github.com/supabase/supabase PR #49423 discussion / email template pitfalls]
- **Wrong casing (`{{ .ConfirmationUrl }}`):** Go templates are case-sensitive; empty link. [CITED: same]
- **Custom `/auth/confirm` verify route (MakerKit/Next pattern):** Unnecessary for this SPA and would expand scope beyond D-04.
- **Committing App Passwords / SMTP pass / Management API tokens:** Violates D-02 and project security norms.
- **Heavy HTML, many images, marketing copy in Auth mail:** Hurts deliverability. [CITED: auth-smtp best practices]
- **Enabling email click tracking on the SMTP provider:** Rewrites links and breaks Auth. [CITED: auth-email-templates Limitations]
- **Building forgot-password UI this phase:** No `resetPasswordForEmail` in SPA today; only brand the template if recovery remains enabled in Auth. [VERIFIED: grep src — no reset flow]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Send confirmation email | Nodemailer / Edge Function / Resend SDK | Supabase Auth + Custom SMTP | Auth already owns tokens, rate limits, verify URLs [CITED: auth-smtp] |
| Branded HTML mailer engine | React Email pipeline | Dashboard Go templates | Zero deploy path; matches D-03/D-04 |
| Custom confirm endpoint | SPA `verifyOtp` page | Default `{{ .ConfirmationURL }}` | Existing PKCE + `detectSessionInUrl` already completes flow [VERIFIED: client.ts] |
| Invite teammates by email | Invite User template / admin invite | Company join code (Phase 03) | D-05 / deferred; team model is code-based [VERIFIED: Phase 03 RESEARCH] |
| Store SMTP secrets in Vite env | `VITE_SMTP_*` | Supabase Dashboard only | Client env would leak; D-02 |

**Key insight:** The product already has a correct confirm-email *application* flow; Phase 15 only replaces the *transport and brand* of the message Auth already sends.

## SMTP Provider Recommendation (Claude's Discretion)

| Option | Fits D-02 personal From? | Domain required? | Deliverability | Recommendation |
|--------|--------------------------|------------------|----------------|----------------|
| **Gmail App Password → `smtp.gmail.com`** | Yes (From = that Gmail) | No | Fair/poor for cold recipients; spam risk; Google rate limits | **Default interim** — zero new vendor; official Supabase troubleshooting exists [CITED: Google SMTP troubleshooting] |
| **Brevo SMTP + verified personal sender** | Yes (verify Gmail as sender) | No for basic send; DKIM on free domains **not** possible | Better logs/limits (~300/day free); free-domain senders warn on Gmail/Yahoo rules | **Fallback** if Gmail SMTP auth fails [CITED: Brevo senders help; auth-smtp lists Brevo] |
| **Resend SMTP** | Only after domain verify | **Yes** (official prerequisite) | Excellent with domain | **Defer** until `@fluxo…` domain phase [CITED: resend.com/docs/send-with-supabase-smtp] |

**Exact From display name:** Set Dashboard **Sender name** to `Fluxo` (not `Supabase Auth`). Recipients see `Fluxo <operator@gmail.com>`. Do not invent a fake `@fluxo` address without domain ownership.

**Runbook must document:** After enabling Custom SMTP, Auth rate limit defaults to **30 messages/hour** (adjustable under Rate Limits). Built-in SMTP is **2/hour** and team-only — another reason custom SMTP is required. [CITED: auth-smtp]

## Common Pitfalls

### Pitfall 1: Assuming templates alone change the From address
**What goes wrong:** Branded HTML still shows `@*.supabase.co` / unauthorized delivery.  
**Why it happens:** Templates customize content; **Custom SMTP** owns From/delivery. Default SMTP refuses non-team addresses. [CITED: auth-smtp]  
**How to avoid:** Enable Custom SMTP first, then paste templates; verify From in a real inbox.  
**Warning signs:** Auth log “Email address not authorized”; sender still supabase.co.

### Pitfall 2: Gmail SMTP misconfiguration
**What goes wrong:** “Error sending confirmation email” in Auth logs.  
**Why it happens:** Using account password instead of App Password; 2FA off; sender ≠ SMTP user; wrong host/port (`smtp-relay.gmail.com` needs 465). [CITED: Google SMTP troubleshooting]  
**How to avoid:** 2FA → App Password → `smtp.gmail.com` 587 or 465; sender email = Gmail address.  
**Warning signs:** Immediate SMTP auth errors in Auth logs; no Brevo/Gmail provider log entry.

### Pitfall 3: Redirect allow-list / Site URL mismatch
**What goes wrong:** Confirm link verifies but lands on wrong host or errors.  
**Why it happens:** `emailRedirectTo` must be on Auth redirect allow-list; Site URL must match deployed SPA.  
**How to avoid:** Runbook checklist: Site URL + Redirect URLs include prod and `http://localhost:5173` (or actual Vite port). Keep `emailRedirectTo` as origin `/`.  
**Warning signs:** User confirms but stays logged out; redirect to Supabase error page.

### Pitfall 4: Breaking confirm by “improving” the link
**What goes wrong:** Token expired / invalid on click.  
**Why it happens:** Prefetch (Safe Links), click tracking, or mangled `ConfirmationURL`. [CITED: auth-email-templates Limitations]  
**How to avoid:** Use bare `href="{{ .ConfirmationURL }}"`; disable provider click tracking; note prefetch OTP workaround in runbook **only if** UAT hits Microsoft Safe Links (do not build OTP UI preemptively — D-04).  
**Warning signs:** Link works in one client, fails in Outlook/corporate.

### Pitfall 5: Treating reset-password as an SPA feature
**What goes wrong:** Scope creep into forgot-password pages.  
**Why it happens:** REQ-27.5 mentions recovery.  
**How to avoid:** Brand Dashboard **Reset password** template only; no LoginPage “Esqueci senha” this phase (feature not present). [VERIFIED: LoginPage.tsx]  
**Warning signs:** Plan tasks for `resetPasswordForEmail` or new routes.

### Pitfall 6: Committing secrets or paste-bin passwords in RESEARCH/PLAN
**What goes wrong:** Credential leak.  
**Why it happens:** Runbook oversharing.  
**How to avoid:** Runbook uses placeholders (`<APP_PASSWORD>`); real values only in Dashboard.  
**Warning signs:** `.env` SMTP keys; screenshots with passwords in git.

## Code Examples

### Management API — SMTP (optional; prefer Dashboard)

```bash
# Source: https://supabase.com/docs/guides/auth/auth-smtp
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -D '{
    "external_email_enabled": true,
    "mailer_autoconfirm": false,
    "smtp_admin_email": "operator@example.com",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "smtp_user": "operator@example.com",
    "smtp_pass": "REPLACE_ME",
    "smtp_sender_name": "Fluxo"
  }'
```

### Management API — Confirm + Recovery templates (optional)

```bash
# Source: https://supabase.com/docs/guides/auth/auth-email-templates
# Keys: mailer_subjects_confirmation / mailer_templates_confirmation_content
#       mailer_subjects_recovery / mailer_templates_recovery_content
# Escape HTML for JSON; keep {{ .ConfirmationURL }} intact.
```

### Optional SPA copy (D-04)

```typescript
// RegisterPage — align message with branded mail (suggestion only)
setSuccessMessage(
  'Conta criada! Enviamos um e-mail da Fluxo para você confirmar o cadastro antes de entrar.',
)
```

Do not change fisioterapeuta success path (awaits company acceptance) unless copy review asks.

### Magic link vs confirm — runbook note (discretion)

This app uses **email+password signup with Confirm email**, not magic-link login. Template type to edit is **Confirm sign up** (`type=email` in ConfirmationURL). Magic Link / OTP templates are out of scope unless product enables passwordless later. [CITED: auth-email-templates template list; VERIFIED: auth.service uses signUp + signInWithPassword]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Built-in Supabase SMTP (demo) | Custom SMTP required for non-team recipients | Documented production guidance | Without Custom SMTP, real user confirm mail fails “not authorized” [CITED: auth-smtp] |
| Default Auth HTML | Dashboard Go templates + optional Management API | Ongoing | Brand without redeploying SPA |
| App-owned mailer for Auth | Prefer SMTP; Hook only for advanced cases | Auth Hook docs | Aligns with D-03 |

**Deprecated/outdated:**
- Relying on default Supabase mail for production signups — explicitly discouraged. [CITED: auth-smtp + troubleshooting not-receiving]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hosted project has **Confirm email** enabled (Phase 03 already designed for both modes) | Architecture | If autoconfirm ON, no confirm email is sent — REQ-27 UAT fails; runbook must verify `mailer_autoconfirm: false` |
| A2 | Operator can create a Google App Password (personal Gmail or Workspace with 2FA) | SMTP recommendation | Execution falls back to Brevo or another listed SMTP |
| A3 | Reset password is “active” only as Auth capability / Dashboard action — not as SPA UI | D-05 / Pitfall 5 | Still brand recovery template; no user-facing forgot flow until a later phase |
| A4 | Production Site URL / Redirect URLs can be updated by the same operator who configures SMTP | Pitfall 3 | Confirm link may not return to the SPA |

**If wrong:** Planner should add a human checkpoint to confirm Auth “Confirm email” toggle and operator mailbox type before SMTP task execution.

## Open Questions (RESOLVED)

1. **Which operator mailbox will be used at execution?** — RESOLVED
   - What we know: D-02 allows Artur’s personal email or another he indicates.
   - Resolution: Gmail App Password path first; Brevo as fallback if Gmail is blocked. Human confirms the live mailbox choice at plan 15-02 checkpoint.

2. **Is Confirm email currently ON in the live project?** — RESOLVED
   - What we know: App handles `needsEmailConfirmation: !session` and duplicate empty identities.
   - Resolution: Preflight in runbook + plan 15-02 how-to-verify reads Auth settings first; keep Confirm email ON (do not enable autoconfirm).

3. **Production + local origins for Redirect URLs?** — RESOLVED
   - What we know: `emailRedirectTo` uses `window.location.origin`.
   - Resolution: Runbook origin table filled at Dashboard apply time with real prod + local URLs; keep app `emailRedirectTo` as origin `/` (unchanged).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | Optional SPA copy + lint | ✓ | Node v26.4.0 / npm 12.0.2 | — |
| Supabase CLI | Local template `config.toml` | ✗ | — | **Hosted Dashboard only** (same as Phases 03/05/07) |
| Supabase hosted project access | SMTP + templates | (operator) | — | Blocking if no Dashboard access |
| Operator mailbox + SMTP creds | Custom SMTP | (operator) | — | Brevo single-sender if Gmail fails |
| Resend verified domain | Resend SMTP | ✗ (deferred domain) | — | Do not choose Resend this phase |

**Missing dependencies with no fallback:**
- Operator access to Supabase Auth settings + a usable SMTP mailbox (human gate).

**Missing dependencies with fallback:**
- Supabase CLI → use Dashboard / optional Management API.
- Gmail SMTP → Brevo (or other auth-smtp listed provider) with verified sender.

Step 2.6 note: Not a pure code-only phase — external SMTP + Dashboard are required.

## Validation Architecture

> `workflow.nyquist_validation` is absent in `.planning/config.json` → treat as **enabled**. No test runner is installed in the app today. [VERIFIED: package.json; .planning/codebase/TESTING.md]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed (lint + typecheck only) |
| Config file | none |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` |

Do **not** add Vitest solely for this phase — there is no pure function to unit-test; SMTP/templates are Dashboard state.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-27.1 | Confirm email shows Fluxo brand/copy | manual UAT | Register with real inbox; screenshot From + body | ❌ Wave 0 N/A |
| REQ-27.2 | From is operator address via Custom SMTP | manual UAT | Inspect From header; change SMTP without redeploy | ❌ |
| REQ-27.3 | Confirm link completes existing account flow | manual UAT | Click link → session → autonomo/empresa/fisio paths | ❌ |
| REQ-27.4 | Runbook documents SMTP + templates + secrets | doc review | File exists under `docs/ops/` or `.planning/ops/`; no secrets committed | ❌ until written |
| REQ-27.5 | Reset password template branded; invites out | manual / config review | Dashboard Reset password HTML matches; Invite User untouched | ❌ |

### Sampling Rate

- **Per task commit:** `npm run typecheck` (if SPA touched); else doc-only → no code gate
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** Manual UAT checklist in runbook green before `/gsd-verify-work`

### Wave 0 Gaps

- None for automated tests — **do not** install Vitest/Playwright as a prerequisite for Phase 15.
- Required deliverable instead: runbook UAT checklist (real signup to non-team inbox).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing Supabase email/password; keep confirm-email ON [CITED: auth-smtp abuse section] |
| V3 Session Management | yes | Existing PKCE + session persistence; confirm link must not introduce open redirects |
| V4 Access Control | no change | Do not touch RLS / `handle_new_user` (D-04) |
| V5 Input Validation | yes (existing) | Zod register schema + sanitizeEmail already on signup |
| V6 Cryptography | no | Do not hand-roll tokens; Auth owns verification secrets |

### Known Threat Patterns for Auth email / SMTP

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SMTP credential leak in git/env | Information Disclosure | Dashboard-only secrets; runbook placeholders (D-02) |
| Open redirect via `emailRedirectTo` | Spoofing / Elevation | Stay on allow-listed same-origin `/`; existing `safeRedirectPath` for in-app redirects |
| Bot signup → SMTP reputation burn | Denial of Service | Keep rate limits; do not disable confirm; CAPTCHA deferred unless abuse appears [CITED: auth-smtp] |
| Phishing lookalike confirm mail | Spoofing | Clear Fluxo From name; short transactional copy; no marketing CTAs |
| Click-tracking breaking tokens | Tampering | Disable provider link tracking [CITED: auth-email-templates] |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory found in the project root at research time. Applicable constraints from existing project intel / conventions:

- Do not call Supabase from UI components — services only (unchanged).
- Never ship `service_role` to the client.
- SQL / Auth config applied via **hosted Dashboard** (CLI not installed) — same as Phases 03/05/07.
- Do not surface raw Auth errors (`mapAuthError`).
- No secrets in committed `.env`.

## Sources

### Primary (HIGH confidence)

- https://supabase.com/docs/guides/auth/auth-smtp — Custom SMTP setup, rate limits, provider list, abuse/deliverability best practices, Auth Hook escape hatch
- https://supabase.com/docs/guides/auth/auth-email-templates — Go template variables (`ConfirmationURL`, `Token`, `TokenHash`, `SiteURL`, `RedirectTo`, `Data`, `Email`), Management API keys, prefetch/tracking limitations
- https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y — Gmail/`smtp.gmail.com` vs `smtp-relay.gmail.com` ports; App Password
- https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw — Debug Auth logs first; custom SMTP strongly recommended
- https://resend.com/docs/send-with-supabase-smtp — Resend requires verified domain + `smtp.resend.com` credentials
- In-repo: `src/services/auth.service.ts`, `src/lib/supabase/client.ts`, `src/pages/auth/RegisterPage.tsx`, `.planning/codebase/INTEGRATIONS.md`, `15-CONTEXT.md`, `REQUIREMENTS.md` REQ-27

### Secondary (MEDIUM confidence)

- Brevo Help — Create/verify sender; free domains cannot authenticate DKIM (https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email)
- Community reports of Brevo + Supabase SMTP working on free plan (Answer Overflow / Discord) — treat as corroboration only

### Tertiary (LOW confidence)

- Third-party SMTP comparison blogs (pricing tables) — use only as orientation; verify limits in provider dashboards at execution

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — official Supabase SMTP + templates docs fetched this session; no app mailer needed
- Architecture: **HIGH** — confirmed against live signup/session code paths
- Pitfalls: **HIGH** — official troubleshooting + template limitations; Gmail caveats documented by Supabase
- SMTP provider pick among Gmail vs Brevo: **MEDIUM** — depends on operator mailbox and live deliverability UAT

**Research date:** 2026-09-21  
**Valid until:** 2026-10-21 (Auth Dashboard UI paths may move; re-check SMTP docs if blocked)
