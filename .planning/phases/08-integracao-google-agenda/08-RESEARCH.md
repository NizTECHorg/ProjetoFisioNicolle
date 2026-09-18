# Phase 8: Integração Google Agenda - Research

**Researched:** 2026-09-18
**Domain:** Google OAuth 2.0 + Calendar API v3 export from clinic SPA (Vite + Supabase Auth PKCE + Edge Functions)
**Confidence:** HIGH (OAuth/linkIdentity/scopes/token rules from Supabase + Google official docs; session model + RLS from codebase); MEDIUM (Edge Function deploy without CLI; Google app verification timeline); LOW (exact hosted Vault/pgsodium availability — not required if secrets table has no grants)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Obrigatório: exportar sessões da agenda da aplicação para o Google Calendar (criar/atualizar eventos).
- **D-02:** Condicional: importar / espelhar eventos do Google na agenda da app **somente se** a pesquisa concluir que é viável sem inventar pacientes fictícios nem furar RLS. Caso contrário, **não implementar** Google → app nesta fase.
- **D-03:** Se só app → Google: a UI deixa claro que a integração é **exportação** (não agenda espelhada bidirecional).
- **D-04:** Conexão OAuth por usuário autenticado (cada profissional conecta a própria conta Google).
- **D-05:** Escopo mínimo do Google Calendar necessário para criar/atualizar eventos do export; não pedir escopos extras sem necessidade.
- **D-06:** Conectar e desconectar a partir da tela Agenda (ou fluxo iniciado nela).
- **D-07:** Fonte: sessões em `patient_sessions` visíveis na Agenda (`listSessionsInRange` / `CalendarSession`).
- **D-08:** Evento no Google deve carregar identificação útil (paciente, horário, tipo/local quando existirem) — sem vazar dados clínicos sensíveis além do necessário no título/descrição do evento.
- **D-09:** Evitar duplicar o mesmo evento: guardar vínculo sessão ↔ `google_event_id` (ou equivalente) para update em re-export.

### Claude's Discretion
- Biblioteca / Edge Function / PKCE vs token no Supabase — escolher o caminho mais seguro compatível com o stack atual (Vite + Supabase, sem pacote novo se der; se precisar de pacote, justificar).
- Duração padrão do evento se a sessão não tiver fim explícito.
- UX de “exportar selecionadas” vs “exportar intervalo / todas do mês”.
- Se Google → app for viável: como mapear evento externo sem `patient_id` (só leitura? card separado?).

### Deferred Ideas (OUT OF SCOPE)
- Sync contínuo / webhook push do Google
- Outlook / Apple Calendar
- Substituir a Agenda interna pelo Google embed
- Export em lote de evoluções clínicas completas (texto SOAP) para o evento
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-20 | Integração Google Agenda — exportar sessões da agenda para o Google Calendar | App→Google via `linkIdentity` + Edge Functions + Calendar `events.insert`/`patch`; Google→app **skipped** (D-02 verdict below) |
| REQ-20.1 | Conectar e desconectar conta Google a partir da Agenda | `CalendarPage` CTAs; `linkIdentity` / `unlinkIdentity` + EF disconnect |
| REQ-20.2 | Sessões criadas/atualizadas como eventos no Google | Map `CalendarSession` → event; store per-user `google_event_id` links |
| REQ-20.3 | Credenciais OAuth não expostas de forma insegura; acesso respeita o dono | Refresh tokens **only** in service-role secrets table / EF; never plain `localStorage` |
| REQ-20.4 | Se Google→app inviável, UI deixa claro que é só exportação | D-03 copy on Agenda |
| REQ-20.5 | Falha de token / escopo / rede em português + reconectar | `mapAuthError` / new `mapGoogleCalendarError`; reconnect CTA |
</phase_requirements>

## Summary

Clinic auth today is **email/password** via Supabase (`signInWithPassword`); the SPA already uses **PKCE** (`flowType: 'pkce'`). Agenda data comes from `patient_sessions` through `listSessionsInRange` → `CalendarSession` (id, patientId, patientName, scheduledAt, type, place, status). There is **no** session end time, **no** Edge Functions tree, **no** Google Auth provider wired in the app UI, and CSP `connect-src` does not yet allow `https://www.googleapis.com`.

**Google → app is not viable** for writing into `patient_sessions`: every insert requires a real `patient_id` and passes `private.can_write_patient` RLS. Inventing patients or orphan sessions breaks the clinical model (D-02). A read-only overlay of arbitrary Google events is possible technically but mixes personal calendar noise with clinical agenda without a safe filter model and is out of the deferred “sync contínuo” scope — **skip import; ship export-only with clear UI (D-03).**

**Primary recommendation:** Keep login as email/password. From `/agenda`, call `supabase.auth.linkIdentity({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/calendar.events.owned', queryParams: { access_type: 'offline', prompt: 'consent' }, redirectTo: origin + '/agenda' } })`. On return, **immediately** hand `provider_token` / `provider_refresh_token` to a Supabase **Edge Function** that stores the refresh token in a **service-role-only** secrets table. Export via Edge Function using Calendar REST `fetch` (no `googleapis` npm package). Persist per-user session↔event links for idempotent re-export (D-09). Default event length **60 minutes**. UX: **export visible month** (+ clear “exportação” banner).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Connect / disconnect Google from Agenda UI | Browser / Client | Frontend Server (SSR) — N/A | SPA only; CTAs on `CalendarPage` (D-06) |
| OAuth consent + PKCE code exchange | Supabase Auth | Browser / Client | Existing PKCE client; `linkIdentity` / redirect |
| Persist Google refresh token | API / Backend (Edge Function) | Database / Storage | Client must never hold long-lived refresh + secret [CITED: supabase.com/docs/guides/auth/social-login] |
| Refresh Google access token | API / Backend (Edge Function) | — | Web OAuth client uses server-side secret [CITED: developers.google.com/identity/protocols/oauth2] |
| Calendar `events.insert` / `patch` | API / Backend (Edge Function) | CDN — N/A | Calls `googleapis.com` with user access token |
| Read `CalendarSession` for export | Database / Storage (RLS) | Browser / Client | EF uses caller JWT so `patient_sessions` RLS still applies |
| Store session ↔ `google_event_id` | Database / Storage | Browser / Client | Per-user link table; D-09; avoids sharing one event id across professionals |
| Export-only messaging (D-03) | Browser / Client | — | Portuguese copy on Agenda |
| Authorization of clinic data | Database / Storage | Browser / Client | RLS authority; client `canWrite*` remains UX-only |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` **does not exist** in this repo. Constraints below are from project docs / CONTEXT / STACK (same authority for planning):

- React + Vite SPA + Supabase; **named exports**, **single quotes**, **no semicolons**, **Portuguese UI** [VERIFIED: `.planning/codebase/CONVENTIONS.md`]
- SQL apply via **Dashboard SQL Editor only** — never `supabase db push` [VERIFIED: STATE + prior phases]
- Prefer **no new npm packages** unless justified [VERIFIED: `.planning/codebase/STACK.md`]
- **RLS is authority**; tokens must **not** live in plain `localStorage` [CONTEXT + project constraints]
- Clinic tokens (`forest` / `accent`); **hide-write, don’t disable** [Phase 3 conventions]
- Update **both** CSP surfaces (`index.html` + `netlify.toml`) when adding origins [VERIFIED: STACK.md]
- Page → hook → service → Supabase; map errors via `mapAuthError` / `mapDbError` [VERIFIED: ARCHITECTURE.md]

## Standard Stack

### Core

| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| `@supabase/supabase-js` | installed `^2.49.8` (registry latest seen `2.116.0`) | Auth `linkIdentity` / `unlinkIdentity`, `functions.invoke`, PostgREST | Already in app; PKCE configured [VERIFIED: `src/lib/supabase/client.ts`, npm view] |
| Supabase Auth Google provider | hosted Dashboard | OAuth client id/secret for Google | Official Google social login path [CITED: supabase.com/docs/guides/auth/social-login/auth-google] |
| Supabase Edge Functions (Deno) | hosted | Token vault + Calendar API + refresh | Required for confidential client secret + offline refresh [CITED: supabase.com/docs/guides/functions; developers.google.com/identity/protocols/oauth2] |
| Google Calendar API v3 REST | `https://www.googleapis.com/calendar/v3` | `events.insert` / `events.patch` | Official API; use `fetch`, not SDK [CITED: developers.google.com/calendar/api/v3/reference/events/insert] |
| Scope `calendar.events.owned` | OAuth scope URI | Create/update events on calendars the user owns (incl. `primary`) | Narrower than full `calendar` / `calendar.events` (D-05) [CITED: developers.google.com/workspace/calendar/api/auth] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Zod (existing) | `^3.25.28` | Validate export payloads / session id lists | Before `functions.invoke` |
| TanStack Query (existing) | `^5.76.1` | Connection status + export mutation toasts | `useGoogleCalendar*` hooks |
| Vite env | existing | `VITE_SUPABASE_*` only — **no** Google client secret in `VITE_*` | Secrets stay in Supabase Function secrets |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Function vault | Store refresh token in RLS table readable by user | Simpler deploy, but JWT+XSS can steal refresh token — **rejects REQ-20.3** |
| Edge Function vault | Re-consent every ~1h (access token only, no refresh store) | No secret server-side, worse UX, still risk if `provider_token` lingers in persisted session |
| `linkIdentity` | Separate Google OAuth SPA PKCE client | Extra Google client type + duplicate OAuth; loses Supabase identity unlink |
| `fetch` Calendar REST | `googleapis` npm (`181.x`) | Large dep; stack prefers no new packages; EF Deno can `fetch` |
| Scope `calendar.events.owned` | `calendar.events` or `calendar` | Broader than needed (D-05); harder Google verification |

**Installation (app):** none — no new npm packages.

**Edge Function:** deploy TypeScript under `supabase/functions/` (or Dashboard editor). Set secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (same Web client as Auth provider), optionally reuse project URL/service role via auto-injected env.

**Version verification:**
- `@supabase/supabase-js`: `npm view` → `2.116.0` (app lock may lag; keep existing range unless upgrading deliberately)
- `googleapis`: **do not install** (audited as alternative only)

## Package Legitimacy Audit

> Phase installs **no new npm packages**. slopcheck was unavailable (`pip install slopcheck` failed / not on PATH).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | N/A | No install |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

*If a later plan adds `googleapis` or GIS scripts, re-run legitimacy gate before install.*

## Architecture Patterns

### System Architecture Diagram

```text
[CalendarPage /agenda]
        |  Conectar Google
        v
[supabase.auth.linkIdentity(google + calendar.events.owned + offline)]
        |  PKCE redirect (existing client)
        v
[Supabase Auth Google provider] -----> [Google consent]
        |
        v  session.provider_token + provider_refresh_token (once)
[SPA captures tokens] --POST--> [Edge Function: google-calendar-connect]
        |                              | service_role write
        |                              v
        |                    [google_calendar_secrets]  (NO grants to anon/authenticated)
        |                    [google_calendar_connections] (RLS: user sees metadata only)
        |
        |  Exportar mês
        v
[Edge Function: google-calendar-export]
        |-- verify JWT
        |-- refresh access_token (client_secret in Function secrets)
        |-- SELECT patient_sessions via user-scoped client (RLS)
        |-- INSERT/PATCH Calendar events on calendarId=primary
        |-- UPSERT google_calendar_session_links (user_id, session_id, google_event_id)
        v
[Google Calendar primary]
```

### Recommended Project Structure

```
src/
├── pages/CalendarPage.tsx              # Connect/disconnect + export UI (D-03/D-06)
├── services/googleCalendar.service.ts  # invoke EF + list connection status
├── hooks/useGoogleCalendar.ts          # TanStack mutations/queries
├── lib/security/index.ts               # mapGoogleCalendarError (PT copy)
supabase/                               # gitignored working copy + planning copy
├── 08-google-calendar.sql              # connections + secrets + links + RLS
└── functions/
    ├── google-calendar-connect/
    ├── google-calendar-export/
    └── google-calendar-disconnect/
.planning/phases/08-integracao-google-agenda/sql/
    └── 08-google-calendar.sql          # committed SQL Editor script
```

### Pattern 1: Link Google Calendar without replacing login
**What:** Authenticated user links Google identity with Calendar scopes; email/password remains the clinic login.  
**When to use:** Always for D-04 (per authenticated user).  
**Example:**
```typescript
// Source: SignInWithOAuthCredentials in @supabase/auth-js (linkIdentity accepts same type)
// Docs: https://supabase.com/docs/guides/auth/auth-identity-linking
// Docs: https://supabase.com/docs/guides/auth/social-login/auth-google (offline refresh)
const { error } = await supabase.auth.linkIdentity({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/agenda`,
    scopes: 'https://www.googleapis.com/auth/calendar.events.owned',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

### Pattern 2: Capture provider tokens then vault them
**What:** After PKCE return, read `session.provider_refresh_token`, send to EF, then clear sensitive fields from client handling (do not write to `localStorage` keys of your own).  
**When to use:** Immediately on `/agenda` after OAuth return.  
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/social-login#provider-tokens
const { data: { session } } = await supabase.auth.getSession()
if (session?.provider_refresh_token) {
  await supabase.functions.invoke('google-calendar-connect', {
    body: {
      refreshToken: session.provider_refresh_token,
      accessToken: session.provider_token,
    },
  })
}
```

### Pattern 3: Map CalendarSession → Google event
**What:** Build event body without clinical SOAP text (D-08).  
**When to use:** Export path.  
**Example:**
```typescript
// Source: https://developers.google.com/workspace/calendar/api/guides/create-events
const start = new Date(session.scheduledAt)
const end = new Date(start.getTime() + 60 * 60 * 1000) // discretion: 60 min
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
// POST /calendar/v3/calendars/primary/events
// PATCH /calendar/v3/calendars/primary/events/{google_event_id} when link exists
```

### Anti-Patterns to Avoid
- **Replacing login with Google Sign-In:** Breaks existing clinic accounts and Phase 3 membership gating — use `linkIdentity`, do not add Google button on `LoginPage`.
- **Putting `GOOGLE_CLIENT_SECRET` in `VITE_*`:** Secret would ship in the browser bundle.
- **Storing refresh tokens in plain `localStorage` or a user-readable RLS column:** Violates REQ-20.3 and Supabase guidance.
- **Inserting Google events as `patient_sessions` without `patient_id`:** Fails RLS / invents patients (D-02).
- **Scope `https://www.googleapis.com/auth/calendar`:** Excess privilege (D-05).
- **`googleapis` npm in Vite:** Unnecessary; EF `fetch` is enough.
- **`supabase db push`:** Not available / forbidden; SQL Editor only.
- **Exporting evolution SOAP into event description:** Deferred / D-08.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth + PKCE | Custom Google redirect parser | Supabase Auth `linkIdentity` + existing PKCE client | Code verifier, redirect URI, identity linking already handled |
| Token refresh with client secret | Browser refresh call | Edge Function + Function secrets | Confidential web client [CITED: Google OAuth web-server docs] |
| Calendar HTTP client | New npm SDK | `fetch` to Calendar v3 | No new package; small surface |
| Duplicate events | Heuristic title matching | `google_calendar_session_links` (D-09) | Stable ids; per-user |
| Error copy | Raw Google JSON to UI | `mapGoogleCalendarError` Portuguese mapper | Matches CONVENTIONS |
| AuthZ for sessions | Client filters “my sessions” as security | RLS via user JWT inside EF | ASVS 4.1.1 |

**Key insight:** The hard problem is **offline Google access with a confidential OAuth client**. Supabase deliberately does **not** refresh or persist provider tokens — the app must vault them on a trusted server (Edge Function).

## Common Pitfalls

### Pitfall 1: No `provider_refresh_token`
**What goes wrong:** Access works once (~1h) then export fails forever.  
**Why it happens:** Google omits refresh unless `access_type=offline` and often `prompt=consent` on first grant.  
**How to avoid:** Pass both query params on `linkIdentity`; on missing refresh token, show “Reconecte o Google” and force consent again.  
**Warning signs:** Connect succeeds but export fails next day with 401.

### Pitfall 2: Provider tokens left in persisted Supabase session
**What goes wrong:** Refresh token sits in browser storage after OAuth.  
**Why it happens:** Session object may include `provider_*` fields after exchange.  
**How to avoid:** Vault immediately via EF; treat leftover client copies as ephemeral; never copy into custom `localStorage` keys.  
**Warning signs:** DevTools Application storage shows Google refresh material.

### Pitfall 3: CSP blocks Calendar / token endpoints
**What goes wrong:** Browser `fetch` to Google fails (if any client call) or confusion when debugging.  
**Why it happens:** Current CSP allows only Supabase + Gemini.  
**How to avoid:** Prefer **all Google API calls from Edge Function** (EF egress not subject to page CSP). Still update CSP if the SPA must call Google or accounts.google.com redirects need documentation. Function invoke stays on `*.supabase.co`.  
**Warning signs:** Console CSP violations mentioning `googleapis.com`.

### Pitfall 4: `unlinkIdentity` requires ≥2 identities
**What goes wrong:** Disconnect errors for edge accounts.  
**Why it happens:** Docs: user needs at least two linked identities to unlink.  
**How to avoid:** Email users already have email identity + Google after link — OK. Still revoke Google token + delete secrets even if unlink fails; show PT error.  
**Warning signs:** Disconnect UI succeeds locally but Google still authorized.

### Pitfall 5: Putting `google_event_id` on `patient_sessions`
**What goes wrong:** One shared event id for empresa colleagues who each have their own Google.  
**Why it happens:** Session is shared clinical row; Google account is per user (D-04).  
**How to avoid:** Link table keyed by `(user_id, session_id)`.  
**Warning signs:** Re-export by therapist B updates therapist A’s event.

### Pitfall 6: Google OAuth verification / sensitive scopes
**What goes wrong:** “Unverified app” screen; production blocked for non-test users.  
**Why it happens:** Calendar scopes often need Google verification.  
**How to avoid:** Use narrowest scope (`calendar.events.owned`); keep app in testing audience during UAT; plan verification before public launch.  
**Warning signs:** Only Google Cloud test users can connect.

### Pitfall 7: Enabling Google provider enables accidental Google login UX
**What goes wrong:** Product confusion / account linking surprises.  
**Why it happens:** Dashboard Google provider is also usable by `signInWithOAuth`.  
**How to avoid:** Do **not** add Google to `LoginPage`; only Agenda `linkIdentity`.  
**Warning signs:** New users appear via Google without membership flow.

### Pitfall 8: Manual Linking disabled
**What goes wrong:** `linkIdentity` fails.  
**Why it happens:** Manual linking is beta and must be enabled in Auth settings.  
**How to avoid:** Checklist: enable Manual Linking + Google provider + redirect URLs.  
**Warning signs:** Immediate Auth API error on Conectar.

## Code Examples

### Connect from Agenda
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-identity-linking
// Types: node_modules/@supabase/auth-js/.../types.d.ts SignInWithOAuthCredentials
await supabase.auth.linkIdentity({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/agenda`,
    scopes: 'https://www.googleapis.com/auth/calendar.events.owned',
    queryParams: { access_type: 'offline', prompt: 'consent' },
  },
})
```

### Create event (Edge Function)
```typescript
// Source: https://developers.google.com/calendar/api/v3/reference/events/insert
const res = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  },
)
if (!res.ok) throw new Error(await res.text())
const created = await res.json() // created.id → google_event_id
```

### Refresh access token (Edge Function only)
```typescript
// Source: https://developers.google.com/identity/protocols/oauth2/web-server#offline
const body = new URLSearchParams({
  client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
  client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
  refresh_token: refreshToken,
  grant_type: 'refresh_token',
})
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})
```

### Suggested SQL shapes (SQL Editor)
```sql
-- Metadata visible to the owning user
create table public.google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text,
  connected_at timestamptz not null default now()
);
alter table public.google_calendar_connections enable row level security;
-- policies: select/insert/update/delete where user_id = auth.uid()

-- Secrets: NO grants to anon/authenticated — Edge Function service_role only
create table public.google_calendar_secrets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);
revoke all on table public.google_calendar_secrets from public, anon, authenticated;

-- D-09 per-user links
create table public.google_calendar_session_links (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.patient_sessions (id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null default 'primary',
  primary key (user_id, session_id)
);
alter table public.google_calendar_session_links enable row level security;
-- policies: user_id = auth.uid(); optional: session readable via can_read_patient
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit OAuth in browser | Auth code + PKCE | Google JS implicit deprecated; Supabase default PKCE | Keep `flowType: 'pkce'` |
| Persist provider tokens in Auth DB | App-owned vault | Supabase design | Must use EF/secrets table |
| Broad `calendar` scope | Fine-grained `calendar.events.owned` | Calendar auth scopes doc (updated 2026-09-03) | Better D-05 + verification story |

**Deprecated/outdated:**
- Google JavaScript **implicit flow** for SPAs — do not use; PKCE via Supabase is correct.
- Hand-rolling OAuth in the Vite app with embedded client secret.

## Google → app viability verdict (D-02)

| Approach | Viable? | Why |
|----------|---------|-----|
| Insert Google events as `patient_sessions` | **No** | Requires `patient_id` + `can_write_patient`; inventing patients violates D-02 and clinical integrity [VERIFIED: `calendar.service.ts` insert; RLS in `03-account-types-team.sql`] |
| Read-only overlay of all Google events on Agenda | Technically yes, product-weak | No patient binding; personal clutter; needs list scope + filtering; continuous sync deferred |
| Separate “external events” table without patients | Out of scope | New domain; not required for REQ-20 acceptance |

**Verdict:** **Skip Google → app.** Deliver app → Google only. UI must state exportação (D-03).

## Discretion recommendations

| Topic | Recommendation |
|-------|----------------|
| Architecture | Edge Functions + service-role secrets table (justified first backend surface) |
| Packages | **Zero** new npm packages; Calendar via `fetch` |
| Default duration | **60 minutes** from `scheduledAt` (no end column exists) |
| Export UX | Primary: **Exportar mês visível**; secondary optional later: per-day |
| Timezone | `America/Sao_Paulo` (matches finance SQL) |
| Google→app | **Do not implement** (including overlay) this phase |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hosted project can deploy Edge Functions via Dashboard without local `supabase` CLI | Environment / Standard Stack | Planner must add human deploy checklist or install CLI |
| A2 | Same Google Web client id/secret used by Supabase Auth can refresh tokens issued through Auth OAuth | Token refresh | May need dedicated OAuth client; test in Wave 0 spike |
| A3 | `calendar.events.owned` is accepted for `primary` calendar inserts for consumer Google accounts | Standard Stack | Fallback to `calendar.events` if Google rejects scope |
| A4 | After PKCE `linkIdentity`, `provider_refresh_token` appears on session like `signInWithOAuth` | Pattern 2 | May need implicit capture path / support ticket; gate with reconnect UX |
| A5 | Google verification not blocking for internal UAT test users | Pitfall 6 | Production launch delayed |

## Open Questions (RESOLVED)

1. **Edge Function deploy path for this team** — **RESOLVED:** Human checkpoint in Plan 08-03 Task 2 — deploy via Supabase Dashboard Functions UI and/or install CLI; secrets set in Dashboard. SQL remains SQL Editor only (no `db push`).
2. **Google Cloud project / consent branding** — **RESOLVED:** Plan 08-03 `user_setup` uses testing audience / OAuth consent until production branding and privacy URLs exist; not a code blocker for export MVP.
3. **Empresa viewers exporting colleague sessions** — **RESOLVED:** Plan 08-05 — export any session **visible** via RLS to the caller’s Google calendar (Agenda already shows those rows); per-user `(user_id, session_id)` event links; do **not** invent patients. No `therapist_id = me` filter this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | ✓ | v26.4.0 | — |
| npm | Scripts | ✓ | 12.0.2 | — |
| `@supabase/supabase-js` | Auth + invoke | ✓ | in package.json | — |
| Supabase CLI | Local functions serve | ✗ | — | Deploy via Dashboard; document manual steps |
| Deno | Local EF test | ✗ | — | Dashboard test / skip local serve |
| Google Cloud OAuth client | Calendar scopes | ✗ (human) | — | **Blocking** — create Web client + enable Calendar API |
| Supabase Google provider + Manual Linking | `linkIdentity` | ✗ (human) | — | **Blocking** Dashboard toggles |
| Edge Functions on project | Token vault | ? (assumed available on hosted) | — | Re-consent-only mode (degraded UX) if Functions unavailable |
| Vitest | Automated tests | ✗ | — | Wave 0 add Vitest **or** gate on lint/typecheck + manual UAT |

**Missing dependencies with no fallback:**
- Google Cloud OAuth client + Calendar API enabled
- Supabase Auth: Google provider + Manual Linking + redirect URLs

**Missing dependencies with fallback:**
- Supabase CLI / Deno → Dashboard deploy
- Vitest → lint + typecheck + manual Agenda UAT checklist

## Validation Architecture

> `workflow.nyquist_validation` is **absent** in `.planning/config.json` → treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — recommend Vitest (aligns with TESTING.md / Vite) if Wave 0 adds tests; otherwise lint+typecheck |
| Config file | none — see Wave 0 |
| Quick run command | `npm run typecheck` (until Vitest exists) |
| Full suite command | `npm run lint && npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-20.1 | Connect/disconnect entry points exist; export-only copy present | manual + optional component | Manual on `/agenda` | ❌ Wave 0 |
| REQ-20.2 | `CalendarSession` → event mapper (title/desc/start/end) | unit | `npx vitest run src/services/googleCalendar.mapper.test.ts` (after Wave 0) | ❌ Wave 0 |
| REQ-20.3 | Secrets table has no grants to `authenticated` | SQL review / manual | SQL Editor checklist | ❌ Wave 0 |
| REQ-20.4 | UI string states exportação when import skipped | unit/string | Vitest on copy constant | ❌ Wave 0 |
| REQ-20.5 | Google 401/403 → Portuguese reconnect message | unit | `vitest` on `mapGoogleCalendarError` | ❌ Wave 0 |
| D-09 | Upsert link uses `(user_id, session_id)` | unit | mapper/idempotency pure fn | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** Full checks green + manual UAT on connect → export month → reconnect after revoke

### Wave 0 Gaps
- [ ] Decide: add Vitest now vs defer automated tests (no runner in `package.json` today)
- [ ] `src/lib/security/mapGoogleCalendarError` (+ test if Vitest added)
- [ ] Pure `mapSessionToGoogleEvent(session, durationMinutes)` unit tests
- [ ] Human checklist: Google Cloud + Supabase Auth Google + Manual Linking + EF secrets
- [ ] CSP note: prefer EF-only Google calls so page CSP may stay unchanged; document if client ever calls Google

## Security Domain

> `security_enforcement` absent in config → enabled. ASVS L1 focus for OAuth tokens.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (linking) | Existing email/password session; Google via `linkIdentity` only — do not weaken LoginPage |
| V3 Session Management | yes | Keep PKCE + `persistSession`; do not store Google refresh in app storage |
| V4 Access Control | yes | Session reads under RLS; secrets table service_role-only; per-user event links |
| V5 Input Validation | yes | Zod session id UUID arrays; sanitize event text fields |
| V6 Cryptography | yes | Do not hand-roll crypto; rely on TLS + Google token endpoint; optional at-rest encryption later |

### Known Threat Patterns for OAuth + Calendar export

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS steals Google refresh token from SPA | Information disclosure | Never keep refresh in browser; EF vault + service_role table |
| `VITE_GOOGLE_CLIENT_SECRET` leaked in bundle | Elevation of privilege | Secret only in Edge Function secrets |
| Export sessions outside RLS | Elevation of privilege | EF uses user JWT for `patient_sessions` select |
| Event description leaks SOAP / evaluations | Information disclosure | D-08 allow-list fields only (name, code, type, place, status) |
| CSRF on OAuth redirect | Spoofing | Supabase PKCE + `redirectTo` allow-list on Auth URL config; `safeRedirectPath` for in-app redirects |
| Confused deputy: export to wrong Google account | Spoofing | Connection row per `auth.uid()`; show connected `google_email` |
| Token reuse after disconnect | Elevation of privilege | Revoke at Google + delete secrets + unlink identity |
| Open redirect after OAuth | Tampering | `redirectTo` must be project allow-listed origin `/agenda` |
| Empresa reads colleague PHI then pushes to personal Google | Information disclosure | Product decision: only export rows caller can SELECT is consistent with Agenda visibility; document; optional filter `therapist_id = auth.uid()` |

## Sources

### Primary (HIGH confidence)
- [CITED: https://supabase.com/docs/guides/auth/social-login] — provider tokens not refreshed/stored by Auth; app must manage refresh
- [CITED: https://supabase.com/docs/guides/auth/social-login/auth-google] — offline `access_type` + `prompt=consent`; extract `provider_token` after OAuth/PKCE
- [CITED: https://supabase.com/docs/guides/auth/auth-identity-linking] — `linkIdentity` / `unlinkIdentity`; Manual Linking required
- [VERIFIED: `@supabase/auth-js` types] — `linkIdentity(SignInWithOAuthCredentials)` supports `scopes` + `queryParams`
- [CITED: https://developers.google.com/workspace/calendar/api/auth] — scope table incl. `calendar.events.owned` (updated 2026-09-03)
- [CITED: https://developers.google.com/calendar/api/v3/reference/events/insert] — insert scopes + REST shape
- [CITED: https://developers.google.com/workspace/calendar/api/guides/create-events] — `primary`, start/end required (updated 2026-09-11)
- [CITED: https://developers.google.com/identity/protocols/oauth2/web-server] — offline access + refresh token handling
- [CITED: https://supabase.com/docs/guides/functions] — Edge Functions + secrets
- [VERIFIED: codebase] — `calendar.service.ts`, `CalendarPage.tsx`, `auth.service.ts`, `client.ts` PKCE, RLS `patient_sessions_*`, CSP in `index.html` / `netlify.toml`

### Secondary (MEDIUM confidence)
- Google OAuth client types (public vs confidential) — [CITED: support.google.com/cloud/answer/15549257]
- Phase 03 research note: no Edge Functions yet — first EF is a project milestone

### Tertiary (LOW confidence)
- Exact Dashboard-only EF DX without CLI — needs human confirmation (A1)
- Whether Auth-issued Google refresh always refreshes with the same client secret (A2)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — official Supabase + Google docs + installed client types
- Architecture: **HIGH** for export-only + EF vault; **MEDIUM** for deploy ops
- Pitfalls: **HIGH** — refresh token, CSP, per-user links, Manual Linking, verification
- Google→app skip: **HIGH** — forced by `patient_id` + RLS + D-02

**Research date:** 2026-09-18  
**Valid until:** ~2026-10-18 (OAuth/Calendar stable; re-check Google verification policy if launching publicly)
