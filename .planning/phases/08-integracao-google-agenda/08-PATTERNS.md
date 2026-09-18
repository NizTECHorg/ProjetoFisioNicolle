# Phase 8: Integração Google Agenda - Pattern Map

**Mapped:** 2026-09-18
**Files analyzed:** 14
**Analogs found:** 11 / 14

Honor CONTEXT over RESEARCH and UI-SPEC on D-01–D-09: **app → Google only**; Google → app skipped (D-02); UI says **exportação** never sync (D-03); OAuth per authenticated user via `linkIdentity` (D-04/D-06); scope `calendar.events.owned` (D-05); source = `listSessionsInRange` / month cursor (D-07); no SOAP in events (D-08); per-user `(user_id, session_id)` links (D-09). UI-SPEC wins on strip placement, copy, hide-write (unmount CTAs), ConfirmDialog **Voltar**.

**Do not** analog Gemini client-key `aiPhysicalEvaluation.service.ts` for Google secrets (anti-pattern — `VITE_*` secret), `LoginPage` Google button, `calendar.service.ts` raw `throwIfError(error.message)`, putting `google_event_id` on `patient_sessions`, `googleapis` npm, `supabase db push`, or shadcn/GIS scripts. Prefer **finance/patientImages** `mapDbError` style for new client services.

Constraints for every new clinic file: named exports, single quotes, no semicolons, `[...].join(' ')` not `clsx`, page → hook → service → Supabase/`functions.invoke`, hide unavailable Google CTAs (unmount, never disabled-looking), SQL Editor only, Portuguese UI strings from UI-SPEC.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/08-integracao-google-agenda/sql/08-google-calendar.sql` | migration | CRUD (tables + RLS + revoke secrets) | `.planning/phases/07-…/sql/07-patient-images.sql` (header/revoke/FORCE) + `.planning/phases/05-…/sql/05-autonomo-finance.sql` (`owner_id = auth.uid()`) | exact |
| `supabase/08-google-calendar.sql` | migration | file-I/O (Editor paste) | `supabase/07-patient-images.sql` | exact |
| `supabase/functions/google-calendar-connect/` | controller (Edge) | request-response + secrets write | **none** — first EF in repo; RESEARCH Pattern 2 | none |
| `supabase/functions/google-calendar-export/` | controller (Edge) | batch + CRUD (Calendar REST + links) | **none** — RESEARCH Pattern 3 + Calendar REST; client analog `finance.service.ts` for JWT/user scoping intent | none |
| `supabase/functions/google-calendar-disconnect/` | controller (Edge) | request-response | **none** — RESEARCH Pitfall 4; client ConfirmDialog analog `TeamPage` | none |
| `src/services/googleCalendar.service.ts` | service | request-response (`functions.invoke` + RLS select) | `src/services/finance.service.ts` (`mapDbError`, `requireUserId`) + `src/services/auth.service.ts` (session/auth errors) | role-match |
| `src/services/googleCalendar.mapper.ts` | utility | transform | `src/services/calendar.service.ts` (`CalendarSession` map) | exact |
| `src/schemas/googleCalendar.schema.ts` | config | transform (Zod) | `src/schemas/auth.schema.ts` / `patient.schema.ts` UUID lists | role-match |
| `src/hooks/useGoogleCalendar.ts` | hook | request-response + mutations | `src/hooks/usePatientImages.ts` + `src/hooks/useClinic.ts` (`useCreateSession` toast/invalidate) | exact |
| `src/pages/CalendarPage.tsx` | route / component | request-response | same file (PageHeader + dash-card) + `TeamPage.tsx` (error article + ConfirmDialog) | exact |
| `src/lib/security/index.ts` | utility | transform (error map) | same file, `mapStorageError` / `mapAuthError` | exact |
| `src/services/auth.service.ts` | service | request-response | same file — **do not** add Google login; only reuse session patterns if vault helper needs `getSession` | partial |
| `index.html` + `netlify.toml` | config | request-response (CSP) | same files `connect-src` — **prefer no change** if all Google calls stay in EF | role-match |
| `src/services/googleCalendar.mapper.test.ts` (optional Wave 0) | test | transform | **none** — no Vitest yet; RESEARCH Validation Architecture | none |

**Do not create/modify:** `LoginPage`, AppShell nav, `patient_sessions` columns for Google ids, Gemini/`VITE_GOOGLE_*`, Phase 3 `private.can_*`, UI primitives (`Button`/`ConfirmDialog`/`PageHeader`), Google → app overlay.

---

## Pattern Assignments

### `.planning/phases/08-integracao-google-agenda/sql/08-google-calendar.sql` (migration, CRUD)

**Analog:** Phase 7 SQL header + revoke/FORCE; Phase 5 owner-scoped RLS; RESEARCH suggested shapes for three tables.

**Header / apply path** (Phase 7 `07-patient-images.sql` lines 1–4):
```sql
-- REQ-19 galeria de imagens. D-06 D-07 D-11. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_sessions_* / can_*.
-- Nao DELETE FROM storage.objects. Nao reescrever private.can_read_patient / can_write_patient.
```

Phase 8 adaptation: REQ-20, D-04/D-09, “Cole no SQL Editor”, “Nao use supabase db push”, “Nao DROP patient_sessions_* / can_*”, “Secrets: sem GRANT a authenticated/anon”.

**CREATE TABLE + user-scoped RLS** (Phase 5 `05-autonomo-finance.sql` lines 93–105):
```sql
create policy autonomo_prices_select
  on public.autonomo_prices
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );
```

Phase 8: `google_calendar_connections` / `google_calendar_session_links` use `user_id = (select auth.uid())` (no autonomo gate). Optional session readability via `can_read_patient` on link insert — keep simple if RESEARCH open question stays “any SELECT-visible session”.

**REVOKE secrets harder than clinic tables** (Phase 7 lines 73–74 — extend to **no** authenticated grant):
```sql
revoke all on table public.patient_images from anon, public;
grant select, insert, update, delete on table public.patient_images to authenticated;
```

Phase 8 `google_calendar_secrets`:
```sql
revoke all on table public.google_calendar_secrets from public, anon, authenticated;
-- NO grant to authenticated — service_role / Edge Function only (REQ-20.3)
```

**ENABLE + FORCE RLS** (Phase 5 lines 82–85):
```sql
alter table public.autonomo_prices enable row level security;
alter table public.autonomo_prices force row level security;
```

Apply FORCE to connections + session_links. Secrets table: revoke + optionally RLS deny-all for authenticated; EF uses service_role.

**Committed copy:** mirror into `supabase/08-google-calendar.sql` for SQL Editor paste (same dual-path as Phase 7).

---

### `supabase/functions/google-calendar-*/` (Edge controllers — no codebase analog)

**Analog:** none in repo. Planner must follow `08-RESEARCH.md` Patterns 2–3 and Code Examples (connect vault, refresh token, `events.insert`/`patch`).

**Client-side invoke contract** (what SPA will call — shape from RESEARCH):
```typescript
await supabase.functions.invoke('google-calendar-connect', {
  body: {
    refreshToken: session.provider_refresh_token,
    accessToken: session.provider_token,
  },
})
```

**Shared EF expectations (document in plan, implement Deno):**
- Verify caller JWT; reject anonymous.
- Refresh via `https://oauth2.googleapis.com/token` with Function secrets `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- Export: create user-scoped Supabase client from JWT for `patient_sessions` SELECT (RLS authority); service_role only for secrets table.
- Upsert `google_calendar_session_links` on `(user_id, session_id)`.
- Never return refresh_token to the client.

**Partial client analog for “require user”:** `finance.service.ts` lines 60–65:
```typescript
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}
```

---

### `src/services/googleCalendar.service.ts` (service, request-response)

**Analog:** `src/services/finance.service.ts` (mapDbError + requireUserId + named exports); auth session read from `AuthProvider` / RESEARCH Pattern 2; **not** `calendar.service.ts` raw error.message.

**Imports pattern** (`finance.service.ts` lines 1–11):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError, sanitizeText } from '@/lib/security'
import type {
  AutonomoPrice,
  CreatePriceInput,
  // ...
} from '@/types/finance'
```

Phase 8: import `mapGoogleCalendarError` (new) + Zod schema; types for connection metadata / export result.

**Error handling** (`finance.service.ts` lines 56–58):
```typescript
function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}
```

For `functions.invoke` failures, map Functions/HTTP/Google payloads through `mapGoogleCalendarError` (never surface raw Google JSON).

**Connection status read** (RLS metadata only — pattern like team org fetch):
```typescript
// Analog intent: finance/team list with .from(...).select(...).eq / maybeSingle
const { data, error } = await supabase
  .from('google_calendar_connections')
  .select('google_email, connected_at')
  .maybeSingle()
```

**Connect flow** (compose RESEARCH + auth session — `AuthProvider.tsx` lines 24–27 for getSession):
```typescript
void supabase.auth.getSession().then(({ data }) => {
  // ...
  setSession(data.session)
})
```

Service responsibilities:
1. `linkGoogleCalendar()` → `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo, scopes, queryParams } })` with `mapAuthError` on Auth errors.
2. `vaultGoogleTokensIfPresent()` → getSession → invoke connect EF when `provider_refresh_token` present; throw mapped PT if missing after OAuth.
3. `exportVisibleMonth({ fromIso, toIso })` or pass session ids already loaded — invoke export EF.
4. `disconnectGoogleCalendar()` → invoke disconnect EF + `unlinkIdentity` best-effort (Pitfall 4).

**Anti-pattern:** do not store refresh token in `localStorage` or custom keys (REQ-20.3).

---

### `src/services/googleCalendar.mapper.ts` (utility, transform)

**Analog:** `src/services/calendar.service.ts` row → `CalendarSession` mapping (lines 43–56).

**Core domain type already exists** (`calendar.service.ts` lines 4–14):
```typescript
export interface CalendarSession {
  id: string
  patientId: string
  patientName: string
  patientCode: string
  photoTone: string
  scheduledAt: string
  type: string
  place: string
  status: SessionStatus
}
```

**Map to Google event** (RESEARCH Pattern 3 — implement as pure fn for optional Vitest):
```typescript
// Default duration 60 min; timezone America/Sao_Paulo; D-08 allow-list only
const start = new Date(session.scheduledAt)
const end = new Date(start.getTime() + 60 * 60 * 1000)
const event = {
  summary: `${session.patientName} · ${session.type}`,
  location: session.place === '—' ? undefined : session.place,
  description: [
    session.patientCode ? `Código: ${session.patientCode}` : null,
    `Status: ${session.status}`,
    'Origem: agenda Fisio (exportação)',
  ].filter(Boolean).join('\n'),
  start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
  end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
}
```

Prefer mapper used **inside Edge Function** (or shared copy under `supabase/functions/_shared/`) so browser never needs Calendar REST. If duplicated, keep pure and identical.

---

### `src/schemas/googleCalendar.schema.ts` (config, transform)

**Analog:** `src/schemas/auth.schema.ts` / `patient.schema.ts` Zod + Portuguese messages.

**UUID array for export** (pattern from Zod usage in auth — `auth.schema.ts` lines 21–24):
```typescript
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória').max(128, 'Senha inválida'),
})
```

Phase 8 example shape:
```typescript
export const exportMonthSchema = z.object({
  fromIso: z.string().datetime({ offset: true }).or(z.string().min(1)),
  toIso: z.string().min(1),
  sessionIds: z.array(z.string().uuid()).optional(),
})
```

Validate before `functions.invoke`.

---

### `src/hooks/useGoogleCalendar.ts` (hook, request-response)

**Analog:** `src/hooks/usePatientImages.ts` (dedicated feature file) + `useClinic.ts` calendar mutations.

**Query + mutation skeleton** (`usePatientImages.ts` lines 12–22, `useClinic.ts` lines 16–37):
```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function usePatientImages(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'images'],
    queryFn: () => listPatientImages(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
      toast('Sessão agendada', 'success')
    },
    onError,
  })
}
```

Phase 8 hooks (UI-SPEC copy):
- `useGoogleCalendarConnection()` → `queryKey: ['google-calendar', 'connection']`
- `useConnectGoogleCalendar()` / reconnect → starts `linkIdentity` (may not toast until return)
- `useVaultGoogleTokens()` → on `/agenda` mount after OAuth; toast **Google conectado**
- `useExportGoogleCalendarMonth()` → toast success / empty / reconnect messages from UI-SPEC
- `useDisconnectGoogleCalendar()` → invalidate connection; toast **Google desconectado**

On 401/403 from export: surface reconnect state to page (return typed error or set query data) so strip unmounts **Exportar mês**.

---

### `src/pages/CalendarPage.tsx` (route, request-response)

**Analog:** same file for Agenda chrome; `TeamPage.tsx` for error article + ConfirmDialog; UI-SPEC for Google strip.

**PageHeader + month range already correct** (`CalendarPage.tsx` lines 49–55, 138–150):
```typescript
  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  const { data: sessions = [], isLoading } = useCalendarSessions(from.toISOString(), to.toISOString())
  // ...
      <PageHeader
        className="dash-in"
        title="Agenda"
        description="Sessões da clínica e prazos de entrega do Quadro."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nova sessão
          </Button>
        }
      />
```

**Insert Google strip** between `PageHeader` and `lg:grid-cols-[1.4fr_1fr]` (line 152). Card chrome analog (`CalendarPage.tsx` lines 153–154):
```typescript
<article className="dash-in dash-card rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
```

**Export-only notice / accent well** — reuse day-panel due card language (`CalendarPage.tsx` lines 258–258):
```typescript
className="block rounded-2xl border border-accent/30 bg-accent-soft p-3"
```

**Hoje chip → connected status pill** (`CalendarPage.tsx` lines 166–175):
```typescript
className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-forest"
```

**Error article** (`TeamPage.tsx` lines 73–76):
```typescript
<article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
  Não foi possível carregar a equipe. Tente de novo em instantes.
</article>
```

UI-SPEC reconnect/load-fail copy in strip-sized article (`border-error/20 bg-error/5`).

**Disconnect ConfirmDialog** (`TeamPage.tsx` lines 224–244 — cancel **Voltar**):
```typescript
      <ConfirmDialog
        open={Boolean(pendingReject)}
        title="Recusar pedido"
        description={/* ... */}
        confirmLabel="Recusar e cancelar conta"
        cancelLabel="Voltar sem recusar"
        tone="danger"
        isLoading={decide.isPending && decide.variables?.accept === false}
        onClose={() => setPendingReject(null)}
        onConfirm={() => { /* mutate */ }}
      />
```

Phase 8: title **Desconectar Google**, confirm **Desconectar Google**, cancel **Voltar**, `tone="danger"`.

**Loading spinner** already on page (`CalendarPage.tsx` lines 245–248) — reuse `h-6 w-6` forest spinner in strip.

**Hide-write:** when disconnected, unmount **Exportar mês** / **Desconectar**; when reconnect required, unmount **Exportar mês** (UI-SPEC §4). Do not put Google CTAs in `PageHeader.action`.

**OAuth return:** on mount, if session has provider refresh token, vault then show connected toast.

---

### `src/lib/security/index.ts` (utility, error map)

**Analog:** same file `mapStorageError` / `mapAuthError` / `mapDbError`.

**Domain-specific mapper pattern** (`mapStorageError` lines 238–281):
```typescript
export function mapStorageError(error: {
  message?: string
  code?: string
  statusCode?: string | number
  error?: string
  status?: number
}): string {
  const message = `${error.message ?? ''} ${error.error ?? ''}`.toLowerCase()
  // ... size / mime / 403 → mapDbError ...
  return 'Não foi possível salvar. Verifique o arquivo e tente de novo.'
}
```

Add `mapGoogleCalendarError` mapping:
- 401 / 403 / `invalid_grant` → UI-SPEC reconnect string
- network / fetch → UI-SPEC Google down string
- permission / RLS → reuse `mapDbError` 42501 path
- missing refresh after OAuth → UI-SPEC vault failure string
- default → generic export failure (UI-SPEC error state)

Keep `safeRedirectPath` / PKCE client as-is (`client.ts` `flowType: 'pkce'`). OAuth `redirectTo` is full origin `/agenda` (Auth allow-list), not `safeRedirectPath` (in-app only).

---

### `src/services/auth.service.ts` (service — touch lightly)

**Analog:** same file. **Do not** add Google to login/register.

**Existing Auth error wrap** (lines 67–74):
```typescript
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.password,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }
```

Prefer putting `linkIdentity` / `unlinkIdentity` in `googleCalendar.service.ts` so Login stays email/password-only (RESEARCH anti-pattern). Reuse `mapAuthError` for Auth API failures from link/unlink.

---

### `index.html` + `netlify.toml` (config, CSP)

**Analog:** both files’ `connect-src` (must stay in sync — STACK).

Current (`index.html` / `netlify.toml`):
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com
```

**Preference (RESEARCH Pitfall 3):** keep Google Calendar REST **only** in Edge Functions → **no CSP change**. Document that SPA must not `fetch` `googleapis.com`. Only update CSP if a client-side Google call is later required.

---

## Shared Patterns

### Authentication / session
**Source:** `src/lib/supabase/client.ts` (PKCE), `src/providers/AuthProvider.tsx` (`getSession` + `onAuthStateChange`), `src/services/auth.service.ts` (`mapAuthError`)
**Apply to:** connect/vault/disconnect services and CalendarPage OAuth return
```typescript
// client.ts lines 21–26
client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
```

`linkIdentity` only from Agenda — never LoginPage.

### Error handling (Portuguese mappers)
**Source:** `src/lib/security/index.ts` (`mapAuthError`, `mapDbError`, `mapStorageError`)
**Apply to:** `mapGoogleCalendarError`; googleCalendar.service; hooks `onError` → `toast(..., 'error')`

### Toast + invalidate
**Source:** `src/hooks/useClinic.ts` / `usePatientImages.ts`
**Apply to:** all Google mutations — copy from UI-SPEC toast table

### Confirm destructive
**Source:** `src/components/ui/ConfirmDialog.tsx` + `TeamPage.tsx`
**Apply to:** Desconectar Google (`tone="danger"`, cancel **Voltar**)

### Hide unavailable actions
**Source:** Phase 3 convention + UI-SPEC § Interaction Contract; clinic panels (`canWrite ? … : null`)
**Apply to:** Exportar / Desconectar / Reconectar visibility — unmount, never disabled primary that looks tappable

### SQL Editor dual copy
**Source:** Phase 5/7 pattern (planning `sql/` + `supabase/*.sql` paste)
**Apply to:** `08-google-calendar.sql` only; no `db push`

### Page → hook → service
**Source:** `.planning/codebase/ARCHITECTURE.md` / existing Calendar stack
**Apply to:** CalendarPage → `useGoogleCalendar*` → `googleCalendar.service` → Supabase Auth / `functions.invoke` / connections SELECT

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `supabase/functions/google-calendar-connect/` | Edge controller | request-response + secrets | No Edge Functions tree in repo; implement from RESEARCH |
| `supabase/functions/google-calendar-export/` | Edge controller | batch + Calendar REST | No server-side Google/Calendar client; use `fetch` + RESEARCH examples |
| `supabase/functions/google-calendar-disconnect/` | Edge controller | request-response | Same — revoke + delete secrets server-side |
| `src/services/googleCalendar.mapper.test.ts` (optional) | test | transform | No Vitest runner installed; Wave 0 decision |

Planner should treat RESEARCH.md Code Examples + Architecture Diagram as the primary template for the three Edge Functions.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/services/`, `src/hooks/`, `src/lib/security/`, `src/providers/`, `src/schemas/`, `src/components/ui/`, `.planning/phases/{03,05,07}/**/sql/`, `index.html`, `netlify.toml`
**Files scanned:** ~40 (targeted greps + 12 full/partial reads)
**Pattern extraction date:** 2026-09-18
**Strong analogs used:** `CalendarPage.tsx`, `calendar.service.ts`, `useClinic.ts` / `usePatientImages.ts`, `finance.service.ts`, `auth.service.ts` + `AuthProvider`, `security/index.ts`, `TeamPage` ConfirmDialog/error article, Phase 5/7 SQL
