---
phase: 04-atalhos-dashboard
verified: 2026-09-14T15:00:11Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "On /painel as a write-capable clinic user: Nova evolução (primary) and Nova avaliação (secondary) are visible even while metrics load. Picker lists only writable patients (empresa does not see colleague rows). Choosing a patient opens Nova sessão (Agendar/Realizada) or Nova avaliação fields. Salvar sessão / Salvar avaliação closes the overlay, URL stays /painel, one success toast with Ver ficha to ?aba=evolucoes or ?aba=avaliacao. Voltar ao dashboard / X / Escape closes everything with no picker leftover and no success toast. After save there is no Salvar e registrar outra; clicking the header shortcut starts a new picker. Empty writable list shows Ir para pacientes. Save error keeps the form open with Não foi possível salvar. Verifique os campos e tente de novo."
    expected: "REQ-16 reachable from /painel without entering the ficha first; D-01–D-04 hold on the overlay."
    why_human: "Planner-deferred end-of-phase check. Overlay flow, toast click, URL stability, visual primary/secondary, and empresa picker omission cannot be proven by grep."
---

# Phase 4: Atalhos no dashboard Verification Report

**Phase Goal:** No dashboard, o profissional inicia uma evolução ou uma avaliação sem entrar na ficha primeiro — escolhe o paciente e cai no fluxo que já existe.
**Verified:** 2026-09-14T15:00:11Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Must-haves merged from ROADMAP success criteria (non-negotiable) plus PLAN 04-01–04-04 truths. PLAN wording that restates a roadmap SC keeps the roadmap contract. ROADMAP SC3 says reuse `PatientEvolutionsPanel` / `PatientEvaluationPanel`; CONTEXT D-01–D-04 and plans 04-02/04-03 lock extraction so the dashboard mounts `PatientSessionEditorForm` / `PatientEvaluationEditorForm` (the same editors the ficha panels wrap). That locked decision is what was verified.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | O dashboard tem botões/ações para Nova evolução e Nova avaliação | ✓ VERIFIED | `DashboardClinicalShortcut` renders primary **Nova evolução** and secondary **Nova avaliação**. `DashboardPage` mounts it as `PageHeader` `action` above the loading/error body. |
| 2 | Cada ação pede o paciente (e a sessão, se for evolução) e abre o formulário existente | ✓ VERIFIED | Picker Modal asks for the patient, then the editor step mounts the extracted session or evaluation form. CONTEXT locks “Nova evolução” to the existing **Nova sessão** editor (Agendar / Realizada), not a second picker of existing sessions. |
| 3 | Não existe um segundo CRUD; reutiliza os editores da ficha (forms extraídos, não os painéis completos) | ✓ VERIFIED | Shortcut imports `PatientSessionEditorForm` / `PatientEvaluationEditorForm` only. Those forms use `sessionFormSchema` / `evaluationFormSchema` and `useCreatePatientSession` / `useCreatePatientEvaluation`. No `PatientEvolutionsPanel`, `PatientEvaluationPanel`, or `CalendarPage` on the dashboard. |
| 4 | Empresa em ficha de colega (consulta) não cria por esses atalhos | ✓ VERIFIED | Picker lists `writablePatients(patients, user?.id)` (`canWritePatient` = viewer === `createdBy`; fail-closed if no `viewerId`). `selectPatient` re-checks `canWritePatient` before opening the editor. Colleague rows are omitted, not disabled. RLS remains the authority (no new SQL this phase). |
| 5 | Save and cancel stay on the dashboard overlay; cancel/X/backdrop/Escape close the whole shortcut with no leftover picker and no success toast (D-01, D-02) | ✓ VERIFIED | Wizard state lives in the component (not a URL query). `closeShortcut` → `{ step: 'closed' }`. Picker and editor `Modal.onClose`, form `onCancel`, and form `onSuccess` all call `closeShortcut`. Header click calls `openPicker` (resets to picker). Success toast is only in the create-hook `onSuccess`, not on cancel. |
| 6 | Success toast can carry Ver ficha to `/pacientes/:id?aba=evolucoes` or `?aba=avaliacao`, gated by `isSafeInternalPath` (D-03) | ✓ VERIFIED | Shortcut passes `successAction` via `patientFichaPath`. Create hooks `toast('Sessão salva'/'Avaliação salva', 'success', { action })`. `ToastViewport` renders `Link` only when `isSafeInternalPath(item.action.href)`. |
| 7 | Next record is a new shortcut click; no Salvar e registrar outra (D-04) | ✓ VERIFIED | Repo-wide grep finds zero `Salvar e registrar outra`. After save the overlay closes; another header click calls `openPicker`. |
| 8 | `writablePatients` omits rows where `canWritePatient` is false | ✓ VERIFIED | `src/lib/dashboardShortcut.ts`: missing `viewerId` returns `[]`; otherwise filters with `canWritePatient`. Shortcut consumes that list. |
| 9 | Existing `toast(message, tone)` callers still compile and auto-dismiss at 4200ms | ✓ VERIFIED | `toast` third arg is optional. `push` uses 6000ms only when `action` is present, else 4200ms. Existing two-arg call sites in hooks/pages remain valid. |
| 10 | Ficha still lists, edits, and deletes sessões via `PatientEvolutionsPanel` wrapping the extracted form | ✓ VERIFIED | Panel still calls `usePatientSessions`, **Nova sessão**, pencils, trash, `ConfirmDialog`. Modal children are `PatientSessionEditorForm` with `Cancelar` / `Salvar`. `PatientPage` still mounts the panel. |
| 11 | Ficha avaliação stays inline and still lists, edits, deletes, and imports PDF | ✓ VERIFIED | Panel still calls `usePatientEvaluations`, chips, `Importar avaliação de PDF (IA)`, `ConfirmDialog`, `PatientPhysicalEvaluationPanel`. Inline wrapper (not Modal) mounts `PatientEvaluationEditorForm`. |
| 12 | Header shortcuts stay visible while the dashboard body is loading, in error, or empty (REQ-16.1 / REQ-16.4) | ✓ VERIFIED | `PageHeader` with the shortcut sits above the `isLoading` / `isError` branches. Shortcut buttons are not gated on `isLoading`, `isError`, or writable count. Empty writable list is explained inside the picker (`Ir para pacientes`). |

**Score:** 12/12 truths verified (code). Overlay UX still needs human UAT.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/dashboardShortcut.ts` | writable filter, name filter, ficha deep-link, search threshold | ✓ VERIFIED | 45 lines. Exports `writablePatients`, `filterPatientsByName`, `patientFichaPath`, `PATIENT_SEARCH_THRESHOLD`. Wired from shortcut. |
| `src/stores/toast.store.ts` | optional `ToastAction` on `ToastItem` | ✓ VERIFIED | `ToastAction`, optional `action` on item, `toast(..., options?)`. |
| `src/components/ui/ToastViewport.tsx` | Ver ficha `Link` only when href is safe | ✓ VERIFIED | `isSafeInternalPath` before `Link`. |
| `src/hooks/usePatients.ts` | create-session/evaluation toast options | ✓ VERIFIED | `toastOptions?: { action?: ToastAction; errorMessage?: string }` on both create hooks. `gsd-sdk` `contains: successAction` is a false negative — the hook uses `toastOptions.action` (plan interface). |
| `src/components/ui/Modal.tsx` | accessible close control | ✓ VERIFIED | Backdrop and X both `aria-label="Fechar"`; X has `min-h-11 min-w-11`. |
| `src/components/patients/PatientSessionEditorForm.tsx` | extracted session create/edit form | ✓ VERIFIED | 266 lines. Named export, Agendar/Realizada, `sessionFormSchema`, create/update hooks. |
| `src/components/patients/PatientEvolutionsPanel.tsx` | list + Modal wrapping extracted form | ✓ VERIFIED | Imports and renders `PatientSessionEditorForm` inside Modal. |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | extracted evaluation fields | ✓ VERIFIED | 207 lines. `FIELD_SECTIONS` História/Funcional/Exame/Conduta. Does not import list/PDF/ConfirmDialog. |
| `src/components/patients/PatientEvaluationPanel.tsx` | inline chrome wrapping form + list/PDF/delete | ✓ VERIFIED | Inline wrapper + list + PDF import + `ConfirmDialog`. |
| `src/components/patients/DashboardClinicalShortcut.tsx` | wizard, picker Modal, create-only editor | ✓ VERIFIED | 217 lines. Named export. Picker then editor; never two Modals. |
| `src/pages/DashboardPage.tsx` | PageHeader action cluster above loading/error | ✓ VERIFIED | `action={<DashboardClinicalShortcut />}`. `gsd-sdk` `contains: Nova evolução` is a false negative — copy lives in the child by plan (Task 1 owns the cluster). |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `usePatients.ts` | `toast.store.ts` | `toast(..., { action })` | WIRED | Create hooks pass `{ action: toastOptions.action }` on success. |
| `ToastViewport.tsx` | `security/index.ts` | `isSafeInternalPath` before Link | WIRED | Guard wraps the `Link`. |
| `dashboardShortcut.ts` | `accountAccess.ts` | `canWritePatient` | WIRED | Filter + fail-closed. |
| `PatientSessionEditorForm.tsx` | `patient.schema.ts` | `sessionFormSchema` + `zodResolver` | WIRED | |
| `PatientSessionEditorForm.tsx` | `usePatients.ts` | `useCreatePatientSession` | WIRED | `mutate(input, { onSuccess })` only closes chrome. |
| `PatientEvolutionsPanel.tsx` | `PatientSessionEditorForm.tsx` | Modal children | WIRED | |
| `PatientEvaluationEditorForm.tsx` | `evaluation.schema.ts` | `evaluationFormSchema` + `emptyEvaluationForm` | WIRED | |
| `PatientEvaluationEditorForm.tsx` | `usePatients.ts` | `useCreatePatientEvaluation` | WIRED | |
| `PatientEvaluationPanel.tsx` | `PatientEvaluationEditorForm.tsx` | inline wrapper | WIRED | |
| `DashboardPage.tsx` | `DashboardClinicalShortcut.tsx` | PageHeader action | WIRED | |
| `DashboardClinicalShortcut.tsx` | `dashboardShortcut.ts` | `writablePatients` + `patientFichaPath` | WIRED | |
| `DashboardClinicalShortcut.tsx` | `PatientSessionEditorForm.tsx` | editor step evolucao | WIRED | |
| `DashboardClinicalShortcut.tsx` | `PatientEvaluationEditorForm.tsx` | editor step avaliacao | WIRED | |

`gsd-sdk query verify.key-links` returned `all_verified: true` for plans 01–04 (13/13).

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `DashboardClinicalShortcut` | `patients` → `writable` | `usePatients()` → `listPatients` | Yes — patient list query, then UX write filter | ✓ FLOWING |
| `DashboardClinicalShortcut` picker rows | `filtered` | `filterPatientsByName(writable, query)` | Yes — derived from fetched list; empty well is `writable.length === 0`, not hardcoded fake patients | ✓ FLOWING |
| `PatientSessionEditorForm` (shortcut) | create payload | `useCreatePatientSession` → `createPatientSession` → `supabase.from('patient_sessions').insert` (+ evolutions when `realizada`) | Yes | ✓ FLOWING |
| `PatientEvaluationEditorForm` (shortcut) | create payload | `useCreatePatientEvaluation` → `createPatientEvaluation` → `supabase.from('patient_evaluations').insert` | Yes | ✓ FLOWING |
| Success toast Ver ficha | `successAction.href` | `patientFichaPath(patientId, 'evolucoes'\|'avaliacao')` passed into create-hook toast options | Yes — not a static `/` or empty href | ✓ FLOWING |

No hollow props: shortcut does not pass `editing` (create-only). Ficha panels pass real `editing` from list state.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| writablePatients omits colleagues and fail-closes without viewerId; patientFichaPath aba contract | Python mirror of `dashboardShortcut.ts` predicates | `writablePatients+patientFichaPath logic PASS` | ✓ PASS |
| No second CTA copy | `grep -R "Salvar e registrar outra" src/` | zero matches | ✓ PASS |
| Shortcut does not mount full ficha panels | grep panels/ConfirmDialog/CalendarPage in `DashboardClinicalShortcut.tsx` | zero matches | ✓ PASS |
| Overlay URL / toast click / empresa picker | needs running app + clinic accounts | not executed (no server start; keep verification fast) | ? SKIP |

Step 7b: runnable helpers checked; interactive overlay skipped.

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh` and no probe declared in PLAN/SUMMARY | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-16 | 04-01, 04-02, 04-03, 04-04 | Atalhos no dashboard para criar evolução ou avaliação | ✓ SATISFIED (code; human UAT pending) | Acceptance 1–4 mapped below. |
| REQ-16.1 | 04-04 | Dashboard mostra ações para evolução e avaliação | ✓ SATISFIED | Header buttons always visible. |
| REQ-16.2 | 04-02, 04-03, 04-04 | Pede o paciente e abre o formulário existente — não um segundo CRUD | ✓ SATISFIED | Picker + extracted forms sharing schema/hooks. Session is the Nova sessão editor, not a parallel CRUD. |
| REQ-16.3 | 04-01, 04-04 | Quem não pode escrever a ficha não cria por esses atalhos | ✓ SATISFIED | `writablePatients` + re-check; hide not disable. |
| REQ-16.4 | 04-04 | Autônomo, empresa (próprias fichas) e fisioterapeuta ativo usam os atalhos | ✓ SATISFIED | Buttons are not gated by `accountType`; write filter is `createdBy`. Clinic access gating remains Phase 3. |

**Orphaned requirements:** none. REQUIREMENTS.md maps only REQ-16 to Phase 4; every plan declares `requirements: [REQ-16]`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `DashboardClinicalShortcut.tsx` / `Modal.tsx` / create hooks | 50–53, 177–213 (shortcut); Modal Escape/backdrop/X always `onClose` | Unmount while `useMutation` is pending can persist the insert without hook `onSuccess` (no toast, no `invalidatePatient`) | ⚠️ Warning | Review CR-01. Does not falsify D-02 wiring (close still goes to `closed`). Happy-path save is still wired. Not a must-have FAIL. |
| `PatientSessionEditorForm.tsx` | 90–120 | `useEffect` reset depends on `therapists` array identity | ⚠️ Warning | Review CR-02. Can wipe in-progress notes on refetch. Form is still the real editor, not a stub. |
| Phase-touched files | — | `TBD` / `FIXME` / `XXX` | none | No debt-marker blockers. |
| `Salvar e registrar outra` | — | placeholder second CTA | none | Absent as required (D-04). |

Code review (`.planning/phases/04-atalhos-dashboard/04-REVIEW.md`, `issues_found`) was treated as advisory. CR-01/CR-02 and WR-* do not by themselves fail roadmap SCs or PLAN must-haves; they are quality risks for UAT.

### Human Verification Required

Harvested from 04-04-PLAN.md `<human-check>` (only PLAN in this phase with a deferred human block). Split below for execution; it is one UAT pass.

### 1. Header shortcuts visible during dashboard load

**Test:** Open `/painel` as a write-capable clinic user. Watch the header while metrics are still loading, on error, and on an empty clinic.
**Expected:** **Nova evolução** (primary) and **Nova avaliação** (secondary) stay visible and clickable. Buttons are not hidden when there are zero writable patients.
**Why human:** Loading/empty visual state and Button variants are not proven by grep.

### 2. Picker → existing form → stay on /painel (D-01–D-04)

**Test:** Click each shortcut. Choose a writable patient. Confirm **Nova sessão** (Agendar / Realizada) or **Nova avaliação** fields. Save. Click **Ver ficha**. Repeat with Voltar ao dashboard / X / Escape. Click the header again after save. Trigger a save error (invalid fields / offline). With an empty writable list, use **Ir para pacientes**.
**Expected:** URL stays `/painel` until Ver ficha or Ir para pacientes. One success toast with Ver ficha to `?aba=evolucoes` or `?aba=avaliacao`. Cancel/X/Escape closes everything with no leftover picker and no success toast. No **Salvar e registrar outra**. Save error keeps the editor open with **Não foi possível salvar. Verifique os campos e tente de novo.**
**Why human:** Overlay, toast click, and URL stability need a browser.

### 3. Empresa colleague fichas omitted from the picker (REQ-16.3)

**Test:** Sign in as empresa with at least one patient created by a colleague (consulta) and one created by the empresa user. Open **Nova evolução**.
**Expected:** Colleague rows are absent (not shown disabled). Own patients appear. Creating from the shortcut only binds to a writable `patientId`.
**Why human:** Needs two account identities and live RLS-backed data.

### Gaps Summary

No must-have gaps. The phase goal is implemented in code: dashboard header shortcuts, writable-patient picker, create-only overlays that reuse the ficha editors, stay-on-dashboard save/cancel, Ver ficha toast, and no second CRUD.

Remaining work is human UAT of the overlay (planner-deferred). Advisory review issues (unmount-during-save, session form reset on therapist refetch) should be watched during that UAT; they are not verification blockers.

---

_Verified: 2026-09-14T15:00:11Z_
_Verifier: Claude (gsd-verifier)_
