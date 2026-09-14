---
phase: 05-financeiro-autonomo
verified: 2026-09-14T19:06:28Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "SQL Editor 10-check matrix (apply already confirmed)"
    expected: "Autônomo A: own catalog/charge allow; cannot steal owner_id; trigger overwrites client amount from catalog; catalog edit does not change existing snapshot. Empresa and fisio: SELECT autonomo_prices / autonomo_session_charges → 0 rows; INSERT denied. Empresa still SELECTs colleague patient_sessions with no money columns. autonomo_finance_totals returns only A's paid snapshots; paid agendada in the current America/Sao_Paulo month increments month_total; unpaid realizada does not."
    why_human: "Hosted RLS and the totals RPC only prove with real JWTs in the Dashboard. The apply itself was human-confirmed; the 10-check allow/deny matrix was not run by this verifier."
  - test: "As autonomo — drawer Financeiro, catalog CRUD, totals, empty states, session XOR"
    expected: "Drawer shows Financeiro with Wallet; /financeiro is AutonomoFinancePage (not bakery FinancePage). Novo preço stays in the header when the catalog is empty. Archive uses ConfirmDialog and leaves the price out of new-session Select. Three total cards come from the RPC (R$ 0,00 when nothing is paid), not from the realizadas list. Empty realizadas shows Nenhuma sessão realizada with no fake rows. Session editor (ficha and dashboard shortcut) shows Valor da consulta on Agendar and Realizada: catalog XOR avulso + Pago; empty catalog hides Select and still shows avulso; Local stays clinical text. Saving a paid session whose catalog price was archived still saves without rewriting the snapshot as Avulso."
    why_human: "Planner-deferred 05-05 human-check. Overlay XOR, empty visuals, archive confirm, and snapshot preservation on edit need a logged-in autonomo in the browser."
  - test: "As empresa and fisio — no Financeiro, silent redirect, no money on the session form"
    expected: "Drawer has no Financeiro; mobile bar still has 4 items and no Wallet. Opening /financeiro Navigates to /pacientes with no toast. Nova sessão / dashboard shortcut has no Valor da consulta, no Pago, no catalog Select."
    why_human: "Nav visibility and silent redirect are session UX. Grep cannot see the authenticated drawer or a live Navigate."
---

# Phase 5: Financeiro do autônomo Verification Report

**Phase Goal:** Só o autônomo vê Financeiro. Cria um catálogo de preços (nome + R$), aplica catálogo XOR avulso na sessão com snapshot e Pago, e vê o arrecadado no mês, no ano e no acumulado.
**Verified:** 2026-09-14T19:06:28Z
**Status:** passed
**Re-verification:** No — initial verification

Goal-backward from ROADMAP success criteria (non-negotiable) plus PLAN 05-01–05-05 truths. SUMMARY.md was not treated as evidence. CONTEXT overrides REQ-17 acceptance 2–3 and the old “dois valores fixos residência vs escritório” wording: the locked product is a variable catalog (nome + R$) XOR avulso, not two location-tied fees. ROADMAP SC2 already records that override; this report verifies the CONTEXT product, not the obsolete two-fee sentence.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Nav e rota `/financeiro` só para `account_type === 'autonomo'`; drawer Wallet; `mobileNavItems` length 4; silent redirect | ✓ VERIFIED | `canSeeFinance` is `accountType === 'autonomo'` (UX only). `clinicNavigationItems` keeps `/financeiro` only for autonomo. `navigationItems` uses lucide `Wallet`. `AppShell` renders `drawerItems` from `clinicNavigationItems`, not the raw list. `mobileNavItems` is Início / Pacientes / Agenda / Quadro — four items, no Financeiro. Route `/financeiro` mounts `AutonomoFinancePage` inside `AppShell`. Non-autonomo hits `<Navigate to="/pacientes" replace />` with no `toast` import. Bakery `FinancePage` / `canManageFinance` are not routed. |
| 2 | Catálogo variável (nome + R$); preços arquivam, não apagam; editar ativo vale só para alocações futuras | ✓ VERIFIED | `priceFormSchema` is `name` + positive BRL via `parseBrlInput` (spot-check: `180` / `180,50` / `180.50` parse; empty / `0` / negative reject). Page CRUD: Novo preço / Editar preço / Arquivar preço + `ConfirmDialog`. `archivePrice` is `.update({ archived_at })` — zero `.delete()` in `finance.service.ts`. SQL: `GRANT select, insert, update` only; `drop policy` for delete; no `FOR DELETE` policy. Edit copy: “Alterar o valor vale só para sessões futuras.” Trigger copies live catalog only on INSERT or `price_id` change; same-`price_id` UPDATE copies `amount_brl` / `price_name` from `OLD`. `listActivePrices` filters `.is('archived_at', null)`. |
| 3 | Sessão: catálogo XOR avulso + Pago; Local permanece texto clínico; snapshot da época; `priceId` arquivado fica no hidden input; `CalendarPage` unchanged | ✓ VERIFIED | `sessionFormSchema` and `sessionChargeFieldsSchema` reject catalog+avulso (`Escolha um preço do catálogo ou um valor avulso, não os dois.`) and Pago without catalog or parseable avulso (`Informe um valor para marcar como pago.`). `place` stays `optionalText(80)`. Shared editor mounts **Valor da consulta** after the Local grid only when `canSeeFinance`; Local is still a clinical `Input`. `priceId` is `<input type="hidden" {...register('priceId')}>`; Select is controlled (`value={selectValue}` where `selectValue` is `''` if the id is not in active `prices`) and writes `priceId` only from `onChange`. Empty catalog hides Select and still shows avulso. `CalendarPage` has its own Sala create (`place` default “Sala 1”) and zero finance symbols. |
| 4 | Totais mês / ano / sempre vêm do RPC de snapshots pagos (inclui agendada pré-paga), sem mock e sem reduzir a lista de realizadas | ✓ VERIFIED | SQL `autonomo_finance_totals` is `security invoker`, `SUM(amount_brl) FILTER (WHERE is_paid)` joined to `patient_sessions.scheduled_at`, buckets via `AT TIME ZONE 'America/Sao_Paulo'`, no `status` filter (paid `agendada` counts; unpaid realizada does not). Client: `fetchFinanceTotals` → `supabase.rpc('autonomo_finance_totals')` → `Number(...)`. Page cards use `useFinanceTotals()`, not `realizadas.reduce`. Copy: “Soma das sessões pagas, inclusive pré-pagas agendadas.” |
| 5 | RLS owner+autonomo on dedicated tables; dinheiro não vive em `patient_sessions` | ✓ VERIFIED | Committed SQL creates `autonomo_prices` and `autonomo_session_charges` with FORCE RLS, `owner_id = auth.uid()` and `profiles.account_type = 'autonomo'`. Charge INSERT/UPDATE also requires `private.can_write_patient`. Script does not `ALTER` `patient_sessions`. `SESSION_LIST_COLUMNS` and `src/types/patient.ts` have no money fields. `listFinanceRealizadas` selects charges from `autonomo_session_charges` in a second query. Human confirmed SQL Editor apply; live JWT matrix remains human (below). |
| 6 | Salvar sessão com catálogo ou avulso faz upsert da charge; mutações invalidam `['finance']`; `charge?` é opcional | ✓ VERIFIED | `useCreatePatientSession` / `useUpdatePatientSession` accept optional `charge?: SessionChargeDraft \| null`. After `createPatientSession` returns `{ id }`, `shouldUpsertCharge` calls `upsertSessionCharge`. Empresa path `createSession.mutate(input)` omits charge. `invalidatePatient` includes `queryKey: ['finance']`. Catalog path upserts `price_id` + `is_paid` (trigger fills snapshot); avulso upserts `price_id: null` + `amount_brl`. |
| 7 | `/financeiro` é `AutonomoFinancePage`: CRUD do catálogo, três totais do RPC, realizadas Completar valor / Marcar como pago, empty states sem fake rows, CTA Novo preço no header | ✓ VERIFIED | Page uses `useFinancePrices` / `useFinanceTotals` / `useFinanceRealizadas` / create-update-archive / upsert / mark-paid. Header action **Novo preço** is always rendered (not inside the empty-catalog branch). Completar valor only when `!row.charge`; Marcar como pago when unpaid charge exists. Empty realizadas: `data={[]}` + `emptyTitle="Nenhuma sessão realizada"`. Does not import `FinancePage` or `permissions.ts`. |
| 8 | `canSeeFinance` is false for empresa and fisio; session finance block is hide-don't-disable | ✓ VERIFIED | Predicate is a strict `=== 'autonomo'` (`AccountType` is `'autonomo' \| 'empresa' \| 'fisioterapeuta'`). Editor wraps the finance block in `{showFinance ? (...) : null}` — no disabled money controls. Empresa/fisio still submit clinical fields via `createSession.mutate(input)` without charge. |

**Score:** 8/8 truths verified (code + applied SQL). RLS JWT matrix and autonomo/empresa overlay flows still need human UAT.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/types/finance.ts` | Clinic finance DTOs | ✓ VERIFIED | 58 lines. Exports `AutonomoPrice`, `SessionCharge`, `FinanceTotals`, `FinanceRealizadaRow`, `UpsertSessionChargeInput`, `SessionChargeDraft`. No residência/escritório fields. |
| `src/schemas/finance.schema.ts` | `parseBrlInput`, `priceFormSchema`, `sessionChargeFieldsSchema` | ✓ VERIFIED | 65 lines. Named exports present. XOR + Pago-requires-amount. |
| `src/lib/accountAccess.ts` | `canSeeFinance` UX predicate | ✓ VERIFIED | Autonomo-only. Documented UX only; not `permissions.ts`. Wired from page, editor, nav. |
| `src/schemas/patient.schema.ts` | session XOR + `isPaid`; `place` optional | ✓ VERIFIED | Duplicated XOR superRefine (PLAN allowed merge or copy). Contains `priceId`. |
| `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` | Idempotent catalog + charge RLS + snapshot + totals | ✓ VERIFIED | 341 lines. `autonomo_session_charges`, trigger, RPC, no DELETE grant. |
| `supabase/05-autonomo-finance.sql` | SQL Editor paste copy | ✓ VERIFIED | Exists, 341 lines (gitignored dir; same length as committed copy). |
| `src/services/finance.service.ts` | prices, charges, totals RPC, realizadas | ✓ VERIFIED | 258 lines. All planned exports. Archive is UPDATE. RPC `autonomo_finance_totals`. No `.delete()`. |
| `src/hooks/useFinance.ts` | TanStack finance queries/mutations | ✓ VERIFIED | 115 lines. Prefix `['finance']`. Wired from page and session editor. |
| `src/components/patients/PatientSessionEditorForm.tsx` | Autonomo-only **Valor da consulta** after Local | ✓ VERIFIED | 401 lines. Contains `Valor da consulta`. Hidden `priceId`. `canSeeFinance`. |
| `src/services/sessions.service.ts` | `createPatientSession` returns `{ id }` | ✓ VERIFIED | `Promise<{ id: string }>`; both agendada and realizada paths `return { id: sessionId }`. List select has no charge embed. |
| `src/pages/AutonomoFinancePage.tsx` | Autonomo-only finance screen | ✓ VERIFIED | 541 lines. Named export. Navigate + catalog + totals + realizadas. |
| `src/config/navigation.ts` | Financeiro drawer item filtered by autonomo | ✓ VERIFIED | Contains `/financeiro` and `Wallet`. Filter `accountType === 'autonomo'`. |
| `src/routes/index.tsx` | `/financeiro` inside AppShell | ✓ VERIFIED | `AutonomoFinancePage`, not bakery `FinancePage`. |

`gsd-sdk query verify.artifacts` on plans 05-01–05-05: `all_passed: true` (13/13).

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | ---- | ------ | ------- |
| `src/lib/accountAccess.ts` | `src/types/account.ts` | `AccountType` named import | ✓ WIRED | `from '@/types/account'` |
| `src/schemas/patient.schema.ts` | `src/schemas/finance.schema.ts` | duplicated XOR + `parseBrlInput` | ✓ WIRED | Error string `Escolha um preço do catálogo ou um valor avulso` present. Not a schema `.merge()`; PLAN allowed copy. |
| `public.snapshot_autonomo_session_charge` | `public.autonomo_prices` | BEFORE INSERT or `price_id` change; same id copies OLD | ✓ WIRED | SQL lines 218–270. `gsd-sdk verify.key-links` on 05-02 reported “Source file not found” because `from` is a function name, not a path — false negative. |
| `public.autonomo_finance_totals` | `public.autonomo_session_charges` | security invoker SUM of `is_paid` | ✓ WIRED | SQL lines 298–319. Same gsd-sdk false negative. |
| `src/services/finance.service.ts` | `autonomo_finance_totals` | `supabase.rpc` | ✓ WIRED | `supabase.rpc('autonomo_finance_totals').maybeSingle()` |
| `src/hooks/usePatients.ts` | `queryKey ['finance']` | `invalidatePatient` | ✓ WIRED | `invalidateQueries({ queryKey: ['finance'] })` |
| `src/hooks/usePatients.ts` | `src/services/finance.service.ts` | `upsertSessionCharge` after create/update | ✓ WIRED | Import + await after clinical save |
| `src/components/patients/PatientSessionEditorForm.tsx` | `src/lib/accountAccess.ts` | `canSeeFinance` hide-don't-disable | ✓ WIRED | `showFinance` gates the block |
| `src/pages/AutonomoFinancePage.tsx` | `src/lib/accountAccess.ts` | `canSeeFinance` Navigate | ✓ WIRED | Early return `<Navigate to="/pacientes" replace />` |
| `src/pages/AutonomoFinancePage.tsx` | `src/hooks/useFinance.ts` | `useFinanceTotals` + prices + realizadas | ✓ WIRED | |
| `src/config/navigation.ts` | lucide-react `Wallet` | drawer item | ✓ WIRED | Import + Financeiro icon; `AppShell` maps `drawerItems` |

`gsd-sdk query verify.key-links`: 05-01, 05-03, 05-04, 05-05 all verified (9/9). 05-02 0/2 is the SQL-function-as-path false negative; wiring exists in the committed script.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `AutonomoFinancePage` | `totals` (`monthTotal` / `yearTotal` / `alwaysTotal`) | `useFinanceTotals` → `fetchFinanceTotals` → `rpc autonomo_finance_totals` | Yes — SQL `SUM` of paid snapshots. `?? 0` is null-coalesce, not a mock list. | ✓ FLOWING |
| `AutonomoFinancePage` | `prices` | `useFinancePrices` → `listActivePrices` → `autonomo_prices` where `archived_at` is null | Yes — live table | ✓ FLOWING |
| `AutonomoFinancePage` | `realizadas` | `useFinanceRealizadas` → `patient_sessions` status `realizada` + separate `autonomo_session_charges` select | Yes — empty array only when zero rows | ✓ FLOWING |
| `PatientSessionEditorForm` | `prices` / `charge` | `useFinancePrices` + `useSessionCharge(editing.id)` | Yes — charge query enabled only when `showFinance` and editing | ✓ FLOWING |
| `PatientSessionEditorForm` | `place` | RHF `register('place')` from session record | Clinical text; not bound to money | ✓ FLOWING |

No hardcoded empty props at call sites for these trees. Completar valor resets to `emptySessionChargeFields()` on purpose (row has no charge yet).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Typecheck (phase automated floor) | `npm run typecheck` | exit 0 | ✓ PASS |
| `parseBrlInput` accepts 180 / 180,50 / 180.50; rejects empty, 0, negative | node eval of `src/schemas/finance.schema.ts` | all 8 cases matched | ✓ PASS |
| `canSeeFinance` autonomo-only | node eval of the predicate | autonomo true; empresa/fisio/null false | ✓ PASS |
| No GRANT DELETE / no FOR DELETE policy on finance tables | grep SQL | `grant select, insert, update` only; `on delete cascade` is FK from charges→sessions, not catalog delete | ✓ PASS |
| `archivePrice` is UPDATE not delete | grep `finance.service.ts` | no `.delete()` | ✓ PASS |
| `listPatientSessions` has no charge embed | grep `sessions.service.ts` | no `autonomo_session_charges` | ✓ PASS |
| `CalendarPage` has no money widget | grep priceId/adHoc/canSeeFinance | no matches | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/**/tests/probe-*.sh` and no probe declared in PLAN/SUMMARY | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-17 | 05-01 … 05-05 | Financeiro do autônomo — valores de consulta e arrecadação | ✓ SATISFIED (CONTEXT) | Acceptance 1: drawer + `/financeiro` autonomo-only + redirect. Acceptance 2–3: CONTEXT D-02–D-07 replace two location-tied fees with catalog (nome + R$) XOR avulso + snapshot; `place` stays clinical. Acceptance 4: totals RPC month/year/always, no mock. Acceptance 5: dedicated tables + owner+autonomo RLS; no money on `patient_sessions`. Live JWT still human. |
| (orphans) | — | REQUIREMENTS maps only REQ-17 to Phase 5 | none | Traceability table: REQ-17 → Phase 5. No extra IDs unclaimed. |

REQ-17 was not treated as failed for missing “residência vs escritório” fees. That wording is explicitly overridden by `05-CONTEXT.md` and ROADMAP SC2.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/pages/AutonomoFinancePage.tsx` | ~324 | `data={[]}` on empty realizadas `DataTable` | ℹ️ Info | Empty-state wiring, not a stub — `emptyTitle` / `emptyDescription` and no fake patient rows. |
| `src/services/finance.service.ts` | ~184 | `if (!hasCatalog && !hasAdHoc) return` | ℹ️ Info | Intentional no-op when the session has no money. Zod blocks Pago-without-amount on the form. |
| `src/pages/FinancePage.tsx` | — | Bakery leftover still in repo | ℹ️ Info | Not imported by `AppRoutes`. Clinic screen is `AutonomoFinancePage`. |
| `src/hooks/queries.ts` | ~293 | Bakery still invalidates `['finance']` | ℹ️ Info | Clinic finance also uses that prefix. Collision is harmless extra invalidate if bakery hooks never run. |
| `PatientSessionEditorForm.tsx` | 87 | `useFinancePrices()` even when `!showFinance` | ℹ️ Info | Extra round-trip for empresa/fisio; RLS returns []. Not a data leak. |

No `TBD` / `FIXME` / `XXX` in phase-touched source. No blocker stubs.

**Confirmation-bias pass:** (1) REQ-17 acceptance 2–3 is only met under CONTEXT, not the literal two-fee text — documented, not a gap. (2) `tsc --noEmit` does not execute XOR or RLS. (3) `upsertSessionCharge` silent-return is an untested error path if a caller sets `isPaid` without amount while bypassing Zod — session editor and Completar valor both go through Zod first.

### Human Verification Required

Harvested from 05-02 and 05-05 `<human-check>` plus VALIDATION.md manual rows. SQL apply was already confirmed by the user; the matrix and browser flows were not.

### 1. SQL Editor 10-check matrix (apply already confirmed)

**Test:** With real JWTs, run RESEARCH Security Domain checks 1–10 against the hosted schema (allow autônomo A, deny empresa/fisio, snapshot immutability, prepaid month total, unpaid realizada excluded).
**Expected:** Tables `autonomo_prices` and `autonomo_session_charges` exist; `patient_sessions` has no money columns; empresa/fisio get 0 finance rows; totals match paid snapshots in America/Sao_Paulo.
**Why human:** No CLI project against hosted RLS. Verifier cannot mint JWTs.

### 2. As autonomo — drawer, catalog, totals, empty states, session XOR

**Test:** Sign in as autonomo. Open Financeiro from the drawer. Create / edit / archive a price. With empty catalog, confirm Novo preço still works and the session form still shows avulso. Mark a session paid (including an agendada) and confirm the three cards move. Completar valor / Marcar como pago on realizadas. Edit a paid session whose price was archived and save.
**Expected:** Wallet item present; totals not invented from the list; empty realizadas has no fake rows; archived id stays on the hidden input; snapshot is not rewritten as Avulso.
**Why human:** Overlay, ConfirmDialog, and visual empty states need the running app.

### 3. As empresa and fisio — no Financeiro, silent redirect, no money on the session form

**Test:** Sign in as empresa and as fisio. Check drawer and mobile bar. Open `/financeiro`. Open Nova sessão (ficha and dashboard shortcut).
**Expected:** No Financeiro in drawer; mobile still 4 items; `/financeiro` goes to `/pacientes` with no toast; no Valor da consulta / Pago.
**Why human:** Authenticated nav and Navigate are not grep-visible.

### Gaps Summary

No code gaps against the CONTEXT/ROADMAP contract. The phase goal is implemented: autonomo-only Financeiro, variable catalog, session XOR + snapshot + Pago, RPC totals, dedicated tables. Human UAT approved 2026-09-14 (`05-HUMAN-UAT.md` status: passed).

No later milestone phase claims this UAT, so nothing was deferred.

---

_Verified: 2026-09-14T19:06:28Z_
_Verifier: Claude (gsd-verifier)_
