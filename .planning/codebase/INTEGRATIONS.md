# External Integrations

**Analysis Date:** 2026-09-04

## APIs & External Services

**Backend (BaaS):**
- Supabase — Clinic data, auth, and Postgres RPCs for leftover bakery/ops modules.
  - SDK/Client: `@supabase/supabase-js` via `src/lib/supabase/client.ts` (`getSupabase()` singleton, `flowType: 'pkce'`, `persistSession: true`, `detectSessionInUrl: true`, header `X-Client-Info: fisio-web`).
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`src/config/env.ts`). Do not use the service-role key in the frontend.
  - Call pattern: pages/hooks → `src/services/*.ts` → `supabase.from(...)` / `supabase.rpc(...)` / `supabase.auth.*`. Never call Supabase from components except through services.

**AI (optional):**
- Google Gemini generateContent API — PDF physical-evaluation draft in `src/services/aiPhysicalEvaluation.service.ts`.
  - SDK/Client: raw `fetch` to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`. Package `@google/genai` is unused; do not introduce a second client.
  - Auth: `VITE_GEMINI_API_KEY` (query-string API key). When unset, the service returns a simulated result after a delay — do not treat that as production clinical data.
  - Models tried in order: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-flash-latest`. Persist the official structured evaluation via `src/services/evaluations.service.ts` (`patient_evaluations`), not the PDF draft. PDF drafts stay in `localStorage` (`fisio.evaluations.${patientId}` in `src/components/patients/PatientPhysicalEvaluationPanel.tsx`).
  - CSP: `connect-src` includes `https://generativelanguage.googleapis.com` in `index.html` and `netlify.toml`.

**Fonts / CDN:**
- Google Fonts — `Plus Jakarta Sans` and `Cormorant Garamond` loaded in `index.html` (`fonts.googleapis.com` / `fonts.gstatic.com`). Mapped in `src/index.css` as `--font-sans` and `--font-display`. Keep CSP `style-src` / `font-src` in sync if fonts change.

**Payments / messaging / maps:**
- Not detected — No Stripe, Twilio, SendGrid, or Maps SDK in `package.json` or `src/`.

## Data Storage

**Databases:**
- Supabase Postgres (hosted)
  - Connection: browser HTTPS/WSS to `VITE_SUPABASE_URL` with the anon key. RLS is the server-side authority (`src/lib/supabase/client.ts` comments; `src/providers/AuthProvider.tsx`).
  - Client: `@supabase/supabase-js` (no Prisma/Drizzle). Generated-style types for the **legacy bakery schema** live in `src/types/database.types.ts`. Clinic patient tables are **not** in that file — type them in `src/types/patient.ts` and `src/types/evaluation.ts`.
  - Clinic tables used by services:
    - `patients`, `patient_goals`, `patient_focus_areas`, `patient_pain_logs`, `patient_alerts` — `src/services/patients.service.ts`
    - `patient_sessions`, `patient_session_evolutions` — `src/services/sessions.service.ts`, `src/services/calendar.service.ts`
    - `patient_evaluations` — `src/services/evaluations.service.ts` (DDL: `supabase/patients-req05-evaluations.sql`)
    - `board_columns`, `board_cards` — `src/services/board.service.ts`
    - `profiles` — `src/services/auth.service.ts`, therapist lookups in `src/services/sessions.service.ts`
  - Legacy bakery/ops tables still queried from `src/services/modules.service.ts` (not routed in `src/routes/index.tsx`): `categories`, `products`, `ingredients`, `stock_movements`, `recipes`, `recipe_items`, `clients`, `orders`, `order_items`, `coupons`, `company_settings`, `production`, `deliveries`, `delivery_items`, `expenses`, `tasks`, `notifications`, `notification_dismissals`, views `shopping_list_view` / `low_stock_view`.
  - RPCs invoked from `src/services/modules.service.ts`: `confirm_order`, `cancel_order`, `update_order_status`, `complete_production`, `admin_update_profile`, `dashboard_metrics`, `dismiss_notification`. Typed in `src/types/database.types.ts` except `dismiss_notification` (present in code, absent from the Functions map). `current_user_role` is typed but unused in `src/`.
  - Schema application: paste SQL in the Supabase SQL Editor (`.planning/PROJECT.md`). `supabase/` is gitignored; there is no committed `supabase/migrations/` despite `src/pages/SetupPage.tsx` mentioning it.

**File Storage:**
- No Supabase Storage buckets in `src/` (no `supabase.storage.from(...)`). Avatars are CSS initials (`src/lib/avatar.ts`, `src/components/ui/PatientAvatar.tsx`); `profiles.avatar_url` is selected but not uploaded here.
- Browser `localStorage` — AI PDF evaluation drafts (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`).
- Browser `sessionStorage` — client-side auth rate-limit counters (`src/lib/security/index.ts`, key `fisio.auth.rate`).
- Static brand assets — `src/assets/brand/` consumed by `src/components/brand/BrandWordmark.tsx`; favicons in `public/`.

**Caching:**
- None (no Redis/CDN cache layer). Client cache is TanStack Query only (`src/main.tsx`, `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`). Invalidate clinic keys `['patients']`, `['patients', id, ...]`, `['calendar-sessions']` after mutations.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email + password). Implementation: `src/services/auth.service.ts`.
  - Sign-in: `supabase.auth.signInWithPassword` (`signInWithEmail`).
  - Sign-up: `supabase.auth.signUp` with `options.data.full_name` and `emailRedirectTo: ${window.location.origin}/`. Confirmation email is handled by the Supabase project (no custom mail provider in this repo).
  - Sign-out: `supabase.auth.signOut`.
  - Session: `supabase.auth.getSession` + `onAuthStateChange` in `src/providers/AuthProvider.tsx`. Keep the auth callback **synchronous** (do not await DB work inside it).
  - Profile gate: `fetchProfile` reads `public.profiles` where `is_active = true`. `isAuthenticated` requires session **and** active profile (`src/providers/AuthProvider.tsx`). Missing profile UI: `src/components/auth/ProtectedRoute.tsx`.
  - PKCE + persisted session (`src/lib/supabase/client.ts`).
  - No OAuth (`signInWithOAuth`) in `src/`.
  - Client rate limiting before login/register: `checkRateLimit` in `src/lib/security/index.ts` (5 attempts / 15 min per key; 20 global). Errors mapped via `mapAuthError` (do not leak raw Supabase messages).
  - Route guards: `ProtectedRoute` / `GuestRoute` in `src/components/auth/ProtectedRoute.tsx`. Safe post-login redirect: `safeRedirectPath` in `src/lib/security/index.ts`.
  - Role helpers for leftover bakery modules: `src/lib/permissions.ts` (`administrador`, `gerente`, `atendente`, `confeiteiro`). Clinic navigation in `src/config/navigation.ts` does not use these.

## Monitoring & Observability

**Error Tracking:**
- None — No Sentry/LogRocket/PostHog. Surface failures with `toast(..., 'error')` from `src/stores/toast.store.ts` (wired in hooks `onError` handlers).

**Logs:**
- Browser console only. Production Vite build has `sourcemap: false` (`vite.config.ts`). Do not add a logging SaaS without a CSP `connect-src` update in `index.html` and `netlify.toml`.

## CI/CD & Deployment

**Hosting:**
- Static SPA. Production setup copy in `src/pages/SetupPage.tsx` assumes **Vercel** (`Settings → Environment Variables`, then Redeploy). SPA rewrite: `vercel.json`.
- Netlify also configured: `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect, CSP) and `public/_redirects`.

**CI Pipeline:**
- None — No `.github/workflows`. Quality gates are local: `npm run lint` and `npm run typecheck` / `npm run build`.

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` — HTTPS Supabase project URL (`src/config/env.ts`, `src/vite-env.d.ts`)
- `VITE_SUPABASE_ANON_KEY` — Public anon key (`src/config/env.ts`, `src/vite-env.d.ts`)

**Optional env vars:**
- `VITE_GEMINI_API_KEY` — Google AI Studio key for PDF analysis (`src/services/aiPhysicalEvaluation.service.ts`). Not declared in `src/vite-env.d.ts`.

**Secrets location:**
- Local: `.env` present (gitignored in `.gitignore`). `.env.local` and `.env.example` not in the tree; README still documents `.env.local`.
- Production: host dashboard (Vercel env vars per `src/pages/SetupPage.tsx`; same names on Netlify if that host is used).
- Vite inlines `VITE_*` at **build** time — changing env without rebuild leaves the previous values in the JS bundle.

## Webhooks & Callbacks

**Incoming:**
- None — No Edge Functions, no `/api` routes, no webhook handlers in this repo. The SPA is static files only.

**Outgoing:**
- Supabase Auth confirmation / magic-link style redirects: `emailRedirectTo` set to `window.location.origin + '/'` in `src/services/auth.service.ts`. Configure the matching Site URL / redirect allow-list in the Supabase Auth dashboard.
- Gemini `generateContent` POST from the browser (`src/services/aiPhysicalEvaluation.service.ts`).

---

*Integration audit: 2026-09-04*
