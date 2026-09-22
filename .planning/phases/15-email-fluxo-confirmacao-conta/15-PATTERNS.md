# Phase 15: E-mail Fluxo de confirmação de conta - Pattern Map

**Mapped:** 2026-09-21  
**Files analyzed:** 5  
**Analogs found:** 4 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `docs/ops/auth-email-smtp.md` | config (ops runbook) | transform (ops → Dashboard state) | `.planning/phases/08-integracao-google-agenda/08-03-PLAN.md` Task 2 `how-to-verify` + `10-UI-CHECKLIST.md` UAT tables | role-match |
| `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html` | config (paste-ready Auth template) | transform | *none in repo* — use `15-RESEARCH.md` Pattern 2 + `src/index.css` brand tokens | no-analog |
| `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html` | config (paste-ready Auth template) | transform | same as confirm-signup (mirror brand; Recovery subject) | no-analog |
| `src/pages/auth/RegisterPage.tsx` | page / component | request-response | `src/pages/auth/RegisterPage.tsx` (self — successMessage block only) | exact |
| `src/services/auth.service.ts` | service | request-response | **DO NOT MODIFY** — keep `signUpWithEmail` / `emailRedirectTo` as-is | leave-alone |

**Explicitly out of scope (no files):** SQL migrations, Edge Functions, npm packages, invite mailer, `handle_new_user`, RLS, LoginPage forgot-password UI, in-app SendGrid/Resend SDK.

## Pattern Assignments

### `docs/ops/auth-email-smtp.md` (config / ops runbook)

**Analog (ops checklist + secrets boundary):** `.planning/phases/08-integracao-google-agenda/08-03-PLAN.md` Task 2  
**Analog (UAT matrix structure):** `.planning/phases/10-responsividade-mobile/10-UI-CHECKLIST.md`  
**Analog (placeholder env / no secrets in git):** `README.md` env section + `src/pages/SetupPage.tsx` numbered steps  
**Analog (Auth email product context):** `.planning/codebase/INTEGRATIONS.md` Auth Provider block

**Core ops pattern** (`08-03-PLAN.md` lines 167–188) — Dashboard human gate; secrets never in repo/Vite:

```markdown
Claude cannot create Google Cloud OAuth clients or click Dashboard toggles.
Prepare a short checklist…; do not invent secrets into the repo.

how-to-verify:
  1. … create/use … note client id + secret.
  2. Supabase Auth: … add redirect URL … site URL; ensure app origin … allowed …
  4. Set Function secrets … Confirm no VITE_GOOGLE_* in Netlify/Vite env.
  6. Reply approved with notes …

acceptance:
  - … secrets set as Function secrets (not VITE_)
```

**Apply to runbook:** Same shape for Custom SMTP — numbered Dashboard steps, placeholder credentials (`<APP_PASSWORD>`), Redirect URLs / Site URL checklist, human approval gate. Swap “Function secrets” → “Auth → SMTP settings (Dashboard only)”.

**UAT checklist pattern** (`10-UI-CHECKLIST.md` lines 1–8, 20–28) — markable table, prerequisites, no redesign of rows:

```markdown
# Phase 10 — Mobile UAT Checklist
**How to use:** …
**Prerequisites:** …

| Check | 360 | 390 | 430 | lg |
|-------|-----|-----|-----|----|
| No page-level horizontal pan … | | | | |
```

**Apply to runbook UAT section:** Rows for REQ-27.1–27.5 (From = Fluxo + operator address; body Fluxo; confirm link → session; reset template branded; Invite untouched; no secrets committed).

**Secrets / placeholder pattern** (`README.md` lines 39–50):

```markdown
Crie um arquivo `.env.local` … com as chaves abaixo:

VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

Observações:
- … não estão com placeholders.
```

**Apply:** Document SMTP fields with placeholders only (`Sender email: <OPERATOR_EMAIL>`, `Password: <APP_PASSWORD>`). Never commit real App Passwords.

**Numbered operator steps tone** (`SetupPage.tsx` lines 18–35):

```tsx
<ol className="mt-6 space-y-3 text-left text-sm text-ink/80">
  <li>
    1. Na Vercel, vá em <code>Settings → Environment Variables</code>
  </li>
  <li>
    2. Confirme <code>VITE_SUPABASE_URL</code> e{' '}
    <code>VITE_SUPABASE_ANON_KEY</code> (Production)
  </li>
  …
</ol>
<p className="mt-6 text-xs text-muted">
  Use apenas a chave anon (pública). Nunca exponha a service_role key no frontend.
</p>
```

**Apply:** Runbook prose uses the same imperative numbered Dashboard path (Auth → SMTP → Templates → URL Configuration) and a closing “never commit SMTP pass / Management API token” note.

**Auth product constraints** (`INTEGRATIONS.md` lines 97–102, 147–149) — keep SPA behavior; Dashboard owns mail:

```markdown
- Email redirect: `${window.location.origin}/`.
- Email confirmation: expected from Supabase Auth (hosted email).
  No in-app SMTP/SendGrid integration. Configure templates in the Supabase dashboard.
- Auth email links return to the SPA origin (`emailRedirectTo` + `detectSessionInUrl: true` …).
```

**Recommended runbook sections (compose from analogs + RESEARCH):**
1. Preflight — Confirm email ON (`mailer_autoconfirm: false`); operator mailbox type
2. Custom SMTP — Gmail App Password path + Brevo fallback fields
3. Auth Email Templates — Confirm signup (+ Reset password); paste from `templates/*.html`
4. Site URL / Redirect URLs — prod + `http://localhost:5173` (or actual Vite port)
5. Rate limits note — Custom SMTP default ~30/hour
6. Secrets boundary — Dashboard only; placeholders in git
7. UAT checklist — register → inbox From/body → click link → account-type flow
8. Magic link vs confirm note — this app uses email+password Confirm signup (`type=email`), not Magic Link

**Do not** put the runbook only under `.planning/phases/15-…` as the sole copy — RESEARCH prefers `docs/ops/` for operators outside GSD folders.

---

### `templates/confirm-signup.html` + `templates/reset-password.html` (optional paste-ready HTML)

**Analog:** None in application tree (no existing Auth HTML assets).  
**Source of truth for structure:** `15-RESEARCH.md` Pattern 2 (lines 191–209)  
**Brand tokens:** `src/index.css` lines 4–11

**Brand color pattern** (`src/index.css`):

```css
--color-forest: #0b1d36;
--color-ink: #102038;
--color-muted: #5a6b80;
```

**Core template pattern** (from RESEARCH — paste into Dashboard; keep Go variable casing):

```html
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

Subject: `Confirme sua conta na Fluxo`.

**Reset password:** Same visual shell; Recovery copy + same `{{ .ConfirmationURL }}` (Auth Recovery template uses the same variable name per Supabase docs). Do **not** build SPA forgot-password UI.

**Anti-patterns (from RESEARCH — enforce in plan):**
- Do not append query params to `{{ .ConfirmationURL }}`
- Do not use wrong casing (`ConfirmationUrl`)
- Web-safe fonts only (Arial/Helvetica) — do not rely on Plus Jakarta / Cormorant
- Disable SMTP provider click tracking
- No Invite User template changes (D-05)

---

### `src/pages/auth/RegisterPage.tsx` (page, request-response) — optional copy-only

**Analog:** Same file — success / error banner pattern already established.

**Imports pattern** (lines 1–11) — do not add mailer imports:

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema'
import { signUpWithEmail } from '@/services/auth.service'
import { lookupOrganizationByCode } from '@/services/team.service'
```

**Core success-message pattern** (lines 62–75) — only change the confirm-email string if planner opts in:

```typescript
const { needsEmailConfirmation } = await signUpWithEmail(data)

if (data.accountType === 'fisioterapeuta') {
  setSuccessMessage('Cadastro concluído. Aguarde a empresa aceitar seu pedido.')
  return
}

if (needsEmailConfirmation) {
  setSuccessMessage(
    'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.',
  )
} else {
  setSuccessMessage('Conta criada com sucesso! Você já pode entrar.')
}
```

**Suggested Fluxo-aligned copy** (from RESEARCH; keep fisioterapeuta path unchanged):

```typescript
setSuccessMessage(
  'Conta criada! Enviamos um e-mail da Fluxo para você confirmar o cadastro antes de entrar.',
)
```

**Status banner UI** (lines 104–111) — reuse; do not redesign:

```tsx
{successMessage && (
  <div
    role="status"
    className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
  >
    {successMessage}
  </div>
)}
```

**Error handling pattern** (lines 76–78) — keep:

```typescript
} catch (error) {
  setServerError(error instanceof Error ? error.message : 'Erro ao criar conta.')
}
```

**Do not:** change form schema, account-type branching, join-code lookup, or call any new email API.

---

### `src/services/auth.service.ts` (service, request-response) — leave alone

**Analog:** Current implementation is the canonical pattern. Planner must treat this as verify-only unless Redirect URL allow-list forces a documented one-line change (unlikely).

**Core signup pattern** (lines 97–136) — preserve:

```typescript
export async function signUpWithEmail(
  data: RegisterFormData,
): Promise<{ needsEmailConfirmation: boolean }> {
  const parsed = registerSchema.parse(data)
  const email = sanitizeEmail(parsed.email)
  const fullName = sanitizeText(parsed.fullName, 100)

  assertRateLimit([`auth:register:${email}`, 'auth:register:global'])

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password: parsed.password,
    options: {
      data: {
        full_name: fullName,
        account_type: parsed.accountType,
        join_code:
          parsed.accountType === 'fisioterapeuta'
            ? normalizeJoinCode(parsed.joinCode ?? '')
            : null,
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  const identities = authData.user?.identities ?? []
  const isDuplicateProbe = Boolean(authData.user) && identities.length === 0
  if (isDuplicateProbe) {
    throw new Error('Este e-mail já está cadastrado. Entre ou use outro e-mail.')
  }

  resetRateLimit(`auth:register:${email}`)

  return { needsEmailConfirmation: !authData.session }
}
```

**Session completion (related leave-alone):** `src/lib/supabase/client.ts` lines 21–26 — `detectSessionInUrl: true`, `flowType: 'pkce'`. Do not add a custom `/auth/confirm` route.

## Shared Patterns

### Secrets stay off the client and out of git
**Source:** `08-03-PLAN.md` Task 2; `SetupPage.tsx` footer; CONTEXT D-02  
**Apply to:** Runbook, any plan notes, SUMMARY  
```text
SMTP host/user/pass / App Password → Supabase Dashboard Auth SMTP only
Never VITE_SMTP_* / never .env committed / placeholders in docs only
```

### Portuguese user-facing auth copy
**Source:** `RegisterPage.tsx`, `LoginPage.tsx`, `auth.service.ts` `mapAuthError` usage  
**Apply to:** Email HTML subjects/bodies + optional RegisterPage success string  
- Short transactional PT-BR; product name **Fluxo**  
- Do not surface raw Supabase Auth errors

### Confirm-email flow already correct — brand transport only
**Source:** `auth.service.ts` + `client.ts` + `INTEGRATIONS.md`  
**Apply to:** All plans  
- Keep `emailRedirectTo: ${origin}/`  
- Keep PKCE + `detectSessionInUrl`  
- Configure SMTP + templates in Dashboard; do not build a mailer

### Human Dashboard checkpoint (hosted, no CLI)
**Source:** Phase 03/08 SQL/ops plans (`Supabase Dashboard → …`)  
**Apply to:** SMTP enable, template paste, Site URL / Redirect URLs, UAT  
- Same “blocking human-check / reply approved” pattern as Google Calendar secrets deploy

### Validation when SPA touched
**Source:** `15-VALIDATION.md`  
**Apply to:** Optional RegisterPage edit only  
```bash
npm run typecheck
# wave gate:
npm run lint && npm run typecheck
```
Doc-only commits: no code gate; UAT checklist in runbook is the phase gate.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `templates/confirm-signup.html` | config | transform | No Auth email HTML assets in repo; invent from RESEARCH Pattern 2 + CSS brand tokens |
| `templates/reset-password.html` | config | transform | Same — mirror confirm template with recovery copy |

`docs/ops/` directory does not exist yet — create it. Closest *behavioral* analogs are phase ops checklists (08-03) and UAT matrices (10-UI-CHECKLIST), not an existing markdown under `docs/`.

## Metadata

**Analog search scope:** `src/pages/auth/`, `src/services/auth.service.ts`, `src/lib/supabase/`, `src/pages/SetupPage.tsx`, `src/index.css`, `README.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/phases/08-integracao-google-agenda/`, `.planning/phases/03-tipos-de-conta-e-equipe/`, `.planning/phases/10-responsividade-mobile/`, `docs/` (absent), `.cursor/rules/` (absent)  
**Files scanned:** ~25 targeted + glob over docs/ops  
**Pattern extraction date:** 2026-09-21
