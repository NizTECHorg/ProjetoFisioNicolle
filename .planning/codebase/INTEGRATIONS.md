# External Integrations

**Analysis Date:** 2026-08-23

## APIs & External Services

**Backend (BaaS):**
- Supabase — Primary application backend (Auth, Postgres REST, Realtime capability via client SDK)
  - SDK/Client: `@supabase/supabase-js` via `src/lib/supabase/client.ts` (`getSupabase()`, lazy singleton + Proxy)
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`src/config/env.ts`)
  - Client options: PKCE flow, `persistSession`, `autoRefreshToken`, `detectSessionInUrl`, header `X-Client-Info: fisio-web`
  - Service modules calling Supabase:
    - `src/services/auth.service.ts` — sign-in/up/out, `profiles`
    - `src/services/patients.service.ts` — patients, goals, focus areas, pain logs, sessions, alerts
    - `src/services/calendar.service.ts` — `patient_sessions`
    - `src/services/board.service.ts` — `board_columns`, `board_cards`
    - `src/services/modules.service.ts` — products, categories, recipes, stock, orders-related tables (legacy bakery domain still present)

**Fonts / CDN:**
- Google Fonts — Cormorant Garamond + Plus Jakarta Sans
  - Loaded from `https://fonts.googleapis.com` / `https://fonts.gstatic.com` in `index.html`
  - Allowed in CSP (`index.html`, `netlify.toml`)

**Payments / third-party SaaS APIs:**
- Not detected — No Stripe/PayPal/etc. usage in source

## Data Storage

**Databases:**
- Supabase Postgres (managed)
  - Connection: browser → Supabase HTTPS/WSS using anon key (`VITE_SUPABASE_*`)
  - Client: PostgREST via `@supabase/supabase-js` (no ORM)
  - Schema authority: SQL scripts in `supabase/`
    - `supabase/schema.sql` — `profiles`, auth trigger `handle_new_user`, RLS baseline
    - `supabase/patients.sql` / `patients-req01.sql` / `patients-req04-alerts.sql` — clinical patient domain
    - `supabase/board.sql` / `board-due.sql` — Kanban board
  - Domain types: `src/types/database.types.ts`, `src/types/patient.ts`
  - Security model: Postgres RLS + RPCs; client assumes RLS is source of truth (`src/lib/supabase/client.ts` comments)

**File Storage:**
- Local/static assets only (`public/`, inlined images under `src/`)
- Supabase Storage API — Not used in application services

**Caching:**
- TanStack Query in-memory cache — Default `staleTime: 60_000` in `src/main.tsx`
- Browser `sessionStorage` — Client-side auth rate-limit store (`fisio.auth.rate` in `src/lib/security/index.ts`)
- No Redis / external cache service

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password)
  - Implementation:
    - `signInWithPassword` / `signUp` / `signOut` in `src/services/auth.service.ts`
    - Session + profile gate in `src/providers/AuthProvider.tsx` (`onAuthStateChange`, load `profiles` by user id)
    - Route protection: `src/components/auth/ProtectedRoute.tsx` (`GuestRoute` / `ProtectedRoute`)
  - Profile row: `public.profiles` linked to `auth.users` (`supabase/schema.sql`)
  - Email confirmation redirect: `emailRedirectTo: ${window.location.origin}/`
  - Client rate limiting + error mapping: `src/lib/security/index.ts`
  - Zod schemas: `src/schemas/auth.schema.ts`
- OAuth / social providers — Not configured in app code
- Service role key — Must never be used in frontend (`SetupPage` warning)

## Monitoring & Observability

**Error Tracking:**
- None — No Sentry/Datadog/LogRocket integrations detected

**Logs:**
- Browser console only (no structured logging SDK)
- User-facing errors mapped via `mapAuthError` / `mapDbError` in `src/lib/security/index.ts` and toast store

## CI/CD & Deployment

**Hosting:**
- Vercel — SPA rewrite in `vercel.json`; setup instructions in `src/pages/SetupPage.tsx` (env + redeploy)
- Netlify — Alternate config in `netlify.toml` + `public/_redirects`
- Build artifact: static `dist/` from Vite

**CI Pipeline:**
- None — No `.github/workflows` or other CI config detected

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` — HTTPS Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Public anon key
- Validated by `isEnvConfigured()` in `src/config/env.ts` (rejects empty, placeholder, or non-HTTPS URL)
- Missing/invalid config → `src/pages/SetupPage.tsx` instead of app shell (`src/App.tsx`)

**Secrets location:**
- Local: `.env` (gitignored via `.gitignore`)
- Production: Hosting platform env (Vercel Settings → Environment Variables; same names for Netlify)
- Note: Vite inlines `VITE_*` at **build** time — changing env requires rebuild/redeploy

## Webhooks & Callbacks

**Incoming:**
- None in this SPA — No serverless functions or webhook endpoints in-repo
- Auth redirect/callback handled client-side by Supabase JS (`detectSessionInUrl`, PKCE)

**Outgoing:**
- None — App does not call external webhook URLs; only Supabase API + Google Fonts

## Integration Patterns (prescriptive)

**Add a new Supabase-backed feature:**
1. Add/adjust SQL in `supabase/*.sql` (RLS policies required)
2. Add types under `src/types/`
3. Implement data access in `src/services/*.service.ts` using `supabase` from `@/lib/supabase/client`
4. Expose React Query hooks in `src/hooks/`
5. Wire UI in `src/pages/` / `src/components/`

**Do not:**
- Put `service_role` keys in the client
- Bypass RLS with elevated keys from the browser
- Call Supabase from components directly — prefer `services/` + hooks

**CSP allowlist (must update if adding APIs):**
- `connect-src`: `'self' https://*.supabase.co wss://*.supabase.co`
- `font-src` / `style-src`: Google Fonts hosts
- Defined in `index.html` and `netlify.toml`

---

*Integration audit: 2026-08-23*
