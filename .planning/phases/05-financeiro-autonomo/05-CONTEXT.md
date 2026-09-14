# Phase 5: Financeiro do autônomo - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Só a conta **autônomo** vê Financeiro. Lá o profissional cria um **catálogo de preços** (nome + R$), aplica um preço (ou um **valor avulso**) em cada sessão, marca **Pago**, e vê arrecadação do **mês**, do **ano** e do **sempre**. Empresa e fisioterapeuta não veem a aba, não acessam `/financeiro` e não ganham campos de dinheiro na sessão. Não reutilizar a tela bakery de despesas (`FinancePage` / `canManageFinance`).

This phase **overrides** ROADMAP success criterion 2 (“dois valores fixos residência vs escritório”). The locked product is a variable price catalog + ad-hoc amount, not two location-tied fees. The existing session **Local** text field (`place`) stays clinical (sala); it is not the money model.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisito
- `.planning/REQUIREMENTS.md` — REQ-17 (acceptance 1, 4, 5 still apply; 2–3 replaced by D-02–D-07)
- `.planning/ROADMAP.md` — Phase 5 goal; honor CONTEXT over “dois valores fixos”
- `.planning/PROJECT.md` — Active REQ-17; out of scope: financeiro empresa/equipe e `FinancePage` bakery
- `.planning/phases/03-tipos-de-conta-e-equipe/03-CONTEXT.md` — `account_type`; Equipe drawer-only; RLS authority

### Conta e nav
- `src/types/account.ts` — `AccountType` includes `'autonomo'`
- `src/lib/accountAccess.ts` — add finance UX predicate here; never `src/lib/permissions.ts`
- `src/config/navigation.ts` — `clinicNavigationItems`; do not add Financeiro to `mobileNavItems`
- `src/pages/TeamPage.tsx` — pattern: `Navigate` when account type cannot access
- `src/routes/index.tsx` — register `/financeiro` inside `AppShell`; do not register bakery `FinancePage`

### Sessão (onde alocar valor)
- `src/components/patients/PatientSessionEditorForm.tsx` — shared editor (ficha Modal, dashboard shortcut, not CalendarPage’s separate create)
- `src/pages/CalendarPage.tsx` — has its own session create (`place` default “Sala 1”); planner must not invent a third money UI there unless it reuses the shared form
- `src/services/sessions.service.ts` / `src/hooks/usePatients.ts` — session CRUD; extend for snapshot + pago
- `src/types/patient.ts` / `src/schemas/patient.schema.ts` — session DTO + Zod; `place` stays optional text

### Padrões
- `src/lib/security/index.ts` — `formatCurrency`, `mapDbError`
- `src/pages/FinancePage.tsx` — bakery leftover; **do not reuse**
- `.planning/codebase/ARCHITECTURE.md` — page → hook → service → RLS; SQL Editor apply path
- `.planning/codebase/CONVENTIONS.md` — named exports, single quotes, no semicolons, hide write controls
- `.planning/codebase/STACK.md` — Zod + RHF + TanStack Query; no test runner

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientSessionEditorForm`: unique shared session create/edit body after Phase 4 — mount finance fields here for autonomo only
- `PageHeader`, `Button`, `Input`, `Select`, `Modal`, `ConfirmDialog` in `src/components/ui/`
- `toast()` in `src/stores/toast.store.ts`
- `formatCurrency` / `formatDate` in `src/lib/security/index.ts`
- `canManageTeam` + `TeamPage` Navigate — copy for finance gate

### Established Patterns
- Clinic identity is `profile.accountType`, not bakery `EmployeeRole`
- RLS + RPC authority; client predicates are UX
- SQL pasted in Supabase SQL Editor; commit a copy under `.planning/phases/05-financeiro-autonomo/sql/`
- Query keys as tuples; new domain hook file (do not add to bakery `src/hooks/queries.ts`)
- Portuguese UI; empty lists stay empty

### Integration Points
- `clinicNavigationItems(accountType)` — show Financeiro only for autonomo
- `AppRoutes` — `/financeiro` behind `ProtectedRoute` + AppShell
- Session mutations invalidate finance totals and the realizadas list
- Dashboard shortcut already mounts `PatientSessionEditorForm` — finance fields appear there automatically if added to the shared form (autonomo only)

### Creative options
- Price catalog table vs JSON on `profiles` — prefer a real table (`autonomo_prices` or similar) so archive + RLS are straightforward
- Snapshot columns on `patient_sessions` (`amount_cents` or numeric BRL, `paid_at`/`is_paid`, optional `price_id`) rather than joining live catalog for totals

</code_context>

<specifics>
## Specific Ideas

- Totais: mês corrente, ano corrente, acumulado (sempre)
- Catálogo: exemplos do tipo “Domiciliar R$180”, “Consultório R$150” — labels are user-defined
- Valor avulso: um R$ digitado na sessão quando nenhum preço do catálogo serve
- Lista no Financeiro: sessões **realizadas** para marcar pago / completar valor das que ficaram sem dinheiro

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Financeiro para empresa/equipe (rateio, comissão) remains out of scope per PROJECT.md.

</deferred>

---

*Phase: 5-financeiro-autonomo*
*Context gathered: 2026-09-14*
