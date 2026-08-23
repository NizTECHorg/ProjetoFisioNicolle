# Codebase Concerns

**Analysis Date:** 2026-08-23

## Tech Debt

**Bakery/confectionery domain leftover in a clinic app:**
- Issue: Large swaths of code still model pedidos, estoque, produção, cupons, entregas, e papéis como `confeiteiro` / `entregador`, while the routed product is fisioterapia (pacientes, agenda, quadro).
- Files: `src/services/modules.service.ts`, `src/hooks/queries.ts`, `src/schemas/modules.schema.ts`, `src/types/database.types.ts`, `src/lib/permissions.ts`, `src/pages/OrdersPage.tsx`, `src/pages/StockPage.tsx`, `src/pages/RecipesPage.tsx`, `src/pages/ProductsPage.tsx`, `src/pages/DeliveriesPage.tsx`, `src/pages/CouponsPage.tsx`, `src/pages/ClientsPage.tsx`, `src/pages/ProductionPage.tsx`, `src/pages/ShoppingPage.tsx`, `src/pages/FinancePage.tsx`, `src/pages/EmployeesPage.tsx`, `src/pages/ReportsPage.tsx`, `src/pages/TasksPage.tsx`, `src/pages/SettingsPage.tsx`, `src/components/layout/NotificationsMenu.tsx`, `src/components/layout/GlobalSearch.tsx`
- Impact: Confusing ownership, inflated bundle surface if re-imported, wrong mental model for planners/executors, bakery copy (`accent-caramel`, “pedidos”) conflicts with clinic UX.
- Fix approach: Delete or quarantine unused bakery pages/hooks/services/schemas; regenerate `database.types.ts` from the live clinic schema; replace `EmployeeRole` and `permissions.ts` with clinic roles; keep only code reachable from `src/routes/index.tsx`.

**Typed Supabase client bypassed with `any`:**
- Issue: Client is deliberately untyped (`AnyDatabase = any`) to avoid Insert/Update inference failures.
- Files: `src/lib/supabase/client.ts`
- Impact: No compile-time guard for column names/payloads; typos and schema drift fail only at runtime.
- Fix approach: Regenerate types from Supabase for clinic tables (`patients`, `patient_*`, `board_*`, `profiles`) and wire `createClient<Database>`; keep row mappers in services.

**`database.types.ts` describes the wrong product:**
- Issue: Canonical DB types cover bakery tables (`products`, `orders`, `deliveries`, loyalty tiers) and omit the patient clinical model used by the app.
- Files: `src/types/database.types.ts`, `src/types/patient.ts` (parallel ad-hoc types)
- Impact: Two type systems; Profile/role types still bakery; patient shape lives only in hand-written interfaces in `src/services/patients.service.ts`.
- Fix approach: Single generated `Database` type including patients + board; delete or shrink bakery table types when tables are removed from the project.

**Misnamed clinic hooks module:**
- Issue: `useClinic.ts` exports calendar and board hooks, not clinic/tenant concepts.
- Files: `src/hooks/useClinic.ts`
- Impact: Misleading imports; harder onboarding and planning.
- Fix approach: Split/rename to `useCalendar.ts` and `useBoard.ts` (or `useAgenda.ts` / `useQuadro.ts`) matching feature boundaries.

**Destructive SQL scripts as “migrations”:**
- Issue: `patients.sql` and `board.sql` `DROP TABLE ... CASCADE` and recreate. Comments say scripts can be re-run.
- Files: `supabase/patients.sql`, `supabase/board.sql`
- Impact: Re-running in a shared/prod project wipes clinical data, sessions, goals, alerts, and board state.
- Fix approach: Replace with additive migrations only (pattern already used in `supabase/patients-req01.sql`, `supabase/patients-req04-alerts.sql`); never drop patient tables in applied scripts; document one-time bootstrap vs migrate.

**Stub clinical modules still linked from the patient UI:**
- Issue: Avaliações, evoluções, reavaliações, exercícios, documentos, financeiro are “Em breve” stubs.
- Files: `src/pages/PatientModuleStubPage.tsx`, `src/routes/index.tsx`, `src/pages/PatientPage.tsx` (shortcuts)
- Impact: Users navigate into dead ends; roadmap looks shipped in nav but is not.
- Fix approach: Either hide shortcuts until implemented or ship vertical slices one module at a time; remove catch-all `:module` route when unused.

**Dashboard is static mock data:**
- Issue: Stats, activity chart, upcoming sessions, and specialty breakdown are hardcoded constants.
- Files: `src/pages/DashboardPage.tsx`
- Impact: Misleading operational view; cannot drive real clinic decisions.
- Fix approach: Wire queries from `patients` / `patient_sessions` (counts, range aggregates) via hooks patterned like `src/hooks/usePatients.ts`.

**Orphaned layout features still depending on bakery APIs:**
- Issue: `NotificationsMenu` and `GlobalSearch` call `useNotifications` / `useGlobalSearch` from bakery `queries.ts`, but are not mounted in `AppShell`.
- Files: `src/components/layout/NotificationsMenu.tsx`, `src/components/layout/GlobalSearch.tsx`, `src/components/layout/AppShell.tsx`, `src/hooks/queries.ts`
- Impact: Dead code that breaks if reattached without bakery tables; false sense that notifications/search exist.
- Fix approach: Remove until clinic notifications/search exist, or reimplement against patients/sessions and remount in `AppShell`.

**Security helpers still carry bakery error strings:**
- Issue: `mapDbError` maps coupon/order/production messages irrelevant to clinic flows.
- Files: `src/lib/security/index.ts`
- Impact: Noise and wrong UX if those codes appear; patient services often bypass this helper entirely.
- Fix approach: Trim to shared DB codes; route clinic services through `mapDbError` consistently.

## Known Bugs

**Open self-registration grants clinic access after profile creation:**
- Symptoms: Anyone who can reach `/cadastro` creates an auth user; trigger inserts `profiles` with role `atendente` and `is_active = true`.
- Files: `src/pages/auth/RegisterPage.tsx`, `src/services/auth.service.ts`, `supabase/schema.sql` (`handle_new_user`)
- Trigger: Public signup on a configured project.
- Workaround: Disable public signup in Supabase Auth dashboard; invite-only users.

**Role labels paper over bakery roles without RBAC on clinic routes:**
- Symptoms: UI maps `confeiteiro` → “Fisioterapeuta”; patient/agenda/board routes have no role checks.
- Files: `src/components/layout/AppShell.tsx`, `src/routes/index.tsx`, `src/lib/permissions.ts` (unused by clinic pages)
- Trigger: Any authenticated profile can use all clinic features.
- Workaround: None in app code — rely on operational trust only.

**Raw Supabase/Postgres errors surface in toasts:**
- Symptoms: Mutations throw `new Error(error.message)` so users (and logs via UI) may see schema/constraint internals.
- Files: `src/services/patients.service.ts`, `src/services/board.service.ts`, `src/services/calendar.service.ts`, consumed via `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`
- Trigger: Failed insert/update/select (RLS, constraint, missing column after partial SQL apply).
- Workaround: Use `mapDbError` (as in `modules.service.ts`) before throwing.

**Schema apply order fragility:**
- Symptoms: Missing columns (`profession`, alert `created_by`) or missing write policies if only `patients.sql` is applied without `patients-req01.sql` / `patients-req04-alerts.sql` / `board.sql`.
- Files: `supabase/patients.sql`, `supabase/patients-req01.sql`, `supabase/patients-req04-alerts.sql`, `supabase/board.sql`, `supabase/board-due.sql`
- Trigger: Partial paste into SQL Editor; re-running drop scripts after additive migrations.
- Workaround: Document strict apply order; prefer a single migration history tool.

## Security Considerations

**PHI/clinical data with open RLS for all authenticated users:**
- Risk: Any logged-in user can SELECT (and often INSERT/UPDATE/DELETE) all patients, sessions, goals, pain logs, alerts, and board cards — no `clinic_id` / ownership predicate.
- Files: `supabase/patients.sql` (`using (true)` select policies), `supabase/patients-req01.sql`, `supabase/patients-req04-alerts.sql`, `supabase/board.sql`
- Current mitigation: Auth required; profiles must be active for UI gate (`AuthProvider` / `ProtectedRoute`); client sanitization helpers in `src/lib/security/index.ts`.
- Recommendations: Scope policies to clinic/org membership; deny-by-default; separate roles for therapist vs admin; never use `using (true)` for clinical tables in multi-user deployments. Treat as **blocking** before multi-clinic or external staff access.

**No multi-tenant / organization model:**
- Risk: Single shared dataset; cannot safely host more than one clinic on one project.
- Files: Entire `supabase/*.sql` patient/board schema; services under `src/services/patients.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`
- Current mitigation: Assumed single-tenant deployment.
- Recommendations: Add `clinic_id` (or `organization_id`) on all clinical tables + membership table; enforce in RLS; thread clinic context from profile into services.

**Client-only auth rate limiting:**
- Risk: `sessionStorage` + in-memory limits are bypassed by clearing storage, other browsers, or direct Auth API calls.
- Files: `src/lib/security/index.ts` (`checkRateLimit`), `src/services/auth.service.ts`
- Current mitigation: Reduces casual brute force in one browser; relies on Supabase Auth server limits.
- Recommendations: Keep client limit as UX only; ensure Supabase Auth rate limits / CAPTCHA / leaked-password protection are enabled (noted in `supabase/schema.sql` comments).

**Health data without audit trail:**
- Risk: Clinical edits (alerts, cadastro, EVA fields, sessions) lack append-only audit of who changed what.
- Files: `src/services/patients.service.ts`, `supabase/patients-req04-alerts.sql` (stores `created_by` on create only)
- Current mitigation: Alert create stamps `created_by` / `created_by_name`.
- Recommendations: Audit table or triggers for UPDATE/DELETE on `patients` and related clinical tables (LGPD accountability).

**Open redirect hardening exists; do not regress:**
- Risk: Lower if `safeRedirectPath` is bypassed in new auth flows.
- Files: `src/lib/security/index.ts`, `src/components/auth/ProtectedRoute.tsx`
- Current mitigation: Internal-path allowlist for post-login redirect.
- Recommendations: Reuse `safeRedirectPath` / `isSafeInternalPath` for any new redirect params.

## Performance Bottlenecks

**Unbounded patient list load:**
- Problem: `listPatients` selects all list columns with no `.range()` / pagination.
- Files: `src/services/patients.service.ts`, `src/hooks/usePatients.ts`, `src/pages/PatientsPage.tsx`
- Cause: Full-table fetch into the client for every list visit.
- Improvement path: Server-side pagination + search (`escapeIlike` already exists); virtualize table if lists grow large.

**Patient detail fan-out queries:**
- Problem: Detail/dashboard loads patient row plus multiple related tables in parallel (goals, focus, pain, sessions, alerts) without pagination on some lists.
- Files: `src/services/patients.service.ts` (`getPatient`, `getPatientDashboard`)
- Cause: N related selects per page open.
- Improvement path: Keep parallel fetches but cap/order sessions and pain logs; consider a single RPC/view for dashboard summary.

**Board loads all columns and cards:**
- Problem: `listBoard` loads every column and card with patient join.
- Files: `src/services/board.service.ts`, `src/pages/KanbanPage.tsx`
- Cause: No pagination or archival.
- Improvement path: Soft-archive completed columns; limit card payload fields for list view.

## Fragile Areas

**Manual Supabase SQL Editor workflow:**
- Files: `supabase/schema.sql`, `supabase/patients.sql`, `supabase/patients-req01.sql`, `supabase/patients-req04-alerts.sql`, `supabase/board.sql`, `supabase/board-due.sql`
- Why fragile: No migration runner, versioning, or CI check that remote schema matches code; drop scripts can destroy data; additive scripts assume prior state.
- Safe modification: Prefer additive `ALTER` scripts; never re-run drop sections against non-empty DBs; record applied version in project docs or Supabase migration history.
- Test coverage: None automated against SQL.

**Patient service as god-mapper:**
- Files: `src/services/patients.service.ts` (~540 lines), large pages `src/pages/PatientPage.tsx`, `src/components/patients/PatientCadastroPanel.tsx`
- Why fragile: Hand-written row interfaces, formatting, and CRUD in one module; easy to miss a column when SQL evolves (`patients-req01` fields).
- Safe modification: Change schema + types + Zod (`src/schemas/patient.schema.ts`) + service columns lists together; avoid editing only one layer.
- Test coverage: No unit/integration tests.

**Auth profile loading vs session:**
- Files: `src/providers/AuthProvider.tsx`, `src/services/auth.service.ts`
- Why fragile: Session without active profile shows “Conta sem perfil”; `fetchProfile` returns `null` on any error (including transient network), which looks like “no profile”.
- Safe modification: Distinguish query errors from missing profile; keep `onAuthStateChange` synchronous (comment already warns of deadlock).
- Test coverage: None.

**Catch-all patient module route:**
- Files: `src/routes/index.tsx` (`/pacientes/:id/:module`)
- Why fragile: Any unknown module string renders stub with generic title; typos look like “Em breve”.
- Safe modification: Whitelist module keys (already in `PatientModuleStubPage`) and redirect unknown to patient summary.

## Scaling Limits

**Single-tenant clinical DB:**
- Current capacity: Suitable for one small clinic with modest patient counts.
- Limit: Breaks for multi-clinic SaaS or large staff sharing one project without RLS scoping; unbounded `listPatients` / `listBoard` degrade as data grows.
- Scaling path: Tenant column + RLS; pagination; indexes already partial (`board_cards_due_on_idx`); add indexes on `patients.full_name`, `patient_sessions.scheduled_at` if missing in applied DB.

**Auth + profiles:**
- Current capacity: Open registration + default `atendente` for every new user.
- Limit: Uncontrolled staff growth and access to all PHI under open RLS.
- Scaling path: Invite-only signup, admin-provisioned profiles, clinic membership.

## Dependencies at Risk

**Dual domain code weight (`modules.service` + bakery pages):**
- Risk: ~900-line `modules.service.ts` and ~450-line `queries.ts` unused by current routes but still in the repo; easy to accidentally import and couple the app to missing bakery tables.
- Impact: Runtime failures against a clinic-only Supabase; wasted maintenance.
- Migration plan: Remove unused modules after confirming no routes; keep clinic services only.

**Zustand underused:**
- Risk: Only `src/stores/toast.store.ts` uses Zustand; not a removal risk, but signals incomplete cleanup of older patterns.
- Impact: Low.
- Migration plan: Keep for toasts or replace with a tiny context if simplifying deps.

**No test runner in `package.json`:**
- Risk: No Vitest/Jest/Playwright; regressions only caught manually.
- Impact: High for clinical correctness and RLS changes.
- Migration plan: Add Vitest for Zod/security helpers/services (mocked Supabase); later Playwright for login + patient CRUD.

## Missing Critical Features

**Clinical documentation modules:**
- Problem: Avaliações, evoluções, reavaliações, exercícios, documentos, financeiro are stubs.
- Blocks: Core physiotherapy workflow beyond cadastro/resumo/agenda/quadro.

**Real dashboard and notifications:**
- Problem: Mock dashboard; notifications UI orphaned and bakery-backed.
- Blocks: Operational awareness (no-shows, due cards, new patients).

**Clinic RBAC and tenancy:**
- Problem: No permission gates on patient data; bakery permissions unused.
- Blocks: Safe multi-user and multi-clinic operation.

**Automated schema migrations & CI:**
- Problem: No `.github` workflows; SQL applied by hand; no tests script.
- Blocks: Reliable deploys and regression safety.

## Test Coverage Gaps

**Entire application untested:**
- What's not tested: Auth mapping, rate-limit helpers, patient Zod schemas, patient/board/calendar services, RLS assumptions, route guards, form submit flows.
- Files: All of `src/` — zero `*.test.*` / `*.spec.*` in project source; `package.json` has no `test` script.
- Risk: Schema or RLS mistakes ship unnoticed; clinical data corruption or exposure possible.
- Priority: High for `src/lib/security/index.ts`, `src/schemas/patient.schema.ts`, and service error mapping; High for any RLS change; Medium for UI pages.

**SQL policies untested:**
- What's not tested: `using (true)` policies, grants after additive scripts, destructive re-run of `patients.sql`.
- Files: `supabase/*.sql`
- Risk: Production data wipe or over-permissive access.
- Priority: High

---

*Concerns audit: 2026-08-23*
