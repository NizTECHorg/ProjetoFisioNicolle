# Technology Stack

**Analysis Date:** 2026-09-14

## Languages

**Primary:**
- TypeScript 5.8.3 (`typescript` `~5.8.3` in `package.json`, resolved in `package-lock.json`) — all application code under `src/`. Compile target is ES2022 (`tsconfig.json`). JSX uses `react-jsx`. Strict mode is on: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
- SQL (Postgres 15 dialect via Supabase) — schema, RLS, triggers, and RPCs. Committed copy: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`. Live scripts also live in gitignored `/supabase/` (see `.gitignore`). Do not use `supabase db push`; paste into the Supabase SQL Editor.

**Secondary:**
- CSS (Tailwind CSS v4 `@theme` / `@import "tailwindcss"`) — `src/index.css`. Do not add a separate `tailwind.config.js`; theme tokens live in CSS.
- HTML — SPA shell in `index.html` (`lang="pt-BR"`).
- JSON — `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vercel.json`.
- TOML — `netlify.toml`.

## Runtime

**Environment:**
- Browser SPA (no Node server, no SSR, no API routes in-repo). Entry: `src/main.tsx` mounted on `#root` in `index.html`.
- Node.js is the **build/dev** runtime only. README (`README.md`) says 18+. Installed `@supabase/supabase-js@2.110.7` requires **Node >= 22**. `react-router-dom@7.18.1` requires Node >= 20. Use **Node 22+** for `npm install`, `npm run dev`, and `npm run build`.
- No `.nvmrc` / `.node-version` / `engines` field in `package.json`. Pin Node 22 locally and in hosting build settings.

**Package Manager:**
- npm (lockfile v3)
- Lockfile: `package-lock.json` present (committed). Root package name in `package.json` is `fluxo`; lockfile name is `fisio`. Use `npm install` / `npm run <script>` — do not introduce pnpm or yarn lockfiles.

## Frameworks

**Core:**
- React 19.2.7 (`react` / `react-dom` `^19.1.0` in `package.json`) — UI. Create components as functions; use hooks. Provider tree: `QueryClientProvider` (`src/main.tsx`) → `BrowserRouter` + `AuthProvider` (`src/App.tsx`).
- React Router DOM 7.18.1 (`react-router-dom` `^7.6.1`) — client routing. Route table: `src/routes/index.tsx`. Guards: `ProtectedRoute` / `GuestRoute` in `src/components/auth/ProtectedRoute.tsx`. Use `BrowserRouter`, not HashRouter.
- Vite 6.4.3 (`vite` `^6.3.5`) with `@vitejs/plugin-react` `^4.4.1` — bundler/dev server. Config: `vite.config.ts`. Path alias `@` → `src/` (mirrors `tsconfig.json` `paths`).
- Tailwind CSS 4.3.3 via `@tailwindcss/vite` `^4.1.7` — styling. Import plugin in `vite.config.ts`; tokens in `src/index.css` (`--color-forest`, `--font-sans` = Plus Jakarta Sans, `--font-display` = Cormorant Garamond).
- Zod 3.25.76 (`zod` `^3.25.28`) — form and payload validation. Schemas: `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts`, `src/schemas/modules.schema.ts`. Wire to forms with `zodResolver` from `@hookform/resolvers`.
- React Hook Form 7.81.0 (`react-hook-form` `^7.56.4`) + `@hookform/resolvers` 5.4.0 — all create/edit forms. Pattern: `useForm({ resolver: zodResolver(schema) })`.
- TanStack Query 5.101.2 (`@tanstack/react-query` `^5.76.1`) — server state. Singleton `QueryClient` in `src/main.tsx` (`staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`, mutations `retry: 0`). Hooks: `src/hooks/queries.ts`, `src/hooks/usePatients.ts`, `src/hooks/usePatientImages.ts`, `src/hooks/useClinic.ts`, `src/hooks/useTeam.ts`, `src/hooks/useFinance.ts`.
- Zustand 5.0.14 (`zustand` `^5.0.5`) — client-only UI state. Current store: `src/stores/toast.store.ts`. Do not put auth or Supabase data in Zustand; those belong in `AuthProvider` / React Query.

**Testing:**
- Not detected. No `vitest`, `jest`, `playwright`, or `cypress` in `package.json`. No `*.test.*` / `*.spec.*` runner config. Typecheck (`npm run typecheck`) and ESLint (`npm run lint`) are the automated checks. If adding tests, introduce Vitest alongside Vite rather than Jest.

**Build/Dev:**
- Vite 6.4.3 — `npm run dev`, `npm run build`, `npm run preview` (scripts call binaries via `node node_modules/...` in `package.json`).
- TypeScript compiler — `npm run typecheck` / first half of `npm run build` (`tsc --noEmit`).
- ESLint 9.27.0 flat config — `eslint.config.js`. Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`. Ignores `dist`.
- Prettier: Not detected. Match surrounding file style; do not add a formatter config unless asked.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.110.7 (`^2.49.8`) — only backend client. Instantiate via `getSupabase()` / `supabase` proxy in `src/lib/supabase/client.ts`. Auth flow: PKCE, `persistSession`, `detectSessionInUrl`, `autoRefreshToken`. Client header `X-Client-Info: fisio-web`. Never import `service_role` or put it in `VITE_*`.
- `@tanstack/react-query` 5.101.2 — cache all Supabase reads/mutations through hooks in `src/hooks/`.
- `zod` 3.25.76 + `@hookform/resolvers` 5.4.0 + `react-hook-form` 7.81.0 — validate on the client before calling services. Services also re-parse auth payloads (`loginSchema.parse` / `registerSchema.parse` in `src/services/auth.service.ts`).
- `react-router-dom` 7.18.1 — navigation and auth gates.
- `lucide-react` 1.25.0 — icons. Import named icons; do not add another icon pack.
- `@google/genai` 2.19.0 — **declared but unused**. Physical-evaluation AI calls Google Generative Language REST from `src/services/aiPhysicalEvaluation.service.ts` via `fetch`, not this SDK. Do not add SDK usage unless replacing the REST client; prefer one approach.

**Infrastructure:**
- `@tailwindcss/vite` 4.3.3 / `tailwindcss` 4.3.3 — CSS pipeline.
- `@vitejs/plugin-react` `^4.4.1` — React Fast Refresh.
- `@types/react` `^19.1.4`, `@types/react-dom` `^19.1.5`, `@types/node` `^22.15.21` — typings.
- `@eslint/js` `^9.27.0`, `typescript-eslint` `^8.32.1`, `globals` `^16.1.0` — lint.

**Data access pattern (prescriptive):**
1. Pages/components call hooks in `src/hooks/`.
2. Hooks call functions in `src/services/*.service.ts`.
3. Services call `supabase` from `src/lib/supabase/client.ts` (tables or `.rpc()`).
4. Map DB errors with `mapDbError` / auth errors with `mapAuthError` from `src/lib/security/index.ts`.
5. Sanitize user text with `sanitizeText` / `sanitizeEmail` / `escapeIlike` in the same module. Do not query Supabase from components.

## Configuration

**Environment:**
- Vite `import.meta.env` only. Typed in `src/vite-env.d.ts` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Validation and export: `src/config/env.ts`. `isEnvConfigured()` requires non-empty HTTPS URL, rejects placeholders containing `seu-projeto` / `sua-chave`. If false, `src/App.tsx` renders `src/pages/SetupPage.tsx` instead of the router.
- Extra runtime env (not in `vite-env.d.ts`): `VITE_GEMINI_API_KEY` read in `src/services/aiPhysicalEvaluation.service.ts`. Optional; missing key falls back to a local simulated result.
- Secrets files: `.env`, `.env.local`, `.env.*.local` are gitignored (`.gitignore`). No committed `.env.example` (SetupPage still tells the user to copy it). Create `.env.local` locally; never commit values.
- Hosting: set the same `VITE_*` vars in the platform **before** build. Vite inlines them at compile time (`src/pages/SetupPage.tsx`).

**Build:**
- `vite.config.ts` — React + Tailwind plugins; alias `@`; security headers on the **dev** server (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`); production `sourcemap: false`; manual chunks `vendor` (react/router) and `supabase`.
- `tsconfig.json` — app (`include: ["src"]`), `baseUrl: "."`, `paths: { "@/*": ["src/*"] }`.
- `tsconfig.node.json` — types `vite.config.ts` only.
- `eslint.config.js` — lint entry.
- `index.html` — CSP, font preconnects, favicons, theme-color `#0b1d36`.
- `netlify.toml` — `npm run build`, publish `dist`, SPA redirect `/* → /index.html` 200, security + CSP headers.
- `vercel.json` — SPA rewrite `/(.*) → /index.html` (no CSP here; rely on `index.html` meta CSP).
- `public/_redirects` — Netlify SPA fallback.

**Path alias:**
- Import as `@/config/env`, `@/lib/supabase/client`, `@/services/...`. Do not use deep relative `../../../` across `src/`.

## Platform Requirements

**Development:**
- Node.js 22+
- npm (lockfile v3)
- `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (HTTPS Supabase project URL + anon key only)
- Optional `VITE_GEMINI_API_KEY` for live PDF analysis
- Browser with `sessionStorage` / `localStorage` (auth rate-limit + physical-eval cache)
- Supabase project with Auth (email/password), Postgres tables/RPCs/RLS already applied

**Scripts (`package.json`):**
- `npm run dev` — Vite dev server
- `npm run build` — `tsc --noEmit` then `vite build` → `dist/`
- `npm run preview` — preview `dist/`
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

**Production:**
- Static host: Vercel (documented in `src/pages/SetupPage.tsx`) and/or Netlify (`netlify.toml`). Output directory: `dist`.
- SPA fallback required (`vercel.json` rewrites / `netlify.toml` redirects / `public/_redirects`).
- Build-time env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; optional `VITE_GEMINI_API_KEY`.
- CSP in `index.html` and `netlify.toml` must keep `connect-src` to `https://*.supabase.co`, `wss://*.supabase.co`, `https://generativelanguage.googleapis.com`. If you add a new origin, update **both** CSPs.
- No Docker, no CI workflows (`.github/` not present).

**Browser APIs used:**
- `crypto.randomUUID()` — toasts (`src/stores/toast.store.ts`)
- `FileReader` / `fetch` — Gemini PDF analysis (`src/services/aiPhysicalEvaluation.service.ts`)
- `sessionStorage` key `fisio.auth.rate` — client auth rate limit (`src/lib/security/index.ts`)
- `localStorage` — physical evaluation cache (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`)
- `Intl.NumberFormat` / `Intl.DateTimeFormat` `pt-BR` — `formatCurrency`, `formatDate`, `formatDateTime` in `src/lib/security/index.ts`

---

*Stack analysis: 2026-09-14*
