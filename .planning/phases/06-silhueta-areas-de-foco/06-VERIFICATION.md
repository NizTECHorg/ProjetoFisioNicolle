---
phase: 06-silhueta-areas-de-foco
verified: 2026-09-14T21:15:00Z
status: human_needed
score: 14/15 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Desktop: hover a writable region ~0.5s, move onto the abinha, click, leave the group; click the path only"
    expected: "Abinha Marcar {label} after ~0.5s; chip click marks/unmarks; leave closes; path-only click does not write"
    why_human: "Hover delay, pointer travel onto the chip, and path-vs-chip write behavior are timing/pointer UX — not exercised in a browser this run"
  - test: "Keyboard: Tab to a writable region, then Escape"
    expected: "Chip opens on path focus; Escape closes and returns focus to that path"
    why_human: "Focus order and Escape restore cannot be confirmed from grep"
  - test: "Touch or DevTools coarse pointer: tap region, then tap abinha"
    expected: "Chip opens immediately (no 500ms wait); second tap on the chip toggles; finger-lift does not dismiss before the chip tap"
    why_human: "Coarse/touch path is matchMedia-gated; needs a real pointer"
  - test: "Empresa account on a colleague ficha with saved areas"
    expected: "Highlights show; no chip, no pointer preview, cursor default; Somente consulta banner still present"
    why_human: "Needs two accounts; client hide is in code, live RLS 42501 was not re-probed this run"
  - test: "Empty writable patient vs empty consult patient"
    expected: "Both silhouettes remain. Empty + canWrite shows Sem áreas registradas. plus the 0,5 s / toque sentence. Empty + !canWrite shows the heading only"
    why_human: "Empty-state copy and layout need a real ficha"
  - test: "Hosted patient_focus_areas has nullable region_key, CHECK, partial unique index; Phase 3 policies still listed"
    expected: "Column live and nullable; patient_focus_areas_patient_region_key exists; select/insert/update/delete policies unchanged. Optional: 8-check matrix including colleague INSERT 42501"
    why_human: "This run cannot query hosted Postgres; 06-02 SUMMARY claims apply succeeded but the allow/deny matrix was not fully re-run"
---

# Phase 6: Silhueta de áreas de foco Verification Report

**Phase Goal:** Na ficha do paciente, o card Áreas de foco deixa de ser um boneco palito decorativo e vira uma silhueta humana simples (frente e costas). Hover 0,5s numa região abre uma abinha; clicar marca ou desmarca aquela parte como área machucada / a trabalhar. Persistido em `patient_focus_areas`.
**Verified:** 2026-09-14T21:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** null (not MVP)

## Goal Achievement

Code delivers the phase goal on the ficha Resumo card: `BodyFocus` is gone, frente/costas SVG maps render from the locked 30-key catalog, the chip is the only write control (`HOVER_OPEN_MS = 500`), `canWrite` hides write UI, and `togglePatientFocusArea` INSERT/DELETE persists `region_key` on `patient_focus_areas`. Hover, touch, empresa consult, and hosted SQL apply were not exercised in a browser or against live Postgres this run.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | O card Áreas de foco mostra silhueta humana frente e costas, não o stick figure atual | ✓ VERIFIED | `PatientPage.tsx` mounts `PatientFocusAreasPanel` under title Áreas de foco. `rg function BodyFocus src` is empty. Panel renders two SVGs (`Silhueta de frente` / `Silhueta de costas`) with captions Frente / Costas |
| 2 | Hover de 0,5s numa parte do corpo abre uma abinha com o nome da região | ✓ VERIFIED | `export const HOVER_OPEN_MS = 500`. Fine hover (`(hover: hover) and (pointer: fine)`) starts `setTimeout` then `setOpenKey`. Chip text is `Marcar {label}` / `Desmarcar {label}` from catalog. Reduced motion and coarse pointer skip the delay by design |
| 3 | Clicar na abinha marca ou desmarca aquela parte como área de foco | ✓ VERIFIED | Path has no `onClick` / no `toggle.mutate`. Chip `onClick` → `onChipClick` → `toggle.mutate(openKey)` only. Pending clicks ignored (`aria-busy`) |
| 4 | Partes marcadas ficam destacadas na silhueta e persistem no Supabase, sem mock | ✓ VERIFIED | `selectedKeys` from `focusAreas.regionKey` after `getFocusRegion`. Marked fill `fill-accent/35`. `getPatientById` SELECTs real `patient_focus_areas`. Toggle INSERT/DELETE via supabase client — no hardcoded focus arrays |
| 5 | Quem não pode escrever a ficha vê as áreas, mas não marca | ✓ VERIFIED | `canWrite={canWrite}` from `canWritePatient`. When false: chip unmounted (`showChip` requires `canWrite`), `tabIndex` omitted, `cursor-default`, no hover preview (`showPreview = canWrite && preview`). Saved fills still render. Phase 3 RLS `can_write_patient` not dropped in 06 SQL |
| 6 | Visual simples e minimalista nas cores da clínica — referência de layout, não cópia navy/laranja | ✓ VERIFIED | Tokens `text-forest`, `fill-accent-soft/40`, `fill-accent/20\|35\|45`, `stroke-forest` / `stroke-accent`. `rg #0A1651\|#FF7D16\|Jotform src` empty. Genderless `BODY_OUTLINE` + catalog paths, no muscle striations |
| 7 | FOCUS_REGION_KEYS is the locked UI-SPEC 30-key tuple; forbidden RESEARCH keys absent | ✓ VERIFIED | Runtime: 30 unique keys, 15 front / 15 back, exact UI-SPEC order. No `front.hand_*`, `front.foot_*`, `back.hand_*`, `back.foot_*`, `back.head` |
| 8 | Each catalog entry has Portuguese label, view front\|back, sortOrder, and a closed SVG path | ✓ VERIFIED | All 30 `FOCUS_REGIONS` match UI-SPEC labels; `sortOrder` 0–29; every `path` is a closed `d` with `Z` |
| 9 | PatientFocusArea.regionKey exists; focusRegionKeySchema is z.enum(FOCUS_REGION_KEYS) and the only write-time Zod validator | ✓ VERIFIED | `src/types/patient.ts` `regionKey: string`. Schema imports `FOCUS_REGION_KEYS` into `z.enum`. Only `togglePatientFocusArea` calls `focusRegionKeySchema.parse` |
| 10 | patient_focus_areas has nullable region_key, format CHECK, partial unique index; Phase 3 policies not rewritten | ✓ VERIFIED | Committed SQL + `supabase/` copy are byte-identical. `ADD COLUMN IF NOT EXISTS region_key text` (no SET NOT NULL). CHECK `null or ^(front\|back)\.[a-z0-9_]+$`. Unique index `patient_focus_areas_patient_region_key`. Executable SQL has 0 DROP/CREATE POLICY, 0 CREATE TABLE, 0 service_role. Phase 3 file still defines select/insert/update/delete |
| 11 | Schema was applied in the hosted SQL Editor, not via supabase db push | ? UNCERTAIN | Script forbids `supabase db push`. Hosted apply cannot be queried this run. 06-02 SUMMARY claims human `applied`; 8-check matrix was not fully re-run. See human verification |
| 12 | getPatientById SELECT includes region_key and skips null or unknown keys | ✓ VERIFIED | `FOCUS_COLUMNS = 'id, region_key, label, is_active, sort_order'`. Mapper `flatMap`: skip `region_key == null` and `!getFocusRegion`; display label from catalog |
| 13 | togglePatientFocusArea parses the schema then INSERT or DELETE; unmark deletes the row; errors go through mapDbError | ✓ VERIFIED | Find by `(patient_id, region_key)`. Exists → `.delete()`. Missing → `.insert({ region_key, label, is_active: true, sort_order })`. 23505 on insert returns `'marked'`. `throwIfFocusError` uses `mapDbError`. Existing `throwIfError` left for other functions |
| 14 | useTogglePatientFocusArea invalidates the patient and toasts Área marcada / Área desmarcada | ✓ VERIFIED | `mutationFn: togglePatientFocusArea(patientId, regionKey)`. `onSuccess`: `invalidatePatient` + toast by result. Permission errors keep mapped message; other errors use Não foi possível salvar a área… |
| 15 | Interaction stays on this Resumo card only — no new tab, route, or third-party widget | ✓ VERIFIED | No new `/pacientes` route. Panel is card body only (`mt-3`). No Jotform/Radix Tooltip/Floating UI/Modal |

**Score:** 14/15 truths verified (1 UNCERTAIN — hosted schema apply)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/focusRegions.ts` | 30-key catalog, helpers, SVG paths | ✓ VERIFIED | 293 lines. Exports `FOCUS_REGION_KEYS`, `FOCUS_REGIONS`, `getFocusRegion`, `listFocusRegionsByView`, `focusRegionPathAriaLabel`, `focusRegionListLabel`. No React/permissions import |
| `src/types/patient.ts` | `PatientFocusArea.regionKey` | ✓ VERIFIED | `regionKey: string` on the interface |
| `src/schemas/patient.schema.ts` | `focusRegionKeySchema` from catalog tuple | ✓ VERIFIED | `z.enum(FOCUS_REGION_KEYS)` named export |
| `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` | Idempotent ALTER + CHECK + unique index | ✓ VERIFIED | 64 lines; no policy rewrite |
| `supabase/06-patient-focus-region-key.sql` | SQL Editor paste copy | ✓ VERIFIED | Byte-identical to committed copy (`cmp`) |
| `src/services/patients.service.ts` | FocusRow.region_key, skip map, toggle | ✓ VERIFIED | `togglePatientFocusArea` INSERT/DELETE; mapper skip |
| `src/hooks/usePatients.ts` | `useTogglePatientFocusArea` | ✓ VERIFIED | Wired to service + invalidate + toasts |
| `src/components/patients/PatientFocusAreasPanel.tsx` | SVG map, delayed chip, canWrite hide | ✓ VERIFIED | 289 lines. `HOVER_OPEN_MS`, chip-only mutate, sr-only list, empty copy |
| `src/pages/PatientPage.tsx` | Mounts panel; BodyFocus deleted | ✓ VERIFIED | Card title kept; `canWrite` passed through |

gsd-sdk `verify.artifacts` on plans 01–04: all_passed true (9/9).

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `patient.schema.ts` | `focusRegions.ts` | `FOCUS_REGION_KEYS` → `z.enum` | WIRED | Named import |
| `patient.ts` | `PatientFocusArea` | `regionKey` | WIRED | CamelCase field |
| `PatientPage.tsx` | `PatientFocusAreasPanel` | Resumo card body | WIRED | Replaces BodyFocus + visible ul |
| `PatientFocusAreasPanel.tsx` | `usePatients.ts` | `useTogglePatientFocusArea(patientId)` | WIRED | Hook call with ficha id |
| `PatientFocusAreasPanel.tsx` | chip `onClick` | `toggle.mutate` only on button | WIRED | Paths never call mutate |
| `usePatients.ts` | `patients.service.ts` | `mutationFn togglePatientFocusArea` | WIRED | |
| `patients.service.ts` | `patient_focus_areas` | select/insert/delete `region_key` | WIRED | Real supabase calls |
| `patient_focus_areas` | `private.can_write_patient` | Phase 3 INSERT/DELETE policies left intact | WIRED | 06 SQL has no DROP/CREATE POLICY; Phase 3 still defines the four policies. gsd-sdk reported "Source file not found" because `from` is a table name — manual check used instead |
| `patient_focus_areas` | unique `(patient_id, region_key)` | partial unique index | WIRED | `patient_focus_areas_patient_region_key` in both SQL copies. Live index not queried this run |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `PatientFocusAreasPanel` | `focusAreas` / `selectedKeys` | `PatientPage` `detail.focusAreas` ← `getPatientById` ← `patient_focus_areas` SELECT `region_key` | Yes — DB rows filtered through catalog | ✓ FLOWING |
| `PatientFocusAreasPanel` | chip write | `useTogglePatientFocusArea` → `togglePatientFocusArea` INSERT/DELETE | Yes — supabase, not mock | ✓ FLOWING |
| `PatientFocusAreasPanel` | region paths/labels | `listFocusRegionsByView` / `FOCUS_REGIONS` | Yes — 30 catalog entries with paths | ✓ FLOWING |
| Empty copy | `focusAreas.length === 0` | same SELECT (length 0 after skip) | Yes — leftover null keys do not count | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| 30-key catalog, labels, forbidden keys absent | `node --input-type=module` import `focusRegions.ts` | keys=30 unique, labels match UI-SPEC, forbiddenPresent=false | ✓ PASS |
| BodyFocus gone | `rg function BodyFocus src` | no matches | ✓ PASS |
| HOVER_OPEN_MS = 500 | read panel export + timeout arg | `export const HOVER_OPEN_MS = 500`; timeout uses that constant | ✓ PASS |
| Chip-only writes | `rg onClick\|toggle.mutate` in panel | mutate only in `onChipClick`; path has enter/down/focus only | ✓ PASS |
| SQL copies identical | `cmp` committed vs `supabase/` | SQL_IDENTICAL | ✓ PASS |
| Module helpers export | same node import | `getFocusRegion('front.head')` → Cabeça; unknown → undefined | ✓ PASS |
| Browser hover/touch/empresa | — | not run this verification | ? SKIP |
| Hosted Postgres apply | — | no DB session this run | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/**/tests/probe-*.sh`; PLAN/SUMMARY do not declare probes | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-18 | 06-01, 06-02, 06-03, 06-04 | Silhueta de áreas de foco — marcar partes do corpo na ficha | ✓ SATISFIED (code); UAT human | Catalog + SQL + toggle + panel on Resumo card |
| REQ-18.1 | (acceptance under REQ-18) | Frente/costas instead of stick figure | ✓ SATISFIED | BodyFocus gone; two SVGs |
| REQ-18.2 | | Hover 0.5s opens clickable abinha | ✓ SATISFIED (code) | `HOVER_OPEN_MS = 500`; chip not native `title` |
| REQ-18.3 | | Click abinha marks/unmarks | ✓ SATISFIED | Chip mutate; path does not write |
| REQ-18.4 | | Several parts marked; highlight = saved | ✓ SATISFIED | Unique index in SQL; `selectedKeys` Set from saved keys |
| REQ-18.5 | | Persist `patient_focus_areas`; existing RLS | ✓ SATISFIED (code); hosted apply UNCERTAIN | Service INSERT/DELETE; policies not rewritten |
| REQ-18.6 | | Who cannot write only sees | ✓ SATISFIED (code); empresa UAT human | `canWrite` hide |

**Orphaned requirements:** none. REQUIREMENTS.md maps only REQ-18 to Phase 6. All four plans declare `requirements: [REQ-18]`. REQ-14 / REQ-05 belong to other phases.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase source files | — | — |

Disconfirmation notes (not blockers):

- No unit test for `togglePatientFocusArea` or the 500ms timer — absence of tests is not a fake pass.
- `focusRegionKeySchema.parse` throws ZodError before `mapDbError`; hook falls through to the generic area-save toast. Acceptable.
- 06-02 SUMMARY: 8-check RLS matrix not fully re-run after apply — routed to human verification, not a code gap.

### Human Verification Required

Harvested from 06-04-PLAN.md `<human-check>` and from UNCERTAIN hosted apply. Browser was not used this run.

### 1. Desktop hover, chip, leave, path-only click

**Test:** On a writable ficha, hover a region ~0.5s, move onto the abinha, click, leave the group. Click the path only (no chip).
**Expected:** Abinha shows Marcar {label} after ~0.5s; click marks; leave closes; path-only click does not insert/delete.
**Why human:** Timing and pointer-group travel cannot be proven by grep.

### 2. Keyboard Tab and Escape

**Test:** Tab to a writable region path, then press Escape.
**Expected:** Chip opens on focus; Escape closes and focus returns to that path.
**Why human:** Focus restore is runtime DOM behavior.

### 3. Touch / coarse pointer

**Test:** DevTools coarse pointer or a phone: tap region, then tap abinha.
**Expected:** Chip opens immediately; chip tap toggles; lifting the finger does not dismiss before the second tap.
**Why human:** `matchMedia('(hover: hover) and (pointer: fine)')` needs a real pointer type.

### 4. Empresa colleague ficha

**Test:** Empresa user opens a patient created by someone else, with at least one saved area.
**Expected:** Highlights visible; no chip; no hover preview; cursor default. Banner Somente consulta — você vê a ficha, mas não pode alterar.
**Why human:** Needs two accounts. Client hide is verified; live `can_write_patient` 42501 was not re-probed.

### 5. Empty states

**Test:** Writable patient with no focus rows; consult patient with no focus rows.
**Expected:** Both silhouettes stay. Writable empty: Sem áreas registradas. plus Passe o cursor 0,5 s…. Consult empty: heading only.
**Why human:** Layout/copy on a real ficha.

### 6. Hosted schema / RLS matrix

**Test:** Table Editor or SQL probe on hosted `patient_focus_areas`.
**Expected:** `region_key` nullable; CHECK + `patient_focus_areas_patient_region_key` present; Phase 3 policies still listed. Optional remaining 8-check rows (colleague INSERT 42501, empresa SELECT).
**Why human:** No hosted DB session this verification. Script exists; live apply is not independently observed.

### Gaps Summary

No code gaps. All roadmap success criteria and PLAN must-haves except hosted SQL apply are present, substantive, and wired. Status is `human_needed` because hover/touch/keyboard/empresa UAT and live schema confirmation were not exercised this run — not because the silhouette panel is a stub.

No later milestone phase covers this UAT (Phase 2 is REQ-14, not a successor to Phase 6). Nothing deferred.

---

_Verified: 2026-09-14T21:15:00Z_
_Verifier: Claude (gsd-verifier)_
