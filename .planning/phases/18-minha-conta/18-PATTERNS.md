# Phase 18: Minha conta - Pattern Map

**Mapped:** 2026-09-24
**Files analyzed:** 12 (11 source/config/SQL targets + D-05 verification procedure)
**Analogs found:** 10 / 12

`updateUser({ password, current_password })` has **no call site** in this repo. The only password API in `src/` is `signInWithPassword` inside `signInWithEmail`. That call is the oracle analog. It is not the wall that checks the current password before the write.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/layout/AppShell.tsx` | component | request-response | `src/components/layout/AppShell.tsx` (footer + `NavLink`) | exact |
| `src/pages/AccountPage.tsx` | component | CRUD | `src/pages/auth/RegisterPage.tsx` (form); chrome `src/pages/TeamPage.tsx`; photo `src/components/patients/PatientPhotoControl.tsx` | role-match |
| `src/routes/index.tsx` | route | request-response | `src/routes/index.tsx` (shell child routes) | exact |
| `src/services/auth.service.ts` (`updateOwnName`) | service | CRUD | `src/services/patientPhoto.service.ts` (`.update().eq('id')`) + `fetchProfile` in the same file | role-match |
| `src/services/auth.service.ts` (`changePassword`) | service | request-response | none for the write; error wrap from `signInWithEmail` | no analog |
| `src/services/accountPhoto.service.ts` | service | file-I/O | `src/services/patientPhoto.service.ts` | role-match |
| `src/schemas/auth.schema.ts` | utility | transform | `src/schemas/auth.schema.ts` (`passwordSchema`, `registerSchema`) | exact |
| `src/providers/AuthProvider.tsx` | provider | request-response | `src/providers/AuthProvider.tsx` | exact |
| `src/hooks/useAuth.ts` | hook | request-response | `src/hooks/useAuth.ts` | exact |
| `src/lib/security/index.ts` (`mapAuthError`) | utility | transform | `src/lib/security/index.ts` | exact |
| `.planning/phases/18-minha-conta/sql/18-account.sql` | migration | batch | `16-patient-photo.sql` (bucket); `03-account-types-team.sql` (revoke/grant style) | role-match |
| `package.json` | config | — | `package.json` `@supabase/supabase-js` | exact |
| D-05 password verification (procedure, not a new source file) | verification | request-response | oracle: `signInWithEmail`; isolated client: `src/lib/supabase/client.ts` | role-match (oracle only) |

Do **not** modify `src/config/navigation.ts`. Minha conta is a footer `NavLink`, not a `clinicNavigationItems` / `mobileNavItems` entry. Do **not** route `src/pages/SettingsPage.tsx`. Do **not** add a test runner or a new test file. Do **not** call `uploadPatientPhoto` or write to bucket `patient-avatars`.

## Pattern Assignments

### `src/components/layout/AppShell.tsx` (component, request-response)

**Analog:** `src/components/layout/AppShell.tsx`

**Imports pattern** (lines 1-7):
```tsx
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { clinicNavigationItems, mobileNavItems } from '@/config/navigation'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { useAuth } from '@/hooks/useAuth'
import { accountTypeLabel } from '@/lib/accountAccess'
```
Add `CircleUser` to the existing `lucide-react` import. Do not add a navigation item.

**Identity already shown in the footer** (lines 10-19, 82-99). The new icon button sits in this same `div`, immediately before the Sair button. Copy the Sair button classes (`min-h-11 min-w-11`, icon-only, `aria-label` + `title`). Use `NavLink to="/conta"` with `aria-label="Minha conta"`. Sair stays `type="button"` and `signOut`.
```tsx
const displayName = profile?.fullName ?? user?.user_metadata.full_name ?? 'Usuário'
const initials = displayName
  .split(' ')
  .slice(0, 2)
  .map((part: string) => part[0])
  .join('')
  .toUpperCase()
const roleLabel = profile ? accountTypeLabel(profile.accountType) : (user?.email ?? '')
```
```tsx
<button
  type="button"
  aria-label="Sair"
  title="Sair"
  onClick={() => void signOut()}
  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
>
  <LogOut size={17} />
</button>
```
The circle at lines 84-86 is initials only. After a photo save, paint a signed URL in that circle and keep initials when the URL is absent. `profile.avatarUrl` today is the raw `profiles.avatar_url` string (`mapClinicProfile`), not a signed URL. Sign at read time (`createSignedUrls`, 3600s). Do not persist the signed URL.

`mobileNavItems` (lines 126-158) stays at four items. The drawer already includes this footer.

---

### `src/pages/AccountPage.tsx` (component, CRUD)

**Analogs:** form `src/pages/auth/RegisterPage.tsx`; page chrome `src/pages/TeamPage.tsx`; photo control `src/components/patients/PatientPhotoControl.tsx`.

Do not copy `src/pages/SettingsPage.tsx`. It is read-only, unrouted, and uses the confectionery theme (`dark-border`, `Badge` of `profile.role`).

**Page chrome** (`TeamPage.tsx` lines 1-12, 59-65) — clinical `PageHeader`, `useAuth`, `toast`:
```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/stores/toast.store'

<section className="mx-auto w-full max-w-7xl">
  <PageHeader
    className="dash-in"
    title="Equipe"
    description="Compartilhe o código e aceite os pedidos dos fisioterapeutas."
  />
```
Account page title is Minha conta. Narrow the section (`max-w-3xl` is enough). Read-only e-mail comes from `user?.email ?? profile?.email`. Read-only account type uses `accountTypeLabel(profile?.accountType)` from `src/lib/accountAccess.ts` lines 55-58. Do not show `profile.role`.

**Form** (`RegisterPage.tsx` lines 3-12, 25-42, 47-78, 94-102):
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema'
import { signUpWithEmail } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
  defaultValues: { fullName: '', /* ... */ },
})

async function onSubmit(data: RegisterFormData) {
  try {
    const { needsEmailConfirmation } = await signUpWithEmail(data)
    toast('Conta criada com sucesso! Você já pode entrar.', 'success')
  } catch (error) {
    toast(error instanceof Error ? error.message : 'Erro ao criar conta.', 'error')
  }
}

<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
  <Input
    label="Nome completo"
    type="text"
    autoComplete="name"
    error={errors.fullName?.message}
    {...register('fullName')}
  />
```
Swap the schema and the service calls (`updateOwnName`, `changePassword`). Empty password fields must not call `updateUser`. After a successful name or photo save, call `reloadProfile()` from `useAuth` (added in this phase). Do not `signInWithPassword` or `signInWithEmail` on submit.

**Photo input** (`PatientPhotoControl.tsx` lines 35-92). Copy the file input, `preparePatientPhoto`, and toast-on-throw. Call the new account photo service, not `useUploadPatientPhoto`.
```tsx
import { preparePatientPhoto } from '@/lib/cropPatientPhoto'
import { toast } from '@/stores/toast.store'

async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const prepared = await preparePatientPhoto(file)
    // then upload account photo — not useUploadPatientPhoto
  } catch (error) {
    if (error instanceof Error) {
      toast(error.message, 'error')
    }
  }
}

<input
  type="file"
  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
  className="sr-only"
  aria-label={ariaLabel}
/>
```
`preparePatientPhoto` (`src/lib/cropPatientPhoto.ts` lines 93-96) returns `{ blob, mimeType }` after magic-byte sniff and 512px crop. Reuse it. Do not add another crop library.

---

### `src/routes/index.tsx` (route, request-response)

**Analog:** `src/routes/index.tsx`

**Imports and shell nesting** (lines 1-16, 31-44). Add `AccountPage` next to the other page imports and one child route inside `ProtectedRoute` → `AppShell`, before the shell `path="*"`.
```tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/painel" element={<DashboardPage />} />
    <Route path="/pacientes" element={<PatientsPage />} />
    {/* add: <Route path="/conta" element={<AccountPage />} /> */}
    <Route path="*" element={<Navigate to="/pacientes" replace />} />
  </Route>
</Route>
```

---

### `src/services/auth.service.ts` — `updateOwnName` (service, CRUD)

**Analog:** pointer update in `src/services/patientPhoto.service.ts` lines 94-102; row read in `fetchProfile` lines 147-158.

There is no `profiles.update` in the repo today. Copy the PostgREST update shape, but the table is `profiles`, the only writable columns are `full_name` and `avatar_url`, and the filter is the logged-in user id.
```ts
const { error: updateError } = await supabase
  .from('patients')
  .update({ photo_path: path })
  .eq('id', patientId)

if (updateError) {
  await supabase.storage.from(AVATAR_BUCKET).remove([path])
  throw new Error(mapDbError(updateError))
}
```
```ts
export async function fetchProfile(userId: string): Promise<ClinicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, is_active, account_type, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapClinicProfile(data as ProfileRow)
}
```
Name save: `.update({ full_name })` only. Also `supabase.auth.updateUser({ data: { full_name } })` in a **separate** call with no `password` field, so `user.user_metadata.full_name` stays aligned with the footer fallback. Do not send `is_active`, `account_type`, `role`, or `email`. `mapClinicProfile` (lines 37-48) copies `avatar_url` into `avatarUrl` as a path. Keep storing the path. Sign only when rendering.

Imports already used by this file (lines 1-14): `supabase` from `@/lib/supabase/client`, `mapAuthError` / `sanitizeText` from `@/lib/security`, schemas from `@/schemas/auth.schema`.

---

### `src/services/auth.service.ts` — `changePassword` (service, request-response)

**No analog for the write.** Grep of `src/` finds `signInWithPassword` only inside `signInWithEmail` (lines 68-75). There is no `updateUser`, no `current_password`, no `reauthenticate`, no `auth.admin`.

**Do not copy `signInWithEmail` as a check before `updateUser`.** That function rate-limits `auth:login`, can `signOut` on a rejected account (lines 92-94), and uses the persisted app client. RESEARCH forbids it as the password wall: a modified client can skip it, and with the Auth flag off `updateUser({ password })` still writes.

**Error wrap to copy** (`signInWithEmail` lines 62-75) — parse with zod, throw `mapAuthError`, do not swallow:
```ts
export async function signInWithEmail(data: LoginFormData): Promise<void> {
  const parsed = loginSchema.parse(data)
  const email = sanitizeEmail(parsed.email)

  assertRateLimit([`auth:login:${email}`, 'auth:login:global'])

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.password,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }
```
Production `changePassword` is one call on the app client, after zod, and only when the new password is non-empty:
```ts
const { error } = await supabase.auth.updateUser({
  password: newPassword,
  current_password: currentPassword,
})
if (error) throw new Error(mapAuthError(error))
```
`mapAuthError` must see `error.code` (see security section). Do not use a separate `auth:login` rate-limit key. Do not call `signOut` on `current_password_invalid`. `@supabase/supabase-js` in `package.json` is `^2.49.8`; RESEARCH measured the installed client at 2.110.7, which does not type `current_password`. Bump to 2.117.1 (checkpoint) or the call site needs a cast. The field still serializes on 2.110.7 because the client spreads attributes into the body.

---

### `src/services/accountPhoto.service.ts` (service, file-I/O)

**Analog:** `src/services/patientPhoto.service.ts` (entire file, 137 lines). Copy structure; change bucket, table, and folder.

**Imports and constants** (lines 1-10):
```ts
import { supabase } from '@/lib/supabase/client'
import { mapDbError } from '@/lib/security'
import { patientPhotoSchema } from '@/schemas/patient.schema'

const AVATAR_BUCKET = 'patient-avatars'
const SIGNED_URL_SECONDS = 3600
const BUCKET_LIMIT_BYTES = 2 * 1024 * 1024
const SAVE_FAILED = 'Não foi possível salvar a foto. Tente de novo.'
```
New bucket id: `account-avatars`. Same 3600s signed URL, 2 MiB, MIME jpeg/png/webp, `upsert: false`. Path: `{userId.toLowerCase()}/${crypto.randomUUID()}.{jpg|png|webp}` via `extensionFor` (lines 33-37). Pointer column is `profiles.avatar_url`, not `patients.photo_path`.

**Upload** (lines 55-110): select current path, upload, update pointer, delete the new object if the update fails, best-effort delete of the previous object. Replace `patientId` with the session user id. Do not import `can_read_patient` / `can_write_patient`.

**Sign** (lines 39-52):
```ts
const { data, error } = await supabase.storage
  .from(AVATAR_BUCKET)
  .createSignedUrls(unique, SIGNED_URL_SECONDS)

if (error) throw new Error(SAVE_FAILED)
return signedUrlByPath(data)
```

**Remove** (lines 113-136): null the pointer first, then `storage.remove`. Account remove is optional; if implemented, same order.

`mapStorageError` (`src/lib/security/index.ts` lines 262-280) talks about 8 MB gallery limits. Patient photo upload ignores it and throws `SAVE_FAILED`. Follow the patient photo service, not `mapStorageError`, for account avatars.

---

### `src/schemas/auth.schema.ts` (utility, transform)

**Analog:** `src/schemas/auth.schema.ts`

**Password rule to reuse, not duplicate** (lines 4-11). `changePasswordSchema` should reference this same `passwordSchema` (export it if the page schema needs it).
```ts
const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^a-zA-Z0-9]/, 'A senha deve conter pelo menos um caractere especial')
```

**Name rule** (lines 28-33) and **confirm + e-mail local-part refines** (lines 43-56). Copy those refines onto current password (non-empty, max 128, like `loginSchema` line 23), new password (`passwordSchema`), and confirm. The local-part check must use the logged-in e-mail, not a field the user can edit.
```ts
.refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
.refine(
  (data) => {
    const local = (data.email.split('@')[0] ?? '').toLowerCase()
    return local.length < 4 || !data.password.toLowerCase().includes(local)
  },
  { message: 'A senha não deve conter seu e-mail', path: ['password'] },
)
```
Export `ChangePasswordFormData` with `z.infer`, same as lines 69-70.

---

### `src/providers/AuthProvider.tsx` (provider, request-response)

**Analog:** `src/providers/AuthProvider.tsx`

**Deadlock comment — do not fetch inside the callback** (lines 38-45):
```tsx
// IMPORTANTE: este callback precisa ser síncrono. Fazer await de consultas
// ao banco aqui causa deadlock no lock interno de auth do supabase-js
// (o spinner infinito no login). O perfil é carregado no efeito abaixo.
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
  if (!mounted) return
  setSession(newSession)
  setSessionLoaded(true)
})
```
`USER_UPDATED` after `updateUser` must not trigger `fetchProfile` here.

**Load to extract into `reloadProfile`** (lines 63-87). Today this runs only when `userId` changes, so a name/photo save does not refresh the footer. Add a `useCallback` that repeats this `fetchProfile` + `setProfile` **outside** `onAuthStateChange`, and put it on the context value next to `signOut` (lines 89-113). Keep the `userId` effect for login/logout. Do not `queryClient.clear()` on reload.
```tsx
void Promise.all([
  fetchProfile(userId),
  fetchMembership(userId).catch(() => null),
]).then(([userProfile, userMembership]) => {
  if (cancelled) return
  setProfile(userProfile)
  setMembership(userMembership)
  setProfileLoading(false)
})
```

---

### `src/hooks/useAuth.ts` (hook, request-response)

**Analog:** `src/hooks/useAuth.ts`

Add `reloadProfile: () => Promise<void>` to `AuthContextValue` (lines 5-13). Keep the guard in `useAuth` (lines 17-22).
```ts
export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: ClinicProfile | null
  membership: Membership | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}
```

---

### `src/lib/security/index.ts` — `mapAuthError` (utility, transform)

**Analog:** `src/lib/security/index.ts` lines 65-96.

The function today types `{ message?: string; status?: number }` and treats any message containing `password` as a weak password. GoTrue uses the same human text for `current_password_required` and `current_password_invalid` (`Current password required when setting new password.`). Branch on `error.code` **before** line 95.
```ts
export function mapAuthError(error: { message?: string; status?: number }): string {
  const message = error.message?.toLowerCase() ?? ''

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  // ...
  if (message.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.'
  }
```
Required codes, in this order, before the generic `password` branch:

| `error.code` | Copy |
|--------------|------|
| `current_password_invalid` | Senha atual incorreta. |
| `current_password_required` | Senha atual incorreta. |
| `same_password` | A nova senha deve ser diferente da atual. |

Leave `invalid login credentials` as the login message. Do not map `current_password_invalid` to that string. `weak_password` may stay on the existing password branch.

---

### `.planning/phases/18-minha-conta/sql/18-account.sql` (migration, batch)

**Analog (bucket and storage policies):** `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql`.

**Header + private bucket** (lines 1-23). New script header must say SQL Editor only, no CLI `db push`, no drop of `can_*`, no `DELETE FROM storage.objects`. Bucket id `account-avatars`, `public = false`, `file_size_limit` 2097152, MIME `image/jpeg`, `image/png`, `image/webp`.
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    public = false;
```

**Idempotent policies** (lines 50-85): `drop policy if exists` then `create policy` for select, insert, delete on `storage.objects`. No UPDATE policy (no upsert). No `anon` policy. **Do not copy** `private.can_read_patient` / `can_write_patient`. Folder check is `(storage.foldername(name))[1] = auth.uid()::text` with the same UUID + extension regex. Do not drop `patient_avatars_storage_*`.

**Pointer CHECK** (lines 29-43) is the shape for `profiles.avatar_url`, not a new `photo_path` column. The column already exists. Before `ADD CONSTRAINT`, abort in a `DO` block if any non-null `avatar_url` fails the path regex. Do not `UPDATE` those rows to null. No analog for that guard — follow RESEARCH pitfall 5.

**Column GRANT has no exact analog.** Closest revoke/grant style is `03-account-types-team.sql` lines 89-92 (table-level, different tables):
```sql
revoke all on table public.organizations from anon, public;
revoke all on table public.organization_memberships from anon, public;
grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;
```
This phase needs column privileges, which that file never does. The hole being closed is the comment at lines 476-477: `profiles_update_own` stays `id = auth.uid()` with no column list.
```sql
revoke update on public.profiles from public, anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
```
Do not revoke `service_role` or the owner. Do not rewrite `handle_new_user`. Do not add a second `on_auth_user_created` trigger. End with `notify pgrst, 'reload schema';` (16-patient-photo.sql line 90).

---

### `package.json` (config)

**Analog:** `package.json` line 16.
```json
"@supabase/supabase-js": "^2.49.8"
```
Bump target is `2.117.1` so `UserAttributes.current_password` is typed. RESEARCH marks the bump `[ASSUMED]` until a human checkpoint (slopcheck unavailable). Do not add crop, upload, or test libraries. Do not change `flowType` in `src/lib/supabase/client.ts`.

---

### D-05 password reset verification (procedure, request-response)

No Vitest/Playwright script. The plan’s verification section **is** this procedure. Grep of `updateUser` does not prove D-05.

#### 1. Current password is checked inside `updateUser`, not before it

There is no existing “verify password, then update” function. Do not add one.

| Step | Copy from | Do not copy |
|------|-----------|-------------|
| Write | RESEARCH Pattern 3: one `supabase.auth.updateUser({ password, current_password })` on the app client | `signInWithEmail` / `signInWithPassword` before the write |
| Wrong current password | GoTrue `error.code === 'current_password_invalid'`; no second request; app session stays | `signOut` branch in `signInWithEmail` lines 92-94 |
| Flag off | `updateUser({ password })` without `current_password` must return `current_password_required` and must not store the new password | A client `if` that skips the call |

`signInWithEmail` (lines 62-96) is the wrong wall: it uses the persisted client, applies login rate limits, and signs out rejected accounts. With `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` off, GoTrue ignores `current_password` and still writes. The hosted toggle (and reauthentication left **off**) is a human checkpoint before UAT.

#### 2. Oracle that proves the old password stopped working

**Call shape analog:** `src/services/auth.service.ts` lines 68-75.
```ts
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email,
  password: parsed.password,
})

if (error) {
  throw new Error(mapAuthError(error))
}
```
The oracle does **not** call `signInWithEmail`. It calls `signInWithPassword` and inspects `error` / `data.session` directly. Success: `error === null` and `data.session` set. Failure: `error.code === 'invalid_credentials'` (message `Invalid login credentials`). Do not treat `mapAuthError` text as the assert.

**Client analog:** `src/lib/supabase/client.ts` lines 15-36. Build a **second** `createClient`. Invert the session flags. Do not use the `supabase` proxy — a successful sign-in on it replaces the app session.
```ts
client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
})
```
Oracle options: `{ auth: { persistSession: false, autoRefreshToken: false } }`. Leave the app client on `flowType: 'implicit'`.

**Passwords used as proof** must already pass `passwordSchema` (lines 4-11) and must differ from each other. `weak_password` fails before the current-password check. `same_password` fails only after the current password matched. Neither code proves D-05.

**Asserts the plan must include** (from RESEARCH Password Reset Verification):

- **Precondition (flag on):** oracle `signInWithPassword(OLD)` creates a session. App `updateUser({ password: NEW })` **without** `current_password` returns `current_password_required`. Oracle: `OLD` still creates a session; `NEW` is `invalid_credentials`. If step 2 writes `NEW`, stop. D-05 is not met.
- **A — wrong current password does not write:** oracle `OLD` succeeds. App `updateUser({ password: NEW, current_password: 'errada-nao-e-a-atual' })` returns `current_password_invalid` and does not `signOut`. Oracle: `OLD` still succeeds; `NEW` is `invalid_credentials`.
- **B — success:** `updateUser({ password: NEW, current_password: OLD })` has `error === null`. Oracle: `OLD` is `invalid_credentials` and has no session. Oracle: `NEW` creates a session whose `data.user.id` is the user who changed it. Reload still shows the account (session id preserved). Sign-in with `OLD` fails; sign-in with `NEW` works.
- **C — production code:** the only `password` field is on `updateUser` together with a non-empty `current_password`. No `signInWithPassword`, `signInWithEmail`, `reauthenticate`, `nonce`, or `auth.admin` on the save path.

## Shared Patterns

### Session and route guard
**Source:** `src/routes/index.tsx` lines 31-33, `src/hooks/useAuth.ts` lines 17-22
**Apply to:** `AccountPage`, footer `NavLink`
```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
```
```ts
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
```
The page does not re-check `isAuthenticated`. `ProtectedRoute` already wraps the shell.

### Service errors
**Source:** `src/services/auth.service.ts` lines 73-75; `src/services/patientPhoto.service.ts` lines 99-101; `src/pages/auth/RegisterPage.tsx` lines 76-78
**Apply to:** `updateOwnName`, `changePassword`, `accountPhoto.service`, `AccountPage`
```ts
if (error) {
  throw new Error(mapAuthError(error))
}
```
```ts
if (updateError) {
  throw new Error(mapDbError(updateError))
}
```
```tsx
toast(error instanceof Error ? error.message : 'Erro ao criar conta.', 'error')
```
Auth failures use `mapAuthError`. Postgres failures use `mapDbError` (`src/lib/security/index.ts` lines 230-235, including `42501`). Storage upload failures in the photo analog use a fixed `SAVE_FAILED` string, not `mapStorageError`.

### Validation
**Source:** `src/pages/auth/RegisterPage.tsx` lines 32-33; `src/schemas/auth.schema.ts` lines 4-11
**Apply to:** name and password forms on `AccountPage`
```tsx
resolver: zodResolver(registerSchema),
```
Services that already parse (`signInWithEmail` line 63) may `schema.parse` again. Photo bytes are checked in the service with `safeParse` (`patientPhoto.service.ts` lines 60-66) after `preparePatientPhoto`.

### Supabase client
**Source:** `src/lib/supabase/client.ts` lines 20-30 and 42-46
**Apply to:** every service. The D-05 oracle is the only second client, and it must not persist.
```ts
flowType: 'implicit',
```
Do not switch the app client back to PKCE.

### Profile reload
**Source:** `src/providers/AuthProvider.tsx` lines 38-41 and 63-87
**Apply to:** `AccountPage` after name or photo save
Fetch with `fetchProfile` in a function the page calls. Never `await` that fetch inside `onAuthStateChange`.

## No Analog Found

| File / behavior | Role | Data Flow | Reason |
|-----------------|------|-----------|--------|
| `changePassword` → `auth.updateUser({ password, current_password })` | service | request-response | No `updateUser` in `src/`. Do not substitute `signInWithPassword` as a pre-check. Follow RESEARCH Pattern 3 and the D-05 section above. Error wrap still copies `signInWithEmail` lines 73-75. |
| `GRANT UPDATE (full_name, avatar_url)` | migration | batch | `03-account-types-team.sql` only has table-level `grant select`. Column revoke/grant is specified in RESEARCH pitfall 4. |
| Legacy `avatar_url` `DO` block that `RAISE EXCEPTION` | migration | batch | No existing script scans `profiles.avatar_url` before a CHECK. |
| D-05 oracle client (`persistSession: false`) | verification | request-response | `createClient` exists, but every option in `client.ts` is the app session (`persistSession: true`). The oracle must not reuse `getSupabase()` / the `supabase` proxy. |
| Automated test file | test | — | `package.json` has no `test` script. Do not add Vitest. Phase gate is `npm run typecheck` plus the manual oracle. |

## Metadata

**Analog search scope:** `src/components/layout/`, `src/pages/`, `src/routes/`, `src/services/`, `src/schemas/`, `src/providers/`, `src/hooks/`, `src/lib/`, `src/config/navigation.ts`, `.planning/phases/**/sql/`, `package.json`
**Files scanned:** AppShell, routes/index, auth.service, AuthProvider, useAuth, auth.schema, security/index (mapAuthError, mapDbError, mapStorageError), supabase/client, patientPhoto.service, PatientPhotoControl, cropPatientPhoto, RegisterPage, TeamPage, SettingsPage, PageHeader, Input, account.ts, accountAccess, navigation, toast.store, 16-patient-photo.sql, 03-account-types-team.sql (grant + `profiles_update_own`), package.json
**Pattern extraction date:** 2026-09-24
