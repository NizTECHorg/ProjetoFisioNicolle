# External Integrations

**Analysis Date:** 2026-09-14

## APIs & External Services

**Backend (BaaS):**
- Supabase — Postgres, Auth, PostgREST, RPCs, RLS. Single integration for persistence and identity.
  - SDK/Client: `@supabase/supabase-js` 2.110.7 in `src/lib/supabase/client.ts`
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` via `src/config/env.ts`
  - Pattern: singleton `createClient` with PKCE; export `getSupabase()` and a `Proxy` named `supabase`. Throw `Supabase não configurado` if `env.isConfigured` is false.
  - Do not call Supabase from UI components. Go through `src/services/*.service.ts`.
  - Do not ship `service_role`. RLS + SECURITY DEFINER RPCs are the authorization layer.

**AI / LLM:**
- Google Gemini (Generative Language API) — analyzes uploaded physical-evaluation PDFs and returns structured JSON (summary, complaint, posture, muscle tests, cinesiologic diagnosis, plan, goals).
  - SDK/Client: **not** `@google/genai` (dependency unused). Use REST `fetch` in `src/services/aiPhysicalEvaluation.service.ts`.
  - Auth: query param `key=` from `VITE_GEMINI_API_KEY` (optional)
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - Models tried in order: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-flash-latest`. Skip 404 and try the next; other HTTP errors throw.
  - Payload: `generationConfig.response_mime_type = application/json`; PDF as `inline_data` base64.
  - If the key is missing, return the in-function simulated result after a delay (UI still works in local/dev).
  - CSP: `connect-src` must include `https://generativelanguage.googleapis.com` (`index.html`, `netlify.toml`).
  - Results are **not** persisted in Postgres; `PatientPhysicalEvaluationPanel` caches them in `localStorage`.

**Fonts / CDN:**
- Google Fonts — Plus Jakarta Sans and Cormorant Garamond loaded in `index.html` (`fonts.googleapis.com` / `fonts.gstatic.com`). Mapped in `src/index.css` as `--font-sans` and `--font-display`. Allowed in CSP `style-src` / `font-src`.

**Unused / do not add without a phase:**
- Stripe, SendGrid, Twilio, Sentry, analytics SDKs: Not detected in `src/`.
- `@google/genai`: installed, zero imports. Prefer REST already in `aiPhysicalEvaluation.service.ts` or replace REST entirely — do not mix both.

## Data Storage

**Databases:**
- Supabase Postgres (`public` schema; `private` helper schema for SECURITY DEFINER functions)
  - Connection: `VITE_SUPABASE_URL` + anon key (PostgREST over HTTPS, not a direct Postgres URL in the app)
  - Client: `@supabase/supabase-js` (no Prisma/Drizzle/ORM)
  - Hand-written types: `src/types/database.types.ts` (`Database` interface). This file covers the **confeitaria/admin** domain (orders, products, stock, etc.). Clinic tables (`patients`, `organizations`, board, evaluations) are used untyped via the pragmatic `any` client in `src/lib/supabase/client.ts`. When adding tables, update `database.types.ts` **and** the service layer.
  - Schema source of truth for account/team: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (copy of gitignored `/supabase/03-account-types-team.sql`). Apply in the SQL Editor; idempotent; do not create a second `on_auth_user_created` trigger.

**Tables used by services (clinic):**
- `patients`, `patient_goals`, `patient_focus_areas`, `patient_pain_logs`, `patient_alerts`, `patient_sessions`, `patient_session_evolutions`, `patient_evaluations` — `src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/calendar.service.ts`, `src/services/evaluations.service.ts`
- `autonomo_prices`, `autonomo_session_charges`, RPC `autonomo_finance_totals` — `src/services/finance.service.ts` (clinic autônomo only; not bakery `expenses`)
- `board_columns`, `board_cards` — `src/services/board.service.ts`
- `organizations`, `organization_memberships` — `src/services/team.service.ts`
- `profiles` — auth profile (`src/services/auth.service.ts`) and employee list (`src/services/modules.service.ts`)

**Tables used by services (admin / bakery-era modules still live):**
- `categories`, `products`, `ingredients`, `stock`, `stock_movements`, `recipes`, `recipe_items`, `clients`, `coupons`, `orders`, `order_items`, `production`, `production_items`, `deliveries`, `delivery_items`, `expenses`, `company_settings`, `notifications`, `notification_dismissals`, `tasks` — `src/services/modules.service.ts`

**Views:**
- `shopping_list_view` — `listShoppingList` in `src/services/modules.service.ts`
- `low_stock_view` — typed in `src/types/database.types.ts`; dashboard uses RPC `dashboard_metrics` for `low_stock_count`

**RPCs (call via `supabase.rpc`, never reimplement in the SPA):**
- Clinic/team (`src/services/team.service.ts`, SQL in `03-account-types-team.sql`):
  - `lookup_organization_by_code` `{ p_code }` → boolean only (do not return org name)
  - `decide_membership` `{ p_membership_id, p_accept }` — owner accepts/rejects pending therapist; rejection sets `profiles.is_active = false` (does not delete `auth.users`)
- Auth bootstrap (Postgres trigger, not called from JS): `public.handle_new_user()` on `auth.users` insert — writes `profiles`, and for `empresa` creates `organizations` + owner membership; for `fisioterapeuta` inserts pending membership when join code matches
- Admin/ops (`src/services/modules.service.ts`, typed in `src/types/database.types.ts`):
  - `confirm_order` `{ p_order_id }`
  - `cancel_order` `{ p_order_id }`
  - `update_order_status` `{ p_order_id, p_status }`
  - `complete_production` `{ p_production_id }`
  - `admin_update_profile` `{ target_user_id, new_role, new_is_active }`
  - `dashboard_metrics` (no args) → JSON
  - `dismiss_notification` `{ p_notification_id }` — with table fallback insert into `notification_dismissals`
- Typed but unused in `src/`: `current_user_role`

**RLS / helpers:**
- Private helpers in schema `private` (`is_org_owner`, `viewer_org_id`, `can_read_patient`, `can_write_patient`, …) in `03-account-types-team.sql`. New patient queries must remain compatible with `patients.created_by` and org membership. Trigger `patients_set_created_by` fills `created_by` from `auth.uid()`.

**File Storage:**
- Supabase Storage: Not used (`storage.` not referenced in `src/`).
- Static assets: `public/` (`favicon.png`, `favicon-32.png`, `apple-touch-icon.png`, `_redirects`).
- Physical-evaluation PDFs: read in-browser as base64, sent to Gemini, not uploaded to a bucket.
- Avatars: CSS initials (`src/lib/avatar.ts`, `src/components/ui/PatientAvatar.tsx`), not object storage. `profiles.avatar_url` exists on the row but is not a Storage integration.

**Caching:**
- TanStack Query in-memory cache (`src/main.tsx`, `staleTime` 60s).
- Supabase Auth session persistence (local storage via supabase-js `persistSession: true`).
- `sessionStorage` `fisio.auth.rate` — client-side login/register rate limit (`src/lib/security/index.ts`). Complements, does not replace, Supabase Auth rate limits.
- `localStorage` — physical evaluation results (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`).
- No Redis / CDN cache layer.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email + password). No OAuth/social providers in application code.
  - Implementation: `src/services/auth.service.ts` (`signInWithPassword`, `signUp`, `signOut`, `fetchProfile`)
  - Session: `supabase.auth.getSession` + `onAuthStateChange` in `src/providers/AuthProvider.tsx`. Keep the auth callback **synchronous** (awaiting DB inside it deadlocks supabase-js).
  - Profile: `public.profiles` keyed by `auth.users.id`. Extra clinic fields: `account_type` (`autonomo` | `empresa` | `fisioterapeuta`), `is_active`.
  - Membership: `fetchMembership` in `src/services/team.service.ts` after login; pending therapists go to `/aguardando` (`ProtectedRoute`).
  - Register metadata: `full_name`, `account_type`, `join_code` (fisioterapeuta only) via `signUp` `options.data`. Email redirect: `${window.location.origin}/`.
  - Password rules: Zod in `src/schemas/auth.schema.ts` (8–128 chars, upper, lower, digit, special, must not contain email local-part).
  - Rate limit: 5 attempts / key and 20 global per 15 minutes in `sessionStorage` (`checkRateLimit`).
  - Error mapping: `mapAuthError` — never surface raw Supabase messages.
  - Redirect safety: `isSafeInternalPath` / `safeRedirectPath` in `src/lib/security/index.ts` (blocks open redirects).
  - Duplicate signup probe: empty `identities` array treated as existing user (`needsEmailConfirmation`).
  - Email confirmation: expected from Supabase Auth (hosted email). No in-app SMTP/SendGrid integration. Configure templates in the Supabase dashboard.

**Account types (clinic):**
- `autonomo` / `empresa` / `fisioterapeuta` — `src/types/account.ts`, `src/lib/accountAccess.ts`. Empresa owners manage join codes on `src/pages/TeamPage.tsx`. Rejected memberships: `is_active = false`; user must use a new email.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry/Datadog/OpenTelemetry.

**Logs:**
- Browser console only. User-facing errors go through `mapAuthError` / `mapDbError` and Zustand toasts (`src/stores/toast.store.ts`, `src/components/ui/ToastViewport.tsx`). Do not `console.log` secrets or full PostgREST payloads in new code.

## CI/CD & Deployment

**Hosting:**
- Vercel — `vercel.json` SPA rewrite; `SetupPage` documents Production env vars + Redeploy after changing `VITE_*`.
- Netlify — `netlify.toml` build `npm run build`, publish `dist`, SPA 200 rewrite, security headers + CSP.
- Dual config is intentional; keep both SPA fallbacks if adding routes.

**CI Pipeline:**
- None (no `.github/workflows`). Quality gates locally: `npm run typecheck`, `npm run lint`, `npm run build`.

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` — `https://<project>.supabase.co` (HTTPS required by `src/config/env.ts`)
- `VITE_SUPABASE_ANON_KEY` — anon/public key only

**Optional env vars:**
- `VITE_GEMINI_API_KEY` — Gemini REST; omit for simulated PDF analysis

**Vite built-ins:**
- `import.meta.env.DEV` — `env.isDev` in `src/config/env.ts` (SetupPage copy differs prod vs local)

**Secrets location:**
- Local: `.env` / `.env.local` (gitignored). Do not read or commit these files.
- Production: Vercel/Netlify project environment variables (must exist **at build**).
- Never put service_role, DB passwords, or JWT secrets in `VITE_*`.

**Typed env:**
- Add new `VITE_*` keys to `src/vite-env.d.ts` **and** `src/config/env.ts` (or the specific service). `VITE_GEMINI_API_KEY` still needs a `vite-env.d.ts` entry when you next touch that file.

## Webhooks & Callbacks

**Incoming:**
- None in-repo (no `app/api`, no Edge Functions, no Stripe/Supabase webhook handlers).
- Auth email links return to the SPA origin (`emailRedirectTo` + `detectSessionInUrl: true` in `src/lib/supabase/client.ts`). PKCE hash/query is handled by supabase-js, not a custom webhook.

**Outgoing:**
- None (no CRM, billing, or Slack posts).
- Database side-effects on signup are **Postgres triggers** (`handle_new_user`), not HTTP webhooks.

**Realtime:**
- `@supabase/realtime-js` ships with supabase-js. No `channel()` / `.on(` subscriptions in `src/`. Do not assume live updates; refetch via React Query.

**Edge Functions / supabase functions.invoke:**
- Not used.

---

*Integration audit: 2026-09-14*
