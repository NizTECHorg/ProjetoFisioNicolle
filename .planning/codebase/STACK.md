# Technology Stack

**Analysis Date:** 2026-08-23

## Languages

**Primary:**
- TypeScript ~5.8.3 — Application source under `src/` (`strict`, `noEmit`, path alias `@/*`)
- TSX / JSX — React UI components and pages (`jsx: "react-jsx"` in `tsconfig.json`)

**Secondary:**
- SQL — Schema and feature scripts in `supabase/` (`schema.sql`, `patients.sql`, `board.sql`, etc.)
- CSS — Global theme and Tailwind entry in `src/index.css` (`@import "tailwindcss"`, `@theme` tokens)
- HTML — SPA shell in `index.html` (CSP, fonts, root mount)

## Runtime

**Environment:**
- Node.js (local observed: v24.x) — Dev tooling and Vite CLI via `node node_modules/...` scripts in `package.json`
- Browser ES2022 — Client runtime target (`tsconfig.json` `target` / `lib`)

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present (package name in lockfile may differ from `package.json` `name: "fisio"`)

## Frameworks

**Core:**
- React 19.x — UI library (`react`, `react-dom`)
- React Router DOM 7.x — Client routing (`src/routes/index.tsx`, `BrowserRouter` in `src/App.tsx`)
- TanStack React Query 5.x — Server/async state (`src/main.tsx` `QueryClientProvider`, hooks under `src/hooks/`)
- Zustand 5.x — Lightweight client UI state (toasts in `src/stores/toast.store.ts`)
- Zod 3.x + React Hook Form 7.x + `@hookform/resolvers` — Form validation (`src/schemas/`, pages/components using `zodResolver`)

**Testing:**
- Not detected — No Vitest/Jest/Playwright config; no `*.test.*` / `*.spec.*` files

**Build/Dev:**
- Vite 6.x — Bundler and dev server (`vite.config.ts`)
- `@vitejs/plugin-react` — React Fast Refresh
- `@tailwindcss/vite` + Tailwind CSS 4.x — Utility CSS pipeline
- TypeScript (`tsc --noEmit`) — Typecheck gate in `build` / `typecheck` scripts
- ESLint 9 (flat config) — `eslint.config.js` with `typescript-eslint`, react-hooks, react-refresh

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.49 (locked ~2.110.x) — Backend API, Auth, Postgres access from the browser (`src/lib/supabase/client.ts`)
- `react` / `react-dom` ^19.1 — Component model
- `@tanstack/react-query` ^5.76 — Query/mutation caching for clinic data hooks
- `zod` ^3.25 — Runtime schemas for auth, patients, modules (`src/schemas/`)

**Infrastructure:**
- `lucide-react` — Icon set in UI
- `react-router-dom` — SPA navigation and route guards (`src/components/auth/ProtectedRoute.tsx`)
- Path alias `@` → `src` — Configured in `vite.config.ts` and `tsconfig.json`

## Configuration

**Environment:**
- Vite `import.meta.env` — Validated in `src/config/env.ts`
- Required public vars (typed in `src/vite-env.d.ts`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- `.env` present locally (gitignored) — Never commit; use anon key only (see `src/pages/SetupPage.tsx`)
- `.env.example` — Referenced by Setup UI but not present in repo at analysis time

**Build:**
- `vite.config.ts` — React + Tailwind plugins, `@` alias, security headers for dev server, manual chunks (`vendor`, `supabase`), `sourcemap: false`
- `tsconfig.json` / `tsconfig.node.json` — App vs Node tooling TS configs
- `eslint.config.js` — Lint for `**/*.{ts,tsx}`, ignores `dist`
- `index.html` — Meta CSP + Google Fonts preconnect
- `vercel.json` — SPA rewrite to `index.html`
- `netlify.toml` — Build (`npm run build`), publish `dist`, SPA redirects, security headers + CSP
- `public/_redirects` — Netlify-style SPA fallback

## Platform Requirements

**Development:**
- Node.js compatible with Vite 6 / npm (use current LTS or recent Node 20+)
- `npm install` then `npm run dev`
- Configure Supabase URL + anon key in `.env`
- Apply SQL scripts from `supabase/` in the Supabase SQL Editor (flat scripts; `supabase/migrations/` not present)

**Production:**
- Static SPA output in `dist/` after `npm run build`
- Hosting targets: Vercel (primary guidance in `src/pages/SetupPage.tsx`) and/or Netlify (`netlify.toml`)
- Env vars must be set **at build time** for Vite embeds
- Backend: Supabase-hosted Postgres + Auth (RLS); no custom Node API server in this repo

---

*Stack analysis: 2026-08-23*
