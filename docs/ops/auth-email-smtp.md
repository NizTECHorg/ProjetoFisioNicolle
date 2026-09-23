# Auth e-mail Fluxo — Custom SMTP + templates

**Purpose:** Operator runbook for REQ-27 (confirm-account e-mail with Fluxo brand via operator SMTP).  
**Secrets:** Never put real SMTP passwords, App Passwords, or Management API tokens in this file or in git. Use placeholders only.

**How to use:** Follow the numbered steps in Supabase Dashboard. Paste HTML from the repo templates listed below. Mark the UAT table when done.

**Out of scope (this phase):** Invite User / team invite mailer, `@fluxo…` domain + SPF/DKIM, in-app mailer / Edge Function, SPA forgot-password UI, Resend (requires verified domain).

---

## 1. Preflight

1. Open **Supabase Dashboard → Authentication → Providers → Email**.
2. Confirm **Confirm email** is **ON** (autoconfirm off). Equivalent config: `mailer_autoconfirm` must be `false`. If autoconfirm is on, no confirm e-mail is sent and UAT fails.
3. Pick the **operator mailbox** you will use as From (personal Gmail or another address you control). Note it as `<OPERATOR_EMAIL>`.
4. Know what this app sends:
   - Signup uses **e-mail + password** with **Confirm signup** (`type=email` in the verify link).
   - This is **not** Magic Link login. Do not edit Magic Link / OTP templates for this requirement.
5. Have Dashboard access to **Authentication → SMTP**, **Email Templates**, and **URL Configuration**.

---

## 2. Custom SMTP

1. Open **Authentication → SMTP Settings** (or **Project Settings → Authentication → SMTP** depending on Dashboard layout).
2. Enable **Custom SMTP**.
3. Set fields (placeholders only in docs — paste real values only in Dashboard):

| Field | Value |
|-------|--------|
| Enable Custom SMTP | ON |
| Sender name | `Fluxo` (exact) |
| Sender email | `<OPERATOR_EMAIL>` |
| Host / Port / User / Pass | See Gmail path or Brevo fallback below |

### Gmail path (default interim)

1. On the Google account for `<OPERATOR_EMAIL>`: enable 2FA → create an **App Password**.
2. In Supabase Custom SMTP:

| Field | Value |
|-------|--------|
| Host | `smtp.gmail.com` |
| Port | `587` (or `465`) |
| Username | `<OPERATOR_EMAIL>` (same as Sender email) |
| Password | `<APP_PASSWORD>` |

3. For Gmail, **Sender email must equal the SMTP username**. Do not invent a fake `@fluxo` From without owning the domain.
4. Save. Recipients should see `Fluxo <<OPERATOR_EMAIL>>`.

### Brevo fallback (if Gmail SMTP auth fails)

1. Create/verify `<OPERATOR_EMAIL>` as a sender in Brevo.
2. Use Brevo SMTP credentials from the Brevo panel (SMTP key as password):

| Field | Value |
|-------|--------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | `<BREVO_SMTP_LOGIN>` |
| Password | `<BREVO_SMTP_KEY>` |
| Sender name | `Fluxo` |
| Sender email | verified `<OPERATOR_EMAIL>` |

3. Do **not** use Resend in this phase (verified domain required).

---

## 3. Auth Email Templates

1. Open **Authentication → Email Templates**.
2. **Confirm sign up** (required):
   - Subject: `Confirme sua conta Fluxo`
   - Body: paste `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html`
   - The CTA **must** be the bare Go variable `{{ .ConfirmationURL }}` and nothing else. Do not append a path or a query string. Go templates are case-sensitive: the name is `ConfirmationURL`.
3. **Reset password** (if recovery stays enabled):
   - Subject: `Redefina sua senha Fluxo`
   - Body: paste `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html`
   - Same rule: the CTA is the bare `{{ .ConfirmationURL }}`. GoTrue supplies the recovery type itself. Do not hand-write a type query parameter.
4. **Invite User:** leave untouched.
5. Save. GoTrue renders `{{ .ConfirmationURL }}` as this project's `/auth/v1/verify` URL. It fills the confirmation timestamp while serving that request, then redirects to `https://fluxofisio.vercel.app/auth/confirm` when that address is on the allow-list.

**Why the previous CTA failed.** The link host came from the Dashboard Site URL, which still pointed at a dev origin, so the message opened a local address. The token was redeemed in the SPA, so the account was confirmed only if that page actually loaded on the device that opened the mail. A bare `{{ .ConfirmationURL }}` is verified by GoTrue before any redirect, so the account can be used with e-mail and password even when the SPA never loads.

**Inbox vs spam:** Personal Gmail SMTP often lands in spam. Ask recipients to mark “Não é spam”; later Brevo / domain SPF-DKIM.

---

## 4. Site URL / Redirect URLs

1. **Authentication → URL Configuration**
2. **Site URL:** `https://fluxofisio.vercel.app` (no trailing path). This is the only allowed Site URL.
3. **Redirect URLs** allow-list is exactly these three entries:
   - `https://fluxofisio.vercel.app`
   - `https://fluxofisio.vercel.app/**`
   - `https://fluxofisio.vercel.app/auth/confirm`
4. Remove every allow-list entry whose host is localhost or 127.0.0.1. The app now always sends the production origin. An origin that is not on the allow-list makes GoTrue fall back to the Site URL instead of leaking the redirect to a dev host. Do not add a local origin back.

---

## SPA build variable (Vercel)

Plan 15-02 pins `emailRedirectTo` to `https://fluxofisio.vercel.app/auth/confirm`. The production build has to carry that value.

1. Open **Vercel → Project → Settings → Environment Variables**.
2. Delete `VITE_APP_URL` unless its value is exactly `https://fluxofisio.vercel.app`.
3. Redeploy so the build that sends `emailRedirectTo` includes the plan 15-02 fix.
4. Leave `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` untouched.
5. No SMTP variable belongs in Vercel. SMTP credentials stay only in the Supabase Dashboard (section 6).

---

## 5. Rate limits

- After **Custom SMTP** is enabled, Auth default send rate is about **30 messages/hour** (adjust under Authentication → Rate Limits if needed).
- Built-in Supabase SMTP is **demo-only** (~2/hour, team addresses). Do not rely on it for real user confirm mail.

---

## 6. Secrets boundary

| Allowed location | Forbidden |
|------------------|-----------|
| Supabase Dashboard Custom SMTP password field | Repo, PR descriptions, screenshots in git |
| Operator password manager | `VITE_SMTP_*` in Vite/Netlify/Vercel |
| Placeholders in this runbook (`<APP_PASSWORD>`, `<OPERATOR_EMAIL>`) | Committed `.env` / `.env.local` with real SMTP pass |

Never commit App Passwords, Brevo SMTP keys, or Management API tokens. Templates and this runbook are public-in-repo by design — they must stay secrets-free.

---

## 7. Pitfalls

1. **Templates alone do not change From** — enable Custom SMTP first; templates only change body/subject.
2. **Click tracking OFF** on the SMTP provider — rewrites break Auth verify links.
3. **Do not mutate `{{ .ConfirmationURL }}`** — bare `href="{{ .ConfirmationURL }}"` only; wrong casing (`ConfirmationUrl`) yields an empty link.
4. **Mail fails?** Check **Authentication → Logs** (or Auth logs) first before blaming the SPA.
5. **Gmail:** Sender email must equal SMTP user; use App Password, not the account password.
6. **Redirect mismatch:** if Site URL / Redirect URLs omit the SPA origin, the confirm link will not return to Fluxo correctly.
7. **Confirm link opens localhost.** Symptom: the message opens a dev host instead of Fluxo in production. Cause: the Dashboard Site URL, the Redirect URLs allow-list, or the Vercel `VITE_APP_URL` build variable still names a dev host. Fix: set Site URL to `https://fluxofisio.vercel.app`, keep only the three production allow-list entries in section 4, remove every localhost or 127.0.0.1 entry, delete `VITE_APP_URL` unless it is exactly that production origin, and redeploy.
8. **Click does not confirm the account.** Symptom: after the button, Authentication → Users still has an empty confirmation timestamp, and sign-in with e-mail and password fails. Cause: the previous template redeemed the token in the SPA, and a PKCE code verifier stored on the signup device is missing when the mail is opened on a phone or another browser. Fix: paste the bare `{{ .ConfirmationURL }}` templates so GoTrue confirms on `/auth/v1/verify` before the redirect. The SPA client stays on implicit flow (plan 15-02).
9. **Links mailed before this fix are dead.** After the Site URL, the allow-list, the templates, and the Vercel redeploy, run a brand-new cadastro with a fresh e-mail address. Do not retest with an old message — those links stay invalid.
10. **A mail scanner may consume the link before the human clicks.** In that case the account is already confirmed. The user should simply sign in with e-mail and senha.

---

## 8. UAT checklist (REQ-27)

**Prerequisites:** Custom SMTP ON, Confirm signup and Reset password templates pasted with a bare `{{ .ConfirmationURL }}` CTA, Confirm email ON, Site URL `https://fluxofisio.vercel.app`, Redirect URLs exactly the three production entries in section 4, and `VITE_APP_URL` deleted or set to that same origin with a redeploy.

**How to use:** Run a brand-new cadastro to a non-team inbox. Do not reuse a message sent before this fix. Mark Pass/Fail/Notes. This table is the acceptance gate for the replan.

| ID | Check | Pass | Fail | Notes |
|----|--------|:----:|:----:|-------|
| REQ-27.1 | CTA host in the received message is the Supabase project domain; the landing URL is `https://fluxofisio.vercel.app/auth/confirm`; the link contains no localhost | Pass | | Operador respondeu `approved` em 2026-09-23. Não informou timestamp, aparelho nem o resultado separado do login. |
| REQ-27.2 | Clicking from a phone, or from a browser other than the one used to sign up, lands on the Fluxo confirm screen | Pass | | Operador respondeu `approved` em 2026-09-23. Não informou timestamp, aparelho nem o resultado separado do login. |
| REQ-27.3 | Dashboard → Authentication → Users shows the new account with its confirmation timestamp filled | Pass | | Operador respondeu `approved` em 2026-09-23. Não informou o timestamp exibido. |
| REQ-27.4 | Signing out and signing in with that e-mail and password succeeds | Pass | | Operador respondeu `approved` em 2026-09-23. Não descreveu o login em separado. |
| REQ-27.5 | The message shows the Fluxo brand and the operator From address (`Fluxo` + `<OPERATOR_EMAIL>`) | Pass | | Operador respondeu `approved` em 2026-09-23. E-mail registrado só como `<OPERATOR_EMAIL>`. |
| REQ-27.6 | Reset password template is Fluxo-branded; **Invite User** is untouched | Pass | | Operador respondeu `approved` em 2026-09-23. |
| REQ-27.7 | No SMTP secret appears in git (placeholders only, including `<APP_PASSWORD>`) | Pass | | Operador respondeu `approved` em 2026-09-23. Nenhuma senha foi enviada na resposta. |

When all required rows pass, Phase 15 UAT for REQ-27 can proceed to verify-work.

---

## 9. Troubleshooting — signup returns HTTP 500

If **Criar conta** fails with `500` right after enabling Custom SMTP, Auth could not send the confirmation e-mail. The account create call fails when mail delivery fails.

**Immediate restore (unblocks signup):**

1. Dashboard → Authentication → SMTP → **disable Custom SMTP** (or clear bad Host/User/Pass) → Save.
2. Retry signup. Default Supabase mail should work again (may land in spam; From won’t be Fluxo yet).

**Then fix SMTP before re-enabling:**

| Check | Correct value |
|-------|----------------|
| Host | Exact `smtp.gmail.com` — **not** the placeholder `your.smtp.host.com` |
| Port | Prefer `587`; `465` also OK |
| Username | Same as Sender email (`arturtenca1@gmail.com`) |
| Password | Google **App Password** (16 chars). Not the normal Gmail password. Paste without spaces. |
| Sender email | Must equal the Gmail account that owns the App Password |
| 2FA | Required on the Google account before App Passwords appear |

Also open **Logs → Auth** in the Dashboard after a failed signup — look for SMTP / “error sending confirmation email”.

Do **not** leave Custom SMTP ON with incomplete Host/Username/Password: that breaks every new registration.

---

## Template file map

| Dashboard template | Repo file | Recommended subject |
|--------------------|-----------|---------------------|
| Confirm sign up | `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html` | Confirme sua conta Fluxo |
| Reset password | `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html` | Redefina sua senha Fluxo |

## References

- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y
