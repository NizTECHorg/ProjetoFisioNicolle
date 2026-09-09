---
phase: 03-tipos-de-conta-e-equipe
verified: 2026-09-09T21:05:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "SQL Editor — confirmar schema live e casos allow/deny"
    expected: "profiles.account_type, organizations e organization_memberships existem; anon não SELECT organizations; JWT pending não SELECT patients; fisio B não lê paciente de A; empresa SELECT (não UPDATE) paciente de A com membership therapist/active"
    why_human: "Não há CLI/projeto de teste; RLS só prova no Dashboard com JWTs reais"
  - test: "Cadastro no browser — os três tipos"
    expected: "Submit sem tipo falha; fisio exige código 8 chars e lookup RPC; empresa/autônomo criam conta; fisio válido fica pendente"
    why_human: "Fluxo Auth + trigger handle_new_user + e-mail de confirmação não dá para exercitar só com grep"
  - test: "Empresa em /equipe — código, copiar, aceitar/recusar"
    expected: "Código visível e copiável; Aceitar pedido ativa o fisio; Recusar pedido pede confirmação e cancela a conta"
    why_human: "Clipboard, toasts e fila ao vivo dependem de contas reais"
  - test: "Autônomo e fisio sem gestão de equipe"
    expected: "Item Equipe ausente no drawer; /equipe redireciona para /pacientes"
    why_human: "Visibilidade de nav e redirect são UX; grep não vê a sessão autenticada"
  - test: "Fisio pendente/recusado e consulta da empresa na ficha"
    expected: "Pendente autentica mas cai em /aguardando, sem clínica. Recusado vê Pedido recusado. Empresa vê Ficha de {nome} e banner Somente consulta, sem editar; Novo paciente da empresa ainda escreve; autônomo sem linha Ficha de"
    why_human: "Máquina de auth + RLS + UI de consulta só se confirmam com três contas no app"
---

# Phase 3: Tipos de conta e equipe Verification Report

**Phase Goal:** Na criação da conta, a pessoa escolhe se é autônomo, empresa ou fisioterapeuta que trabalha em empresa. A conta empresa pode alocar mais funcionários (fisioterapeutas).
**Verified:** 2026-09-09T21:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

Goal-backward from ROADMAP success criteria + PLAN must_haves. SUMMARY.md was not treated as evidence.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | O cadastro exige escolher um tipo: autônomo, empresa ou fisioterapeuta | ✓ VERIFIED | `registerSchema.accountType` is `z.enum(['autonomo','empresa','fisioterapeuta'])`. `RegisterPage` Select has those three options plus empty "Selecione o tipo"; empty string is not in the enum so submit without a choice fails. Not bakery `administrador`/`confeiteiro`. |
| 2 | Empresa consegue adicionar/alocar fisioterapeutas na equipe | ✓ VERIFIED | `/equipe` (`TeamPage`) shows copyable `joinCode`, pending Aceitar/Recusar, active list. Writes go through `useDecideMembership` → `decideMembership` RPC. Nav Equipe only when `accountType === 'empresa'`. |
| 3 | Fisioterapeuta de empresa entra no contexto da empresa (não cria clínica própria nesta fase) | ✓ VERIFIED | `handle_new_user` creates `organizations` only for `empresa`. Fisio + valid `join_code` inserts `therapist`/`pending` membership. After accept, fisio is `isAuthenticated` without Equipe (`canManageTeam` is empresa-only). |
| 4 | Autônomo opera sozinho, sem tela de equipe | ✓ VERIFIED | Autônomo path in `handle_new_user` is profile only. `clinicNavigationItems` drops `/equipe` unless empresa. `TeamPage` `Navigate`s to `/pacientes` when `!canManageTeam`. Mobile bar has no Equipe. |
| 5 | Tipos e vínculos persistem no Supabase (REQ-15.5) | ✓ VERIFIED | `signUpWithEmail` writes `account_type` and `join_code` into Auth metadata. SQL creates `profiles.account_type`, `organizations`, `organization_memberships`, `lookup_organization_by_code`, `decide_membership`, and replaces `handle_new_user` reading `raw_user_meta_data`. Editor copy matches (744 lines). Live allow/deny still needs human (below). |
| 6 | Fisio pending autentica mas não é `isAuthenticated` e não abre a clínica; fetch de membership falho fica em /aguardando | ✓ VERIFIED | `isAuthenticated` requires active profile, not `isPendingTherapist`, and not (`fisioterapeuta` && `membership === null`). `ProtectedRoute`/`GuestRoute`/`WaitingApprovalPage` use `shouldAwaitApproval`. `fetchMembership` throw is caught to `null` (fail-closed). |
| 7 | Recusa cancela a conta sem apagar `auth.users`; UI mostra Pedido recusado | ✓ VERIFIED | `decide_membership` sets membership `rejected` and `profiles.is_active = false`. SQL has no `delete from auth.users`. `TeamPage` confirm then RPC. `isRejectedAccount` → `AccountRejected` ("Pedido recusado"). `signInWithEmail` signs out rejected and throws. |
| 8 | Só quem cadastrou edita a ficha; empresa consulta ficha de colega (D-05/D-06/D-07) | ✓ VERIFIED | SQL `can_write_patient` = creator and not pending/rejected; `can_read_patient` = creator or empresa owner of an active therapist. `canWritePatient(user.id, createdBy)` on `PatientPage`; consult banner; `Ficha de {nome}` on `PatientsPage` for empresa teammate rows. Panels receive `canWrite`. `Novo paciente` stays on the list for empresa. |
| 9 | GuestRoute não manda pending/rejected para `/painel` | ✓ VERIFIED | GuestRoute clinic redirect only if `isAuthenticated`. Pending → `/aguardando`. Rejected/inactive → `InactiveSessionCard`. Login still `navigate(from)` (default `/painel`); `ProtectedRoute` then sends pending to `/aguardando` before `<Outlet />`. |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/types/account.ts` | Account unions, labels, ClinicProfile | ✓ VERIFIED | 70 lines. Exports `AccountType`, `MembershipStatus`, `ClinicProfile`, `accountTypeLabels`. Not `EmployeeRole`. |
| `src/lib/accountAccess.ts` | UX predicates | ✓ VERIFIED | `canManageTeam`, `canWritePatient`, `normalizeJoinCode`, `isPendingTherapist`, `isRejectedAccount`. Wired from TeamPage, PatientPage, AuthProvider, ProtectedRoute, schema. |
| `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` | Idempotent org/RLS/RPC | ✓ VERIFIED | 744 lines. `private.can_read_patient`, `handle_new_user`, `decide_membership`, child-table policies. |
| `supabase/03-account-types-team.sql` | SQL Editor paste copy | ✓ VERIFIED | Same line count as committed copy. |
| `src/schemas/auth.schema.ts` | accountType + joinCode | ✓ VERIFIED | Enum + `superRefine` length 8 for fisio. |
| `src/services/team.service.ts` | lookup, membership, org, list, decide | ✓ VERIFIED | All four exports used. RPC names match SQL. |
| `src/pages/auth/RegisterPage.tsx` | Tipo de conta + código | ✓ VERIFIED | Select + conditional Código; calls `lookupOrganizationByCode` before `signUpWithEmail`. |
| `src/pages/auth/WaitingApprovalPage.tsx` | `/aguardando` card | ✓ VERIFIED | 48 lines. Fail-closed copy when membership is null. |
| `src/hooks/useAuth.ts` | membership on context | ✓ VERIFIED | `membership: Membership \| null` on `AuthContextValue`. |
| `src/components/auth/ProtectedRoute.tsx` | pending/rejected gates | ✓ VERIFIED | Contains `/aguardando` and `isPendingTherapist`. |
| `src/pages/TeamPage.tsx` | `/equipe` UI | ✓ VERIFIED | 247 lines. Code, pending, active, confirm reject. |
| `src/hooks/useTeam.ts` | `['team']` + decide | ✓ VERIFIED | `useTeam`, `useDecideMembership`. `useMembership` exported but unused (INFO). |
| `src/config/navigation.ts` | Equipe + filter | ✓ VERIFIED | `/equipe` in `navigationItems`; `clinicNavigationItems` filters. |
| `src/types/patient.ts` | createdBy on list/detail | ✓ VERIFIED | `PatientListItem`, `Patient`, `PatientDashboard`. |
| `src/services/patients.service.ts` | stamp + select `created_by` | ✓ VERIFIED | Insert payload `created_by: user.id`; LIST/DETAIL/DASHBOARD columns; name resolve. |
| `src/pages/PatientPage.tsx` | banner + canWrite | ✓ VERIFIED | `canWritePatient`; banner; panels including evaluation → physical. |
| `src/pages/PatientsPage.tsx` | Ficha de {fisio} | ✓ VERIFIED | `fichaDeLine` for empresa teammate rows; Novo paciente always shown. |

gsd-sdk `verify.artifacts` on all seven PLANs: `all_passed: true` (17/17).

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/lib/accountAccess.ts` | `src/types/account.ts` | named imports | ✓ WIRED | `from '@/types/account'` |
| `public.handle_new_user` | `auth.users.raw_user_meta_data` | CREATE OR REPLACE | ✓ WIRED | SDK reported "Source file not found" (function name, not a path). SQL lines 307–363 read `account_type` / `join_code` from `new.raw_user_meta_data`. |
| `decide_membership` | memberships + `profiles.is_active` | SECURITY DEFINER | ✓ WIRED | Same SDK miss. SQL 394–436: owner check, pending only, reject sets `is_active = false`. |
| `RegisterPage.tsx` | `lookup_organization_by_code` | `lookupOrganizationByCode` | ✓ WIRED | RegisterPage → team.service → `supabase.rpc('lookup_organization_by_code')` |
| `auth.service.ts` | `auth.signUp` options.data | `account_type` | ✓ WIRED | `options.data.account_type` and `join_code` |
| `AuthProvider.tsx` | `fetchProfile` + `fetchMembership` | userId effect | ✓ WIRED | `Promise.all` in userId effect; `onAuthStateChange` has no await |
| `ProtectedRoute.tsx` | `isPendingTherapist` | Guest + Protected | ✓ WIRED | Both routes |
| `TeamPage.tsx` | `decide_membership` | `useDecideMembership` | ✓ WIRED | mutate → RPC |
| `AppShell.tsx` | `clinicNavigationItems` | filtered drawer | ✓ WIRED | `drawerItems = clinicNavigationItems(profile?.accountType)` |
| `patients.service.ts` | `patients.created_by` | insert + columns | ✓ WIRED | |
| `PatientPage.tsx` | `accountAccess.ts` | `canWritePatient` | ✓ WIRED | `canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `RegisterPage` | `accountType` / `joinCode` | RHF + Zod; lookup RPC | User input + `lookup_organization_by_code` | ✓ FLOWING |
| `TeamPage` | `members`, `joinCode` | `useTeam` → `listTeamMembers` / `fetchOwnerOrganization` | Supabase `organizations` + `organization_memberships` (+ profiles embed) | ✓ FLOWING |
| `PatientsPage` | `patients`, `createdByName` | `usePatients` → `patients.service` | `created_by` select + profiles name map | ✓ FLOWING |
| `PatientPage` | `canWrite`, `showConsultBanner` | `canWritePatient` + `detail/dashboard.createdBy` | Same patient queries | ✓ FLOWING |
| `WaitingApprovalPage` | `membership` | AuthProvider `fetchMembership` | `organization_memberships` | ✓ FLOWING |
| `AuthProvider` | `profile.accountType` | `fetchProfile` | `profiles.account_type` (defaults autonomo if null) | ✓ FLOWING |

Empty `?? []` / `?? ''` on TeamPage are query fallbacks, overwritten when `useTeam` resolves.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| TypeScript compile of account/equipe/ficha wiring | `npm run typecheck` | exit 0 | ✓ PASS |
| Zod registerSchema without Vite alias | `node` import of `auth.schema.ts` | ERR_MODULE_NOT_FOUND (`@/lib`) | ? SKIP (alias; schema read instead) |
| SQL copies identical length | `wc -l` both SQL paths | 744 / 744 | ✓ PASS |
| No `delete from auth.users` | grep on committed SQL | no matches | ✓ PASS |
| No `service_role` in executable SQL | grep -v comments | 0 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh` and none declared in PLAN/SUMMARY | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-15 | 03-01, 03-02, 03-03, 03-04, 03-05, 03-06, 03-07 | Tipos de conta e equipe na empresa | ✓ SATISFIED | All seven plans declare `requirements: [REQ-15]`. Acceptance 1–5 map to truths 1–5 and 8. |
| REQ-15.1 | 03-03 | Cadastro exige tipo | ✓ SATISFIED | Zod enum + RegisterPage Select |
| REQ-15.2 | 03-05 | Empresa aloca funcionários | ✓ SATISFIED | `/equipe` code + decide |
| REQ-15.3 | 03-04, 03-05 | Fisio não gerencia equipe | ✓ SATISFIED | `canManageTeam` + redirect |
| REQ-15.4 | 03-05 | Autônomo não vê gestão | ✓ SATISFIED | Nav filter + redirect |
| REQ-15.5 | 03-02, 03-03 | Persistido no Supabase | ✓ SATISFIED (code) | SQL + signup metadata; live RLS UAT is human |

**Orphaned requirements:** none. `.planning/REQUIREMENTS.md` maps only REQ-15 to Phase 3. REQ-14 / REQ-05 belong to other phases.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/hooks/useTeam.ts` | 25 | `useMembership` exported, never imported | ℹ️ Info | Dead export; AuthProvider calls `fetchMembership` directly. Not a must-have. |
| Ficha panels | props | `canWrite?: boolean = true` | ℹ️ Info | Intentional so other callers keep writing. `PatientPage` always passes `canWrite`; `PatientEvaluationPanel` forwards into physical eval. |
| `src/services/calendar.service.ts` | 67 | `patient_sessions` insert with no `canWritePatient` UI | ℹ️ Info | Agenda is outside ficha scope (D-07). RLS `can_write_patient` still blocks empresa writes on teammate rows. |
| Phase source files | — | TBD / FIXME / XXX | none | No unreferenced debt markers in phase-touched src/SQL. |
| `src/services/aiPhysicalEvaluation.service.ts` | 123 | pre-existing lint `any` | ℹ️ Info | Documented in `deferred-items.md`; not introduced by Phase 3. |

### Human Verification Required

Harvested from PLAN `<human-check>` blocks (03-02, 03-05, 03-07) plus live signup/equipe/ficha flows that grep cannot close.

### 1. SQL Editor allow/deny

**Test:** No Dashboard, paste/confirm `supabase/03-account-types-team.sql` if not already applied. Table Editor: `profiles.account_type`, `organizations`, `organization_memberships`. Run the allow/deny comments at the bottom of the SQL (anon SELECT orgs; pending JWT SELECT patients; fisio B vs A; empresa UPDATE vs SELECT of A's patient).
**Expected:** Script Success (no 42P17). Tables/columns present. Deny/allow match the comments.
**Why human:** Hosted RLS cannot be proven from the repo. 03-02 SUMMARY claims apply; this check does not trust that claim as live evidence.

### 2. Cadastro — three account types

**Test:** Open `/cadastro`. Submit without tipo. Register autônomo, empresa, and fisio with a real join code (and an invalid code).
**Expected:** Tipo obrigatório. Código 8 caracteres só para fisio; código inválido bloqueia antes do signUp. Empresa/autônomo criam conta. Fisio válido vê “Aguarde a empresa aceitar”.
**Why human:** Auth signup + trigger + optional e-mail confirmation.

### 3. Empresa /equipe

**Test:** As empresa, open Equipe. Copy code. As a pending fisio, appear in Pedidos. Aceitar pedido / Recusar pedido (confirm copy).
**Expected:** Code grouped XXXX XXXX, clipboard raw 8 chars. Accept → “Na equipe”. Reject → confirm “Recusar e cancelar conta”, then cancelled account.
**Why human:** Live membership rows and clipboard.

### 4. Autônomo / fisio without Equipe

**Test:** Log in as autônomo and as accepted fisio. Check drawer and visit `/equipe`.
**Expected:** Equipe absent. `/equipe` → `/pacientes`. Bottom bar still four items.
**Why human:** Nav visibility is session-dependent UX.

### 5. Pending/rejected gates + empresa consulta on ficha

**Test:** Pending fisio login. Rejected fisio login. As empresa, open a teammate patient and create a new patient of the empresa's own. As autônomo, check list subtitles.
**Expected:** Pending → `/aguardando`, no AppShell clinic. Rejected → “Pedido recusado” / must use another e-mail. Teammate ficha: banner “Somente consulta”, no add/edit/delete on sessão, avaliação, meta, alerta, cadastro. Empresa own patient still writable. Autônomo list has no “Ficha de”.
**Why human:** Cross-account RLS + UI hide vs disable.

### Gaps Summary

No blocking gaps in the codebase. Phase goal is implemented: three-type cadastro, empresa team allocation via code + decide, fisio pending-into-org (no own clinic), autônomo without Equipe, creator-write / owner-read fichas.

Status is `human_needed` because live SQL allow/deny and browser UAT of signup / equipe / ficha were not exercised in this verification pass (no app login, no Dashboard). `passed` is not allowed while those items remain.

No later milestone phase claims this work — nothing deferred.

---

_Verified: 2026-09-09T21:05:00Z_
_Verifier: Claude (gsd-verifier)_
