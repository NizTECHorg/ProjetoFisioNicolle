# Phase 26: PDF, botão Gerando e envio ao cliente - Pattern Map

**Mapped:** 2026-10-06
**Files analyzed:** 12
**Analogs found:** 12 / 12

Do not edit `src/components/ui/Button.tsx` `isLoading` (spinner + `Aguarde...` stays). Do not edit `patient-ai-summary` (phase 11, phase 13, or `supabase/functions/`). No SQL, no `supabase/migrations`, no new npm package. The phase-13 function below is a read-only analog for the new function.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/ui/AiGeneratingButton.tsx` | component | request-response | `src/components/ui/Button.tsx` | role-match |
| `src/components/ui/ConfirmDialog.tsx` | component | request-response | `src/components/ui/ConfirmDialog.tsx` | exact |
| `src/components/patients/PatientAiComposer.tsx` | component | request-response | `src/components/patients/PatientAiComposer.tsx` | exact |
| `src/components/patients/PatientAiReportsList.tsx` | component | request-response | `src/components/patients/PatientAiReportsList.tsx` | exact |
| `src/index.css` | config | transform | `src/index.css` (`.landing-fade` + `prefers-reduced-motion`) | exact |
| `src/services/patientAiPdf.service.ts` | service | file-I/O | `src/services/patientAiPdf.service.ts` | exact |
| `src/services/patientDocumentSend.service.ts` | service | request-response | `src/services/patientAi.service.ts` + `src/services/patientAiReports.service.ts` | role-match |
| `src/lib/patientContact.ts` | utility | transform | `src/services/patients.service.ts` `emptyToNull` + `src/lib/accountAccess.ts` | role-match |
| `src/schemas/patientAi.schema.ts` | model | transform | `src/schemas/patientAi.schema.ts` | exact |
| `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts` | controller | request-response | `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` | role-match |
| `src/lib/patientContact.test.ts` | test | transform | `src/lib/patientSummary.test.ts` | exact |
| `src/lib/phase26Contract.test.ts` | test | transform | `src/lib/patientSummaryContract.test.ts` + `src/lib/mobilidadePalpacao.test.ts` | exact |

## Pattern Assignments

### `src/components/ui/AiGeneratingButton.tsx` (component, request-response)

**Analog:** `src/components/ui/Button.tsx`

New file. Copy the button shell (forwardRef, `disabled`, `className` join, `min` touch via existing `px-6 py-3.5`). Do not add or branch `isLoading`. While generating, render the literal word `Gerando`, Lucide `Star` at 16px (`aria-hidden`), class `ai-generating`, `disabled`, `aria-busy="true"`. Idle state renders `children` with no glow.

Icon size analog is the list, not Button: `Trash2 size={16}` in `PatientAiReportsList.tsx` line 148. `Mail` for the e-mail button comes from the same `lucide-react` import style (line 2 of that file).

**Imports / shell** (`src/components/ui/Button.tsx` lines 1-43):

```tsx
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
    // ...
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[baseStyles, variants[variant], fullWidth ? 'w-full' : '', className].join(' ')}
        {...props}
      >
```

**Do not copy this branch** (`Button.tsx` lines 45-52). It stays the global loading UI for Salvar, Excluir, export upload, and the field picker:

```tsx
{isLoading ? (
  <>
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <span>Aguarde...</span>
  </>
) : (
  children
)}
```

---

### `src/components/ui/ConfirmDialog.tsx` (component, request-response)

**Analog:** itself. Add an optional prop, default off, so every existing caller keeps `Button` + `isLoading`. Only the resumo replace dialog opts into `AiGeneratingButton` on the confirm control. Cancel stays `Button` secondary, no glow. Delete dialog in the reports list keeps `isLoading={deleteReport.isPending}`.

**Current confirm control** (lines 43-55):

```tsx
<Button
  fullWidth
  className={[
    'sm:w-auto',
    tone === 'danger' ? '!bg-error !text-white hover:!bg-error/90' : '',
  ]
    .filter(Boolean)
    .join(' ')}
  onClick={onConfirm}
  isLoading={isLoading}
>
  {confirmLabel}
</Button>
```

Keep `gap-3` on the action row (line 32). Do not change `Button` padding.

---

### `src/components/patients/PatientAiComposer.tsx` (component, request-response)

**Analog:** itself.

**Fail-closed write** (lines 38-41 and 96):

```tsx
/** Fail-closed — unmount write chrome when false. */
canWrite?: boolean
// ...
if (!canWrite) return null
```

The composer already hides the whole card without write, so the new send pair does not need a second `canWrite` check here.

**Model vs file save** (lines 146-166 and 195-200): `setGenerating(true)` wraps `generatePatientAiSummary` and, on the evolução branch only, `generateEvolucaoSynthesis`. That boolean is the Gerando window. `createReport.isPending` is file save and stays `Button` `isLoading` (`Aguarde...`).

```tsx
async function handleGenerate() {
  if (busy) return
  setGenerating(true)
  try {
    await generatePatientAiSummary({ patientId, userHint: hint.length > 0 ? hint : undefined })
    invalidatePatient(qc, patientId)
    toast(PATIENT_AI_COPY.generateSuccess, 'success')
  } catch (error) {
    toast(error instanceof Error ? error.message : PATIENT_AI_COPY.generateError, 'error')
  } finally {
    setGenerating(false)
  }
}
```

**Split the export button** (lines 532-539). Today one `isLoading` covers both waits:

```tsx
<Button
  type="button"
  className="w-full sm:w-auto"
  isLoading={generating || (createReport.isPending && !pickerOpen)}
  disabled={exportDisabled}
  onClick={() => void handleExport()}
>
  {PATIENT_AI_COPY.ctaExport}
</Button>
```

Use `AiGeneratingButton` only while `generating` on **Gerar resumo** (lines 440-448) and on evolução export during synthesis. Avaliação export never sets `generating` before the picker; it stays `Button`. Picker confirm stays `confirming={createReport.isPending}` (lines 544-551) and `PatientAiFieldPicker` keeps `Button` `isLoading`.

**Replace dialog** (lines 554-567) is the only `ConfirmDialog` that requests the Gerando confirm visual:

```tsx
<ConfirmDialog
  open={confirmOpen}
  confirmLabel={PATIENT_AI_COPY.regenerateConfirmLabel}
  cancelLabel={PATIENT_AI_COPY.regenerateCancelLabel}
  tone="danger"
  autoFocusCancel
  isLoading={generating}
  onConfirm={() => {
    void handleGenerate().finally(() => setConfirmOpen(false))
  }}
/>
```

**Toast** (import line 27): `toast(message, 'error' | 'success')` from `@/stores/toast.store`. Missing contact, missing saved PDF, popup blocked, and SMTP failure use that path and do not toast success.

Send pair sits under **Exportar PDF** in both PDF scopes. Order: WhatsApp, then e-mail. Secondary chrome: `Button` `variant="secondary"` or the same surface/line/ink classes. `min-h-11`. Icon 16px, 8px gap. Full width on narrow, `sm:` row with 8px between. While the e-mail invoke or the signed URL is in flight, that control uses `Button` `isLoading` (`Aguarde...`), not Gerando.

Patient e-mail and phone are already on `usePatient` → `detail` (`patients.service.ts` maps null to `'—'`). Pass them through `patientContact` helpers. Do not use `emergencyPhone`.

---

### `src/components/patients/PatientAiReportsList.tsx` (component, request-response)

**Analog:** itself.

**`canWrite` hides destructive chrome; Abrir and Baixar stay** (lines 122-150):

```tsx
<div className="flex shrink-0 flex-wrap items-center gap-1">
  <button type="button" aria-label="Abrir" /* ... */>Abrir</button>
  <button type="button" aria-label="Baixar" /* ... */>Baixar</button>
  {canWrite ? (
    <button type="button" aria-label="Excluir" onClick={() => setPendingDelete(report)}>
      <Trash2 size={16} />
    </button>
  ) : null}
</div>
```

Insert the send pair only when `canWrite` and `report.kind` is `avaliacao` or `evolucao`, between Baixar and Excluir. `geral` and `sessao` rows do not get the pair. Delete `ConfirmDialog` (lines 157-175) stays `isLoading={deleteReport.isPending}`.

**`window.open` guard** (lines 28-31). WhatsApp must treat a null return as failure and must not toast success. Same options: `'_blank', 'noopener,noreferrer'`.

```tsx
function openReport(report: PatientAiReport) {
  if (!report.signedUrl) return
  window.open(report.signedUrl, '_blank', 'noopener,noreferrer')
}
```

List URLs expire in 3600s and `createPatientAiReport` returns `signedUrl: null`. On WhatsApp click, create a new signed URL (see reports service). Do not reuse `report.signedUrl` as proof the patient can open the file.

---

### `src/index.css` (config, transform)

**Analog:** token block lines 3-14 and reduced-motion lines 244-255.

Accent is already `#2f7dff` (`--color-accent`, line 6). Do not add a color token. Add `.ai-generating` / `@keyframes ai-glow` next to the landing motion block. The existing media query does not cover a new class; include `.ai-generating` with `animation: none` and a static blue shadow (`0 0 16px 4px rgba(47, 125, 255, 0.45)` per UI-SPEC). No other button uses this class.

```css
@media (prefers-reduced-motion: reduce) {
  .landing-fade {
    animation: none;
    opacity: 1;
  }
  .dash-in,
  .dash-line,
  .dash-ring {
    animation: none !important;
  }
}
```

---

### `src/services/patientAiPdf.service.ts` (service, file-I/O)

**Analog:** itself. Restyle only `kind: 'avaliacao' | 'evolucao'`. `drawGeral` (line 793) and `drawSessao` (line 826) stay.

**Dispatch** (lines 2546-2557). `footerKind === 'ficha'` is set only for those two kinds (line 2543), so the ficha branch of `drawHeaderBand` (lines 311-349) and `drawFooter` (lines 279-308) is the header/footer to replace. Geral and sessão use the `fluxo` branch.

```tsx
if (input.kind === 'geral') {
  drawGeral(ctx, input)
} else if (input.kind === 'sessao') {
  drawSessao(ctx, input)
} else if (input.kind === 'evolucao') {
  ctx.footerKind = 'ficha'
  drawEvolucao(ctx, input)
} else {
  drawAvaliacao(ctx, input)
}
```

**Logo already embedded** (lines 9-10 and 2518-2522): `import logoUrl from '@/assets/brand/logo.png'`, `embedPng`. New header uses that image at 32pt, title 20pt Helvetica-Bold (`Avaliação` / `Evolução`), 48×4pt bar in `COLORS.accent` (line 35, `#2f7dff`), patient name 16pt only if filled, meta 14pt `COLORS.muted` only if date or therapist exists. Page stays white (`COLORS.white`). Do not copy the dark theme.

**Empty field skip — keep** (lines 848-887):

```tsx
function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function drawTwoColumnFields(ctx: DrawContext, fields: Array<[string, string | undefined]>): void {
  const filled = fields.filter(([, v]) => textFilled(v)) as Array<[string, string]>
  if (filled.length === 0) return
  // ...
}

function drawOptionalField(...): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && !value.trim()) return false
  // ...
  return true
}
```

Stop calling `drawPageBanner` and `drawFichaBlockFrame` from `drawAvaliacao` (first banner line 1664) and `drawEvolucao` (line 2425). Section title is the readable name only, 20pt, no letter and no `BLOCO`. 24pt before the title, 8pt before the first field, 16pt between fields. Checked options become one comma-separated line (`checkedLabels`, lines 852-870). No checkbox squares, no `Não informado`, no `Sem dados`, no em dash as filler.

**Empty table cell** — sole caller is avaliação block C at line 2210. Evolução, geral, and sessão do not call `drawDataTable`. Inside `drawDataTable` (lines 1267-1268 and 1343-1344) an empty cell is forced to `'—'`, then `wrapLines` draws it:

```tsx
const text = cells[i]?.trim() ? cells[i]! : '—'
const lines = wrapLines(ctx.font, text, fontSize, w)
// ...
const cellText = cells[i]?.trim() ? cells[i]! : '—'
const lines = wrapLines(ctx.font, cellText, fontSize, Math.max(8, cw - padX * 2))
```

Skip `drawText` when the cell is empty. Do not pass `''` into `wrapLines`.

**Do not change `wrapLines` or `toWinAnsiSafe`.** Both are shared. `wrapLines` (lines 208-209) turns a blank string into `'—'`. `toWinAnsiSafe` (lines 198-206) maps U+2014 to `-` and unknown chars to `?`.

**Arrow stays on the drawn string only** (lines 2192-2199). Contract test already asserts this (`mobilidadePalpacao.test.ts` lines 1252-1253):

```tsx
formatCabecalhoRegiao(regiao, { incluirNome: true }).replaceAll('→', '->')
```

**Footer today** (lines 287-290) for ficha is a form caption and hides the page number. Avaliação/evolução footer becomes `Fluxo` plus page number, 14pt, `COLORS.muted`, no clinical sentence. Change the ficha branch only.

`SIZE` (lines 46-54) is shared (title 16, body 9.5). Do not retune it globally. Use 14 / 16 / 20 only on the avaliação and evolução draw path.

---

### `src/services/patientDocumentSend.service.ts` (service, request-response)

**Analog:** `generatePatientAiSummary` in `src/services/patientAi.service.ts` for invoke and error mapping. **Analog:** `src/services/patientAiReports.service.ts` for the bucket and signed URL.

**Invoke** (patientAi.service.ts lines 1, 135-149):

```tsx
import { supabase } from '@/lib/supabase/client'

const parsed = patientAiSummaryInvokeSchema.parse(input)
const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
  body: { patientId: parsed.patientId, userHint: parsed.userHint },
})
if (error) {
  const payload = await readFunctionsErrorPayload(error, data)
  throwMappedFunctionsError(payload)
}
```

New function name: `send-patient-document`. Body is only `patientId` and `reportId` after Zod parse. Do not send the patient's e-mail. Success toast only when invoke returns 2xx and the body has no `error`. Map failure to Portuguese (`Não foi possível enviar o e-mail. Tente de novo em instantes.`), same `throw new Error` style as `throwMappedFunctionsError` (lines 78-84). Copy `readFunctionsErrorPayload` (lines 39-76) rather than importing the AI mapper, so SMTP text is not rewritten as an IA error.

**Signed URL** (patientAiReports.service.ts lines 6-7 and 144-146, and null on create at line 178):

```tsx
const REPORT_BUCKET = 'patient-ai-reports'
const SIGNED_URL_SECONDS = 3600
// list:
.createSignedUrls(paths, SIGNED_URL_SECONDS)
// create returns:
return mapReportRow(row, null)
```

WhatsApp click calls `createSignedUrl(storagePath, 604800, { download: 'avaliacao.pdf' | 'evolucao.pdf' })` on that bucket. If `error` or no URL, stop. Do not mark sent. There is no `.download()` in `src/`; the browser does not download the PDF for WhatsApp.

`window.open('https://wa.me/' + digits + '?text=' + encodeURIComponent(message))`. Message is the short Portuguese line plus the URL. Null window → error toast.

---

### `src/lib/patientContact.ts` (utility, transform)

**Analog:** `emptyToNull` in `src/services/patients.service.ts` lines 174-177, and the pure predicate style of `canWritePatient` in `src/lib/accountAccess.ts` lines 32-37.

```tsx
function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
```

New helpers reject null, `''`, and `'—'` (the placeholder `mapPatient` writes at lines 337-338). E-mail needs a simple usable-address check. Phone: digits only; 10 or 11 digits gain prefix `55`; 12 or 13 digits that already start with `55` stay; anything else is not a WhatsApp number. No `emergencyPhone`. Return a result the UI can turn into the Portuguese sentences in the UI-SPEC, not a fake success.

`canWritePatient` stays the UX gate. The Edge Function repeats ownership with `patients.created_by`. Do not treat the client predicate as authorization.

---

### `src/schemas/patientAi.schema.ts` (model, transform)

**Analog:** itself. Add send copy next to `PATIENT_AI_COPY` (lines 4-14) and a Zod object next to `patientAiSummaryInvokeSchema` (lines 72-80).

```tsx
export const PATIENT_AI_COPY = {
  generateSuccess: 'Resumo atualizado',
  generateError: 'Não foi possível gerar o resumo. Tente de novo em instantes.',
  // ...
}

export const patientAiSummaryInvokeSchema = z.object({
  patientId: z.string().uuid(),
  userHint: z.string().trim().max(2000).optional().transform(/* ... */),
})
```

Invoke schema fields: `patientId` and `reportId` as `z.string().uuid()` only. No e-mail, no phone. UI strings for missing contact, export-first, SMTP failure, and the two success lines live here so components do not invent a second copy source. `ctaGenerate` / `ctaExport` (lines 23-24) stay. The word `Gerando` is a state label, not a replacement of those CTAs.

---

### `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts` (controller, request-response)

**Analog:** `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`. Read and copy the shell. Do not edit that file. Paste the new source in the Dashboard. Do not `supabase functions deploy`.

**Shell** (lines 7-55 and 1000-1027):

```ts
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function requireUser(req: Request): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  // getUser(token) → 401 when missing
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', code: 'method_not_allowed' }, 405)
  }
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  // JSON parse → 400 invalid_body; UUID_RE on ids (lines 53-54, 1024-1027)
})
```

**Ownership read** (lines 338-348). Select fails or the row is missing → 403. Extend the select with `email, created_by`. If `created_by` is not `user.id`, 403 and do not open SMTP. Load `patient_ai_reports` for that `patient_id` and `reportId` with the same user client. Download `storage_path` from bucket `patient-ai-reports` with that client, not service role. No `.download()` exists in the repo; this is the new call. Do not log the password, the signed URL, or PDF bytes.

Placeholder `'—'`, null, or blank `patients.email` → Portuguese error, no SMTP. SMTP via pinned `https://deno.land/x/denomailer@1.6.0/mod.ts` (not an npm dependency). Secrets `FLUXO_SMTP_*` from `Deno.env` only, names must not start with `SUPABASE_`. Port 465 → `tls: true`; port 587 → `tls: false`. `client.close()` after send. Subject/body: `Sua avaliação` / `Sua evolução` and `Segue o documento da sua fisioterapia, em anexo.` Filename `avaliacao.pdf` or `evolucao.pdf`.

If a runbook is added, copy the placeholder tone of `docs/ops/auth-email-smtp.md` lines 1-6 (no real passwords). That file is not in the recommended source tree; do not change Auth SMTP or the confirm-account templates.

---

### `src/lib/patientContact.test.ts` (test, transform)

**Analog:** `src/lib/patientSummary.test.ts` lines 1-24.

```ts
import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { resolveSummaryFields } from './patientSummary.ts'

test('REQ-33.3: edição vence o original', () => {
  equal(resolveSummaryFields({ summary: 'a' }, { summary: 'b' }).summary, 'b')
})
```

Import the new helper from `./patientContact.ts`. Cases: `'—'`, empty, null rejected; 10 and 11 digits gain `55`; 12 and 13 digits starting with `55` stay; other lengths rejected. No Vitest. No new package.

---

### `src/lib/phase26Contract.test.ts` (test, transform)

**Analog:** `src/lib/patientSummaryContract.test.ts` lines 1-18 (read source, slice between markers) and `src/lib/mobilidadePalpacao.test.ts` lines 1247-1253 (PDF source assertions).

```ts
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

function sliceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  if (start < 0) throw new Error(`marcador ausente: ${startMarker}`)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (end < 0) throw new Error(`marcador ausente: ${endMarker}`)
  return source.slice(start, end)
}
```

```ts
equal(frameB.includes(".replaceAll('→', '->')"), true)
```

Assert, by reading source:

- `Button.tsx` still contains `Aguarde...` and the spinner classes. `AiGeneratingButton.tsx` contains `Gerando` and `Star`. Composer avaliação export and the field-picker confirm do not use `AiGeneratingButton`.
- `toWinAnsiSafe` body unchanged. Arrow replace remains `.replaceAll('→', '->')` on the drawn string.
- Avaliação/evolução path does not draw `'—'` as an empty table value. `drawGeral` / `drawSessao` still present.
- Send service invokes `send-patient-document` and builds `wa.me`. Reports list gates the pair with `canWrite`. New function compares `created_by` and does not read an e-mail from the JSON body.
- `patient-ai-summary/index.ts` is not part of this phase's diff. The existing `mobilidadePalpacao.test.ts` `toWinAnsiSafe` test must keep passing. Do not edit that function to satisfy the new test.

## Shared Patterns

### Authentication
**Source:** `patient-ai-summary/index.ts` `requireUser` + `createUserClient` (lines 25-51) and `canWritePatient` (`src/lib/accountAccess.ts` lines 32-37).
**Apply to:** `send-patient-document`, composer (already returns null), reports list send buttons.
UX hides the pair when `canWrite` is false. The function checks `patients.created_by` against the JWT user and uses the user-scoped client. No service role. RLS stays the read wall.

### Error handling
**Source:** `toast` in `src/stores/toast.store.ts` lines 56-62; `throwMappedFunctionsError` in `patientAi.service.ts` lines 78-84; `jsonResponse` in the Edge Function lines 14-18.
**Apply to:** composer, reports list, `patientDocumentSend.service.ts`, the new function.
Portuguese `Error` messages. Success only after a real 2xx e-mail response, or after WhatsApp has both a signed URL and a non-null `window.open`. Missing contact explains and does not claim the send.

### Validation
**Source:** `patientAiSummaryInvokeSchema` (`src/schemas/patientAi.schema.ts` lines 72-80) and `UUID_RE` plus manual body checks (function lines 53-54 and 1024-1027).
**Apply to:** client invoke and the Edge Function. Client Zod is not trusted for the destination. The function re-reads `patients.email`.

### PDF safety
**Source:** `toWinAnsiSafe` lines 198-206 and `.replaceAll('→', '->')` at line 2197.
**Apply to:** `drawAvaliacao` and `drawEvolucao` only. Do not change `toWinAnsiSafe`. Do not embed a font. Do not invent clinical sentences.

### Loading chrome
**Source:** `Button.tsx` lines 45-52.
**Apply to:** every control that does not call the model, including export upload, picker confirm, e-mail/WhatsApp in flight, Salvar, and Excluir. Gerando is only `AiGeneratingButton` plus the optional confirm mode.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every planned file has an analog. |

Partial gaps inside those files (use RESEARCH.md for the missing call, not a new library):

| Gap | Role | Data Flow | Reason |
|-----|------|-----------|--------|
| Storage `.download()` inside `send-patient-document` | controller | file-I/O | No `.download()` in `src/` or the phase-13 function. Auth and JSON shell still copy `requireUser`. Bucket name copies `REPORT_BUCKET`. |
| WhatsApp mark SVG | component | request-response | No brand SVG in the app. Button chrome copies the reports-list controls. `Mail` and `Star` copy `lucide-react` as used by `Trash2`. |

## Metadata

**Analog search scope:** `src/components/ui`, `src/components/patients`, `src/services`, `src/lib`, `src/schemas`, `src/index.css`, `src/stores/toast.store.ts`, `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`, `docs/ops/auth-email-smtp.md`
**Files scanned:** 16 analogs read (Button, ConfirmDialog, PatientAiComposer, PatientAiReportsList, patientAi.service, patientAiReports.service, patients.service, patientAiPdf.service, patient-ai-summary index, index.css, patientAi.schema, toast.store, accountAccess, patientSummary.test, patientSummaryContract.test, mobilidadePalpacao.test)
**Pattern extraction date:** 2026-10-06
