---
phase: 05-financeiro-autonomo
reviewed: 2026-09-14T19:05:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/types/finance.ts
  - src/schemas/finance.schema.ts
  - src/lib/accountAccess.ts
  - src/schemas/patient.schema.ts
  - src/services/finance.service.ts
  - src/hooks/useFinance.ts
  - src/hooks/usePatients.ts
  - src/services/sessions.service.ts
  - src/components/patients/PatientSessionEditorForm.tsx
  - src/config/navigation.ts
  - src/routes/index.tsx
  - src/pages/AutonomoFinancePage.tsx
  - .planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql
findings:
  critical: 0
  warning: 6
  info: 3
  total: 9
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-09-14T19:05:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Phase 5 keeps money off `patient_sessions`, routes `/financeiro` to `AutonomoFinancePage` (not bakery `FinancePage`), leaves `CalendarPage` without a third XOR widget, holds archived `priceId` on a hidden input, and keeps `sessionId` on update mutate. The snapshot trigger preserves amount/name on same-`price_id` UPDATE (including `is_paid`). RLS is owner+autonomo with FORCE, no DELETE grant, and charge writes also require `can_write_patient`. Hide-vs-disable is honored (unmount finance block, hide empty catalog Select, no disabled Pago on paid rows).

Remaining issues are snapshot-identity bugs in the session editor, silent no-op “saves”, a non-atomic clinical-then-charge write, and a `created_by` filter that can hide agenda-created realizadas from D-10.

## Warnings

### WR-01: Catalog snapshot treated as avulso when `priceName === 'Avulso'`

**File:** `src/components/patients/PatientSessionEditorForm.tsx:49-55`
**Issue:** Prefill uses the display name, not `priceId`. A catalog row named exactly `Avulso` (a label the product itself uses) is loaded as ad-hoc (`priceId: ''` + filled avulso). The next save upserts `price_id: null`, the trigger stamps `price_name = 'Avulso'`, and the catalog FK is dropped. D-07 snapshot identity is rewritten.
**Fix:** Discriminate by null `priceId`, not by name:

```ts
function financeFieldsFromCharge(charge: SessionCharge | null | undefined) {
  if (!charge) return emptyFinanceFields
  if (charge.priceId == null) {
    return {
      priceId: '',
      adHocAmount: charge.amountBrl.toFixed(2).replace('.', ','),
      isPaid: charge.isPaid,
    }
  }
  return {
    priceId: charge.priceId,
    adHocAmount: '',
    isPaid: charge.isPaid,
  }
}
```

### WR-02: Avulso `onChange` clears hidden archived `priceId`

**File:** `src/components/patients/PatientSessionEditorForm.tsx:134,286-318`
**Issue:** Archived catalog ids are kept on a hidden input while the Select displays `Sem valor` (intended keep-in-state). Any keystroke in Valor avulso runs `setValue('priceId', '')`. The user is looking at an empty Select, so typing an amount is the natural next action — and it converts the epoch catalog row into Avulso on save (`price_id` null, client amount). Same XOR `onChange` exists on Completar valor, but that modal only opens when `charge` is null, so the session editor is the live path.
**Fix:** Do not clear `priceId` on every avulso input. Clear it only when avulso has a parseable amount, or keep the archived option in the Select (label + archived hint) so the control is not visually empty. Minimum:

```ts
{...form.register('adHocAmount', {
  onChange: (event) => {
    if (event.target.value.trim() !== '') {
      form.setValue('priceId', '', { shouldValidate: true })
    }
  },
})}
```

Still better: include the current archived price in `catalogOptions` so Select `value` matches RHF.

### WR-03: Charge fetch reset wipes in-progress session edits

**File:** `src/components/patients/PatientSessionEditorForm.tsx:136-169`
**Issue:** The reset effect depends on `charge`. Opening an existing session first resets with `emptyFinanceFields` (`useSessionCharge` still loading), then resets again when the charge arrives. Any clinical fields the user already typed are discarded. Phase 5 added `charge` / `showFinance` to this effect; the second reset is new.
**Fix:** Skip finance-empty reset while the charge query is pending, or merge finance fields with `setValue` instead of full `reset`:

```ts
const { data: charge, isFetched: chargeFetched } = useSessionCharge(
  showFinance ? editing?.id : undefined,
)

useEffect(() => {
  if (editing && showFinance && editing.id && !chargeFetched) return
  // existing reset...
}, [editing, form, therapists, charge, showFinance, chargeFetched])
```

### WR-04: Completar valor toasts success when upsert is a no-op

**File:** `src/services/finance.service.ts:178-184`
**File:** `src/pages/AutonomoFinancePage.tsx:156-166`
**Issue:** Zod allows neither catalog nor avulso (allocation optional). `onComplete` always calls `useUpsertCharge`, which always toasts `Valor da sessão salvo`. `upsertSessionCharge` returns without writing when both sides are empty. The modal closes; the row stays `Sem valor`. Same silent return means a direct `mutate` of `isPaid: true` with no amount would appear to succeed and persist nothing (`shouldUpsertCharge` also ignores `isPaid`).
**Fix:** Reject empty complete submissions in the page (require catalog or parseable avulso). In the service, throw if `isPaid` is true and both XOR fields are empty. Do not toast success on an early return:

```ts
if (!hasCatalog && !hasAdHoc) {
  if (input.isPaid) throw new Error('Informe um valor para marcar como pago.')
  return
}
```

On Completar valor, disable submit or `setError` when both fields are empty.

### WR-05: Session create is not atomic with the charge write

**File:** `src/hooks/usePatients.ts:206-214`
**Issue:** `createPatientSession` commits first; `upsertSessionCharge` runs after. If the charge write fails (archived price, RLS, trigger raise), the user sees an error but the clinical session already exists. Retry creates a duplicate session. Update has the same split: clinical changes persist, money does not.
**Fix:** If a single RPC is out of scope, on charge failure after create, delete the session (or return `{ id }` and let the form call a compensating delete) and surface a combined error. At minimum, include the created id in the error toast so the user does not save again blindly.

### WR-06: Realizadas list filters `created_by`, hiding agenda sessions

**File:** `src/services/finance.service.ts:222-229`
**Issue:** D-10’s list is how the autônomo completes value on old/agenda sessions. `listFinanceRealizadas` adds `.eq('created_by', userId)`. `calendar.service.ts` `createSession` does not set `created_by` (no fill trigger on `patient_sessions`, unlike `patients`). Those rows, once marked `realizada` on the calendar, never appear under Sessões realizadas. RLS `can_read_patient` already scopes the SELECT; the extra filter is redundant for a solo autônomo and drops the deferred Calendar allocation path.
**Fix:** Drop the `created_by` filter (keep `status = 'realizada'`). Rely on session RLS. If a creator filter must stay, backfill `created_by` on calendar insert (out of this file set) so the predicate matches live rows.

## Info

### IN-01: XOR rules duplicated instead of shared

**File:** `src/schemas/finance.schema.ts:36-59`
**File:** `src/schemas/patient.schema.ts:196-211`
**Issue:** `sessionChargeFieldsSchema` and `sessionFormSchema` copy the same catalog-vs-avulso / pago-without-amount `superRefine`. Drift will desync Completar valor vs the session editor. Unpaid garbage avulso (`abc`, `0`) also passes Zod (`hasAdHoc` is trim-only) and is then dropped by `parseBrlInput` + `shouldUpsertCharge`.
**Fix:** `sessionFormSchema` should `.and(sessionChargeFieldsSchema)` (or merge those three fields). Reject non-empty avulso that fails `parseBrlInput`, not only when `isPaid`.

### IN-02: `upsertSessionCharge` prefers catalog when both sides are sent

**File:** `src/services/finance.service.ts:180-197`
**Issue:** Pitfall 5 asked XOR at UI + CHECK + trigger. The service does not reject both; `hasCatalog` wins and `adHocAmountBrl` is ignored. The trigger then overwrites catalog amount, so a dual payload cannot persist two amounts — but the API still accepts a D-05 violation.
**Fix:** `if (hasCatalog && hasAdHoc) throw new Error('Escolha um preço do catálogo ou um valor avulso, não os dois.')`

### IN-03: Finance queries run for empresa/fisio session forms

**File:** `src/components/patients/PatientSessionEditorForm.tsx:85-88`
**Issue:** `useFinancePrices()` is not `enabled: showFinance`. Non-autônomo still SELECT `autonomo_prices` (RLS returns 0 rows; not a leak). `useSessionCharge` is correctly gated.
**Fix:** `useQuery({ ..., enabled: showFinance })` via a parameter on `useFinancePrices`, or skip the hook when `!showFinance`.

---

_Reviewed: 2026-09-14T19:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
