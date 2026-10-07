---
phase: 26-pdf-botao-gerando-envio-cliente
reviewed: 2026-10-07T00:49:39Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/components/patients/PatientAiComposer.tsx
  - src/components/patients/PatientAiReportsList.tsx
  - src/components/patients/PatientResumoIaPanel.tsx
  - src/components/ui/AiGeneratingButton.tsx
  - src/components/ui/ConfirmDialog.tsx
  - src/index.css
  - src/lib/patientContact.test.ts
  - src/lib/patientContact.ts
  - src/lib/phase26Contract.test.ts
  - src/schemas/patientAi.schema.ts
  - src/services/patientAiPdf.service.ts
  - src/services/patientDocumentSend.service.ts
  - .planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
resolutions: CR-01, WR-01 and WR-02 fixed before verification. IN-01 left. IN-02 comments stay because phase 25 source tests use them as anchors.
---

# Phase 26: Code Review Report

**Reviewed:** 2026-10-07T00:49:39Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The send Edge Function keeps the destination on the patient row (`patients.email`), refuses the call unless `created_by` is the JWT user, downloads the PDF with that same user client, and does not log the SMTP password or a signed URL.

CR-01, WR-01, and WR-02 were fixed before verification. WhatsApp now opens with `window.open(href, '_blank')` and sets `popup.opener = null` only after a non-null handle. The composer drops the saved report when the patient changes. The signed URL and the email function both refuse a storage path whose first folder is not the patient id. IN-01 and IN-02 remain.

## Critical Issues

### CR-01: WhatsApp success is reported as a blocked popup

**File:** `src/services/patientDocumentSend.service.ts:119-125`
**Issue:** `openPatientDocumentWhatsApp` calls `window.open(href, '_blank', 'noopener,noreferrer')` and treats a `null` return as failure. With `noopener` (and `noreferrer`, which implies it), the browser opens the new tab and still returns `null`, because there is no opener handle. `PatientAiComposer` (lines 429-432) and `PatientAiReportsList` (lines 112-115) then toast `sendWhatsAppBlocked` and skip `sendWhatsAppSuccess`. A send that opened WhatsApp is shown as "O WhatsApp não abriu", and the success toast never runs. A real popup block is indistinguishable, so the error path cannot be used while `noopener` is in the feature string. `phase26Contract.test.ts` currently requires this `noopener` plus `null` check, so that assertion locks the bug in.
**Fix:**

```ts
export function openPatientDocumentWhatsApp(digits: string, signedUrl: string): Window | null {
  if (!signedUrl.startsWith('https://')) return null
  if (!/^\d{12,13}$/.test(digits)) return null
  const text = `${PATIENT_AI_COPY.whatsappMessage} ${signedUrl}`
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  const popup = window.open(href, '_blank')
  if (popup === null) return null
  popup.opener = null
  return popup
}
```

Update the phase 26 contract test so it expects `opener = null` after a bare `window.open`, and no longer requires the `noopener` feature string.

## Warnings

### WR-01: Composer can WhatsApp the previous patient's PDF

**File:** `src/components/patients/PatientAiComposer.tsx:95-99`
**Issue:** `savedReport` is component state and is never cleared when `patientId` changes. `/pacientes/:id` reuses `PatientPage`, so moving from `/pacientes/A?aba=resumo-ia` to `/pacientes/B?aba=resumo-ia` keeps this composer mounted. `handleSendWhatsApp` (lines 417-429) then signs `savedReport.storagePath` and opens WhatsApp on the current patient's phone (`detail?.phone`). Email does not have this hole: `sendPatientDocument` sends the current `patientId` with the report id, and the function requires `patient_ai_reports.patient_id` to match. List resend is also safe because it uses the row on screen.
**Fix:**

```tsx
useEffect(() => {
  setSavedReport(null)
  setSending(null)
}, [patientId])
```

Ignore `createReport` `onSuccess` when the patient id captured at export time is no longer `patientId`.

### WR-02: Send attaches whatever storage path is on the report row

**File:** `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts:167-173`
**Issue:** After the owner check, the function downloads `report.storage_path` with the user JWT. The table check only requires `uuid/uuid.pdf`; it does not require the first segment to be `patient_id`. Storage read is `can_read_patient` on that folder, which is true for the org owner on every therapist's files. An owner who also created the destination patient can insert a report on their patient whose path points at another patient's object, then this function emails that PDF to `patients.email`. The app's uploader writes `${patientId}/${reportId}.pdf`, so the UI does not do this; the function still trusts the row.
**Fix:**

```ts
const folder = report.storage_path.split('/')[0]?.toLowerCase() ?? ''
if (folder !== patientId.toLowerCase()) {
  return portugueseError(FILE_UNAVAILABLE, 404)
}
```

Apply the same prefix check in `signPatientDocumentUrl` before `createSignedUrl`, using the patient id of the ficha being contacted.

## Info

### IN-01: Times Roman is embedded and never drawn

**File:** `src/services/patientAiPdf.service.ts:2095`
**Issue:** `timesBold` is embedded into every PDF and stored on `DrawContext`, and no draw call uses it.
**Fix:** Drop the embed and the `timesBold` field until a title actually needs that face.

### IN-02: Leftover frame markers in the força / neuro draw

**File:** `src/services/patientAiPdf.service.ts:1373`
**Issue:** `// drawFichaBlockFrame(ctx, 'C'` and the matching line before section D are unfinished comments left from the block-frame removal. They are not executed.
**Fix:** Delete both comment lines.

---

_Reviewed: 2026-10-07T00:49:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
