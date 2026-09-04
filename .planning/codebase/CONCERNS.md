# Codebase Concerns

**Analysis Date:** 2026-09-04

## Tech Debt

**Bakery/confectionery leftover stack (dead product surface):**
- Issue: A full second product (pedidos, produtos, estoque, finanças, entregas, cupons, receitas) still lives in the repo and is not routed. Roles, search, and notifications still speak that domain.
- Files: `src/services/modules.service.ts` (918 lines), `src/hooks/queries.ts`, `src/types/database.types.ts`, `src/lib/permissions.ts`, `src/pages/ProductsPage.tsx`, `src/pages/OrdersPage.tsx`, `src/pages/FinancePage.tsx`, `src/pages/ClientsPage.tsx`, `src/pages/StockPage.tsx`, `src/pages/DeliveriesPage.tsx`, `src/pages/RecipesPage.tsx`, `src/pages/ProductionPage.tsx`, `src/pages/ShoppingPage.tsx`, `src/pages/CouponsPage.tsx`, `src/pages/EmployeesPage.tsx`, `src/pages/TasksPage.tsx`, `src/pages/ReportsPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/BlankPage.tsx`, `src/components/layout/GlobalSearch.tsx`, `src/components/layout/NotificationsMenu.tsx`, `src/schemas/modules.schema.ts`
- Impact: New work is easy to wire to the wrong tables/hooks. `EmployeeRole` includes `confeiteiro` / `entregador`. `AppShell` maps those leftovers to clinic labels in `src/components/layout/AppShell.tsx`. Global search still groups `cliente` / `produto` / `pedido`.
- Fix approach: Delete or quarantine unused pages/hooks/services. Replace `database.types.ts` with generated Supabase types for the clinic schema. Introduce clinic-specific roles (`fisioterapeuta`, `admin`) instead of remapping bakery roles.

**Manual SQL as the only schema source:**
- Issue: Schema changes are pasted into the Supabase SQL Editor. There is no `supabase/migrations/` history and only one checked-in script.
- Files: `supabase/patients-req05-evaluations.sql`, `.planning/STATE.md`, `.planning/PROJECT.md`
- Impact: Local code and production drift. REQ-05 UI is live while `patient_evaluations` may be missing remotely. New tables/policies cannot be reproduced from git.
- Fix approach: Adopt Supabase CLI migrations. Treat `supabase/*.sql` as the source of truth and apply them in order. Do not ship UI that depends on a table until the migration is applied.

**Untyped Supabase client + stale generated types:**
- Issue: `getSupabase()` uses `any`. `Database` in `src/types/database.types.ts` has no `patients`, `patient_sessions`, `patient_evaluations`, `board_columns`, or `board_cards`. Clinic services define local row types and cast query results.
- Files: `src/lib/supabase/client.ts`, `src/types/database.types.ts`, `src/services/patients.service.ts`, `src/services/evaluations.service.ts`, `src/services/calendar.service.ts`, `src/services/sessions.service.ts`, `src/services/board.service.ts`
- Impact: Insert/update typos compile. Missing `patient_evaluations` is invisible to `tsc`.
- Fix approach: Run `supabase gen types` after migrations. Type the client as `SupabaseClient<Database>`. Remove `AnyDatabase` and per-file `as EvaluationRow` casts.

**Duplicated date/calendar helpers:**
- Issue: `startOfDay`, `sameDay`, `toLocalInput`, weekday labels, and `Intl` formatters are copied across pages.
- Files: `src/pages/DashboardPage.tsx`, `src/pages/CalendarPage.tsx`, `src/pages/KanbanPage.tsx`, `src/services/patients.service.ts`, `src/services/evaluations.service.ts`, `src/lib/security/index.ts`
- Impact: Timezone bugs (UTC `toISOString().slice(0, 10)` vs local `T00:00:00`) will be fixed in one place and left in another.
- Fix approach: One `src/lib/dates.ts` (local calendar date, range, format). Ban `toISOString().slice(0, 10)` for user-facing dates.

**Patient modules still stubbed:**
- Issue: Shortcuts send users to “Em breve” modules that look like product features.
- Files: `src/pages/PatientPage.tsx` (`shortcuts`), `src/pages/PatientModuleStubPage.tsx`, `src/routes/index.tsx`
- Impact: Reavaliações, Exercícios, Documentos, and Financeiro look available and dead-end.
- Fix approach: Hide unfinished shortcuts or route them to existing tabs. Keep `PatientModuleStubPage` only for explicit placeholders.

**Header/search leftovers after FLUXO layout:**
- Issue: Desktop shell has no top header. `GlobalSearch` and `NotificationsMenu` are unused and still bakery-themed (`dark-border`, pedidos/clientes).
- Files: `src/components/layout/AppShell.tsx`, `src/components/layout/GlobalSearch.tsx`, `src/components/layout/NotificationsMenu.tsx`
- Impact: Adding search/notifications later will resurrect the wrong product language.
- Fix approach: Delete unused components or rewrite them against `listPatients` / clinic alerts before putting them back in the shell.

**Client header still branded as fisio-web:**
- Issue: Supabase client sends `X-Client-Info: fisio-web` after the FLUXO rebrand.
- Files: `src/lib/supabase/client.ts`
- Impact: Logs and support traces do not match the product name.
- Fix approach: Change the header to `fluxo-web` when touching that client.

## Known Bugs

**REQ-05 table may be missing in Supabase:**
- Symptoms: Aba Avaliação shows “Não foi possível carregar as avaliações. Confira se o script SQL do REQ-05 já foi executado no Supabase.” Create/edit/delete fail. `.planning/ROADMAP.md` marks Phase 1 done while `.planning/REQUIREMENTS.md` and `.planning/STATE.md` still wait on SQL + UAT.
- Files: `supabase/patients-req05-evaluations.sql`, `src/services/evaluations.service.ts`, `src/components/patients/PatientEvaluationPanel.tsx`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`
- Trigger: Open any patient → Avaliação before applying the script.
- Workaround: Run `supabase/patients-req05-evaluations.sql` in the Supabase SQL Editor, then reload.

**AI fallback invents a clinical chart:**
- Symptoms: Without `VITE_GEMINI_API_KEY`, PDF upload waits ~1.8s and returns a hardcoded lombar/L5-S1 case. The UI presents it as an analysis of the uploaded file.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `AI_EVALUATION_FLOW.md`
- Trigger: Upload any PDF in an environment without the Gemini key (or after all model names 404).
- Workaround: Do not click “Usar na avaliação estruturada” or “Aplicar Diagnóstico ao Prontuário” unless the result was clearly produced by the model. Prefer failing closed when the key is missing.

**Dashboard “Novas avaliações” is patient status, not REQ-05 records:**
- Symptoms: The card counts `patient.status === 'avaliacao'`, not rows in `patient_evaluations`. A saved structured evaluation does not increment the card. A patient left on status `avaliacao` does.
- Files: `src/pages/DashboardPage.tsx`, `src/hooks/usePatients.ts`
- Trigger: Compare the dashboard card with the Avaliação tab after creating a structured evaluation.
- Workaround: Treat the card as “pacientes em status Avaliação”, not new ficha records.

**Session progress counters drift from calendar status:**
- Symptoms: Calendar “Marcar realizada” only updates `patient_sessions.status`. List/dashboard progress uses denormalized `patients.sessions_done` / `sessions_planned`.
- Files: `src/services/calendar.service.ts`, `src/services/patients.service.ts` (`mapListItem`), `src/pages/DashboardPage.tsx` (`progressLabel`), `src/pages/CalendarPage.tsx`
- Trigger: Confirm/complete sessions only from Agenda.
- Workaround: Edit the planned/done fields on the patient ficha, or recount from `patient_sessions` in one place.

**Default evaluation date uses UTC, not clinic local date:**
- Symptoms: After 21:00 in Brazil (UTC−3), “Nova avaliação” can prefill yesterday.
- Files: `src/schemas/evaluation.schema.ts` (`emptyEvaluationForm`)
- Trigger: Open a new evaluation at night.
- Workaround: Correct `performedOn` before save. Use a local `YYYY-MM-DD` helper.

**Agenda has no query error state:**
- Symptoms: Failed `useCalendarSessions` still renders an empty month. User cannot tell load failure from an empty clinic.
- Files: `src/pages/CalendarPage.tsx`, `src/hooks/useClinic.ts`
- Trigger: Network/RLS error on `patient_sessions`.
- Workaround: Check the network tab. Dashboard already surfaces `isError`; Agenda does not.

**Body map is decorative, not clinical data:**
- Symptoms: `BodyFocus` always highlights the same right-leg region, independent of focus areas or pain logs.
- Files: `src/pages/PatientPage.tsx` (`BodyFocus`)
- Trigger: Open Resumo for any patient.
- Workaround: Read “Foco do tratamento” text, not the SVG.

## Security Considerations

**RLS on evaluations is “any authenticated user, all rows”:**
- Risk: Every logged-in account can `SELECT`/`INSERT`/`UPDATE`/`DELETE` every patient’s clinical evaluation. Combined with open `/cadastro`, a stranger who registers can read PHI if a profile row is created for them.
- Files: `supabase/patients-req05-evaluations.sql` (`patient_evaluations_authenticated_all`, `using (true)`, `with check (true)`), `src/pages/auth/RegisterPage.tsx`, `src/services/auth.service.ts`, `src/providers/AuthProvider.tsx`
- Current mitigation: UI requires an active `profiles` row (`isAuthenticated` in `src/providers/AuthProvider.tsx`). That is not RLS. Rate limit in `src/lib/security/index.ts` is browser `sessionStorage` only.
- Recommendations: Scope policies to clinic membership (or at least `created_by` / assigned therapist). Disable public sign-up or require an invite/admin-created profile. Add server-side Auth rate limits. Do not consider `using (true)` acceptable for clinical tables.

**Gemini API key and clinical PDFs leave the browser:**
- Risk: `VITE_GEMINI_API_KEY` is bundled into the client. Anyone can extract it and consume quota. PDF bytes (PHI) go to `generativelanguage.googleapis.com` with the key in the query string. `vite-env.d.ts` does not even declare the variable.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/vite-env.d.ts`, `src/config/env.ts`
- Current mitigation: Feature no-ops to a fake chart if the key is absent. No Edge Function, no key rotation story.
- Recommendations: Move Gemini calls to a Supabase Edge Function or backend. Never prefix the key with `VITE_`. Add consent, retention, and a hard fail when the proxy is down. Enforce a real size limit (UI says 20MB; `handleFile` in `src/components/patients/PatientPhysicalEvaluationPanel.tsx` does not check).

**PHI in `localStorage`:**
- Risk: IA drafts persist as `fisio.evaluations.{patientId}` on the device. Shared computers keep clinical text. Clearing storage loses the history; another browser never sees it. This is not the official ficha, but it looks like one.
- Files: `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Current mitigation: Official record is `patient_evaluations` via `src/services/evaluations.service.ts`.
- Recommendations: Stop persisting IA output in `localStorage`. Keep drafts in memory or in a server table with RLS. Wipe on sign-out.

**Raw Postgres errors reach toasts:**
- Risk: Clinic services throw `error.message` instead of `mapDbError`. Missing-table and constraint text can leak schema details.
- Files: `src/services/evaluations.service.ts`, `src/services/patients.service.ts`, `src/services/calendar.service.ts`, `src/services/sessions.service.ts`, `src/services/board.service.ts`, `src/lib/security/index.ts` (`mapDbError` used mainly by `src/services/modules.service.ts`)
- Current mitigation: Evaluation list has a dedicated SQL-missing copy. Mutations still toast the raw message via `onError` in `src/hooks/usePatients.ts`.
- Recommendations: Route every service error through `mapDbError`. Add a specific “relação não existe” mapping for pending SQL.

**Open registration + no clinic isolation:**
- Risk: `/cadastro` is a guest route. PROJECT.md marks multi-clínica out of scope, so one Supabase project is one shared PHI pool.
- Files: `src/routes/index.tsx`, `src/pages/auth/RegisterPage.tsx`, `.planning/PROJECT.md`
- Current mitigation: Profile must exist and be `is_active` (`src/services/auth.service.ts` `fetchProfile`). `fetchProfile` swallows query errors and returns `null`.
- Recommendations: Invite-only onboarding. Log profile-fetch failures. Plan tenant isolation before a second clinic uses the same project.

## Performance Bottlenecks

**`listPatients` pulls every session for every patient:**
- Problem: After listing patients, a second query loads all `patient_sessions` with `.in('patient_id', ids)` and no date filter. Dashboard and Agenda both call this just to decorate a few rows.
- Files: `src/services/patients.service.ts` (`listPatients`), `src/hooks/usePatients.ts`, `src/pages/DashboardPage.tsx`, `src/pages/CalendarPage.tsx`, `src/pages/PatientsPage.tsx`, `src/pages/KanbanPage.tsx`
- Cause: Next-session preview is computed in the client from the full session set. Done/planned counts still come from denormalized columns, so most of the payload is unused on Dashboard.
- Improvement path: List query should select list columns only. Next session via a view/RPC (`distinct on (patient_id)`). Dashboard metrics via a dedicated RPC, not `usePatients()` + a wide calendar range.

**Dashboard over-fetches calendar + patients:**
- Problem: One range query from `prevMonthStart` through `max(weekEnd, nextMonthStart, upcomingEnd)` plus the full patient list, on every `/painel` visit.
- Files: `src/pages/DashboardPage.tsx`, `src/services/calendar.service.ts`, `src/hooks/useClinic.ts`
- Cause: Stats, chart, and “próximas sessões” share one hook with a conservative window.
- Improvement path: Split queries (month counts, week series, next 4 sessions). Keep `staleTime` (already 60s on patients).

**Agenda loads the entire Kanban board for due dots:**
- Problem: `useBoard()` fetches all columns and cards. `useDueCards` in `src/hooks/useClinic.ts` is unused.
- Files: `src/pages/CalendarPage.tsx`, `src/services/board.service.ts`, `src/hooks/useClinic.ts`
- Cause: Due markers are derived client-side (`card.dueOn as string`, column title contains `conclu`).
- Improvement path: Call `listDueCards` for the visible month. Persist a real `done` flag instead of parsing column titles.

**PDF → Base64 in memory:**
- Problem: The whole file is read with `FileReader.readAsDataURL` and sent in JSON. No size cap despite “até 20MB”.
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Cause: Multimodal inline upload from the browser.
- Improvement path: Reject over a few MB on the client; upload to Storage; process on the server.

## Fragile Areas

**REQ-05 evaluation stack:**
- Files: `src/services/evaluations.service.ts`, `src/components/patients/PatientEvaluationPanel.tsx`, `src/hooks/usePatients.ts`, `supabase/patients-req05-evaluations.sql`
- Why fragile: Runtime depends on a table that is not in `database.types.ts` and may not exist remotely. “Inicial” is computed in the client from `performed_on`, not stored. Updates do not rewrite author. Deletes are hard deletes of clinical history. No `updated_at` trigger in the SQL script.
- Safe modification: Apply SQL first. Add types. Keep Zod limits in `src/schemas/evaluation.schema.ts`. Do not drop columns used by `EVALUATION_COLUMNS`. Prefer soft-delete or audit before allowing purge.
- Test coverage: None. No `*.test.*` / `*.spec.*` in the repo. `package.json` has no test script.

**Dashboard metrics (new real-data wiring):**
- Files: `src/pages/DashboardPage.tsx` (530 lines: helpers, chart, page)
- Why fragile: Status filters, “sessão do mês”, and chart rules (`countsAsMonthSession`, `countsInActivity`) are inline. Week offset +1 means previous week. Chart and stat cards have no unit tests.
- Safe modification: Extract pure metric functions and test them. Do not mix `avaliacao` status with `patient_evaluations` without renaming the card.
- Test coverage: None.

**Agenda + session status machine:**
- Files: `src/pages/CalendarPage.tsx`, `src/services/calendar.service.ts`
- Why fragile: UI only advances `agendada → confirmada → realizada`. No cancel, no reschedule, no therapist on create (defaults `Sala 1` / `Sessão`). Date math is copied from Dashboard.
- Safe modification: Keep status transitions in one helper. Add `cancelada` before inventing new statuses. Validate create with Zod like patient forms.
- Test coverage: None.

**Kanban “done” = column title:**
- Files: `src/pages/CalendarPage.tsx` (`columnTitle.toLowerCase().includes('conclu')`), `src/pages/KanbanPage.tsx`, `src/services/board.service.ts`
- Why fragile: Renaming “Concluído” breaks Agenda due styling. HTML5 drag-and-drop has no keyboard alternative.
- Safe modification: Store `is_done` or a column type. Use `useDueCards` from Agenda.
- Test coverage: None.

**Auth bootstrap:**
- Files: `src/providers/AuthProvider.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/services/auth.service.ts`
- Why fragile: Profile fetch is async and silent on error (`return null`). Comment documents a supabase-js deadlock if `onAuthStateChange` awaits. Easy to reintroduce the infinite login spinner.
- Safe modification: Keep the auth callback synchronous. Surface profile-load errors. Do not add awaits inside `onAuthStateChange`.
- Test coverage: None.

## Scaling Limits

**Unbounded patient + session reads:**
- Current capacity: Fine for a single small clinic (tens of patients).
- Limit: `listPatients` + all sessions, plus Dashboard/Agenda/Kanban each calling it, will grow as O(patients × sessions). No pagination on `src/pages/PatientsPage.tsx`.
- Scaling path: Server-side search/pagination. Dashboard RPC. Session range queries only. Do not add a second clinic on the same RLS-open project.

**Client-side rate limit:**
- Current capacity: 5 attempts / email and 20 global per 15 minutes, per browser (`src/lib/security/index.ts`).
- Limit: Incognito or another device resets the counter. Does not protect Supabase Auth.
- Scaling path: Supabase Auth rate limits + disable public sign-up.

**Single-tenant PHI store:**
- Current capacity: One clinic, one Supabase project (constraint in `.planning/PROJECT.md`).
- Limit: A second clinic or a leaked anon key + registered user exposes everyone’s charts.
- Scaling path: Org/clinic_id on every clinical table and RLS that checks membership.

## Dependencies at Risk

**`@google/genai` unused; raw `fetch` + speculative model names:**
- Risk: `package.json` lists `@google/genai` but `src/services/aiPhysicalEvaluation.service.ts` calls REST with `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-flash-latest`. Those IDs may 404. Docs in `AI_EVALUATION_FLOW.md` still say `gemini-2.0-flash`.
- Impact: Upload “succeeds” via the fake fallback, or fails after several round-trips.
- Migration plan: Drop the unused SDK or use it from a server. Pin one supported model. Fail if it is unavailable.

**No CI, no test runner:**
- Risk: `package.json` has `lint` / `typecheck` / `build` only. No Vitest/Jest/Playwright. No `.github/workflows`.
- Impact: Dashboard, REQ-05, and RLS changes ship untested. `tsc` cannot see clinic table mistakes because of `any`.
- Migration plan: Add Vitest for services/metrics. Add a CI workflow that runs `lint`, `typecheck`, and tests. Do not add Cypress until unit coverage exists for dates and evaluations.

**Hand-maintained `database.types.ts`:**
- Risk: Types describe the bakery schema. Clinic tables are untyped.
- Impact: Refactors compile while querying missing relations.
- Migration plan: Generate types from the live schema after REQ-05 SQL is applied.

## Missing Critical Features

**Applied REQ-05 schema in production:**
- Problem: Code assumes `patient_evaluations`. Remote DB may not have it. UAT is blocked (`.planning/STATE.md`).
- Blocks: Closing REQ-05, dashboard-from-evaluations, any report that compares avaliações.

**Tenant-aware RLS and invite-only access:**
- Problem: Authenticated-all policies + public register are not enough for clinical data.
- Blocks: Safe multi-user use, a second professional with least privilege, any compliance review (LGPD).

**Authoritative session/evaluation metrics:**
- Problem: Dashboard mixes status enums, denormalized counters, and calendar rows. No query against `patient_evaluations`.
- Blocks: Trustworthy “novas avaliações” and progress %.

**Server-side AI import:**
- Problem: Key in the client, fake fallback, PHI in `localStorage`.
- Blocks: Safe use of “PDF + IA só preenche rascunho” in production.

**Tests and schema-as-code:**
- Problem: No test files, no migrations, no CI.
- Blocks: Safe refactors of Dashboard, Agenda, and evaluations.

## Test Coverage Gaps

**Structured evaluations (REQ-05):**
- What's not tested: Mapping, “Inicial” = oldest `performed_on`, Zod limits, create/update/delete, SQL-missing error path.
- Files: `src/services/evaluations.service.ts`, `src/schemas/evaluation.schema.ts`, `src/components/patients/PatientEvaluationPanel.tsx`
- Risk: Wrong initial flag, empty complaint persisted, UI shipping against a missing table.
- Priority: High

**Dashboard aggregations:**
- What's not tested: Month/week windows, status filters, chart values, upcoming slice.
- Files: `src/pages/DashboardPage.tsx`
- Risk: Silent wrong clinic numbers after a filter tweak.
- Priority: High

**Calendar date math and status transitions:**
- What's not tested: Month grid, due-date parsing, create payload, status buttons.
- Files: `src/pages/CalendarPage.tsx`, `src/services/calendar.service.ts`
- Risk: Sessions land on the wrong day; cancel never exists; board dues mis-parse.
- Priority: Medium

**Auth and path safety:**
- What's not tested: `safeRedirectPath`, rate-limit store, register duplicate-user probe, profile-required gate.
- Files: `src/lib/security/index.ts`, `src/services/auth.service.ts`, `src/providers/AuthProvider.tsx`
- Risk: Open redirect regressions; login spinner deadlock if the callback is “fixed” with `await`.
- Priority: Medium

**AI PDF import:**
- What's not tested: File-type/size rejection, JSON parse failure, missing-key path (must not return fake PHI).
- Files: `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- Risk: Fabricated charts applied to real patients.
- Priority: High

**Dead bakery modules:**
- What's not tested: Entire `modules.service` / leftover pages. Do not add tests there; delete or isolate first.
- Files: `src/services/modules.service.ts`, `src/pages/OrdersPage.tsx` and siblings
- Risk: Effort spent testing unused product code.
- Priority: Low (delete, don’t test)

---

*Concerns audit: 2026-09-04*
