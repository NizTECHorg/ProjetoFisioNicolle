# Phase 5: Financeiro do autônomo - Research

**Researched:** 2026-09-14
**Domain:** Clinic SPA finance (autônomo-only price catalog + session charge snapshot + RLS) on React + Supabase
**Confidence:** HIGH (stack, RLS leak, layers, and locked product are verified in-repo + official Postgres/Supabase docs); MEDIUM (hosted Postgres exact minor version; whether 3-arg `date_trunc` is already on the project)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Quem vê
- **D-01:** Tudo neste fase é **só `account_type === 'autonomo'`**: item de nav, rota `/financeiro`, catálogo, totais, lista, RLS, e campos de valor/pago no formulário de sessão. Empresa e fisioterapeuta não veem, `/financeiro` redireciona, e o form de sessão deles **não** mostra preço/pago.

### Catálogo de preços
- **D-02:** O autônomo cria **vários preços** (nome + valor em R$), não dois valores fixos por local.
- **D-03:** Preços **não apagam** — **arquivam**. Arquivados saem do select de novas sessões; sessões antigas continuam com o snapshot e o nome da época.
- **D-04:** Editar um preço **ativo** só vale para alocações **futuras**. Sessões já gravadas **não** recalculam (ver D-07).

### Na sessão
- **D-05:** Na sessão (ficha, atalho do dashboard, agenda — o mesmo editor), o autônomo escolhe **um preço do catálogo XOR um valor avulso**. Nunca os dois juntos.
- **D-06:** O campo **Local** existente permanece texto clínico. Dinheiro é outro contrato (preço/avulso + snapshot + pago).
- **D-07:** A sessão **guarda o R$ da época** (snapshot). Se o catálogo mudar ou arquivar, o valor já salvo na sessão não muda.

### Pago e totais
- **D-08:** Implementar status **Pago** na sessão. **Se estiver Pago, contabiliza** nos totais do Financeiro (mês / ano / sempre). Agendar pago (ex.: pré-pago) também soma.
- **D-09:** Totais vêm das sessões com valor snapshot e `pago`; **sem mock**.

### Tela `/financeiro`
- **D-10:** A tela tem: (1) CRUD do catálogo (criar / editar / arquivar), (2) três totais (mês corrente, ano corrente, acumulado), (3) **lista das sessões realizadas** para marcar pago e completar valor das antigas.

### Claude's Discretion
- **Pago no form:** visível em **Agendar e Realizada** (autônomo). Default desmarcado. A lista do Financeiro (D-10) foca realizadas; o form cobre os dois modos.
- **Nav:** item Financeiro **só no drawer**, no mesmo padrão de Equipe (Phase 3). `mobileNavItems` permanece com 4 itens.
- **Redirect:** não-autônomo em `/financeiro` → `/pacientes` (espelhar `TeamPage` + `canManageTeam`).
- **Moeda:** `formatCurrency` em `src/lib/security/index.ts` (pt-BR / BRL). Não inventar outro formatter.
- **Camadas:** page → hook (`useFinance` ou equivalente clinic, **não** `queries.ts` bakery) → service → Supabase. SQL no SQL Editor; copiar script em `.planning/phases/05-financeiro-autonomo/sql/`.
- **RLS:** catálogo e colunas financeiras da sessão só o dono autônomo lê/escreve. Empresa/fisio não veem esses dados mesmo via API.
- **UX predicates:** `canSeeFinance(accountType)` (ou nome equivalente) em `accountAccess.ts` — UX only; RLS is authority. Esconder controles; não desabilitar botões que parecem clicáveis.
- **Select vazio:** se o catálogo não tem preço ativo, o avulso continua disponível. Lista de realizadas sem valor mostra empty sem placeholder fake.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Financeiro para empresa/equipe (rateio, comissão) remains out of scope per PROJECT.md.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-17 | Só a conta autônomo vê Financeiro. Catálogo de preços (nome+R$), alocar na sessão (catálogo XOR avulso), snapshot, Pago, totais mês/ano/sempre. Persistido no Supabase com RLS. | Dedicated `autonomo_prices` + `autonomo_session_charges` tables; `canSeeFinance`; `/financeiro` like `TeamPage`; finance fields only on `PatientSessionEditorForm` when autonomo; SQL Editor script. |
| REQ-17 acceptance 1 | Item Financeiro no drawer e rota `/financeiro` só para autônomo. Empresa e fisioterapeuta não veem e `/financeiro` redireciona. | `clinicNavigationItems` + `canSeeFinance` + `AutonomoFinancePage` `Navigate` to `/pacientes`. Do **not** add to `mobileNavItems`. |
| REQ-17 acceptance 2 (ROADMAP/REQUIREMENTS wording) | ~~Dois valores fixos residência vs escritório~~ | **OVERRIDDEN by D-02–D-04.** Variable catalog, archive not delete, edit does not rewrite snapshots. |
| REQ-17 acceptance 3 (ROADMAP/REQUIREMENTS wording) | ~~Alocar o valor pelo local da sessão~~ | **OVERRIDDEN by D-05–D-07.** Catalog XOR ad-hoc; `place` stays clinical; snapshot on the charge row. |
| REQ-17 acceptance 4 | Totais mês corrente, ano corrente e acumulado, derivados das sessões com valor — sem mock. | SQL `SUM` of paid snapshots in `America/Sao_Paulo`. Include paid `agendada` (D-08). Do **not** derive totals only from the realizadas list. |
| REQ-17 acceptance 5 | Persistido no Supabase; RLS impede empresa/fisio de ler/escrever. | Separate tables + owner-only RLS. Do **not** put money columns on `patient_sessions` (empresa already `SELECT`s those rows via `private.can_read_patient`). |
</phase_requirements>

## Summary

Phase 5 adds **autônomo-only finance** to the clinic SPA. The product is **not** the ROADMAP pair of location-tied fees. The locked model is a **variable price catalog** (name + BRL, archive instead of delete), an **XOR** allocation on the session (one catalog price **or** one ad-hoc amount), a **snapshot** of the reais and label at save time, a **Pago** flag that is the only inclusion rule for totals, and a `/financeiro` screen with catalog CRUD, three live totals, and the list of **realizadas** so the professional can mark paid and fill amounts on old sessions.

There is **no application server**. The browser talks to Supabase with the anon key. `patient_sessions_select` already lets an **empresa** owner read colleague sessions (`private.can_read_patient`). Postgres RLS filters **rows**, not columns. Putting `amount` / `is_paid` on `patient_sessions` would leak money through the API even if the React form hides the fields. Honor D-01 / RLS discretion with **two new tables** (`autonomo_prices`, `autonomo_session_charges`) whose policies allow only `profiles.account_type = 'autonomo'` **and** `owner_id = auth.uid()`.

**Primary recommendation:** Ship SQL (Editor apply path) for catalog + charge tables with snapshot trigger and owner-only RLS; add `canSeeFinance`, drawer-only nav, `AutonomoFinancePage` (never bakery `FinancePage`), `useFinance` + `finance.service.ts`; extend `PatientSessionEditorForm` / `sessionFormSchema` for autonomo XOR + Pago. Leave `CalendarPage`’s separate create **without** a third money UI. Install **no** runtime packages. Totals = `SUM` in SQL of paid snapshots, including prepaid `agendada`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drawer item + `/financeiro` gate | Browser / Client | — | Filter `clinicNavigationItems`; page `Navigate` like `TeamPage`. Not authorization. |
| Hide preço/pago on session form | Browser / Client | — | `canSeeFinance(profile.accountType)` around fields. Empresa/fisio forms stay clinical. |
| Catalog CRUD (create / edit / archive) | Database / Storage | Browser / Client | Table `autonomo_prices`. UI never `DELETE`. RLS is the wall. |
| Allocate catalog XOR ad-hoc on session | Browser / Client | Database / Storage | Zod `superRefine` on the shared editor. DB CHECK + trigger enforce XOR and snapshot. |
| Snapshot integrity (D-04 / D-07) | Database / Storage | — | BEFORE trigger copies `name` + `amount_brl` from catalog when `price_id` is set. Catalog UPDATE must not cascade. |
| Pago flag | Database / Storage | Browser / Client | `is_paid` on the **charge** row. Default false. Visible on Agendar and Realizada for autonomo. |
| Totals mês / ano / sempre | Database / Storage | Browser / Client | `SUM` of paid charges joined to `patient_sessions.scheduled_at` in `America/Sao_Paulo`. Invoker RPC or filtered select. |
| Realizadas list on `/financeiro` | API / Backend (PostgREST) | Browser / Client | Sessions `status = 'realizada'` owned by the autonomo, LEFT JOIN charge. Completing value = upsert charge. |
| Authorization (who may see money) | Database / Storage | Browser / Client | RLS on finance tables. `canSeeFinance` is UX only (ASVS 4.1.1). |
| Calendar “Nova sessão” | Browser / Client | — | Existing `calendar.service.ts` create. **Do not** add a third money UI. Allocate later via shared form or finance list. |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` is **absent**. Treat these tracked sources with the same authority as locked decisions:

- **Layers:** page → hooks → services → Supabase. Pages/components do not call `supabase`. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`]
- **Clinic gating:** `src/lib/accountAccess.ts` only. Do **not** import `src/lib/permissions.ts`, `canManageFinance`, or `src/pages/FinancePage.tsx`. [VERIFIED: ARCHITECTURE.md, CONTEXT.md]
- **Hide, don’t disable** write controls that look tappable (Phase 3 D-07). [VERIFIED: CONVENTIONS.md, STATE.md]
- **SQL apply path:** hosted SQL Editor only. Do **not** `supabase db push`. Commit a copy under `.planning/phases/05-financeiro-autonomo/sql/` (`/supabase/` is gitignored). [VERIFIED: ARCHITECTURE.md, `.gitignore`]
- **Style:** single quotes, no semicolons, 2-space, `[...].join(' ')` not `clsx`, named exports only, no barrels. [VERIFIED: CONVENTIONS.md]
- **Quality gates:** `npm run lint` and `npm run typecheck`. No test runner today. [VERIFIED: `package.json`, `.planning/codebase/TESTING.md`]
- **LGPD:** empty lists stay empty (no fake rows). Finance amounts are the professional’s money, not clinical history — still minimize: clinical session selects must not embed charge columns. [VERIFIED: PROJECT.md, `listPatientSessions` column list]
- **Root `security.skill.md`:** do **not** change Supabase Auth/session storage this phase (same as Phase 4). Clinic already uses supabase-js `persistSession`. Apply: no `dangerouslySetInnerHTML`; Zod on all money inputs; RLS on new tables; `mapDbError` on permission failures.

## Standard Stack

Reuse what is already installed. **Do not add runtime packages.** Do not add `decimal.js`, `dinero.js`, `currency.js`, shadcn, or a second formatter.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 (`^19.1.0`) | UI | Existing SPA. [VERIFIED: `.planning/codebase/STACK.md`] |
| react-router-dom | 7.18.1 (`^7.6.1`) | Register `/financeiro` inside `AppShell`; `Navigate` for non-autônomo | Copy `TeamPage`. [VERIFIED: `src/routes/index.tsx`, `src/pages/TeamPage.tsx`] |
| @tanstack/react-query | 5.101.2 (`^5.76.1`) | `useFinance` query keys `['finance']`, `['finance', 'prices']`, `['finance', 'totals']`, `['finance', 'sessions']` | New domain hook file, not `queries.ts`. [VERIFIED: ARCHITECTURE.md] |
| react-hook-form + @hookform/resolvers + zod | 7.81.0 / 5.4.0 / 3.25.76 | Catalog forms + XOR on `sessionFormSchema` | Stay on Zod 3 (`superRefine` already used in `sessionFormSchema`). [VERIFIED: STACK.md, `src/schemas/patient.schema.ts`] |
| @supabase/supabase-js | 2.110.7 (`^2.49.8`) | Table CRUD + optional totals RPC | Only backend client. [VERIFIED: STACK.md] |
| lucide-react | 1.25.0 | Drawer icon `Wallet` (exported from installed package) | Do not add another icon pack. [VERIFIED: `node_modules/lucide-react` export `Wallet`] |
| zustand toast | 5.0.14 | Success/error toasts from `useFinance` | Existing `toast()`. [VERIFIED: `src/stores/toast.store.ts`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `formatCurrency` / `formatDate` | local `@/lib/security` | All BRL and date labels | Always. Pass **reais** `number`, never invent `formatBRL`. |
| `canSeeFinance` | local `accountAccess.ts` | UX hide/redirect | Always. RLS still enforces. |
| UI kit | local | `PageHeader`, `Button`, `Input`, `Select`, `Modal`, `ConfirmDialog`, `DataTable` | Catalog + `/financeiro` list. Archive uses `ConfirmDialog` (not hard delete). |
| Postgres `numeric(12,2)` | Hosted Supabase | Exact BRL amounts | Catalog + snapshot. Never `float`/`double precision`/`money`. [CITED: postgresql.org/docs/current/datatype-numeric.html] |
| Postgres RLS + CHECK + trigger | Hosted Supabase | XOR, snapshot, owner wall | All authorization and snapshot integrity. [CITED: supabase.com/docs/guides/database/postgres/column-level-security] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `autonomo_session_charges` | Money columns on `patient_sessions` + column GRANTs | Steel-man: one join, fewer tables. **Reject.** RLS cannot hide columns. Empresa `SELECT`s sessions today (`patient_sessions_select` + `can_read_patient`). Official docs recommend a dedicated table over column privileges for this case. [CITED: supabase.com/docs/guides/database/postgres/column-level-security] |
| JSON catalog on `profiles` | Real `autonomo_prices` table | Steel-man: no extra table. Weak: archive, RLS, and listing active prices become messy. CONTEXT already prefers a real table. |
| Two fixed fees (residência / escritório) | Locked out by D-02 | ROADMAP SC2/SC3 wording. Honor CONTEXT. |
| Integer cents | `numeric(12,2)` reais | Cents avoid JS float; `formatCurrency` already takes reais; bakery expenses already store reais. Prefer `numeric` in Postgres (official recommendation for money) and **SUM in SQL**, not in JS. |
| Reuse `FinancePage` / `useFinanceSummary` | New `AutonomoFinancePage` | Bakery caramel/dark, `canManageFinance(profile.role)`, expenses. Explicitly forbidden. |
| Money UI on `CalendarPage` | Reuse `PatientSessionEditorForm` | CONTEXT forbids a third money UI unless the calendar mounts the shared form. Do **not** expand Calendar this phase. Autônomo allocates later from ficha, dashboard shortcut (already shared form), or finance list. |
| Vitest in the product wave | `lint` + `typecheck` + SQL Editor matrix | TESTING.md wants Vitest. Do not block REQ-17 on the first harness. Nyquist Wave 0 lists the gap. |

**Installation:**

```bash
# None for the product feature. Do not npm install.
```

**Version verification:** Versions in the Core table are from `.planning/codebase/STACK.md` (analysis 2026-09-14) and `package.json`. No new registry packages for implementation.

## Package Legitimacy Audit

> This phase **does not install external packages** for the product feature.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | No install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`slopcheck` was not available at research time (`command -v slopcheck` failed). No `[VERIFIED]` new package names are recommended. If Wave 0 later adds Vitest for Nyquist, the planner must gate that install behind `checkpoint:human-verify` and treat the package name as `[ASSUMED]` until slopcheck + official docs are both satisfied.

## Architecture Patterns

### System Architecture Diagram

```text
  Autônomo browser                         Empresa / Fisio browser
  ----------------                         ----------------------
  Drawer: Financeiro                       Drawer: no Financeiro
  /financeiro → AutonomoFinancePage        /financeiro → Navigate /pacientes
  Session form: preço XOR avulso + Pago    Session form: Local clínico only
           │                                          │
           ▼                                          ▼
     useFinance / usePatients                    usePatients (clinical columns)
           │                                          │
           ▼                                          ▼
     finance.service.ts                         sessions.service.ts
     (prices, charges, totals)                  SELECT without charges embed
           │                                          │
           └────────────┬─────────────────────────────┘
                        ▼
              Supabase PostgREST (anon JWT)
                        │
          ┌─────────────┼──────────────────────────┐
          ▼             ▼                          ▼
   autonomo_prices   autonomo_session_charges   patient_sessions
   RLS: owner +      RLS: owner + autonomo      RLS: can_read_patient
   autonomo only     snapshot trigger            (empresa CAN read rows)
                     CHECK XOR                   NO money columns
          │             │
          └──────┬──────┘
                 ▼
        RPC or SUM: paid charges
        bucketed by scheduled_at
        AT America/Sao_Paulo
        month / year / always
```

### Recommended Project Structure

```
src/
├── types/finance.ts                 # AutonomoPrice, SessionCharge, FinanceTotals
├── schemas/finance.schema.ts        # catalog create/edit + BRL parse
├── schemas/patient.schema.ts        # extend sessionFormSchema: XOR + isPaid
├── lib/accountAccess.ts             # canSeeFinance
├── config/navigation.ts             # Financeiro drawer item; not mobileNavItems
├── services/finance.service.ts      # prices + charges + totals (map snake_case)
├── hooks/useFinance.ts              # query keys ['finance', …]
├── pages/AutonomoFinancePage.tsx    # NEVER import FinancePage.tsx
├── routes/index.tsx                 # /financeiro
└── components/patients/PatientSessionEditorForm.tsx  # finance fields if canSeeFinance

.planning/phases/05-financeiro-autonomo/sql/
└── 05-autonomo-finance.sql          # committed copy; apply in SQL Editor
```

Do **not** add finance types to `src/types/database.types.ts`. Do **not** add hooks to `src/hooks/queries.ts`.

### Pattern 1: Dedicated finance tables (not session columns)

**What:** `autonomo_prices` (catalog) and `autonomo_session_charges` (1:1 with a session, snapshot + pago).
**When to use:** Always for this phase. This is how D-01 “even via API” is physically true while empresa can still read clinical sessions.
**Example:**

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/column-level-security
-- Dedicated table + RLS instead of column privileges.

create table if not exists public.autonomo_prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  amount_brl numeric(12, 2) not null check (amount_brl > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.autonomo_session_charges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  session_id uuid not null unique references public.patient_sessions (id) on delete cascade,
  price_id uuid references public.autonomo_prices (id),
  price_name text not null,
  amount_brl numeric(12, 2) not null check (amount_brl > 0),
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint autonomo_session_charges_xor
    check (
      (price_id is not null)
      or (price_id is null and price_name = 'Avulso')
    )
);
```

No charge row means “sessão sem valor” (D-10 completar depois). Do not store a zero row to mean empty.

### Pattern 2: Snapshot trigger (catalog edit must not rewrite history)

**What:** BEFORE INSERT OR UPDATE on charges: if `price_id` is set, copy live `name` and `amount_brl` from that catalog row into the charge. Reject archived `price_id` when the allocation is new or the `price_id` **changes**. If `price_id` is null, require client `amount_brl` and set `price_name = 'Avulso'`.
**When to use:** Every write to `autonomo_session_charges`.
**Why:** Client could otherwise POST a catalog id with a tampered amount. D-07 requires the stored reais to be the epoch value; the trigger is the authority, not the SPA.

Catalog UPDATE/archive never `UPDATE autonomo_session_charges`. No `ON UPDATE CASCADE` of amount.

### Pattern 3: UX predicate copy of Equipe

**What:** `canSeeFinance` next to `canManageTeam`. Nav filter + page `Navigate`.
**When to use:** Drawer, route, session form fields.
**Example:**

```typescript
// Source: src/lib/accountAccess.ts (canManageTeam) + src/pages/TeamPage.tsx

/** Financeiro só para conta Autônomo. Empresa e fisio não veem (D-01). UX only. */
export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}

export function clinicNavigationItems(accountType: AccountType | null | undefined): NavigationItem[] {
  return navigationItems.filter((item) => {
    if (item.path === '/equipe') return accountType === 'empresa'
    if (item.path === '/financeiro') return accountType === 'autonomo'
    return true
  })
}
```

### Pattern 4: XOR on the shared session editor

**What:** Extend `sessionFormSchema` with optional `priceId`, `adHocAmount`, `isPaid`. `superRefine`: if both catalog and ad-hoc are filled, error. Neither is allowed (allocation optional). `isPaid` default `false`. Fields rendered only when `canSeeFinance`.
**When to use:** `PatientSessionEditorForm` (ficha Modal **and** dashboard shortcut). That is the unique shared body after Phase 4.

CalendarPage keeps its own create (`place` default “Sala 1”) **without** money fields.

### Anti-Patterns to Avoid

- **Money columns on `patient_sessions`:** Empresa SELECT policy already matches `can_read_patient`. RLS will not redact `amount_brl`. [CITED: supabase.com/docs/guides/database/postgres/column-level-security]
- **Reusing `FinancePage` / `canManageFinance` / `useExpenses`:** Bakery RBAC on `profiles.role`, caramel/dark, despesas. Forbidden by CONTEXT and PROJECT.md.
- **Tying money to `place`:** D-06. Local stays clinical text.
- **DELETE catalog rows:** D-03. Archive (`archived_at`). FK stays so history can still name the price; snapshot columns remain even if the UI never joins.
- **Recalculating old charges when the catalog changes:** D-04 / D-07.
- **Summing totals only from the realizadas list:** D-08 prepaid `agendada` + `is_paid` must count. The D-10 list is a different query.
- **Adding Financeiro to `mobileNavItems`:** Locked drawer-only, 4 bottom items.
- **`select *` on clinical sessions after a future column add:** Keep explicit clinical column lists in `sessions.service.ts` / `calendar.service.ts`.
- **JS `number` SUM of many reais:** Totals live in SQL `numeric`. Display with `formatCurrency(Number(total))` after mapping.
- **`type="number"` for BRL:** Locale (`180,50`) breaks. Use text + parse helper.
- **Disabled “Pago” that still looks tappable** for empresa: hide the block entirely.
- **`supabase db push` / Supabase CLI:** Not installed. SQL Editor only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| pt-BR currency display | Custom `R$` string concat | `formatCurrency` | Locale, separators, existing helper. |
| Exact money storage | `float` / JS cents class | Postgres `numeric(12,2)` | Official monetary type. [CITED: postgresql.org/docs/current/datatype-numeric.html] |
| Month/year buckets in Brazil | Client `getMonth()` on UTC ISO | `date_trunc(..., 'America/Sao_Paulo')` or `AT TIME ZONE` | 21:00 BRT 30 Sep is 00:00 UTC 1 Oct. [CITED: postgresql.org/docs/current/functions-datetime.html] |
| Hide money from empresa | Client omit columns | Separate table + RLS | API bypass. |
| XOR catalog vs avulso | Informal UI-only toggle | Zod `superRefine` + CHECK + trigger | Client can send both. |
| Archive confirmation | `window.confirm` | `ConfirmDialog` | Existing clinic pattern (`TeamPage` reject). |
| Permission error copy | Raw Postgres | `mapDbError` | `42501` → “Você não tem permissão…”. |
| Decimal library | `decimal.js` / `dinero.js` | SQL SUM + `formatCurrency` | No new packages; scale is 2. |

**Key insight:** The hard part is **not** the React page. It is keeping money **off** the clinical session row so Phase 3 empresa-read RLS does not become a finance leak, while still snapshotting BRL so catalog edits cannot rewrite history.

## Common Pitfalls

### Pitfall 1: Putting amount/pago on `patient_sessions`

**What goes wrong:** Empresa opens a colleague ficha or guesses PostgREST `select=amount_brl` and reads the autônomo’s prices and paid flags.
**Why it happens:** `patient_sessions_select` uses `private.can_read_patient` (creator **or** org owner). RLS is row-level. [VERIFIED: `03-account-types-team.sql` lines 206–240, 611–615] [CITED: supabase.com/docs/guides/database/postgres/column-level-security]
**How to avoid:** New tables with `owner_id = auth.uid()` and `account_type = 'autonomo'`. Clinical services never embed those tables.
**Warning signs:** Any migration `alter table patient_sessions add column amount`.

### Pitfall 2: Totals from the D-10 list only

**What goes wrong:** Prepaid `agendada` + Pago is missing from mês/ano/sempre.
**Why it happens:** D-10 list is realizadas; D-08 explicitly counts paid scheduled sessions.
**How to avoid:** Totals query = all charges where `is_paid` and `amount_brl > 0`, bucketed by `patient_sessions.scheduled_at`. Independent of status.
**Warning signs:** `getFinanceTotals` maps the same array as `listRealizadas`.

### Pitfall 3: Snapshot taken from live catalog at read time

**What goes wrong:** Editing “Domiciliar” from 180 to 200 silently changes last month’s total.
**Why it happens:** `JOIN autonomo_prices` for display/totals instead of charge snapshot columns.
**How to avoid:** Totals and list labels use `autonomo_session_charges.amount_brl` and `price_name`. Trigger copies at write. Catalog UPDATE does not touch charges.
**Warning signs:** Totals SQL joins `autonomo_prices.amount_brl`.

### Pitfall 4: UTC month boundaries

**What goes wrong:** A sessão at 21:00 in São Paulo on the last day of the month lands in next month’s total.
**Why it happens:** `date_trunc('month', scheduled_at)` uses session TimeZone (often UTC on Supabase).
**How to avoid:** `date_trunc('month', scheduled_at, 'America/Sao_Paulo')` (PG 15 3-arg) **or** `(scheduled_at AT TIME ZONE 'America/Sao_Paulo')`. Verify in SQL Editor after apply.
**Warning signs:** Totals disagree with the listed dates on `/financeiro`.

### Pitfall 5: XOR only in the UI

**What goes wrong:** A crafted insert sets both `price_id` and a different ad-hoc amount.
**Why it happens:** Hidden fields are not a control.
**How to avoid:** CHECK + trigger overwrite amount from catalog when `price_id` is present. Zod is UX.
**Warning signs:** Service trusts `input.amount` whenever `priceId` is set.

### Pitfall 6: Hard-deleting prices

**What goes wrong:** FK failure or lost “nome da época”.
**Why it happens:** CRUD muscle memory.
**How to avoid:** `archived_at = now()`. Select for new sessions: `archived_at is null`. No `DELETE` policy for the autônomo (or policy exists but UI never calls it — prefer **no DELETE policy** so API cannot delete).
**Warning signs:** `supabase.from('autonomo_prices').delete()`.

### Pitfall 7: Financeiro on the bottom bar

**What goes wrong:** Breaks Equipe pattern and 4-item mobile nav.
**Why it happens:** Copying `navigationItems` into `mobileNavItems`.
**How to avoid:** Add the item only to `navigationItems`; filter like Equipe.
**Warning signs:** `mobileNavItems.length !== 4`.

### Pitfall 8: Invalidating only `['patients', id, 'sessions']`

**What goes wrong:** `/financeiro` totals stay stale after saving Pago on the ficha.
**Why it happens:** `invalidatePatient` does not know finance keys.
**How to avoid:** Also `invalidateQueries({ queryKey: ['finance'] })` from session mutations **and** finance mutations. Family prefix, not exact key. [VERIFIED: `usePatients.ts` `invalidatePatient`]

### Pitfall 9: `formatCurrency` on string numeric without `Number()`

**What goes wrong:** `Intl` formats incorrectly or throws if PostgREST ever returns numeric as string; large numerics can lose precision as JSON numbers.
**Why it happens:** Postgres `numeric` is exact; JSON numbers are IEEE floats. [CITED: github.com/PostgREST/postgrest/issues/2586 — PostgREST currently emits JSON numbers; precision is a known issue for huge numerics. Clinic amounts `numeric(12,2)` fit in JS number safely.]
**How to avoid:** Map `amount_brl` with `Number(...)` in the service. Do not SUM in JS. `formatCurrency` argument is `number` reais. [VERIFIED: `src/lib/security/index.ts` `formatCurrency`]

### Pitfall 10: Applying SQL only under gitignored `/supabase/`

**What goes wrong:** Planner/executor think schema is in git; hosted DB never updated.
**Why it happens:** Root `supabase/` is gitignored. [VERIFIED: `.gitignore`]
**How to avoid:** Human paste in SQL Editor. Commit `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql`. Idempotent `drop policy if exists` / `create table if not exists`. End with optional `notify pgrst, 'reload schema';`.

## Code Examples

Verified patterns from this repo and official docs:

### canSeeFinance + redirect (copy TeamPage)

```typescript
// Source: src/pages/TeamPage.tsx lines 31–33 + src/lib/accountAccess.ts

export function AutonomoFinancePage() {
  const { profile } = useAuth()
  if (!canSeeFinance(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }
  // …
}
```

### Session XOR (Zod 3 superRefine)

```typescript
// Source: src/schemas/patient.schema.ts existing superRefine style
// Catalog XOR ad-hoc; neither allowed (D-10 complete later).

sessionFormSchema.superRefine((data, ctx) => {
  const hasCatalog = Boolean(data.priceId)
  const hasAdHoc = data.adHocAmount.trim() !== ''
  if (hasCatalog && hasAdHoc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Escolha um preço do catálogo ou um valor avulso, não os dois.',
      path: ['adHocAmount'],
    })
  }
})
```

### Parse BRL text (no new library)

```typescript
// Source: discretion — local helper in finance.schema.ts
// Accepts "180", "180,50", "180.50". Rejects empty when the field is required.

export function parseBrlInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '').replace('R$', '')
  if (!trimmed) return null
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}
```

### Totals in SQL (paid snapshot, Brazil calendar)

```sql
-- Source: https://www.postgresql.org/docs/current/functions-datetime.html
-- date_trunc(text, timestamptz, text) → timestamptz (PG 15)

create or replace function public.autonomo_finance_totals()
returns table (month_total numeric, year_total numeric, always_total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(c.amount_brl) filter (
      where c.is_paid
        and date_trunc('month', s.scheduled_at, 'America/Sao_Paulo')
          = date_trunc('month', now(), 'America/Sao_Paulo')
    ), 0),
    coalesce(sum(c.amount_brl) filter (
      where c.is_paid
        and date_trunc('year', s.scheduled_at, 'America/Sao_Paulo')
          = date_trunc('year', now(), 'America/Sao_Paulo')
    ), 0),
    coalesce(sum(c.amount_brl) filter (where c.is_paid), 0)
  from public.autonomo_session_charges c
  join public.patient_sessions s on s.id = c.session_id;
$$;
```

Use **`security invoker`** so RLS on charges still applies. Do **not** `security definer` this RPC (would skip the owner wall unless the body re-checks `auth.uid()`).

### RLS owner + autonomo (catalog)

```sql
-- Source: 03-account-types-team.sql policy shape (auth.uid() subquery)

alter table public.autonomo_prices enable row level security;
alter table public.autonomo_prices force row level security;

create policy autonomo_prices_all
  on public.autonomo_prices
  for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );
```

Prefer **no DELETE policy** (or `for all` minus delete via separate commands): archive is an UPDATE. Grant `select, insert, update` only.

Charges: same owner/autonomo checks **plus** `with check` that the session’s patient is writable by the autônomo (`private.can_write_patient`). Empresa consulting a colleague cannot insert a charge even if they spoof `session_id`.

### Invalidate finance from session writes

```typescript
// Source: src/hooks/usePatients.ts invalidatePatient — extend family

function invalidatePatient(qc: QueryClient, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
  void qc.invalidateQueries({ queryKey: ['finance'] })
}
```

### Native Pago checkbox (clinic tokens, not bakery caramel)

```tsx
// Source: bakery uses accent-caramel on leftover pages — do not copy that class.
// No clinic Checkbox primitive exists. Use a labeled native checkbox.

<label className="flex items-center gap-2 text-sm text-ink">
  <input
    type="checkbox"
    className="accent-forest"
    {...form.register('isPaid')}
  />
  Pago
</label>
```

Hide this entire label when `!canSeeFinance`. Default `isPaid: false`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| REQ-17 / ROADMAP: two fixed fees residência vs escritório, allocated by `place` | Variable catalog + XOR ad-hoc + snapshot + Pago | CONTEXT 2026-09-14 | Planner must **not** implement SC2/SC3 as written on ROADMAP.md |
| Column GRANTs to hide fields on a shared table | Dedicated table + RLS (Supabase official recommendation for most users) | Current Supabase CLS docs | Do not put money on `patient_sessions` |
| Postgres `money` type | `numeric` for monetary amounts | Long-standing PG docs | Avoid `money` (lc_monetary, limited ops) |
| Bakery `FinancePage` + `canManageFinance` | Clinic `AutonomoFinancePage` + `canSeeFinance` | Phase 3 account types | Identity is `accountType`, not `EmployeeRole` |

**Deprecated/outdated:**
- ROADMAP Phase 5 success criteria 2 and 3 (“dois valores fixos”, “valor correspondente ao local”): honor CONTEXT.
- Postgres `money` type for this schema.
- Column-level privileges as the first choice (Supabase: advanced, breaks `select *`, same JWT role `authenticated` cannot see a column as autonomo and hide it from empresa).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hosted DB supports `date_trunc(text, timestamptz, text)` (PG 15). Fallback: `AT TIME ZONE 'America/Sao_Paulo'`. | Totals SQL | Apply fails; use fallback in the same script. |
| A2 | Calendar create stays without money this phase (allocate later). | CalendarPage | Autônomo might expect Pago when scheduling from Agenda. CONTEXT says do not invent a third UI unless the shared form is reused — planner should **not** expand Calendar. |
| A3 | Unarchive is out of scope; professional creates a new price. | Catalog | User cannot revive a name; low product risk. |
| A4 | Duplicate catalog names allowed. | Catalog | Two “Domiciliar” rows possible. |
| A5 | Allocation is optional (no charge row until filled). | XOR | Matches D-10 “completar valor das antigas”. |
| A6 | Charge `price_name` for ad-hoc is the literal `'Avulso'`. | Snapshot | Display copy; can be changed if product wants a blank label. |
| A7 | Totals timezone is `America/Sao_Paulo` (clinic is Brazil; UI is pt-BR). | Totals | If the professional is abroad, month buckets follow Brazil. Not discussed in CONTEXT. |
| A8 | No DELETE policy on `autonomo_prices`. | RLS | Safer than UI-only archive. |

**If this table is used in discuss-phase:** A2, A3, and A7 are the only product-facing assumptions. A1 is technical with a fallback.

## Open Questions (RESOLVED)

1. **RESOLVED: Calendar deferral** — Should Agenda’s separate create mount `PatientSessionEditorForm` so money appears there too?
   - What we know: D-05 says “ficha, atalho do dashboard, agenda — o mesmo editor”. Canonical refs say CalendarPage has its own create and the planner must not invent a **third** money UI unless it reuses the shared form.
   - What's unclear: Is “reuse the shared form on Calendar” in this phase or later?
   - Recommendation: **Do not** refactor Calendar this phase. Document that Agenda-created sessions get money from ficha edit or `/financeiro` list. If the planner includes Calendar, the **only** allowed path is replacing that form with `PatientSessionEditorForm`, not a second XOR widget.

2. **RESOLVED: no unarchive** — Unarchive?
   - What we know: D-03 archive, not delete. No mention of restore.
   - Recommendation: omit unarchive. New price with the same name is allowed (A4).

3. **RESOLVED: Pago requires amount** — Pago without amount
   - What we know: D-08 counts sessions with snapshot **and** pago.
   - Recommendation: cannot persist `is_paid` without a charge row. UI: if they check Pago with neither catalog nor avulso, Zod error “Informe um valor para marcar como pago”.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | lint / typecheck / dev | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| Vite dev server | UAT | ✓ | (project script `npm run dev`) | — |
| Supabase SQL Editor | Schema apply | ✓ (process, not CLI) | Hosted | **Only** apply path |
| supabase CLI | `db push` | ✗ | — | Do not use. Paste SQL. |
| ctx7 | Library docs | ✗ | — | Official URLs via WebFetch |
| slopcheck | Package gate | ✗ | — | No new packages |
| Vitest | Nyquist unit tests | ✗ | — | Wave 0 gap; do not block product |
| Knowledge graph | Cross-doc query | ✗ | graphify disabled | Codebase grep used instead |

**Missing dependencies with no fallback:**
- None for product execution **if** the human applies SQL in the Editor (same as Phase 3).

**Missing dependencies with fallback:**
- Vitest — Validation Architecture Wave 0; product ships with `lint` + `typecheck` + SQL allow/deny matrix + manual UAT.
- 3-arg `date_trunc` — fallback `AT TIME ZONE` in the same script if Editor errors.

**Step 1.3 graph:** `.planning/graphs/graph.json` absent; `gsd-tools graphify status` → `"disabled": true`. No graph context injected.

## Validation Architecture

> `workflow.nyquist_validation` is **absent** in `.planning/config.json` → treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed. Quality gates: ESLint 9 + `tsc --noEmit`. Intended unit runner when added: Vitest (TESTING.md). |
| Config file | none — see Wave 0 |
| Quick run command | `npm run lint` && `npm run typecheck` |
| Full suite command | Same, plus SQL Editor allow/deny checklist in VERIFICATION.md |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-17.1 | `canSeeFinance` true only for `'autonomo'` | unit | `npx vitest run src/lib/accountAccess.test.ts` (after Wave 0) | ❌ Wave 0 |
| REQ-17.1 | `clinicNavigationItems` includes `/financeiro` only for autonomo; Equipe still empresa-only; `mobileNavItems.length === 4` | unit | `npx vitest run src/config/navigation.test.ts` | ❌ Wave 0 |
| REQ-17.1 | Non-autônomo hitting `/financeiro` redirects to `/pacientes` | manual-only | UAT with empresa + fisio sessions | ❌ no Playwright |
| REQ-17 D-02 | Catalog schema: name + positive BRL; archive is update not delete | unit | `npx vitest run src/schemas/finance.schema.test.ts` | ❌ Wave 0 |
| REQ-17 D-05 | Session XOR: both catalog+avulso fail; neither ok; one ok | unit | `npx vitest run src/schemas/patient.schema.test.ts` | ❌ Wave 0 |
| REQ-17 D-08 | Pago without amount fails parse | unit | same schema file | ❌ Wave 0 |
| REQ-17.4 | Pure helper documenting totals rule (paid + snapshot; ignore status) | unit | `npx vitest run src/lib/financeTotals.test.ts` if a tiny mapper is extracted; otherwise SQL-only | ❌ Wave 0 |
| REQ-17.4 | Totals month/year/always from DB | manual-only | SQL Editor: insert paid agendada in current month; assert RPC | ❌ not automatable without DB |
| REQ-17.5 | Empresa/fisio cannot SELECT/INSERT finance tables | manual-only | SQL Editor JWT matrix (copy Phase 3 checklist style) | ❌ SQL Editor |
| REQ-17 D-06 | `place` still optional text; no location fee enum | unit | existing `sessionFormSchema` still accepts `place` without money | ❌ Wave 0 |
| REQ-17 UI | Empty active catalog: avulso still shown; empty realizadas list has no fake rows | manual-only | Browser UAT | ❌ |

Manual-only justification: no Playwright; RLS cannot be mocked meaningfully (TESTING.md: “Do not mock RLS”).

### Sampling Rate

- **Per task commit:** `npm run lint` and `npm run typecheck`
- **Per wave merge:** same + SQL Editor smoke if the wave touched `.sql`
- **Phase gate:** lint + typecheck green; SQL checklist in VERIFICATION.md; browser UAT of `/financeiro` as autonomo and redirect as empresa; session form hide/show by account type (ficha + dashboard shortcut)

### Wave 0 Gaps

- [ ] No Vitest config / `src/**/*.test.ts` — first unit files should be `accountAccess.test.ts` (add `canSeeFinance`), `navigation.test.ts`, `patient.schema.test.ts` (XOR), `finance.schema.test.ts`
- [ ] Framework install: only if Nyquist executor is ordered to add tests this phase — `vitest` from https://vitest.dev (do **not** add Jest). Gate with `checkpoint:human-verify` because slopcheck was unavailable
- [ ] Shared fixtures: none required beyond inline objects (TESTING.md)
- [ ] SQL allow/deny appendix in the plan’s verification, not in Vitest

If the planner does **not** introduce Vitest, Nyquist VALIDATION.md should mark schema/predicate rows as **Wave 0 deferred** and keep `npm run typecheck` as the automated command. Product plans must not wait on the harness.

## Security Domain

> `security_enforcement` is absent in project config → enabled. Root `security.skill.md` cookie/MFA rules are **not** in scope (do not restub supabase-js session).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (no change) | Existing supabase-js PKCE + `persistSession` |
| V3 Session Management | no (no change) | Existing `AuthProvider` |
| V4 Access Control | yes | RLS on `autonomo_prices` / `autonomo_session_charges`; UX `canSeeFinance`; `Navigate` is not a control |
| V5 Input Validation | yes | Zod catalog + XOR + `parseBrlInput`; CHECK `amount_brl > 0`; trigger snapshot |
| V6 Cryptography | no | No new crypto. Never hand-roll money hashing |

### Known Threat Patterns for clinic finance (Supabase SPA)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Empresa reads colleague session money | Information disclosure | Money **not** on `patient_sessions`; finance tables owner+autonomo RLS |
| Fisio/empresa POST a charge | Elevation of privilege | `with check` account_type + owner_id + `can_write_patient` |
| Client sends catalog id + fake amount | Tampering | BEFORE trigger overwrites amount/name from catalog |
| Client allocates archived price | Tampering | Trigger rejects archived `price_id` on new/changed allocation |
| Client sends catalog **and** avulso | Tampering | CHECK XOR + Zod |
| Catalog DELETE removes history | Tampering / DoS of history | No DELETE policy; archive only |
| Catalog UPDATE rewrites old totals | Tampering | Snapshot columns; no cascade |
| Direct PostgREST to finance tables as empresa | Information disclosure | RLS default deny; empty result, not an error on SELECT |
| Open redirect on future “ver sessão” links | Spoofing | `safeRedirectPath` if any href is added; not required for v1 |
| XSS in price name | Tampering | React text nodes; `sanitizeText` on write in the service |
| Fake placeholder patients/amounts | LGPD / integrity | Empty lists stay empty |

**SQL Editor allow/deny matrix (planner must copy into verification):**

1. Autônomo A: INSERT/SELECT/UPDATE own prices; archive; INSERT charge on own session.
2. Autônomo A: cannot UPDATE `owner_id` to B.
3. Autônomo A: INSERT charge with `price_id` + different `amount_brl` → stored amount equals catalog (trigger).
4. Autônomo A: change catalog amount → existing charge unchanged.
5. Empresa E: SELECT `autonomo_prices` / `autonomo_session_charges` → 0 rows; INSERT → 42501 / mapped permission.
6. Empresa E: SELECT `patient_sessions` of therapist still works; payload has **no** money fields.
7. Fisio: same deny as empresa on finance tables.
8. Autônomo A: `autonomo_finance_totals()` returns only A’s paid snapshots.
9. Paid `agendada` in current Brazil month increments month_total.
10. Unpaid realizada does **not** increment totals.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/05-financeiro-autonomo/05-CONTEXT.md` — locked D-01–D-10 (overrides ROADMAP SC2/SC3)
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` — `can_read_patient`, `patient_sessions_select`, SQL Editor apply notes
- `src/pages/TeamPage.tsx`, `src/lib/accountAccess.ts`, `src/config/navigation.ts`, `src/routes/index.tsx`
- `src/components/patients/PatientSessionEditorForm.tsx`, `src/services/sessions.service.ts`, `src/hooks/usePatients.ts`
- `src/pages/CalendarPage.tsx` — separate create, `place` default “Sala 1”
- `src/pages/FinancePage.tsx` + `src/lib/permissions.ts` `canManageFinance` — **do not reuse**
- `src/lib/security/index.ts` — `formatCurrency`, `mapDbError`
- https://supabase.com/docs/guides/database/postgres/column-level-security — RLS ≠ columns; prefer dedicated table
- https://www.postgresql.org/docs/current/datatype-numeric.html — `numeric` for money; do not use float
- https://www.postgresql.org/docs/current/functions-datetime.html — `date_trunc` with time zone
- `.planning/codebase/{ARCHITECTURE,CONVENTIONS,STACK,TESTING}.md` — layers, no test runner, SQL Editor

### Secondary (MEDIUM confidence)

- PostgREST numeric-as-JSON-number precision discussion (github.com/PostgREST/postgrest/issues/2586) — clinic `numeric(12,2)` still safe as JS number; still SUM in SQL
- Crunchy Data “Working with Money in Postgres” — `numeric` vs integer cents (steel-man for cents; rejected to match `formatCurrency` reais)

### Tertiary (LOW confidence)

- Whether hosted Supabase TimeZone is UTC (typical; treat as yes and always pass `America/Sao_Paulo`)
- Exact hosted Postgres minor version for 3-arg `date_trunc` (A1; fallback documented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse installed clinic stack; no new runtime libraries
- Architecture: HIGH — dedicated tables required by official RLS/column docs + live `can_read_patient` SELECT on sessions
- Pitfalls: HIGH — leak via session columns, UTC buckets, totals vs realizadas list, bakery FinancePage are all evidenced

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (stack stable; re-check only if Zod 4 or Supabase CLS guidance changes)

**Graph:** skipped (graphify disabled; no `graph.json`)
