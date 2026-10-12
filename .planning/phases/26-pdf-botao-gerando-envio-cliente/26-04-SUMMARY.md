---
phase: 26-pdf-botao-gerando-envio-cliente
plan: 04
subsystem: ui
tags: [react, whatsapp, supabase-storage, edge-function]

requires:
  - phase: 26-pdf-botao-gerando-envio-cliente
    provides: send-patient-document invoke from 26-03 and the export composer from 26-02
provides:
  - WhatsApp and email buttons on export and on saved avaliação or evolução PDFs
  - Signed URL of 604800 seconds opened in wa.me only when the window is real
  - Dashboard runbook with SMTP secret names and no stored password
affects: []

tech-stack:
  added: []
  patterns:
    - "Send waits use Button isLoading; Gerando stays on the model buttons"
    - "Success toasts follow a closed https check and a non-null window.open, or a successful invoke"

key-files:
  created:
    - .planning/phases/26-pdf-botao-gerando-envio-cliente/26-USER-SETUP.md
  modified:
    - src/services/patientDocumentSend.service.ts
    - src/components/patients/PatientAiComposer.tsx
    - src/components/patients/PatientAiReportsList.tsx
    - src/components/patients/PatientResumoIaPanel.tsx
    - src/lib/phase26Contract.test.ts

key-decisions:
  - "createSignedUrl for send uses only 604800 seconds; a failed or non-https URL toasts sendFileUnavailable and never success"
  - "sendWhatsAppSuccess runs only after the signed URL starts with https and window.open is not null"
  - "The resend pair mounts only when canWrite is true and the kind is avaliacao or evolucao"
  - "PatientResumoIaPanel passes detail phone and email from the existing usePatient"

patterns-established:
  - "The send service returns a window or a closed failure and does not toast"
  - "Geral, sessão, and read-only accounts do not get the send pair"

requirements-completed: [REQ-37]

duration: 9min
completed: 2026-10-07
---

# Phase 26 Plan 04: Patient PDF send Summary

**WhatsApp and email send for a saved avaliação or evolução, with success only after an https link and an open window, or after the email invoke**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-07T00:27:34Z
- **Completed:** 2026-10-07T00:36:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Export of avaliação and evolução offers Enviar por WhatsApp and Enviar por e-mail under Exportar PDF, using Button isLoading while the signed URL or the invoke runs.
- The saved-PDF list shows the same pair only for writers, and only on avaliação or evolução rows. Abrir and Baixar stay. Geral and sessão do not get the pair.
- A missing contact, a missing file, a failed signed URL, or a blocked popup explains the failure in Portuguese and does not toast success.
- `26-USER-SETUP.md` tells the operator to paste `send-patient-document` in the Dashboard and to store the five `FLUXO_SMTP_*` secrets there, without a host, user, or password in git.

## Task Commits

Each task was committed atomically:

1. **Task 1: Link do WhatsApp e envio no compositor** - `b4d6811` (test), `158689a` (feat)
2. **Task 2: Reenvio na lista, contrato de escrita e runbook** - `51d85cc` (test), `bd521a4` (feat)

**Plan metadata:** docs commit with this summary

## Files Created/Modified

- `src/services/patientDocumentSend.service.ts` - Signs the PDF for 604800 seconds and opens `wa.me` without toasting
- `src/components/patients/PatientAiComposer.tsx` - Remembers the PDF saved in this mount and sends it on the two channels
- `src/components/patients/PatientAiReportsList.tsx` - Resends a row by id and storage path when the viewer can write
- `src/components/patients/PatientResumoIaPanel.tsx` - Passes `detail?.phone` and `detail?.email` into the list
- `src/lib/phase26Contract.test.ts` - REQ-37.3 and REQ-37.5 source contracts
- `.planning/phases/26-pdf-botao-gerando-envio-cliente/26-USER-SETUP.md` - Dashboard steps with secret names only

## Decisions Made

- The signed URL for WhatsApp is created on click with `expiresIn` 604800 and download name `avaliacao.pdf` or `evolucao.pdf`. There is no 86400 fallback.
- `sendWhatsAppSuccess` is reached only when the URL starts with `https` and `window.open` did not return null.
- Email success is `sendEmailSuccess` only when `sendPatientDocument({ patientId, reportId })` does not throw. The request body does not include the recipient.
- The list does not call `usePatient` again. It uses the phone and email already loaded for the resumo panel.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [26-USER-SETUP.md](./26-USER-SETUP.md) for:

- Pasting `functions/send-patient-document/index.ts` as the Edge Function `send-patient-document`
- Storing `FLUXO_SMTP_HOST`, `FLUXO_SMTP_PORT`, `FLUXO_SMTP_USER`, `FLUXO_SMTP_PASS`, and `FLUXO_SMTP_FROM` in Edge Function secrets
- UAT of the real inbox and the WhatsApp conversation after those secrets exist

Do not run `supabase functions deploy` and do not enable the Send Email Hook.

## Next Phase Readiness

- REQ-37.3 and REQ-37.5 are covered in the composer and the saved-PDF list.
- The real email and the `wa.me` chat still depend on the operator following `26-USER-SETUP.md`.
- `node --test src/lib/patientContact.test.ts src/lib/phase26Contract.test.ts src/lib/mobilidadePalpacao.test.ts` passed (34 tests) and `npm run typecheck` passed.

## TDD Gate Compliance

- `test(26-04)` commit `b4d6811` precedes `feat(26-04)` commit `158689a`
- `test(26-04)` commit `51d85cc` precedes `feat(26-04)` commit `bd521a4`

## Self-Check: PASSED

- FOUND: src/services/patientDocumentSend.service.ts
- FOUND: src/components/patients/PatientAiComposer.tsx
- FOUND: src/components/patients/PatientAiReportsList.tsx
- FOUND: src/components/patients/PatientResumoIaPanel.tsx
- FOUND: .planning/phases/26-pdf-botao-gerando-envio-cliente/26-USER-SETUP.md
- FOUND: b4d6811
- FOUND: 158689a
- FOUND: 51d85cc
- FOUND: bd521a4

---
*Phase: 26-pdf-botao-gerando-envio-cliente*
*Completed: 2026-10-07*
