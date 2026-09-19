# Phase 9: Paciente/sessão sem fisioterapeuta (empresa) - Research

**Researched:** 2026-09-18
**Domain:** Clinic SPA — optional physiotherapist on patient/session create for `account_type === 'empresa'` (React + Zod + Supabase RLS)
**Confidence:** HIGH (hotspots, nullable columns, RLS, and locked product verified in-repo); MEDIUM (exact live Postgres `information_schema` not queried this session — inferred from working Calendar insert-null path)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Escopo só empresa
Opcionalidade de fisioterapeuta na criação de paciente e sessão vale para `account_type === 'empresa'`. Autônomo e fisioterapeuta mantêm o comportamento atual (não regredir).

#### D-02 — Sessão: therapistId opcional (empresa)
No fluxo Nova sessão / agendar (ficha, agenda, atalhos), empresa pode salvar com `therapistId` vazio → persistido como `null`. Schema Zod não exige UUID quando o ator é empresa.

#### D-03 — Paciente sem fisioterapeuta alocado
Empresa cria paciente sem selecionar/alocar fisioterapeuta (campo de profissional vazio ou omitido). Sem bloquear o cadastro por falta de profissional.

#### D-04 — Atribuir depois
Edição de paciente e de sessão permite preencher o profissional depois. Lista/ficha/agenda mostram estado claro quando não há profissional (copy PT: **Sem profissional** ou equivalente já usado no produto).

#### D-05 — Sem mudança de modelo de conta
Não criar novo `account_type`. Não alterar fluxo de Equipe (REQ-15). RLS Phase 3 continua autoridade; `created_by` da empresa no paciente permanece.

#### D-06 — Fora de escopo desta fase
- Rateio / comissão financeira por fisio
- Auto-atribuição forçada ao criador empresa
- Google Agenda (Phase 8 permanece aberta, UAT pendente — histórico preservado)
- REQ-05 / REQ-14

### Claude's Discretion
*(Discuss-phase skipped — no separate discretion section in CONTEXT. Research recommendations below fill product gaps that CONTEXT left open: schema factory shape, empty→null boundary, display helper, default select value for empresa.)*

### Deferred Ideas (OUT OF SCOPE)
- Rateio / comissão financeira por fisio
- Auto-atribuição forçada ao criador empresa
- Google Agenda (Phase 8 permanece aberta, UAT pendente — histórico preservado)
- REQ-05 / REQ-14
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-21 | Empresa cria paciente e sessão sem alocar fisioterapeuta; vínculo opcional; atribuir depois; UI clara; sem regressão autônomo/fisio; persistência nula + RLS válido | Schema factory for `sessionFormSchema`; nullable `UpsertPatientSessionInput`; `sessions.service` empty→null; empresa defaults/select copy; display helper **Sem profissional**; patient path already optional — tighten display only; leave Phase 3 RLS and Phase 8 untouched |
| REQ-21 acceptance 1 | Fluxos de novo paciente (empresa) não exigem fisioterapeuta | `createPatientSchema.therapistName` already `optionalText`; `PatientsPage` create modal omits therapist entirely; `createPatient` → `emptyToNull(therapistName)` |
| REQ-21 acceptance 2 | Fluxos de nova sessão / agendar (empresa) não exigem `therapistId` | Hotspot: `sessionFormSchema` + `PatientSessionEditorForm` runtime gate; Calendar already inserts null |
| REQ-21 acceptance 3 | Registros sem profissional exibem estado claro e permitem atribuir na edição | Replace silent omit / `—` with **Sem profissional**; keep edit paths |
| REQ-21 acceptance 4 | Autônomo e fisioterapeuta não perdem o fluxo atual | Factory keeps required UUID for non-empresa; keep auto-select first therapist for non-empresa |
| REQ-21 acceptance 5 | Persistência nula; RLS de equipe válido | `therapist_id` already nullable in app types + Calendar path; RLS uses `can_write_patient(patient_id)` / `can_read_patient` — not `therapist_id` |
</phase_requirements>

## Summary

Phase 9 is a **narrow product change**: only `account_type === 'empresa'` may create/schedule clinical sessions (and keep patients) **without** a physiotherapist UUID. Persistence target is `patient_sessions.therapist_id = null` (+ `therapist_name = null`). Patient-level allocation is already a free-text `patients.therapist_name` that is optional in Zod and omitted from the quick-create modal — the patient half of REQ-21 is mostly **copy clarity**, not a new write path.

The real blocker is the **shared session editor**: `sessionFormSchema.therapistId` is `z.string().uuid('Selecione o profissional')`, and `PatientSessionEditorForm.onSubmit` rejects any missing therapist before the service runs. That form is reused by the ficha Evoluções tab and the dashboard clinical shortcut (`DashboardClinicalShortcut`). By contrast, `calendar.service.createSession` already accepts optional `therapistId?` and writes `null`; `CalendarPage` never sends a therapist today.

RLS from Phase 3 does **not** key off `therapist_id`. Session INSERT/UPDATE/DELETE require `private.can_write_patient(patient_id)` (creator write). Empresa `created_by` on patients stays as today (D-05). Phase 8 Google Calendar must not be edited.

**Primary recommendation:** Add `createSessionFormSchema(accountType)` (empresa: UUID **or** `''`; others: required UUID), map `''` → `null` at the service boundary (mirror Calendar / evaluations), default empresa select to empty with label **Sem profissional**, keep autônomo/fisio required + first-therapist default, and centralize display copy. Install **no** new packages. Do **not** touch Phase 8 files.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Decide if therapist is required | Browser / Client | — | UX gate from `profile.accountType`; Zod factory. Not a new DB role. |
| Persist `therapist_id` null | Database / Storage | API / Backend (PostgREST) | Column already nullable in app contract; service writes null |
| Authorize session create/update | Database / Storage | Browser / Client | Phase 3 RLS `can_write_patient(patient_id)` is authority; `canWritePatient` is UX only |
| Patient create without therapist | Browser / Client | Database / Storage | Already works; schema optional; modal omits field |
| Display “Sem profissional” | Browser / Client | — | List/ficha/viewer copy only |
| Assign therapist later (edit) | Browser / Client | Database / Storage | Existing update paths; remove required gate for empresa |
| Calendar quick create | Browser / Client | Database / Storage | Already null-safe; leave Google strip (Phase 8) alone |
| Equipe / account_type model | — | — | Out of scope (D-05 / D-06) |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory found in the project root at research time. Apply existing project conventions from `PROJECT.md` and prior phases:

- Layers: page → hooks → services → Supabase
- UI copy in Portuguese; empty states without fake placeholders
- SQL scripts manual via Supabase SQL Editor (not `supabase db push`) when SQL is needed
- Do not invent bakery `permissions.ts` patterns; use `accountAccess.ts` UX predicates + RLS as authority

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 3.25.76 (installed); registry latest 4.6.5 unused | Form/schema validation | Already used for `sessionFormSchema`; do not upgrade in this phase |
| react-hook-form | 7.81.0 | Forms | Session editor + patient forms |
| @hookform/resolvers | 5.4.0 (lockfile); registry 5.9.1 | `zodResolver` | Existing pattern |
| @supabase/supabase-js | ^2.49.8 | Persistence | Existing clinic services |
| @tanstack/react-query | ^5.76.1 | Mutations/invalidation | `useCreatePatientSession` / `useUpdatePatientSession` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `accountAccess.ts` | in-repo | UX predicates | Add `canOmitSessionTherapist(accountType)` (or equivalent) — UX only, mirror `canSeeFinance` |
| Existing Select / Modal | in-repo | UI | Empty option label **Sem profissional** for empresa |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Schema factory by `accountType` | Single schema + `superRefine` needing accountType in form values | Steel man: one export. Weaker: couples form values to auth; factory matches finance’s “branch by account” style and CONTEXT hotspot note |
| `z.string().uuid().optional().or(z.literal(''))` for empresa | Always-optional therapist for all types | Violates D-01 |
| Store empty string in DB | Persist `null` | Empty string fights FK/uuid columns and null checks; Calendar/evaluations already use null |
| New `account_type` / Equipe change | — | Forbidden by D-05 |

**Installation:**

```bash
# No new runtime packages for Phase 9.
# Optional Wave 0 (tests only — see Validation Architecture):
# npm install -D vitest
```

**Version verification:** `npm ls zod react-hook-form @hookform/resolvers` in project → zod@3.25.76, react-hook-form@7.81.0, @hookform/resolvers@5.4.0. [VERIFIED: local node_modules]

## Package Legitimacy Audit

> Phase 9 ships **no new runtime packages**. Optional Wave 0 may add `vitest` as a **devDependency** only.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| *(none — reuse zod / RHF / Supabase already in package.json)* | — | — | — | — | n/a | Approved — no install |
| vitest (optional Wave 0) | npm | mature | high | github.com/vitest-dev/vitest | not run (slopcheck unavailable) | Flagged `[ASSUMED]` — planner must add `checkpoint:human-verify` before install if Wave 0 chooses Vitest |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none (no new runtime deps)  
*slopcheck was unavailable at research time (`command -v slopcheck` failed after best-effort pip install).*

## Architecture Patterns

### System Architecture Diagram

```text
[Empresa user]
    │
    ├─ PacientesPage "Novo paciente"
    │     → createPatientSchema (therapistName optional, field omitted)
    │     → patients.service.createPatient
    │     → patients.created_by = auth.uid()   ← unchanged (D-05)
    │     → patients.therapist_name = null
    │
    ├─ PatientSessionEditorForm (ficha + DashboardClinicalShortcut)
    │     → createSessionFormSchema(accountType)
    │           empresa: therapistId '' | uuid
    │           autonomo/fisio: therapistId uuid required
    │     → map '' → { therapistId: null, therapistName: null }
    │     → sessions.service create/update
    │     → patient_sessions.therapist_id NULL
    │     → RLS: can_write_patient(patient_id)
    │
    └─ CalendarPage "Nova sessão"
          → calendar.service.createSession (therapistId already optional)
          → patient_sessions.therapist_id NULL
          → DO NOT modify Google Calendar strip (Phase 8)

[Display]
  null/empty therapist → "Sem profissional" (lista, ficha, viewer)
  Edit patient admin / edit session → assign later (D-04)
```

### Recommended Project Structure

```
src/
├── schemas/patient.schema.ts          # createSessionFormSchema(accountType)
├── types/patient.ts                   # UpsertPatientSessionInput therapist* nullable
├── lib/accountAccess.ts               # canOmitSessionTherapist (UX only)
├── lib/therapistLabel.ts              # NEW optional: formatTherapistLabel → "Sem profissional"
├── services/sessions.service.ts       # empty → null on insert/update
├── services/calendar.service.ts       # leave as-is (already null-safe)
├── components/patients/
│   ├── PatientSessionEditorForm.tsx   # factory resolver, defaults, submit, select label
│   ├── PatientEvolutionsPanel.tsx     # display copy
│   └── PatientCadastroPanel.tsx       # display "Sem profissional" instead of "—"
└── pages/CalendarPage.tsx             # no Google changes; therapist field optional later (discretion: leave alone)
```

### Pattern 1: Account-typed session schema factory

**What:** Export `createSessionFormSchema(accountType: AccountType | null | undefined)` that returns the existing object + `superRefine` for mode/finance, but swaps `therapistId` field by account.

**When to use:** Any shared form used by multiple `account_type`s (this phase’s session editor).

**Example:**

```typescript
// Analog: src/schemas/modules.schema.ts assigned_to / courier_id
// Zod: z.string().uuid().optional().or(z.literal('')) — verified locally to accept '' and valid UUID
import { z } from 'zod'
import type { AccountType } from '@/types/account'

const therapistIdRequired = z.string().uuid('Selecione o profissional')
const therapistIdOptionalEmpresa = z
  .string()
  .uuid('Selecione o profissional')
  .optional()
  .or(z.literal(''))

export function createSessionFormSchema(accountType: AccountType | null | undefined) {
  const therapistId =
    accountType === 'empresa' ? therapistIdOptionalEmpresa : therapistIdRequired

  return z
    .object({
      // ...existing fields...
      therapistId,
    })
    .superRefine(/* existing mode + finance rules unchanged */)
}

// Keep a default export for non-empresa callers / tests if needed:
export const sessionFormSchema = createSessionFormSchema('autonomo')
```

**Form wiring:**

```typescript
const { profile } = useAuth()
const schema = useMemo(
  () => createSessionFormSchema(profile?.accountType),
  [profile?.accountType],
)
const form = useForm<SessionFormData>({
  resolver: zodResolver(schema),
  // ...
})
```

### Pattern 2: Empty select → null at service boundary

**What:** HTML `<select>` keeps `value=""`; TypeScript DTO allows `string | null`; service writes SQL null (same as Calendar + evaluations).

**When to use:** Every write path that accepts omitted therapist.

**Example:**

```typescript
// Mirror: src/services/calendar.service.ts createSession
// Mirror: src/services/evaluations.service.ts therapist_id: input.therapistId || null
therapist_id: input.therapistId?.trim() ? input.therapistId : null,
therapist_name: input.therapistName?.trim() ? input.therapistName : null,
```

Update `UpsertPatientSessionInput`:

```typescript
therapistId: string | null
therapistName: string | null
```

### Pattern 3: Display label helper

**What:** Single PT string for missing professional.

**Example:**

```typescript
export function formatTherapistLabel(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed || trimmed === '—') return 'Sem profissional'
  return trimmed
}
```

Use in `PatientEvolutionsPanel` list/viewer, `PatientCadastroPanel` Field value, and any agenda row that surfaces therapist (Calendar DTO currently has no therapist field — no change required unless planner adds it).

### Anti-Patterns to Avoid

- **Global optional therapist:** Softening Zod for all account types regresses D-01 for autônomo/fisio.
- **Persisting `''` or inventing a sentinel UUID:** Use SQL `null`.
- **Auto-assigning empresa creator as therapist:** Forbidden by D-06.
- **Filtering Calendar/list by `therapist_id = me`:** Would hide unassigned empresa sessions; Calendar already lists by date range + RLS only. [VERIFIED: `calendar.service.ts` `listSessionsInRange`]
- **Touching Phase 8 Google files / SQL / Edge Functions:** D-06.
- **Changing Equipe / `account_type` / Phase 3 `can_*` helpers:** D-05.
- **Putting money or finance gates on this change:** Empresa never sees finance (`canSeeFinance`); leave Phase 5 alone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optional UUID in HTML forms | Custom string parsers / “null” magic strings | `z.string().uuid().optional().or(z.literal(''))` (in-repo bakery analog) | Already proven; empty select is `''` |
| Authorization for who may omit therapist | New RLS on `therapist_id` | Existing `can_write_patient` + UX factory | RLS already correct without therapist |
| Therapist display copy | Scattered ternaries with different strings | `formatTherapistLabel` | D-04 consistency |
| Account branching | Duplicate session forms per account | One form + schema factory + `canOmitSessionTherapist` | Matches `canSeeFinance` pattern |

**Key insight:** The database and Calendar path already allow null therapists. Phase 9 is primarily **unblocking the Zod/UI gate for empresa** and clarifying empty state copy — not a schema migration project.

## Common Pitfalls

### Pitfall 1: Leaving the runtime `if (!therapist)` gate
**What goes wrong:** Zod passes for empresa with `''`, but `onSubmit` still `setError('Selecione o profissional')`.  
**Why it happens:** Dual validation in `PatientSessionEditorForm` lines ~172–176. [VERIFIED: source]  
**How to avoid:** Gate that check with `!canOmitSessionTherapist(accountType)` (or equivalent).  
**Warning signs:** Empresa still cannot save with empty select after schema change.

### Pitfall 2: Defaulting empresa to `therapists[0]`
**What goes wrong:** Empresa “creates without allocating” but UI auto-picks the first profile — silent assignment.  
**Why it happens:** `useEffect` reset sets `therapistId: therapists[0]?.id ?? ''`. [VERIFIED: source]  
**How to avoid:** For empresa (and when omitting allowed), default `''`. Keep first-therapist default for autônomo/fisio.  
**Warning signs:** New sessions always show a name even when user never chose one.

### Pitfall 3: Writing empty string into `therapist_id`
**What goes wrong:** Postgres uuid column / FK rejects `''` (22P02) or stores bad data.  
**Why it happens:** `sessions.service` currently assigns `input.therapistId` verbatim. [VERIFIED: source]  
**How to avoid:** Coalesce like Calendar (`?? null` / emptyToNull).  
**Warning signs:** Insert errors only when select left empty.

### Pitfall 4: Autônomo regression via Calendar “fix”
**What goes wrong:** Someone adds required therapist to `CalendarPage` “for consistency,” breaking today’s Calendar create (already null for everyone).  
**Why it happens:** Misreading D-01 as “all paths must require therapist for non-empresa.”  
**How to avoid:** D-01 means **do not soften** the ficha/editor requirement for non-empresa; **do not harden** Calendar. Leave Calendar create as-is.  
**Warning signs:** PRs that add therapist Select to Calendar for autônomo.

### Pitfall 5: Assuming RLS needs `therapist_id`
**What goes wrong:** Unnecessary SQL / policy changes; risk to Phase 3.  
**Why it happens:** Intuition that “unassigned sessions are invisible.”  
**How to avoid:** Policies use `can_read_patient` / `can_write_patient` on `patient_id` only. [VERIFIED: `03-account-types-team.sql` patient_sessions_*]  
**Warning signs:** New migration touching `private.can_*` or `patient_sessions_*`.

### Pitfall 6: Finance `created_by` confusion
**What goes wrong:** Mixing session `created_by` (author of the row) with `therapist_id` (allocated professional).  
**Why it happens:** `sessions.service` sets `created_by: author.userId`; Calendar create historically omits `created_by` (Phase 5 review note).  
**How to avoid:** Do not auto-fill `therapist_id` from `created_by`. Empresa finance is out of scope (D-06). Do not “fix” Calendar `created_by` in this phase unless needed for an unrelated bug.  
**Warning signs:** Code that sets `therapist_id: author.userId` for empresa.

### Pitfall 7: Touching Phase 8
**What goes wrong:** Merge conflicts / UAT reset on Google Calendar.  
**How to avoid:** Do not edit `.planning/phases/08-*`, `supabase/functions/google-calendar-*`, or Google hooks/UI beyond observing that export does not filter by `therapist_id`. [VERIFIED: export function has no therapist_id filter in grep]

### Pitfall 8: Patient display still shows `—`
**What goes wrong:** Acceptance “estado claro” fails even though create works.  
**Why it happens:** `mapPatient` uses `therapist_name ?? '—'` and Evoluções omits the name entirely when null.  
**How to avoid:** Use **Sem profissional** per D-04.  
**Warning signs:** Cadastro card still shows em dash for empty fisioterapeuta.

## Code Examples

### Empresa submit mapping (editor)

```typescript
// Source: pattern from PatientEvaluationEditorForm + calendar.service
const omitOk = canOmitSessionTherapist(profile?.accountType)
const therapist = therapists.find((item) => item.id === values.therapistId)

if (!omitOk && !therapist) {
  form.setError('therapistId', { message: 'Selecione o profissional' })
  return
}

const input = {
  // ...
  therapistId: therapist?.id ?? null,
  therapistName: therapist?.fullName ?? null,
}
```

### Select options for empresa

```typescript
const therapistOptions = [
  { value: '', label: omitOk ? 'Sem profissional' : 'Selecione…' },
  ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
]
```

### Patient path (already OK for create)

```typescript
// createPatientSchema.therapistName: optionalText(120) — [VERIFIED: patient.schema.ts]
// PatientsPage onSubmit does not send therapistName — patient lands with therapist_name null
// createPatient: therapist_name: emptyToNull(input.therapistName) — [VERIFIED: patients.service.ts]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session therapist always required in Zod + form | Required only for non-empresa; empresa may null | Phase 9 (this) | Unblocks clinic ops without allocation |
| Evaluation therapist optional for everyone | Unchanged (already optional) | Phase 1 | Analog for submit mapping only — do not import REQ-05 scope |
| Calendar create without therapist | Keep | Pre-existing | Proof that DB accepts null |

**Deprecated/outdated:**
- Treating `sessionFormSchema` as a single static schema for all account types once Phase 9 ships — prefer factory.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Live `patient_sessions.therapist_id` is NULLABLE (no NOT NULL) | Summary / Pitfalls | If NOT NULL, Calendar create would already fail; still add UAT check `information_schema` if insert-null errors appear |
| A2 | No SQL migration required for Phase 9 | Standard Stack / Don't Hand-Roll | If live DB differs from app assumptions, planner adds optional ALTER … DROP NOT NULL script |
| A3 | Vitest is acceptable Wave 0 if tests are required | Validation Architecture | Team may prefer typecheck + manual UAT only |

**If live DB check is desired (human SQL Editor):**

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'patient_sessions'
  and column_name = 'therapist_id';
-- expect YES
```

## Open Questions (RESOLVED)

1. **Should CalendarPage gain an optional therapist Select for empresa?** — RESOLVED
   - What we know: Create already saves null; D-04 allows assign later via edit (ficha).
   - Decision: **Leave Calendar create without therapist field** this phase (smallest diff; avoids Phase 8 churn). Assign via ficha editor. Agenda Sem profissional N/A (Calendar DTO/UI has no therapist field).

2. **Patient Cadastro free-text vs profile UUID** — RESOLVED
   - What we know: Patients store `therapist_name` text only — no `therapist_id` on `patients`.
   - Decision: **Do not add patient.therapist_id** this phase (D-05 / scope). Keep optional text + **Sem profissional** display. Session UUID allocation remains the structured link.

3. **`listActiveTherapists` returns all active profiles** — RESOLVED
   - What we know: `.from('profiles').eq('is_active', true)` — may include empresa owners and non-team users depending on RLS/data.
   - Decision: **Out of scope** unless it blocks UAT; do not expand Equipe filtering here (D-05).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | typecheck / optional vitest | ✓ | v26.4.0 | — |
| npm | installs | ✓ | 12.0.2 | — |
| zod (installed) | schema factory | ✓ | 3.25.76 | — |
| Supabase project (hosted) | persistence / RLS | ✓ (assumed project remote) | — | SQL Editor human verify nullability |
| Vitest | Wave 0 unit tests | ✗ not in package.json | — | `npm run typecheck` + manual UAT matrix |
| ctx7 / Context7 | docs | ✗ | — | Official zod.dev + in-repo analogs |
| slopcheck | package audit | ✗ | — | No new packages → N/A |

**Missing dependencies with no fallback:** none for implementation (reuse installed stack).

**Missing dependencies with fallback:** Vitest → typecheck + manual UAT.

Step 2.6 note: Phase is code/config with existing Supabase; no new external services.

## Validation Architecture

> `workflow.nyquist_validation` absent in `.planning/config.json` → treat as **enabled**.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed today (`package.json` scripts: `dev`, `build`, `lint`, `preview`, `typecheck` only) |
| Config file | none — see Wave 0 |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` (+ manual UAT below) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-21 | Empresa schema accepts `therapistId: ''` | unit | `npx vitest run src/schemas/patient.schema.test.ts` (after Wave 0) | ❌ Wave 0 |
| REQ-21 | Autônomo schema rejects `''` | unit | same | ❌ Wave 0 |
| REQ-21 | Service maps empty → null | unit | optional pure helper test | ❌ Wave 0 |
| REQ-21 | Empresa create patient without therapist | manual UAT | — | ❌ manual |
| REQ-21 | Empresa save session without therapist (ficha + shortcut) | manual UAT | — | ❌ manual |
| REQ-21 | Autônomo/fisio still blocked without therapist in editor | manual UAT | — | ❌ manual |
| REQ-21 | UI shows Sem profissional; edit assigns later | manual UAT | — | ❌ manual |
| REQ-21 | RLS: empresa writes own patient session with null therapist | manual / SQL | — | ❌ manual |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` + schema unit tests if Wave 0 landed
- **Phase gate:** Full typecheck green + human UAT matrix (empresa omit / autonomo require / display / edit assign) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Optional: add Vitest + `src/schemas/patient.schema.test.ts` covering factory empresa vs autonomo (`checkpoint:human-verify` before install — slopcheck unavailable)
- [ ] Shared helper test for `formatTherapistLabel` if extracted
- [ ] If Vitest declined: document manual UAT checklist in plan SUMMARY / HUMAN-UAT

*(Existing test infrastructure does **not** cover phase requirements.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no change | Existing Supabase Auth |
| V3 Session Management | no | — |
| V4 Access Control | yes | Phase 3 RLS `can_write_patient` / `can_read_patient`; UX `canWritePatient` / new omit predicate is **not** authorization |
| V5 Input Validation | yes | Zod factory; UUID or empty only; never trust client accountType for RLS |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client claims `accountType=empresa` to skip therapist while JWT is autonomo | Tampering / Elevation | Soften Zod only in UI; DB still accepts null for any writer who passes RLS — **acceptable** because null therapist is not a privilege. Do not weaken RLS. Autônomo “required therapist” is product UX, not a security boundary. |
| Empresa writes colleague patient sessions | Elevation | Unchanged `can_write_patient` (creator only) |
| Empty string stored as uuid | Tampering | Service empty→null |
| Leaking finance via session payload | Information disclosure | Unchanged — money not on `patient_sessions` (Phase 5) |
| Accidental Google token / Phase 8 edits | — | Do not touch Phase 8 files |

## Concrete file list for planner

| File | Action |
|------|--------|
| `src/schemas/patient.schema.ts` | Add `createSessionFormSchema(accountType)`; keep finance/mode `superRefine` |
| `src/types/patient.ts` | `UpsertPatientSessionInput.therapistId/Name` → `string \| null` |
| `src/lib/accountAccess.ts` | Add `canOmitSessionTherapist(accountType)` |
| `src/lib/therapistLabel.ts` (or inline helper) | `formatTherapistLabel` → **Sem profissional** |
| `src/services/sessions.service.ts` | Coalesce empty therapist to null on create/update |
| `src/components/patients/PatientSessionEditorForm.tsx` | Factory resolver; empresa default `''`; conditional runtime gate; select label |
| `src/components/patients/PatientEvolutionsPanel.tsx` | Show **Sem profissional** when null |
| `src/components/patients/PatientCadastroPanel.tsx` | Display label for empty fisioterapeuta |
| `src/services/patients.service.ts` | Optional: map `therapist: formatTherapistLabel(row.therapist_name)` instead of `—` |
| `src/pages/CalendarPage.tsx` | **No change** (already null); do not edit Google strip |
| `src/services/calendar.service.ts` | **No change** |
| Phase 8 paths / Equipe / SQL `can_*` | **Do not touch** |
| Optional SQL | Only if UAT proves `therapist_id` NOT NULL (unexpected) |

## Sources

### Primary (HIGH confidence)

- In-repo: `src/schemas/patient.schema.ts`, `PatientSessionEditorForm.tsx`, `sessions.service.ts`, `calendar.service.ts`, `patients.service.ts`, `types/patient.ts`, `accountAccess.ts`
- In-repo: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` — `patient_sessions_*` + `can_write_patient` / `can_read_patient`
- In-repo: `src/schemas/modules.schema.ts` — `z.string().uuid().optional().or(z.literal(''))` pattern
- In-repo: `09-CONTEXT.md`, `REQUIREMENTS.md` REQ-21, `ROADMAP.md` Phase 9
- Local runtime check: zod 3.25.76 accepts `optional().or(z.literal(''))` for `''` and valid UUID [VERIFIED: node script]
- [CITED: zod.dev] — `.optional()`, `.literal()`, unions/or composition

### Secondary (MEDIUM confidence)

- Phase 5/8 research notes that Calendar/export do not require `therapist_id = me` for visibility
- Live DB nullability inferred from Calendar insert-null path (A1)

### Tertiary (LOW confidence)

- Whether product later wants Calendar therapist Select for empresa (Open Question 1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse only; versions from `npm ls`
- Architecture: HIGH — hotspots and RLS verified in source/SQL
- Pitfalls: HIGH — dual validation + default first therapist + empty string write are concrete bugs waiting to happen

**Research date:** 2026-09-18  
**Valid until:** 2026-10-18 (stable clinic SPA patterns; re-check if Zod major upgrade to v4 is adopted)
