# Phase 20: Esqueci minha senha - Pattern Map

**Mapped:** 2026-09-29
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/auth/ForgotPasswordPage.tsx` | component | request-response | `src/pages/auth/LoginPage.tsx` | exact |
| `src/pages/auth/LoginPage.tsx` | component | request-response | `src/pages/auth/LoginPage.tsx` (self + show-password link) | exact |
| `src/pages/auth/AuthConfirmPage.tsx` | component | request-response | `src/pages/auth/AuthConfirmPage.tsx` + `RegisterPage` password fields | exact / role-match |
| `src/services/auth.service.ts` | service | request-response | `signUpWithEmail` + `changePassword` (same file) | exact |
| `src/schemas/auth.schema.ts` | utility | transform | `loginSchema` + `changePasswordSchema` (same file) | exact |
| `src/lib/auth/confirmCallback.ts` | utility | request-response | `src/lib/auth/confirmCallback.ts` (self) | exact |
| `src/routes/index.tsx` | route | request-response | `src/routes/index.tsx` GuestRoute `/cadastro` | exact |
| `src/lib/security/index.ts` | utility | request-response | `mapAuthError` + `limitsFor` / `checkRateLimit` (same file) | role-match |

**Reuse only (no change expected):** `AuthLayout`, `Button`, `Input`, `ToastViewport` / `toast()`, `env.appUrl`, `passwordSchema`, `signOut`, `supabase` client (`flowType` unchanged).

**Do not modify:** `AccountPage` / `changePassword` / Phase 18 `current_password` wall; `src/lib/supabase/client.ts` auth options.

---

## Pattern Assignments

### `src/pages/auth/ForgotPasswordPage.tsx` (component, request-response)

**Analog:** `src/pages/auth/LoginPage.tsx` (form chrome) + success-body branch inspired by `AuthConfirmPage` status UI

**Imports / AuthLayout + form shell** (LoginPage lines 1–11, 43–56):
```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/stores/toast.store'
// + forgotPasswordSchema + requestPasswordReset

<AuthLayout
  title="Esqueci minha senha"
  subtitle="Informe o e-mail da conta. Enviamos um link para criar uma senha nova."
  footer={
    <p>
      Lembrou a senha?{' '}
      <Link to="/" className="font-medium text-forest hover:text-forest-mid">
        Entrar
      </Link>
    </p>
  }
>
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
```

**Core submit pattern** (LoginPage lines 34–40 — adapt service + anti-enumeration success):
```typescript
async function onSubmit(data: ForgotPasswordFormData) {
  try {
    await requestPasswordReset(data.email)
    setSent(true) // replace form with identical success copy — never branch on "user missing"
  } catch (error) {
    toast(
      error instanceof Error ? error.message : 'Não foi possível enviar o link. Tente de novo.',
      'error',
    )
  }
}
```

**E-mail field pattern** (LoginPage lines 57–66):
```typescript
<Input
  label="E-mail"
  type="email"
  autoComplete="off"
  inputMode="email"
  spellCheck={false}
  placeholder="seu@email.com"
  error={errors.email?.message}
  {...register('email')}
/>
```

**CTA:** `<Button type="submit" fullWidth isLoading={isSubmitting}>Enviar link</Button>`

**Success body (no list empty-state analog — use AuthConfirmPage centered body):**
```typescript
// After sent === true: keep AuthLayout title; replace form with:
<p className="text-sm text-muted text-center">
  Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.
</p>
// optional spam line + Link "Voltar ao login" → /
```

**Anti-patterns from RegisterPage:** Do **not** copy duplicate-e-mail toast (`Este e-mail já está cadastrado…`). Do **not** probe `profiles` before submit.

---

### `src/pages/auth/LoginPage.tsx` (component, request-response)

**Analog:** Self — add link under password / Mostrar senha, above Entrar

**Link style pattern** (LoginPage lines 77–83 — same classes as Mostrar senha; UI-SPEC wants `min-h-11` like AccountPage):
```typescript
<button
  type="button"
  onClick={() => setShowPassword((prev) => !prev)}
  className="text-xs text-muted transition-colors hover:text-forest"
>
  {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
</button>

// ADD (prefer Link, hit area ≥ 44px):
<Link
  to="/esqueci-senha"
  className="inline-flex min-h-11 items-center text-xs text-muted transition-colors hover:text-forest"
>
  Esqueci minha senha
</Link>
```

**Hit-area reference** (AccountPage lines 343–348):
```typescript
className="inline-flex min-h-11 items-center text-xs text-muted transition-colors hover:text-forest"
```

**Must not:** Call `resetPasswordForEmail` from login submit; link to `/conta`; add a second primary button.

---

### `src/pages/auth/AuthConfirmPage.tsx` (component, request-response)

**Analog:** Self for working/error/signup success; `RegisterPage` for dual password fields; `AccountPage` for toast + error mapping on password write — **without** senha atual / `changePassword`

**Existing confirm effect** (AuthConfirmPage lines 18–47) — **branch before signup copy**:
```typescript
void confirmFromInitialUrl().then((result) => {
  if (cancelled) return
  if (result.ok) {
    // NEW: if recovery (type=recovery / PASSWORD_RECOVERY / result.mode === 'recovery')
    //   → setStatus('recovery') / show Nova senha form; DO NOT toast signup; DO NOT navigate('/')
    // ELSE signup path unchanged:
    setStatus('ok')
    setMessage('E-mail confirmado. Você já pode entrar na Fluxo.')
    toast('E-mail confirmado com sucesso.', 'success')
    window.setTimeout(() => {
      if (!cancelled) navigate('/', { replace: true })
    }, 900)
    return
  }
  // recovery-aware error copy (UI-SPEC):
  // ignored → "Link inválido ou incompleto. Peça um novo link em Esqueci minha senha."
  // consumed → "Este link já foi usado ou expirou. Peça um novo link em Esqueci minha senha."
  // Do not reuse "Cadastre-se de novo…" when in recovery context
})
```

**Working spinner** (AuthConfirmPage lines 57–61) — keep; recovery working copy = **Validando o link…**:
```typescript
<div className="flex justify-center py-6">
  <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
</div>
```

**Password fields pattern** (RegisterPage lines 142–167 — labels from UI-SPEC):
```typescript
<Input
  label="Nova senha"
  type={showPassword ? 'text' : 'password'}
  autoComplete="new-password"
  placeholder="••••••••••••"
  hint="Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial"
  error={errors.password?.message}
  {...register('password')}
/>
<Input
  label="Confirmar nova senha"
  type={showPassword ? 'text' : 'password'}
  autoComplete="new-password"
  placeholder="••••••••••••"
  error={errors.confirmPassword?.message}
  {...register('confirmPassword')}
/>
<button type="button" /* Mostrar senhas / Ocultar senhas */ />
<Button type="submit" fullWidth isLoading={isSubmitting}>
  Salvar nova senha
</Button>
```

**Post-save pattern** (AccountPage toast + auth.service `signOut` — do not call `changePassword`):
```typescript
await setPasswordFromRecovery(data)
toast('Senha atualizada.', 'success')
await signOut()
navigate('/', { replace: true })
```

**AuthLayout titles:** recovery form → title **Nova senha**, subtitle **Escolha uma senha nova para entrar na Fluxo.**; signup path keeps **Confirmar e-mail**.

**Critical GuestRoute pitfall:** Public `/auth/confirm` stays outside `GuestRoute` (already true). Never auto-navigate recovery success into `/` while session still authenticated without `signOut` first — `GuestRoute` would admit clinic access (ProtectedRoute lines 111–124).

---

### `src/services/auth.service.ts` (service, request-response)

**Analog A — request reset:** `signUpWithEmail` (sanitize, rate limit, `env.appUrl` redirect, `mapAuthError`)

**Imports already present** (lines 1–11):
```typescript
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'
import {
  checkRateLimit,
  formatRetryAfter,
  mapAuthError,
  resetRateLimit,
  sanitizeEmail,
} from '@/lib/security'
```

**Rate-limit + redirect pattern** (signUpWithEmail lines 109–128):
```typescript
const email = sanitizeEmail(parsed.email)
assertRateLimit([`auth:register:${email}`, 'auth:register:global'])
// …
emailRedirectTo: `${env.appUrl}/auth/confirm`,
```

**New `requestPasswordReset` — copy structure, new keys, no profiles probe:**
```typescript
export async function requestPasswordReset(emailInput: string): Promise<void> {
  const parsed = forgotPasswordSchema.parse({ email: emailInput })
  const email = sanitizeEmail(parsed.email)
  assertRateLimit([`auth:recovery:${email}`, 'auth:recovery:global'])

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/auth/confirm`,
  })
  if (error) {
    // Prefer recovery-specific message for SMTP/mail branches — not signup "e-mail de confirmação"
    throw new Error(/* mapRecoveryRequestError(error) or dedicated string */)
  }
  resetRateLimit(`auth:recovery:${email}`)
  // Success when error is null — UI always same (anti-enumeration)
}
```

**Analog B — set password:** `changePassword` (lines 190–204) — **omit** `current_password`

```typescript
// EXISTING — do not reuse for recovery:
export async function changePassword(/* … */) {
  const { error } = await supabase.auth.updateUser({
    password: parsed.newPassword,
    current_password: parsed.currentPassword, // Phase 18 only
  })
}

// NEW:
export async function setPasswordFromRecovery(input: RecoveryPasswordFormData): Promise<void> {
  const parsed = recoveryPasswordSchema.parse(input)
  assertRateLimit([/* auth:recovery:set:* keys */])
  const { error } = await supabase.auth.updateUser({
    password: parsed.password, // or newPassword field name from schema
  })
  if (error) throw new Error(mapAuthError(error)) // or recovery-write mapping
  await signOut() // preferred so user "entra de novo"
}
```

**Must not:** Call `changePassword` from recovery; pre-query `fetchProfile` / `profiles` to check e-mail existence.

---

### `src/schemas/auth.schema.ts` (utility, transform)

**Analog A — e-mail only:** `loginSchema` + shared `emailSchema` (lines 20–31)

```typescript
const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail é obrigatório')
  .max(254)
  .email('E-mail inválido')
  .transform((value) => value.toLowerCase())

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória').max(128, 'Senha inválida'),
})

// NEW:
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})
```

**Analog B — new + confirm without current:** `changePasswordSchema` superRefine (lines 74–132) — drop `currentPassword` and “diferente da atual”; keep empty **Informe a nova senha.**, `passwordSchema`, match **As senhas não coincidem.**

```typescript
export const recoveryPasswordSchema = z
  .object({
    password: z.string(), // empty → "Informe a nova senha."
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .superRefine(/* passwordSchema.safeParse like changePasswordSchema */)
  .refine(/* password === confirmPassword → path confirmPassword */)
```

Reuse `passwordSchema` (lines 4–11). Optional e-mail-in-password refine only if session e-mail is available — otherwise skip (unlike `changePasswordSchema(email)`).

---

### `src/lib/auth/confirmCallback.ts` (utility, request-response)

**Analog:** Self

**Recovery already in OTP set** (lines 5–12):
```typescript
const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])
```

**Gap:** `typesToTry(null)` omits `recovery` (lines 76–79):
```typescript
function typesToTry(hint: EmailOtpType | null): EmailOtpType[] {
  if (hint) return [hint]
  return ['signup', 'email', 'magiclink', 'invite'] // recovery missing when type absent
}
```

**Recommended extensions (planner discretion):**
1. Export `initialParams.type` or `isRecoveryCallback()` from parsed `type === 'recovery'`.
2. Widen `ConfirmCallbackResult` success to `{ ok: true; mode?: 'signup' | 'recovery' }` when hint/type is recovery.
3. Do **not** blindly prepend `recovery` to every confirm fallback (signup pitfall). Prefer GoTrue-supplied `type` + hash `type=recovery`.

**Consume once** (lines 138–143) — keep singleton `confirmPromise` so AuthProvider + AuthConfirmPage share one verify.

---

### `src/routes/index.tsx` (route, request-response)

**Analog:** GuestRoute block for `/cadastro` (lines 22–29)

```typescript
<Route element={<GuestRoute />}>
  <Route path="/" element={<LoginPage />} />
  <Route path="/login" element={<Navigate to="/" replace />} />
  <Route path="/cadastro" element={<RegisterPage />} />
  {/* ADD */}
  <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
</Route>

{/* Keep public — do NOT wrap in GuestRoute */}
<Route path="/auth/confirm" element={<AuthConfirmPage />} />
```

Import: `import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'`

Optional public sibling `/auth/redefinir-senha` only if client-navigated after recovery detect — **no** Dashboard Redirect URL change.

---

### `src/lib/security/index.ts` (utility, request-response)

**Analog:** `limitsFor` + `mapAuthError` (lines 65–136, 191–199)

**Rate-limit keys:** Extend `limitsFor` so `auth:recovery:` gets sensible limits (mirror register hourly or login window — planner choice):

```typescript
function limitsFor(key: string): { max: number; windowMs: number } {
  if (key.startsWith('auth:register:')) {
    return { max: REGISTER_MAX_ATTEMPTS, windowMs: REGISTER_WINDOW_MS }
  }
  // ADD auth:recovery: branch
  return {
    max: key.endsWith(':global') ? LOGIN_MAX_ATTEMPTS_GLOBAL : LOGIN_MAX_ATTEMPTS_PER_KEY,
    windowMs: LOGIN_WINDOW_MS,
  }
}
```

**Error mapping — do not blindly reuse signup SMTP string for reset** (lines 124–133):
```typescript
return 'Não foi possível enviar o e-mail de confirmação. Confira o SMTP…'
```

Recovery request UI needs: **Não foi possível enviar o link. Tente de novo.**  
Expired-link default (lines 93–101) says **Cadastre-se de novo…** — recovery UI must override with Esqueci minha senha copy **in the page**, or add a context-aware helper; avoid breaking signup confirm wording.

Client rate-limit toast already aligned: `over_request_rate_limit` / rate limit → **Muitas tentativas. Aguarde e tente novamente mais tarde.**

---

## Shared Patterns

### Auth chrome
**Source:** `src/components/auth/AuthLayout.tsx` lines 10–59  
**Apply to:** `ForgotPasswordPage`, both modes of `AuthConfirmPage`  
Reuse `title` / `subtitle` / optional `footer`; do not restyle marketing aside or form card.

### Guest vs public routing
**Source:** `src/routes/index.tsx` + `GuestRoute` (`ProtectedRoute.tsx` lines 111–134)  
**Apply to:** `/esqueci-senha` inside GuestRoute; `/auth/confirm` stays public. Recovery must `signOut` before sending user to login so GuestRoute does not bounce an authenticated recovery session into the clinic.

### Form stack
**Source:** Login/Register — `react-hook-form` + `zodResolver` + `space-y-5` + `Button fullWidth isLoading`  
**Apply to:** Forgot-password e-mail form; recovery new-password form.

### Service error / rate limit
**Source:** `auth.service.ts` `assertRateLimit` + `throw new Error(mapAuthError(error))`  
**Apply to:** `requestPasswordReset`, `setPasswordFromRecovery`. Prefer recovery-specific user strings per UI-SPEC when `mapAuthError` is signup-biased.

### Password strength
**Source:** `passwordSchema` in `auth.schema.ts`  
**Apply to:** Recovery new password only (same rules as cadastro / Minha conta). Never invent a generic “requisitos de segurança” line for empty/mismatch — use UI-SPEC inline messages.

### Toasts
**Source:** `toast(...)` from `@/stores/toast.store` (LoginPage / AccountPage)  
**Apply to:** Rate limit, network/Auth failures, recovery success **Senha atualizada.** Do not toast different messages for known vs unknown e-mail on request.

### Session / redirect origin
**Source:** `env.appUrl` (`config/env.ts` lines 4–46); signup `emailRedirectTo`  
**Apply to:** `resetPasswordForEmail({ redirectTo: \`${env.appUrl}/auth/confirm\` })`. Never localhost.

### Separation from Phase 18
**Source:** `changePassword` + AccountPage password card  
**Apply as negative pattern:** Recovery must not import or call `changePassword`; must not render **Senha atual**.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned files have close analogs. Closest gap: listening for `PASSWORD_RECOVERY` event name — `AuthProvider` `onAuthStateChange` ignores `_event`; detect via URL `type=recovery` and/or extend confirm result instead of inventing a new provider pattern. |

---

## Metadata

**Analog search scope:** `src/pages/auth/`, `src/services/auth.service.ts`, `src/schemas/auth.schema.ts`, `src/lib/auth/`, `src/lib/security/`, `src/routes/`, `src/components/auth/`, `src/providers/AuthProvider.tsx`, `src/pages/AccountPage.tsx`, `src/config/env.ts`  
**Files scanned:** ~15 primary auth-related sources  
**Pattern extraction date:** 2026-09-29  
**UI contract:** `.planning/phases/20-esqueci-minha-senha/20-UI-SPEC.md` (copy, spacing, anti-enumeration)  
**Research:** `.planning/phases/20-esqueci-minha-senha/20-RESEARCH.md`
