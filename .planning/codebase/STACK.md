# Technology Stack

**Analysis Date:** 2026-09-04

## Languages

**Primary:**
- TypeScript ~5.8.3 (`package.json` `devDependencies.typescript`) — Application source under `src/`. Strict mode in `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`). Target `ES2022`, JSX `react-jsx`, `verbatimModuleSyntax`. Config: `tsconfig.json` (app) and `tsconfig.node.json` (Vite config only).
- SQL (Postgres dialect) — Manual schema scripts applied in the Supabase SQL Editor. Local example: `supabase/patients-req05-evaluations.sql`. Directory `supabase/` is gitignored (see `.gitignore`).

**Secondary:**
- HTML — SPA shell in `index.html` (`lang="pt-BR"`, product title `FLUXO`).
- CSS — Tailwind v4 theme tokens and base styles in `src/index.css` (`@import "tailwindcss"` + `@theme`).
- JavaScript (ESM) — Tooling configs: `vite.config.ts`, `eslint.config.js`. Package is `"type": "module"` in `package.json`.

## Runtime

**Environment:**
- Browser SPA (no Node server, no SSR). Entry: `src/main.tsx` mounted from `index.html`.
- Node.js for toolchain only. README recommends Node 18+ (`README.md`). `package.json` has no `engines` field. Local analysis host: Node v26.4.0. Type defs: `@types/node` ^22.15.21.

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: present at `package-lock.json`
- Note: `package.json` `"name"` is `fluxo`; `package-lock.json` root `"name"` is still `fisio`. Keep using npm so the lockfile stays the source of truth.

## Frameworks

**Core:**
- React ^19.1.0 + `react-dom` ^19.1.0 — UI. Bootstrap in `src/main.tsx` (`createRoot`, `StrictMode`).
- React Router DOM ^7.6.1 — Client routing in `src/routes/index.tsx` (`BrowserRouter` in `src/App.tsx`). Clinic routes: `/painel`, `/pacientes`, `/agenda`, `/quadro`. Auth routes: `/`, `/cadastro`.
- Vite ^6.3.5 — Dev server, bundler, preview. Config: `vite.config.ts` (`@vitejs/plugin-react`, `@tailwindcss/vite`, alias `@` → `src/`).
- Tailwind CSS ^4.1.7 via `@tailwindcss/vite` ^4.1.7 — Utility CSS. Theme lives in `src/index.css` (`--color-forest`, `--font-sans`, `--font-display`). No `tailwind.config.js`.

**Testing:**
- Not detected — No Vitest/Jest/Playwright in `package.json`. No `*.test.*` / `*.spec.*` files. `npm test` is not defined.

**Build/Dev:**
- TypeScript compiler (`tsc --noEmit`) — `npm run typecheck` and as a gate in `npm run build` (`package.json`).
- ESLint ^9.27.0 (flat config) — `eslint.config.js` (`typescript-eslint` ^8.32.1, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`). Run: `npm run lint`.
- Prettier / Biome — Not detected.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.49.8 — Auth, Postgres REST, RPCs. Singleton client in `src/lib/supabase/client.ts`. Split into a `supabase` Rollup chunk in `vite.config.ts`.
- `@tanstack/react-query` ^5.76.1 — Server-state cache. `QueryClient` defaults in `src/main.tsx` (`staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`). Clinic hooks: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`. Legacy bakery hooks: `src/hooks/queries.ts`.
- `zod` ^3.25.28 — Form and service validation. Schemas in `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts`, `src/schemas/modules.schema.ts`.
- `react-hook-form` ^7.56.4 + `@hookform/resolvers` ^5.0.1 — Forms. Pair with `zodResolver(...)` (pattern in `src/pages/auth/LoginPage.tsx`, `src/components/patients/PatientCadastroPanel.tsx`).
- `zustand` ^5.0.5 — Client UI store only. Toast store: `src/stores/toast.store.ts` (`toast()` helper). Do not put clinic data here; use TanStack Query.
- `lucide-react` ^1.25.0 — Icons. Navigation icons declared in `src/config/navigation.ts`.

**Infrastructure:**
- `@google/genai` ^2.19.0 — Listed in `package.json` but **not imported**. PDF analysis in `src/services/aiPhysicalEvaluation.service.ts` uses `fetch` against `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. Do not add a second Gemini client unless replacing that fetch path.
- `@vitejs/plugin-react` ^4.4.1 — JSX/Fast Refresh.
- `globals` ^16.1.0 — ESLint browser globals in `eslint.config.js`.

## Configuration

**Environment:**
- Vite `import.meta.env` with `VITE_*` prefix. Typed in `src/vite-env.d.ts` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only — `VITE_GEMINI_API_KEY` is read untyped in `src/services/aiPhysicalEvaluation.service.ts`).
- Required for the app to boot: `VITE_SUPABASE_URL` (must be `https:`) and `VITE_SUPABASE_ANON_KEY`. Validated in `src/config/env.ts` (`isEnvConfigured()`). Placeholders containing `seu-projeto` / `sua-chave` are rejected.
- If env is invalid, `src/App.tsx` renders `src/pages/SetupPage.tsx` instead of the router.
- Optional: `VITE_GEMINI_API_KEY` — when missing, `analyzePhysicalEvaluationPdf` in `src/services/aiPhysicalEvaluation.service.ts` returns a simulated evaluation.
- `.env` present locally (gitignored via `.gitignore`). `.env.local` / `.env.example` not present. `src/pages/SetupPage.tsx` still tells developers to copy `.env.example` → `.env`.
- Never put the Supabase `service_role` key in Vite env (warned in `src/pages/SetupPage.tsx`). Vite inlines `VITE_*` at **build** time; changing host env requires rebuild (`src/pages/SetupPage.tsx`).

**Build:**
- `vite.config.ts` — React + Tailwind plugins; `@` alias; security headers on the dev server; `build.sourcemap: false`; `manualChunks` for `vendor` (`react`, `react-dom`, `react-router-dom`) and `supabase`.
- `tsconfig.json` — paths `"@/*": ["src/*"]` (keep in sync with Vite alias).
- `tsconfig.node.json` — covers `vite.config.ts`.
- `index.html` — CSP meta (allows `https://*.supabase.co`, `wss://*.supabase.co`, `https://generativelanguage.googleapis.com`, Google Fonts).
- `netlify.toml` — `npm run build`, publish `dist`, SPA redirect `/*` → `/index.html`, CSP + security headers.
- `vercel.json` — SPA rewrite `/(.*)` → `/index.html`.
- `public/_redirects` — Netlify SPA fallback `/* /index.html 200`.
- Output directory: `dist/` (gitignored).

**Scripts (`package.json`):**
```bash
npm run dev          # Vite dev server
npm run build        # tsc --noEmit && vite build
npm run preview      # vite preview
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
```

Invoke Vite/tsc/eslint via `node node_modules/...` paths in `package.json` (do not assume a global binary).

## Platform Requirements

**Development:**
- Node.js 18+ (README). npm with `package-lock.json`.
- Create a gitignored `.env` (or `.env.local`) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Optional `VITE_GEMINI_API_KEY` for live PDF analysis.
- Apply clinic SQL in the Supabase SQL Editor. `supabase/` is gitignored; `src/pages/SetupPage.tsx` mentions `supabase/migrations/` which is not present. Current local script: `supabase/patients-req05-evaluations.sql`.
- Path alias: import from `@/...` (example: `import { env } from '@/config/env'`).

**Production:**
- Static host (SPA). Documented target is Vercel (`src/pages/SetupPage.tsx` production steps). Netlify config also present (`netlify.toml`, `public/_redirects`).
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on the host, then **redeploy** so Vite inlines them.
- CSP must allow `https://*.supabase.co`, `wss://*.supabase.co`, and `https://generativelanguage.googleapis.com` if Gemini is enabled (`index.html`, `netlify.toml`).
- No Docker / `engines` / `.nvmrc` detected.

---

*Stack analysis: 2026-09-04*
