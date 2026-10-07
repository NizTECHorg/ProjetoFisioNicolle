---
phase: 26-pdf-botao-gerando-envio-cliente
plan: 03
subsystem: api
tags: [smtp, denomailer, supabase-edge, whatsapp, zod]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: patient-ai-summary JWT client shell and patient-ai-reports bucket
  - phase: 26-pdf-botao-gerando-envio-cliente
    provides: PATIENT_AI_COPY and the saved avaliação or evolução PDF
provides:
  - Helpers that reject placeholder email and phone and normalize Brazilian WhatsApp digits
  - send-patient-document source that emails the PDF from patients.email for the JWT user
  - Client invoke that sends only patientId and reportId
affects: [26-04]

tech-stack:
  added: []
  patterns:
    - "resolvePatientEmail and resolveWhatsAppDigits return missing or invalid; copy stays in PATIENT_AI_COPY"
    - "Edge Function reads patients.email with the user JWT and ignores any address in the JSON body"
    - "denomailer 1.6.0 is a pinned Deno URL, not an npm dependency"

key-files:
  created:
    - src/lib/patientContact.ts
    - src/lib/patientContact.test.ts
    - src/services/patientDocumentSend.service.ts
    - .planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts
  modified:
    - src/schemas/patientAi.schema.ts

key-decisions:
  - "Contact helpers return missing or invalid so the screen can choose the Portuguese sentence"
  - "send-patient-document reads patients.email with the user JWT and ignores any address in the JSON body"
  - "SMTP password stays in FLUXO_SMTP_PASS; denomailer is pinned at 1.6.0 and is not an npm dependency"
  - "REQ-37 stays open because plans 26-02 and 26-04 still own the Gerando button and the send screen"

patterns-established:
  - "Port 465 uses tls true; port 587 uses tls false for STARTTLS"
  - "The client forwards only the known Portuguese send sentences and otherwise uses sendEmailError"

requirements-completed: []

duration: 8min
completed: 2026-10-07
---

# Phase 26 Plan 03: Patient document send Summary

**Usable patient contact plus a Dashboard-ready function that attaches the saved PDF and sends it only to `patients.email`**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-07T00:01:54Z
- **Completed:** 2026-10-07T00:09:25Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `resolvePatientEmail` and `resolveWhatsAppDigits` reject null, blank, and `—`, and a 10- or 11-digit phone gains the `55` prefix.
- `PATIENT_AI_COPY` holds the send sentences, and `patientDocumentSendSchema` accepts only `patientId` and `reportId`.
- `send-patient-document` checks `created_by` against the JWT user, downloads `patient-ai-reports` with that user's client, and attaches `avaliacao.pdf` or `evolucao.pdf`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Contato utilizável e cópia de envio** - `68c960c` (test), `6765a30` (feat)
2. **Task 2: Função send-patient-document e o invoke** - `ba5ecca` (test), `cf34e61` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/lib/patientContact.ts` - Usable email and WhatsApp digits
- `src/lib/patientContact.test.ts` - Contact cases and the REQ-37.3 source contract
- `src/schemas/patientAi.schema.ts` - Send copy and `patientDocumentSendSchema`
- `src/services/patientDocumentSend.service.ts` - Invoke `send-patient-document`
- `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts` - Source to paste in the Dashboard

## Decisions Made

- Contact helpers return `{ ok, email|digits }` or `{ ok: false, reason: 'missing' | 'invalid' }`. The screen maps those reasons to the locked sentences.
- The function selects `email, created_by` on `patients` with the user JWT. A different `created_by` is 403 and does not open SMTP. An address in the JSON body is never read.
- Missing SMTP secrets and send failures return `Não foi possível enviar o e-mail. Tente de novo em instantes.` The client shows that sentence, `sendNeedEmail`, or `sendFileUnavailable`, and does not pass SMTP text through the AI error mapper.
- REQ-37 stays unchecked. Plans 26-02 and 26-04 still own the Gerando button and the send screen. `requirements.mark-complete` was not called.
- The state plan counter stays at 2 of 4. Plan 26-02 still has no summary, so `state.advance-plan` was not called.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] SMTP construction failures stay inside the handler**
- **Found during:** Task 2 (Função send-patient-document e o invoke)
- **Issue:** A throw from `new SMTPClient` would escape `Deno.serve` and could print the connection object, including `FLUXO_SMTP_PASS`.
- **Fix:** Construct, send, and `close()` inside one try/finally. The catch returns the Portuguese send sentence and does not log the error.
- **Files modified:** `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts`
- **Verification:** `node --test src/lib/patientContact.test.ts` passes, and the source still has no password literal.
- **Committed in:** `cf34e61`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The catch keeps the SMTP password out of an unhandled exception. No scope creep.

## Issues Encountered

- `npm run typecheck` fails on four unused helpers already in `src/services/patientAiPdf.service.ts` from plan 26-01: `drawNoteBox`, `drawCalloutBanner`, `drawPageBanner`, and `drawSideBySideBlocks`. This plan's files are not in that error list. Those helpers were left unused on purpose for the clear ficha path and were not edited here. Logged in `deferred-items.md`.
- `node --test src/lib/patientContact.test.ts` passes (12 tests).

## User Setup Required

None in this plan. Pasting `send-patient-document` into the Dashboard and setting `FLUXO_SMTP_HOST`, `FLUXO_SMTP_PORT`, `FLUXO_SMTP_USER`, `FLUXO_SMTP_PASS`, and `FLUXO_SMTP_FROM` belong to plan 26-04. Do not configure the Send Email Hook.

## Next Phase Readiness

- Plan 26-04 can call `sendPatientDocument({ patientId, reportId })` and `resolvePatientEmail` / `resolveWhatsAppDigits`.
- Plan 26-02 is still open. The position stays on plan 2.

## Known Stubs

None. The function is source for the Dashboard and is not deployed from this plan.

## Self-Check: PASSED

- FOUND: src/lib/patientContact.ts
- FOUND: src/lib/patientContact.test.ts
- FOUND: src/schemas/patientAi.schema.ts
- FOUND: src/services/patientDocumentSend.service.ts
- FOUND: .planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts
- FOUND: 68c960c
- FOUND: 6765a30
- FOUND: ba5ecca
- FOUND: cf34e61

---
*Phase: 26-pdf-botao-gerando-envio-cliente*
*Completed: 2026-10-07*
