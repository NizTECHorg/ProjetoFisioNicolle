# Codebase Concerns

**Analysis Date:** 2026-09-14

## Tech Debt

**Bakery domain leftover in the clinic SPA:**
- Issue: A full confeitaria stack (orders, recipes, stock, coupons, deliveries, finance, production, employees, bakery RBAC) still lives in the repo and is not mounted in `src/routes/index.tsx`. Clinic code must not import it.
- Files: `src/services/modules.service.ts` (918 lines), `src/hooks/queries.ts`, `src/lib/permissions.ts`, `src/types/database.types.ts`, `src/schemas/modules.schema.ts`, `src/pages/OrdersPage.tsx`, `src/pages/RecipesPage.tsx`, `src/pages/StockPage.tsx`, `src/pages/TasksPage.tsx`, `src/pages/ProductsPage.tsx`, `src/pages/CouponsPage.tsx`, `src/pages/ClientsPage.tsx`, `src/pages/DeliveriesPage.tsx`, `src/pages/EmployeesPage.tsx`, `src/pages/FinancePage.tsx`, `src/pages/ReportsPage.tsx`, `src/pages/ProductionPage.tsx`, `src/pages/ShoppingPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/BlankPage.tsx`, `src/components/layout/GlobalSearch.tsx`, `src/components/layout/NotificationsMenu.tsx`, `src/components/dashboard/SalesChart.tsx`
- Impact: Wrong types (`EmployeeRole` / `confeiteiro` in `src/types/database.types.ts`), accidental bakery table queries, lint/typecheck cost, and planners copying bakery patterns instead of clinic ones (`src/lib/accountAccess.ts` already forbids importing `src/lib/permissions.ts`).
- Fix approach: Delete or quarantine bakery pages/hooks/services. Keep clinic types in `src/types/patient.ts` / `src/types/account.ts` / `src/types/evaluation.ts`. Do not extend `src/types/database.types.ts` for clinic tables.

**Supabase client untyped (`any`):**
- Issue: `getSupabase()` uses `SupabaseClient<any>` because generated Insert/Update types collapse to `never`. Clinic tables (`patients`, `patient_evaluations`, `organizations`, `board_columns`) are not in `src/types/database.types.ts`.
- Files: `src/lib/supabase/client.ts`, `src/types/database.types.ts`
- Impact: Typos in column names compile. Runtime failures only at query time.
- Fix approach: Generate clinic-only Database types (or hand-write Tables for patients/org/board) and pass that generic to `createClient`. Do not reuse bakery `Database`.

**God files mixing mapping, I/O, and UI helpers:**
- Issue: Single files own too many responsibilities, so a small change risks regressions across list/detail/dashboard.
- Files: `src/services/modules.service.ts` (918), `src/services/patients.service.ts` (656), `src/pages/PatientPage.tsx` (577), `src/pages/DashboardPage.tsx` (530), `src/hooks/queries.ts` (447), `src/components/patients/PatientCadastroPanel.tsx` (418)
- Impact: Hard reviews, duplicated date/status helpers (`src/pages/DashboardPage.tsx` vs `src/pages/CalendarPage.tsx`), missed `canWrite` plumbing.
- Fix approach: Split PatientPage by tab (resumo / evoluções / avaliação / cadastro). Move date helpers to `src/lib/`. Keep services as thin query+map layers.

**Schema scripts not versioned with the app:**
- Issue: `.gitignore` ignores `/supabase/`. Clinic SQL for evaluations and goals lives only on disk (`supabase/patients-req05-evaluations.sql`, `supabase/patients-req14-goals.sql`). Org/RLS SQL is duplicated: tracked copy at `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` and a gitignored local `supabase/03-account-types-team.sql`. `src/pages/SetupPage.tsx` tells operators to run `supabase/migrations/` and copy `.env.example`; neither exists in the repo.
- Files: `.gitignore`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`, `src/pages/SetupPage.tsx`, `.planning/STATE.md`
- Impact: New clones cannot recreate the database. Two SQL copies drift. REQ-05 evaluations SQL may be missing in production.
- Fix approach: Commit idempotent SQL under a tracked path (for example `.planning/phases/*/sql/` as source of truth). Point SetupPage at that path. Stop documenting `.env.example` until the file exists.

**Inconsistent DB error mapping:**
- Issue: Bakery `src/services/modules.service.ts` uses `mapDbError`. Clinic services throw raw PostgREST messages via local `throwIfError`.
- Files: `src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/calendar.service.ts`, `src/services/evaluations.service.ts`, `src/services/board.service.ts`, `src/services/team.service.ts` (mixed: `throwIfError` plus `mapDbError` only on `decideMembership`)
- Impact: Toasts can leak schema/RLS details. UX differs by screen.
- Fix approach: Use `mapDbError` from `src/lib/security/index.ts` in every service `throwIfError`. Do not pass `error.message` to the UI.

**Unused Gemini SDK:**
- Issue: `@google/genai` is in `package.json` but AI calls use raw `fetch` in `src/services/aiPhysicalEvaluation.service.ts`.
- Files: `package.json`, `src/services/aiPhysicalEvaluation.service.ts`
- Impact: Extra supply-chain surface with no benefit.
- Fix approach: Remove `@google/genai` until a server-side SDK is introduced.

**`canWrite` defaults to true on every patient panel:**
- Issue: Panels treat missing `canWrite` as writable. RLS still blocks, but UI shows edit/delete until the mutation fails.
- Files: `src/components/patients/PatientCadastroPanel.tsx`, `src/components/patients/PatientGoalsPanel.tsx`, `src/components/patients/PatientEvolutionsPanel.tsx`, `src/components/patients/PatientAlertsPanel.tsx`, `src/components/patients/PatientEvaluationPanel.tsx`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Impact: Empresa consulta (read-only) regresses if a new mount forgets the prop.
- Fix approach: Default `canWrite` to `false`. Require the page (`src/pages/PatientPage.tsx`) to pass `canWritePatient(...)`.

## Known Bugs

**`npm run lint` fails on explicit `any`:**
- Symptoms: ESLint `@typescript-eslint/no-explicit-any` at the Gemini catch. `.planning/phases/03-tipos-de-conta-e-equipe/deferred-items.md` records this as out of phase 03 scope. `npm run typecheck` still passes.
- Files: `src/services/aiPhysicalEvaluation.service.ts`
- Trigger: Run `npm run lint`.
- Workaround: Typecheck-only CI. Do not ship new `any`.

**Gemini key missing silently fabricates a clinical report:**
- Symptoms: Without `VITE_GEMINI_API_KEY`, `analyzePhysicalEvaluationPdf` waits ~1.8s then returns hardcoded lombar/L5-S1 findings unrelated to the PDF. The UI presents this as an evaluation.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `AI_EVALUATION_FLOW.md`
- Trigger: Upload any PDF on a build without the env var.
- Workaround: Never persist the result to `patient_evaluations` without a human review. Fail closed: if no key, throw a user-facing error instead of simulating.

**Membership fetch failure locks fisioterapeuta out of the clinic:**
- Symptoms: `AuthProvider` swallows `fetchMembership` errors (`catch(() => null)`). `isAuthenticated` is false when `accountType === 'fisioterapeuta' && membership === null`, so a network/RLS blip sends an already-accepted therapist to `/aguardando`.
- Files: `src/providers/AuthProvider.tsx`, `src/pages/auth/WaitingApprovalPage.tsx`, `src/components/auth/ProtectedRoute.tsx`
- Trigger: Transient error on `organization_memberships` during login.
- Workaround: Sign out and sign in again (copy on WaitingApprovalPage). Distinguish “query failed” from “no row” in `src/services/team.service.ts`.

**Profile query errors look like a deactivated account:**
- Symptoms: `fetchProfile` returns `null` on both missing row and PostgREST error. `ProtectedRoute` then shows “Conta sem perfil ativo”.
- Files: `src/services/auth.service.ts`, `src/components/auth/ProtectedRoute.tsx`
- Trigger: RLS/network error on `profiles` after a valid session.
- Workaround: Sign out. Split error vs empty in `fetchProfile` and show a retry state.

**Physical PDF analyses never reach Postgres:**
- Symptoms: Results live in `localStorage` key `fisio.evaluations.${patientId}` only. Another device, another browser, or storage eviction loses them. Applying to the structured evaluation is a separate `patient_evaluations` write.
- Files: `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `src/services/evaluations.service.ts`
- Trigger: Analyze a PDF, then open the patient on another browser.
- Workaround: Click “usar como avaliação” so a copy lands in `patient_evaluations`. Persist AI artifacts in Storage + a table, or drop localStorage.

**Raw Postgres errors in toasts:**
- Symptoms: Calendar, board, patients, sessions, evaluations throw `new Error(error.message)`. Failed RLS/check constraints can surface English PostgREST text.
- Files: `src/services/calendar.service.ts`, `src/services/board.service.ts`, `src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/evaluations.service.ts`
- Trigger: Forbidden write as empresa on a colleague’s patient; invalid status.
- Workaround: None for the user. Map through `mapDbError`.

**Kanban “done” is inferred from column title:**
- Symptoms: Calendar due cards mark done when `columnTitle.toLowerCase().includes('conclu')`. Renaming the list breaks the heuristic.
- Files: `src/pages/CalendarPage.tsx`, `src/services/board.service.ts`
- Trigger: Rename a “Concluído” column.
- Workaround: Keep “conclu” in the title. Add a real `status` or `is_done` column.

## Security Considerations

**Gemini API key in the Vite bundle:**
- Risk: `VITE_GEMINI_API_KEY` is compiled into client JS. Anyone can extract it and burn quota or send PHI to Google as this project.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/vite-env.d.ts` (key is used but not declared), `index.html` (`connect-src` includes `https://generativelanguage.googleapis.com`)
- Current mitigation: Key is optional; CSP limits connect-src. No server proxy.
- Recommendations: Move Gemini to a Supabase Edge Function or backend. Never prefix secrets with `VITE_`. Add `VITE_GEMINI_API_KEY` to `src/vite-env.d.ts` only if it remains public (it should not).

**PHI sent to Google and stored in `localStorage`:**
- Risk: PDF of avaliação física (health data, LGPD art. 5º II) is base64-posted to `generativelanguage.googleapis.com`. Parsed JSON is stored in `localStorage` (`fisio.evaluations.*`) with no encryption, TTL, or tenant isolation beyond the key name. XSS can read it. Shared computers retain it after logout (`signOut` in `src/services/auth.service.ts` does not clear those keys).
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `src/providers/AuthProvider.tsx`
- Current mitigation: Upload UI gated by `canWrite`. No file-size or magic-byte check (extension/`file.type` only).
- Recommendations: Proxy AI through a backend with DPA. Cap size (e.g. 10 MB) and verify `%PDF` header. Encrypt or do not persist locally. Wipe `fisio.evaluations.*` on logout. Log access.

**Session tokens in browser storage:**
- Risk: `createClient` in `src/lib/supabase/client.ts` uses `persistSession: true` (supabase-js default: `localStorage`). `security.skill.md` forbids JWT in `localStorage`/`sessionStorage` for this healthcare app. Client rate limit (`fisio.auth.rate` in `sessionStorage` via `src/lib/security/index.ts`) is trivially bypassable.
- Files: `src/lib/supabase/client.ts`, `src/lib/security/index.ts`, `security.skill.md`
- Current mitigation: PKCE (`flowType: 'pkce'`), HTTPS URL check in `src/config/env.ts`, CSP in `index.html`, nosniff/frame deny on the Vite dev server in `vite.config.ts`.
- Recommendations: Prefer httpOnly cookie auth via a BFF if the threat model requires it. Keep relying on Supabase Auth rate limits, not the client counter. Add production CSP/headers on the host (meta CSP in `index.html` is not equivalent to a server header).

**Board tables outside org RLS:**
- Risk: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` leaves `board_columns` / `board_cards` unchanged. Card titles can hold patient names (PHI). Cross-tenant read/write is possible if those tables still use `authenticated`/`using (true)` policies.
- Files: `src/services/board.service.ts`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`
- Current mitigation: Patient RLS exists for `patients` and related clinical tables in that SQL file. Board is explicit residual risk.
- Recommendations: Add `organization_id` (or owner) to board tables and policies matching `private.viewer_org_id()`. Until then, do not put identifiable patient data in card titles.

**Null `patients.created_by` visible to any authenticated user:**
- Risk: The SQL comments document a residual: rows with `created_by` null remain selectable by any authenticated user during/after migration.
- Files: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`
- Current mitigation: Trigger `patients_set_created_by` on insert; index `patients_created_by_idx`.
- Recommendations: Backfill `created_by`, then tighten SELECT so null-owner rows are not world-readable.

**No MFA, no prontuário audit log:**
- Risk: `security.skill.md` requires MFA for clinic admins and access logs (who/when/which patient). Neither exists in app or SQL.
- Files: `src/services/auth.service.ts`, `src/services/patients.service.ts`, `security.skill.md`
- Current mitigation: Password complexity in `src/schemas/auth.schema.ts`; fail-closed pending fisio in `src/providers/AuthProvider.tsx`; RLS on clinical tables in the phase-03 SQL.
- Recommendations: Enable Supabase MFA for `empresa` owners. Insert an `audit_events` row (or use pgaudit) on patient SELECT/UPDATE via RPC.

**Client `canWrite` is UX only:**
- Risk: Hiding buttons is not authorization. Safe only because Plan 03-02 RLS is the authority (`src/lib/accountAccess.ts` documents this).
- Files: `src/lib/accountAccess.ts`, `src/pages/PatientPage.tsx`
- Current mitigation: RLS `can_write_patient` / `can_read_patient` in `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`.
- Recommendations: Never add a client-only check without a matching policy. Do not reintroduce bakery `src/lib/permissions.ts` for clinic routes.

## Performance Bottlenecks

**Patient list hydrates every session for every patient:**
- Problem: `listPatients` loads all patients then `patient_sessions` with `.in('patient_id', ids)` and no date/status filter, then aggregates in JS.
- Files: `src/services/patients.service.ts`, `src/hooks/usePatients.ts`, `src/pages/PatientsPage.tsx`, `src/pages/CalendarPage.tsx`, `src/pages/KanbanPage.tsx`, `src/pages/DashboardPage.tsx`
- Cause: Session counts and next-session live on the list DTO. Calendar and Kanban also call `usePatients()` just to fill a select.
- Improvement path: Postgres view or RPC returning counts + next session. Paginate/search the list. Add `usePatientOptions()` with `id, full_name` only for selects.

**Dashboard over-fetches then filters in the browser:**
- Problem: `DashboardPage` loads the full patient list plus all sessions from `min(weekStart, prevMonthStart)` to `max(weekEnd, nextMonthStart, upcomingEnd)`, then filters in `useMemo`.
- Files: `src/pages/DashboardPage.tsx`, `src/hooks/useClinic.ts`, `src/services/calendar.service.ts`
- Cause: Metrics (active patients, month session counts, activity chart) are derived client-side.
- Improvement path: One RPC `clinic_dashboard_metrics(week_offset)` returning counts and upcoming rows. Keep `listSessionsInRange` for the calendar month only.

**Patient detail fan-out:**
- Problem: `getPatientById` / `getPatientDashboard` fire parallel selects (goals, focus, pain, sessions, alerts, names). `PatientPage` also mounts evaluations/sessions hooks.
- Files: `src/services/patients.service.ts`, `src/pages/PatientPage.tsx`, `src/hooks/usePatients.ts`
- Cause: No nested select / single payload for the ficha.
- Improvement path: One view `patient_ficha` or nested `select` with FK embeds. Lazy-load tabs so avaliação/evoluções queries run only when the tab is open.

**Unbounded PDF → base64 in memory:**
- Problem: `fileToBase64` reads the whole file; no size cap before `fetch`.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Cause: Missing validation.
- Improvement path: Reject files > N MB before FileReader. Stream via backend upload.

## Fragile Areas

**Auth gate (pending / rejected / missing profile):**
- Files: `src/providers/AuthProvider.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/pages/auth/WaitingApprovalPage.tsx`, `src/services/auth.service.ts`, `src/lib/accountAccess.ts`
- Why fragile: Four boolean combinations (`isActive`, `accountType`, `membership === null`, `membership.status`) must stay aligned. Comment in AuthProvider: `onAuthStateChange` must stay synchronous or login deadlocks.
- Safe modification: Change one predicate in `src/lib/accountAccess.ts` and update AuthProvider + ProtectedRoute + WaitingApprovalPage together. Do not await inside `onAuthStateChange`.
- Test coverage: No automated tests. Manual UAT only (`.planning/phases/03-tipos-de-conta-e-equipe/03-HUMAN-UAT.md`).

**Patient write UX vs RLS:**
- Files: `src/pages/PatientPage.tsx`, `src/lib/accountAccess.ts`, all `src/components/patients/*Panel.tsx`
- Why fragile: Nested `PatientPhysicalEvaluationPanel` must receive `canWrite` from `PatientEvaluationPanel`, not only from PatientPage (documented in `.planning/STATE.md`). Default `true` undoes D-07 if omitted.
- Safe modification: Thread `canWrite` from `canWritePatient(viewerId, patient.createdBy)` at the page. Default new panels to `false`.
- Test coverage: No component tests for hidden vs disabled controls.

**SQL apply path (hosted Editor, not CLI):**
- Files: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`, `.gitignore`
- Why fragile: Idempotent but order-sensitive (`patients.created_by` before helper functions). A second `handle_new_user` trigger would duplicate profiles. Gitignored `/supabase/` diverges from the tracked planning copy.
- Safe modification: Apply only the tracked planning SQL. Inspect live `on_auth_user_created` before running. Do not `supabase db push`.
- Test coverage: Optional checks listed at the bottom of the SQL file; not automated.

**AI JSON contract:**
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/types/evaluation.ts`, `src/components/patients/PatientEvaluationPanel.tsx` (`draftFromPdf`)
- Why fragile: Model list (`gemini-3.6-flash` … `gemini-flash-latest`) and unvalidated `JSON.parse`. Extra/missing keys become empty clinical fields.
- Safe modification: Parse with a Zod schema (`src/schemas/evaluation.schema.ts` or a new AI result schema). Fail if parse fails; never use the simulated lombar payload in production.
- Test coverage: None.

**Date/week math copied between pages:**
- Files: `src/pages/DashboardPage.tsx`, `src/pages/CalendarPage.tsx`
- Why fragile: `startOfWeek` (Monday offset) duplicated. Off-by-one in ISO vs local `toISOString()` can drop timezone-edge sessions.
- Safe modification: Shared helpers in `src/lib/datetime.ts`. Query ranges in local date strings if the column is `timestamptz`.
- Test coverage: None.

## Scaling Limits

**Client-side clinic aggregation:**
- Current capacity: Fine for tens of patients and a few hundred sessions (single-practitioner / small empresa).
- Limit: `listPatients` + all sessions payload grows linearly. Dashboard and Kanban each pull the full list. No pagination in `src/pages/PatientsPage.tsx`.
- Scaling path: Server-side search (`escapeIlike` already exists in `src/lib/security/index.ts`), cursor pagination, metrics RPC, `select` options endpoint.

**Org / tenant:**
- Current capacity: One `organizations` row per empresa owner (`owner_id` unique in SQL).
- Limit: Board is not org-scoped. Empresa consulta of all teammate patients loads every ficha the RLS allows into one SPA list.
- Scaling path: Tenant column on board. List virtualization. Optional filters by therapist (`created_by`).

**Auth rate limit:**
- Current capacity: 5 attempts / email and 20 global per 15 minutes per browser (`src/lib/security/index.ts`).
- Limit: Per-tab memory + `sessionStorage`; does not protect the project from distributed brute force.
- Scaling path: Supabase Auth rate limits + CAPTCHA. Treat client limiter as UX only.

## Dependencies at Risk

**`@google/genai` unused; browser `fetch` to Gemini:**
- Risk: Unused SDK still installed. Browser key exposure. Model IDs in `src/services/aiPhysicalEvaluation.service.ts` may 404 (loop continues only on 404).
- Impact: Broken AI upload or leaked key.
- Migration plan: Server-side Gemini (Edge Function). Pin one model. Remove the npm package.

**Zod 3 + bakery `database.types.ts`:**
- Risk: `zod` `^3.25.28` vs Zod 4; clinic schema is hand-mapped while bakery `Database` is stale.
- Impact: Type drift vs live Postgres (`account_type`, `organizations`, `patient_*`).
- Migration plan: Generate types from live schema into a clinic `Database` interface. Stay on Zod 3 until `zodResolver` supports 4.

**No CI, no `npm audit` gate, no lockfile policy beyond `package-lock.json`:**
- Risk: `package.json` has no `test` script. No `.github/workflows`. Lint already fails. Dependabot/Renovate not present.
- Impact: Regressions and vulnerable deps ship unnoticed.
- Migration plan: GitHub Action: `npm ci`, `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high`. Fix the existing `any` first.

**React 19 / Vite 6 / supabase-js 2:**
- Risk: Stack is current; auth deadlock comment in `src/providers/AuthProvider.tsx` is a known supabase-js footgun.
- Impact: Reintroducing `await` in `onAuthStateChange` freezes login.
- Migration plan: Keep the sync callback. Add a regression test around AuthProvider if tests are introduced.

## Missing Critical Features

**Prontuário modules still stubs:**
- Problem: Reavaliações, exercícios, documentos, financeiro are “Em breve” shortcuts and `PatientModuleStubPage`.
- Files: `src/pages/PatientPage.tsx`, `src/pages/PatientModuleStubPage.tsx`, `src/routes/index.tsx`
- Blocks: Full clinical chart, billing, exercise plans, document vault (README claims cobranças).

**REQ-05 evaluations SQL apply:**
- Problem: App code writes `patient_evaluations` (`src/services/evaluations.service.ts`) but `.planning/STATE.md` still lists executing `supabase/patients-req05-evaluations.sql` as pending. Without that table/policies, the Avaliação tab fails at runtime.
- Files: `src/services/evaluations.service.ts`, `.planning/STATE.md`
- Blocks: Structured initial evaluation in production.

**Search, notifications, settings for the clinic:**
- Problem: `GlobalSearch` / `NotificationsMenu` query bakery tables (`clients`, `products`, `orders`) and are not mounted in `src/components/layout/AppShell.tsx`. No clinic patient search in the shell.
- Files: `src/components/layout/GlobalSearch.tsx`, `src/components/layout/NotificationsMenu.tsx`, `src/components/layout/AppShell.tsx`
- Blocks: Finding a patient from the header; clinic alerts (session today, pending membership) in the bell.

**Observability and error boundary:**
- Problem: No Error Boundary in `src/main.tsx`. One `console.error` in the AI panel. No Sentry/Logflare.
- Files: `src/main.tsx`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Blocks: Diagnosing white-screen crashes and production AI failures.

**`.env.example` and tracked migrations:**
- Problem: SetupPage and README document files that are not in git. `.env*` is gitignored (contents not read for this audit); no example file is committed.
- Files: `src/pages/SetupPage.tsx`, `README.md`, `.gitignore`
- Blocks: Repeatable onboarding.

**LGPD operational controls:**
- Problem: No retention/delete workflow, no access audit, no encryption-at-rest beyond what Supabase provides for the project.
- Files: `security.skill.md` vs `src/services/patients.service.ts`
- Blocks: Healthcare compliance claims.

## Test Coverage Gaps

**Entire application untested:**
- What's not tested: No `*.test.*` / `*.spec.*`, no Vitest/Jest/Playwright config, no `test` script in `package.json`.
- Files: `package.json`, `src/` (all services, auth, RLS-sensitive UI)
- Risk: Auth fail-closed rules, `canWrite` defaults, Gemini fallback, and list-query payloads can break without detection. `npm run lint` already fails so it is not a useful gate.
- Priority: High

**Auth and membership (High):**
- What's not tested: Login rate limit, pending/rejected/null-membership routing, `safeRedirectPath` open-redirect checks, `decideMembership` error mapping.
- Files: `src/providers/AuthProvider.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/lib/security/index.ts`, `src/services/team.service.ts`
- Risk: Privilege leak into `/painel` or lockout of valid therapists.
- Priority: High

**Patient RLS UX (High):**
- What's not tested: Empresa user sees ficha but no edit controls; fisio B cannot open fisio A’s patient.
- Files: `src/pages/PatientPage.tsx`, `src/lib/accountAccess.ts`
- Risk: D-05 / D-07 regressions.
- Priority: High

**AI evaluation path (High):**
- What's not tested: PDF type/size validation, Zod parse of model JSON, no-key behavior, localStorage isolation per patient.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Risk: Fabricated clinical text saved as if it came from the PDF.
- Priority: High

**Calendar / board (Medium):**
- What's not tested: Week start (Monday), session range filters, column-title “done” heuristic, drag/move card.
- Files: `src/pages/CalendarPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/KanbanPage.tsx`, `src/services/board.service.ts`
- Risk: Wrong counts and lost cards.
- Priority: Medium

**Bakery dead code (Low):**
- What's not tested: `src/services/modules.service.ts` and pages not in the router.
- Files: listed under Tech Debt
- Risk: Low for clinic users; high if someone remounts those routes against a clinic database (queries to missing `orders` / `products` tables).
- Priority: Low — delete rather than test.

---

*Concerns audit: 2026-09-14*
