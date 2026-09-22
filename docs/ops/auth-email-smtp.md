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
   - The CTA **must** be:
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
     Do **not** use only `{{ .ConfirmationURL }}` with PKCE — that fails when the user opens the mail in another browser/device than the one used to sign up.
3. **Reset password** (if recovery stays enabled):
   - Subject: `Redefina sua senha Fluxo`
   - Body: paste `templates/reset-password.html`
   - CTA: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
4. **Invite User:** leave untouched.
5. Save. SPA route `/auth/confirm` runs `supabase.auth.verifyOtp({ token_hash, type })`.

**Inbox vs spam:** Personal Gmail SMTP often lands in spam. Ask recipients to mark “Não é spam”; later Brevo / domain SPF-DKIM.

---

## 4. Site URL / Redirect URLs

1. **Authentication → URL Configuration**
2. **Site URL:** `https://fluxofisio.vercel.app` (no trailing path)
3. **Redirect URLs** include:
   - `https://fluxofisio.vercel.app`
   - `https://fluxofisio.vercel.app/**`
   - `https://fluxofisio.vercel.app/auth/confirm`
   - Local (optional): `http://localhost:5173/**`
4. After changing templates/Site URL, send a **new** signup e-mail (old links keep the old href).

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

---

## 8. UAT checklist (REQ-27)

**Prerequisites:** Custom SMTP ON, Confirm signup + Reset templates pasted, Confirm email ON, Redirect URLs include prod + local origins.

**How to use:** Run a real signup to a non-team inbox. Mark Pass/Fail. Dashboard paste/apply is completed in plan 15-02; this table is the acceptance gate.

| ID | Check | Pass | Fail | Notes |
|----|--------|:----:|:----:|-------|
| REQ-27.1 | Confirm e-mail body/copy shows Fluxo brand (not generic “Supabase Auth”) | | | |
| REQ-27.2 | From display is `Fluxo` + operator address (`<OPERATOR_EMAIL>`) via Custom SMTP | | | |
| REQ-27.3 | Confirm link → session established → account-type flow (autônomo / empresa / fisioterapeuta) works as today | | | |
| REQ-27.4 | This runbook documents SMTP + templates + secrets boundary; no real secrets in git | | | |
| REQ-27.5 | Reset password template is Fluxo-branded if recovery is used; **Invite User** template left untouched | | | |
| Extra | No `VITE_SMTP_*` or SMTP password in committed env files | | | |

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
