# Phase 11: Resumo IA - Research

**Researched:** 2026-09-19  
**Domain:** Patient-ficha AI clinical summary (Gemini via Edge Function) + client PDF export + private Supabase Storage metadata  
**Confidence:** HIGH (codebase inventory, Phase 7 Storage/RLS patterns, Phase 8 EF invoke patterns, pdf-lib official README, Gemini structured-output docs); MEDIUM (exact Gemini model id to pin in production — catalog moves fast); LOW (hosted Storage global file-size cap; whether `private.can_*` inside new bucket policies needs a thin SECURITY DEFINER wrapper — same A2 risk as Phase 7)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Aba = Resumo IA
O rótulo da aba da ficha que hoje é o hub de IA/avaliação passa a **Resumo IA**. Avaliação estruturada (REQ-05 / `patient_evaluations`) **não some**: fica como fluxo secundário acessível a partir desta aba ou mantida como subseção “Avaliação estruturada”, sem competir pelo nome da aba. Planner confirma UX mínima sem redesenhar a ficha inteira.

#### D-02 — Uma caixa, dois modos
Um único input/composer na aba com seletor de modo:
1. **Escrever resumo (IA)** — gera/atualiza texto do Resumo do paciente  
2. **Exportar avaliação (PDF)** — gera PDF geral **ou** por sessão escolhida  

Sem dois formulários paralelos competindo.

#### D-03 — Contexto máximo no modo resumo
Ao gerar resumo, o backend/serviço monta um pacote com tudo disponível do paciente: identidade (nome, idade/nascimento, código), cadastro/queixa/diagnóstico, programa, EVA, metas, **áreas de foco** (e pode **marcar/atualizar** áreas quando a IA retornar regiões), evoluções **por sessão** (estado, condutas, resposta, plano), avaliações estruturadas existentes, notas relevantes. Objetivo: máximo de contexto clínico seguro (sem inventar dados ausentes).

#### D-04 — Destino do resumo
O texto gerado grava na área **Resumo do paciente** / campo `ai_summary` (e campos satélite só se o retorno estruturado da IA for explícito — ex. focus areas). Exibir o resultado também no Resumo (aba Resumo) após salvar.

#### D-05 — PDFs salvos na aba
Modo export produz PDF:
- **Geral** — avaliação/estado atual do paciente  
- **Por sessão** — sessão escolhida na UI  

Lista **Avaliações salvas**: tipo (geral | sessão), data de geração, e se sessão → identificação da sessão (data/hora ou label). Download/reabrir a partir da lista. Persistência: Storage + tabela de metadados (não só `localStorage`).

#### D-06 — Segurança e permissões
- Chave do modelo **não** no bundle Vite se evitável (preferir Edge Function / server); se brownfield `VITE_GEMINI_*` existir, RESEARCH recomenda migração.
- RLS: leitura alinhada a ficha; escrita/gerar/excluir só com `can_write_patient`.
- Copy de erro em português.

#### D-07 — Fora de escopo
- Substituir REQ-05 avaliação estruturada completa  
- Google Agenda / Phase 8–10  
- Redesign de marca  
- Import PDF de avaliação física pode permanecer como caminho legado nesta fase ou ser encaixado como ação secundária — não bloquear D-02

### Claude's Discretion
(Discuss-phase skipped — intent explicit. Discretion areas implied by CONTEXT notes:)
- Schema name/shape for metadata table + bucket
- PDF lib (prefer existing / Deno EF vs new client lib — none in repo today)
- UI-SPEC details: composer + lista salvos; português
- Whether EF or client assembles the context pack
- Exact wave boundaries and whether physical-PDF import stays under a `<details>` legacy block

### Deferred Ideas (OUT OF SCOPE)
- Substituir REQ-05 avaliação estruturada completa
- Google Agenda / Phase 8–10
- Redesign de marca
- Sync Google → app, multi-clínica, auditoria MFA completa (security.skill backlog)
- Replacing `localStorage` physical-eval drafts as a hard requirement of this phase (D-07: legacy import must not block D-02)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-23 | Resumo IA — gerar resumo clínico e PDFs salvos (geral / por sessão) | Tab rename + unified composer; EF Gemini → `ai_summary`; pdf-lib → Storage + `patient_ai_reports`; RLS `can_read/write_patient`; Portuguese errors; `canWrite` hides generate/delete |
| REQ-23.1 | Aba **Resumo IA** (rótulo/fluxo; não confunde com REQ-05) | Rename tab label (and prefer slug `resumo-ia`); structured eval as subsection |
| REQ-23.2 | Input unificado: gerar resumo IA **ou** exportar PDF | Single composer with mode selector (D-02) |
| REQ-23.3 | Gerar resumo com contexto máximo; atualiza Resumo; focus areas quando IA indicar | Context pack + EF JSON `{ summary, focusRegionKeys? }` + `updatePatient({ aiSummary })` + `togglePatientFocusArea` / batch mark |
| REQ-23.4 | PDF geral/sessão + lista Avaliações salvas | Client `pdf-lib` + private bucket + metadata table |
| REQ-23.5 | Persistência Supabase (metadados + arquivo); RLS | Clone Phase 7 Storage pattern |
| REQ-23.6 | Erros PT; consulta-only sem gerar/excluir | `mapDbError` / EF Portuguese codes; hide when `!canWrite` |
</phase_requirements>

## Summary

Today the ficha splits “AI” across two places: the **Resumo** tab only *displays* `patients.ai_summary` (read-only), while the **Avaliação** tab hosts REQ-05 structured evaluations plus a legacy Gemini PDF-import panel that calls Google **from the browser** with `VITE_GEMINI_API_KEY` and persists results in `localStorage` (`fisio.evaluations.*`). There is **no write path** for `ai_summary` in `UpdatePatientInput` / `updatePatient`. There is **no PDF library** in `package.json`. Phase 7 already proved the durable pattern for clinical files: private Storage bucket + metadata table + RLS via `private.can_read_patient` / `private.can_write_patient` + signed URLs. Phase 8 already proved Edge Function auth (`requireUser` + `functions.invoke`) and Dashboard secrets (`Deno.env.get(...)`).

Phase 11 should **re-home the AI hub** under a tab labeled **Resumo IA** (D-01), add a **single composer** with two modes (D-02), generate clinical summaries through a **new Edge Function** that holds `GEMINI_API_KEY` (D-06 — migrate off Vite), write `ai_summary` (and optional focus regions from a closed catalog), and export **deterministic PDFs** with **pdf-lib in the browser** then upload to a new private bucket with a `patient_ai_reports` metadata row (D-05). Keep REQ-05 structured evaluation as a secondary subsection; keep physical-PDF import as legacy secondary (D-07) without blocking the composer.

**Primary recommendation:** Edge Function `patient-ai-summary` (Gemini secret + JSON summary) + client `pdf-lib` export + private bucket `patient-ai-reports` + table `patient_ai_reports` (kind `geral`|`sessao`, nullable `session_id`, `storage_path`) mirroring Phase 7; tab label **Resumo IA**; one composer component; do not invent a second AI form.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tab label **Resumo IA** + `?aba=` routing | Browser / Client | — | Same ficha pattern as Imagens / Evoluções |
| Unified composer (mode + optional hint + session select) | Browser / Client | — | UX only; no parallel forms (D-02) |
| Assemble clinical context pack | API / Backend (Edge Function) preferred | Browser / Client | EF loads via user JWT under RLS → minimizes trust in client-supplied PHI and keeps one assembly path (D-03) |
| Call Gemini (API key) | API / Backend (Edge Function) | — | D-06 / CONCERNS: never ship model key in Vite |
| Persist `ai_summary` | API / Backend (PostgREST) | Database | `patients` UPDATE under `patients_update` + `can_write_patient` |
| Update focus areas from AI keys | API / Backend (PostgREST) | Browser / Client | Reuse `togglePatientFocusArea` / insert only keys in `FOCUS_REGION_KEYS` |
| Build PDF bytes (geral / sessão) | Browser / Client | — | Deterministic layout from data already readable in SPA; no Deno PDF required |
| Upload PDF + metadata | API / Backend (Storage + PostgREST) | Database / Storage | Mirror `patientImages.service.ts` |
| Download / reopen saved PDFs | API / Backend (signed URL) | Browser / Client | `createSignedUrl`; never store URL in DB |
| Authorization wall | Database / Storage | Browser / Client | RLS helpers; `canWritePatient` is UX-only [VERIFIED: `accountAccess.ts`] |
| Legacy PDF→Gemini import | Browser / Client (existing) | — | D-07 secondary; migrate key later if touched |

## Project Constraints (from .cursor/rules/)

**`.cursor/rules/` does not exist** in this workspace (verified by glob). Apply root `security.skill.md` and established phase conventions instead:

| Source | Directive |
|--------|-----------|
| `security.skill.md` | PHI / LGPD art. 5º II — confidentiality before convenience |
| `security.skill.md` | Never put secrets in Vite/`VITE_*` for model keys; validate uploads by MIME/size |
| `security.skill.md` | Backend authorization — do not rely on hidden buttons |
| Phase 3/7/8 convention | Do **not** rewrite `private.can_read_patient` / `can_write_patient` |
| Phase 7/8 convention | SQL via **SQL Editor** only; do not `supabase db push`; paste copy under gitignored `/supabase/` |
| Phase 7 convention | Do **not** `DELETE FROM storage.objects` expecting S3 cleanup |
| `accountAccess.ts` | `canWritePatient` is UX; RLS is the wall |
| Portuguese UI | Error copy and labels in Portuguese (D-06) |

## Standard Stack

### Core

| Library / Platform | Version | Purpose | Why Standard |
|--------------------|---------|---------|--------------|
| React + Vite SPA | React `^19.1.0`, Vite `^6.3.5` [VERIFIED: package.json] | Ficha UI | Existing app |
| `@supabase/supabase-js` | `^2.49.8` [VERIFIED: package.json] | PostgREST, Storage, `functions.invoke` | Already used for images + Google Calendar |
| Supabase Edge Functions (Deno) | Hosted (Phase 8 tree under `supabase/functions/`) [VERIFIED: codebase] | Gemini proxy + optional write orchestration | D-06; matches calendar vault pattern |
| Google Gemini API (`generateContent`) | Prefer `gemini-2.5-flash` with fallbacks `gemini-2.0-flash`, `gemini-flash-latest` [CITED: ai.google.dev/gemini-api/docs/models — catalog includes 2.5-flash / 2.0-flash / 3.x flash family] | Clinical summary JSON | Brownfield already uses Generative Language REST; structured JSON via `response_mime_type: application/json` [CITED: ai.google.dev/gemini-api/docs/structured-output] |
| `pdf-lib` | `1.17.1` (npm; created 2017-09; ~45M downloads/month) [VERIFIED: npm registry + github.com/Hopding/pdf-lib README — Browser/Deno/Node] | Create PDF in browser | No PDF lib in repo; official README targets browser; Unicode caveats documented |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod (existing) | `^3.25.28` | Validate EF invoke body, report kind, sessionId | Always before invoke / upload |
| TanStack Query (existing) | `^5.76.1` | Hooks for reports list + mutations | Mirror `usePatientImages` |
| `@google/genai` | installed `^2.19.0` but **unused in `src/`** [VERIFIED: rg] | — | **Do not adopt for this phase** — EF should use `fetch` like Phase 8 Calendar and the existing physical-eval service |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Function Gemini | Keep `VITE_GEMINI_API_KEY` client calls | Simpler, but **rejects D-06** and leaks key + PHI egress from browser [VERIFIED: CONCERNS.md] |
| Client `pdf-lib` | Generate PDF inside Edge Function | Consistent server fonts; heavier Deno deploy; client already has data — overkill for D-05 |
| `pdf-lib` | `jspdf` `4.2.1` | Also mature; worse text/layout ergonomics for multi-section clinical docs — prefer pdf-lib |
| EF assembles context | Client sends full context pack | Faster to ship; client can inflate/tamper prompt — only hurts own write path, but EF+RLS assembly is cleaner for D-03 |
| New bucket | Reuse `patient-images` | Wrong MIME policy (images only) — **do not** |

**Installation:**

```bash
npm install pdf-lib
# Gemini: no new npm package — Edge Function uses fetch + Deno.env GEMINI_API_KEY
```

**Version verification (2026-09-19):**
- `pdf-lib@1.17.1` — npm view OK; homepage https://pdf-lib.js.org/; repo https://github.com/Hopding/pdf-lib [VERIFIED: npm registry]
- `jspdf@4.2.1` — considered only [VERIFIED: npm registry]
- `@google/genai@2.23.0` latest on registry; project locks `^2.19.0` unused — skip for EF [VERIFIED: npm registry]

## Package Legitimacy Audit

> slopcheck **not available** at research time → packages tagged `[ASSUMED]` for planner gating. Registry + official docs still support recommending `pdf-lib`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `pdf-lib` | npm | since 2017-09 (~9 yrs) | ~45M / last month | github.com/Hopding/pdf-lib | unavailable | Approved for install — planner adds `checkpoint:human-verify` because slopcheck missing `[ASSUMED]` |
| `jspdf` | npm | since 2015-05 | ~55M / last month | github.com/parallax/jsPDF | unavailable | Not recommended (alternative only) |
| `@google/genai` | npm | since 2025-03 | (installed unused) | Google | unavailable | **Do not add new usage** — leave dependency alone or remove in cleanup |

**Packages removed due to slopcheck [SLOP] verdict:** none (tool unavailable)  
**Packages flagged as suspicious [SUS]:** none evaluated by slopcheck  

**postinstall scripts:** `pdf-lib` / `jspdf` — no network postinstall observed via `npm view … scripts.postinstall` (empty) [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
[Ficha ?aba=resumo-ia]
        │
        ▼
[PatientResumoIaPanel]
   ├─ Composer (mode: resumo | pdf)
   │     │
   │     ├─ mode=resumo ──► supabase.functions.invoke('patient-ai-summary', { patientId, userHint? })
   │     │                         │
   │     │                         ▼
   │     │                  [Edge Function]
   │     │                    ├─ requireUser (JWT)
   │     │                    ├─ load context under RLS (user client) OR service_role after can_write check
   │     │                    ├─ Gemini generateContent (GEMINI_API_KEY secret)
   │     │                    └─ return { summary, focusRegionKeys[] }
   │     │                         │
   │     │                         ▼
   │     │                  updatePatient(aiSummary) + mark focus keys
   │     │                         │
   │     │                         ▼
   │     │                  invalidate patient detail → Resumo tab shows new text
   │     │
   │     └─ mode=pdf ──► buildPdf(geral | sessão) with pdf-lib
   │                           │
   │                           ▼
   │                     storage.upload('patient-ai-reports', path)
   │                           │
   │                           ▼
   │                     INSERT patient_ai_reports metadata
   │
   └─ Lista Avaliações salvas ──► list rows + createSignedUrl → download/open
   └─ Subseção Avaliação estruturada (PatientEvaluationPanel) [D-01]
   └─ Legacy details: Importar PDF (PatientPhysicalEvaluationPanel) [D-07]
```

### Recommended Project Structure

```
src/
├── components/patients/
│   ├── PatientResumoIaPanel.tsx          # NEW — composer + saved list + embeds
│   ├── PatientAiComposer.tsx             # NEW — mode switch + actions
│   ├── PatientAiReportsList.tsx          # NEW — Avaliações salvas
│   ├── PatientEvaluationPanel.tsx        # KEEP — subsection under Resumo IA
│   └── PatientPhysicalEvaluationPanel.tsx # KEEP — legacy secondary
├── services/
│   ├── patientAi.service.ts              # NEW — invoke EF + map PT errors
│   ├── patientAiReports.service.ts       # NEW — Storage + metadata CRUD
│   ├── patientAiPdf.service.ts           # NEW — pdf-lib builders (geral/sessão)
│   ├── patients.service.ts               # EXTEND — aiSummary on updatePatient
│   └── aiPhysicalEvaluation.service.ts   # KEEP legacy (migrate key later)
├── hooks/usePatientAiReports.ts          # NEW
├── schemas/patientAi.schema.ts           # NEW
└── types/patient.ts                      # EXTEND — PatientAiReport, UpdatePatientInput.aiSummary
supabase/functions/
└── patient-ai-summary/index.ts           # NEW — Gemini + context
.planning/phases/11-resumo-ia/sql/
└── 11-patient-ai-reports.sql             # NEW — bucket + table + RLS
```

### Pattern 1: Edge Function Gemini (no Vite key)

**What:** Hold `GEMINI_API_KEY` in Function secrets; SPA calls `functions.invoke` with JWT.  
**When to use:** Any model call (REQ-23 generate).  
**Example:**

```typescript
// Source pattern: supabase/functions/google-calendar-export/index.ts + ai.google.dev structured output
const key = Deno.env.get('GEMINI_API_KEY')
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemAndUserPrompt }] }],
      generationConfig: { response_mime_type: 'application/json' },
    }),
  },
)
```

### Pattern 2: Private Storage + metadata (Phase 7 clone)

**What:** Bucket `patient-ai-reports` (private, `application/pdf`, size limit ~5–8 MiB). Path `{patient_id}/{report_id}.pdf`. Table RLS + `storage.objects` policies call existing `can_read_patient` / `can_write_patient`.  
**When to use:** Every saved PDF (D-05).  
**Example:** Mirror `patientImages.service.ts` upload-then-INSERT; on INSERT fail → `storage.remove`.

### Pattern 3: Unified composer, two modes

**What:** One control surface: segmented control or select (`Escrever resumo (IA)` | `Exportar avaliação (PDF)`), optional textarea hint (resumo mode), session `<Select>` only when PDF + sessão, primary CTA.  
**When to use:** Always on Resumo IA tab (D-02).

### Pattern 4: Focus areas from closed catalog

**What:** Model may return `focusRegionKeys: string[]`. Client/EF filters with `focusRegionKeySchema` / `FOCUS_REGION_KEYS` (30 keys). Mark missing keys (insert); do **not** invent free-text regions; do **not** wipe unmarked areas unless product later decides replace-all (recommend **additive mark only** unless user confirms replace).  
**When to use:** When JSON includes keys (D-03/D-04).

### Anti-Patterns to Avoid

- **`VITE_GEMINI_API_KEY` for REQ-23** — key in bundle; PHI to Google from browser as project identity [VERIFIED: CONCERNS.md]
- **Saving Avaliações salvas in `localStorage`** — same failure mode as physical evals [VERIFIED: CONCERNS.md]
- **Reusing `patient-images` bucket** — MIME allow-list is jpeg/png/webp only [VERIFIED: 07-patient-images.sql]
- **Rewriting Phase 3 `can_*` helpers** — forbidden by project convention
- **AI inventing clinical facts** — prompt must say: only use provided context; omit empty fields; never fabricate
- **Writing `ai_summary` without extending `updatePatient`** — field is read-only today [VERIFIED: patients.service.ts]
- **Trusting Gemini model ids like `gemini-3.6-flash` alone** — brownfield tries unverified ids; pin `gemini-2.5-flash` first with 404 fallback chain [CITED: models catalog + existing service]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF binary construction | Custom PDF syntax writer | `pdf-lib` | Cross-runtime, page/text APIs [CITED: pdf-lib README] |
| Model API auth in SPA | Fetch with Vite key | Edge Function + `Deno.env` secret | D-06 / ASVS secret handling |
| File ACL | App-only checks | Storage + table RLS `can_*` | UX ≠ auth |
| Signed download URLs | Persist public URLs | `createSignedUrl` (~1h) | Same as images |
| Focus region taxonomy | Free-text body parts from model | `FOCUS_REGION_KEYS` | Silhouette catalog is closed [VERIFIED: focusRegions.ts] |
| Portuguese DB errors | Raw PostgREST | `mapDbError` / EF error codes | Existing security helper |

**Key insight:** The hard problems are **secret isolation** and **durable PHI artifacts** — both already solved in-repo by Phase 8 (EF secrets) and Phase 7 (private Storage). Phase 11 should compose those patterns, not invent a third storage story.

## Common Pitfalls

### Pitfall 1: Vite Gemini key continues to ship
**What goes wrong:** Quota theft; PHI attributed to leaked key.  
**Why it happens:** Brownfield `.env` already has `VITE_GEMINI_API_KEY`; physical-eval path still uses it.  
**How to avoid:** REQ-23 path **must** use EF secret `GEMINI_API_KEY`. Document migration; optionally remove `connect-src` Generative Language from CSP once client stops calling Google directly (legacy import may still need it until migrated).  
**Warning signs:** Network tab shows `generativelanguage.googleapis.com` from the SPA on Resumo IA generate.

### Pitfall 2: `ai_summary` update silently no-ops
**What goes wrong:** UI shows success but Resumo tab unchanged.  
**Why it happens:** `UpdatePatientInput` lacks `aiSummary`; `updatePatient` never maps `ai_summary`.  
**How to avoid:** Extend type + payload in the same wave as generate. Invalidate `['patients', id]` queries.  
**Warning signs:** Postgres row unchanged after mutate.

### Pitfall 3: Public bucket or wrong MIME
**What goes wrong:** Clinical PDFs world-readable or upload rejected.  
**How to avoid:** `public = false`, `allowed_mime_types = '{application/pdf}'`, path CHECK regex like images.  
**Warning signs:** `getPublicUrl` usage; 400 on upload.

### Pitfall 4: Orphan Storage objects
**What goes wrong:** Upload succeeds, INSERT fails → billed orphan.  
**How to avoid:** Upload then INSERT; on INSERT error `storage.remove` (Phase 7 pattern). Delete: `remove` then DELETE row.  
**Warning signs:** Objects in Dashboard without table rows.

### Pitfall 5: Session PDF after session delete
**What goes wrong:** List breaks or FK cascade deletes history.  
**How to avoid:** `session_id ON DELETE SET NULL`; store denormalized `session_label` (date/time text) at create time for list display; kind stays `sessao`.  
**Warning signs:** Null session with no label in UI.

### Pitfall 6: Prompt / context size blow-ups
**What goes wrong:** Gemini 413/timeout; expensive tokens; truncated nonsense.  
**How to avoid:** Cap evolutions (e.g. last N sessions), truncate long text fields, omit empty strings, exclude non-clinical PII (emergency contacts, email) unless needed — D-03 identity + clinical, not full administrative dump.  
**Warning signs:** EF latency >30s; empty candidates.

### Pitfall 7: Focus area wipe
**What goes wrong:** AI returns partial regions and clears the silhouette.  
**How to avoid:** Additive marks only (default). Never delete unmarked areas from a partial AI list without explicit UX.  
**Warning signs:** User loses prior marks after one generate.

### Pitfall 8: Empresa consult can generate
**What goes wrong:** RLS blocks but UI still offers buttons → English errors.  
**How to avoid:** Hide generate/export/delete when `!canWrite`; EF returns Portuguese `forbidden` if invoked anyway.  
**Warning signs:** Empresa sees Sparkles CTA on colleague ficha.

### Pitfall 9: Unicode in pdf-lib
**What goes wrong:** Missing glyphs for Portuguese accents.  
**How to avoid:** Embed a font that supports Latin-1/Portuguese (pdf-lib standard fonts are limited — plan to embed a TTF/OTF or subset). Test with “avaliação”, “evolução”.  
**Warning signs:** Blank boxes in PDF.

### Pitfall 10: Confusing Resumo vs Resumo IA
**What goes wrong:** Two tabs both feel like “resumo”.  
**How to avoid:** Keep **Resumo** as read dashboard (shows `ai_summary` card). **Resumo IA** is the generate/export hub. Copy: “O texto gerado aparece em Resumo do paciente”.  
**Warning signs:** Users look for generate on Resumo tab.

## Code Examples

### Extend `updatePatient` for `ai_summary`

```typescript
// Source: extend src/services/patients.service.ts + UpdatePatientInput
// [VERIFIED gap: updatePatient currently ignores ai_summary]
if (input.aiSummary !== undefined) {
  payload.ai_summary = emptyToNull(input.aiSummary)
}
```

### Invoke summary Edge Function

```typescript
// Source pattern: src/services/googleCalendar.service.ts
const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
  body: { patientId, userHint: hint || undefined },
})
if (error) throw new Error(/* map to PT */)
const body = data as { summary: string; focusRegionKeys?: string[] }
```

### Gemini JSON contract (EF prompt)

```json
{
  "summary": "string — resumo clínico em português, só com fatos do contexto",
  "focusRegionKeys": ["back.lumbar", "front.knee_r"]
}
```

Only keys from the fixed catalog; empty array if none.

### pdf-lib create + upload sketch

```typescript
// Source: https://pdf-lib.js.org / Hopding/pdf-lib README (Create Document)
import { PDFDocument, StandardFonts } from 'pdf-lib'

const doc = await PDFDocument.create()
const page = doc.addPage()
const font = await doc.embedFont(StandardFonts.Helvetica)
page.drawText('Resumo do paciente', { x: 50, y: 750, size: 14, font })
const bytes = await doc.save()
const blob = new Blob([bytes], { type: 'application/pdf' })
// then storage.from('patient-ai-reports').upload(path, blob, { contentType: 'application/pdf', upsert: false })
```

### Recommended SQL sketch (`patient_ai_reports`)

```sql
-- Mirror Phase 7; do not rewrite can_*. SQL Editor only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-ai-reports', 'patient-ai-reports', false, 8388608, array['application/pdf']::text[])
on conflict (id) do nothing;

create table if not exists public.patient_ai_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  session_id uuid null references public.patient_sessions (id) on delete set null,
  kind text not null check (kind in ('geral', 'sessao')),
  storage_path text not null unique,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 8388608),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  session_label text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users (id),
  constraint patient_ai_reports_kind_session_ck check (
    (kind = 'geral' and session_id is null)
    or (kind = 'sessao' and session_id is not null)
  ),
  constraint patient_ai_reports_path_ck check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
  )
);
-- + indexes, grants, FORCE RLS, policies using private.can_read_patient / can_write_patient
-- + storage.objects policies scoped to bucket_id = 'patient-ai-reports'
```

## Context Pack Inventory (codebase)

| Source | Fields available | Include in pack? |
|--------|------------------|------------------|
| `getPatientById` / `Patient` | name, code, age, birthDate, complaint, diagnosis, program, programProgress, eva, lastVisit, evolutionSummary, lastConducts, nextSessionPlan, goals[], focusAreas[], painSeries[], sessionsDone/Total, frequency, therapist, startDate, adminNotes, aiSummary (prior) | **Yes** clinical + identity (D-03). Prefer **omit** phone/email/emergency* for minimization unless discuss later |
| `listPatientSessions` | scheduledAt, type, place, status, therapistName, evolution.{patientState, changesSinceLast, conducts, treatmentResponse, incidents, nextPlan} | **Yes** — cap last N |
| `listPatientEvaluations` / `PatientEvaluation` | performedOn, mainComplaint, anamnesis, history, pain, limitations, goals, physicalExam, tests, measurements, physioDiagnosis, plan | **Yes** |
| `localStorage` physical evals | `PhysicalEvaluationResult` | **No** for EF pack — not durable/authoritative |
| Alerts | message, tone | Optional “notas relevantes” — include short list if present |

## Refactor vs Keep

| Asset | Verdict |
|-------|---------|
| `PatientEvaluationPanel` + `evaluations.service` + `patient_evaluations` | **Keep** — subsection under Resumo IA (D-01/D-07) |
| `PatientPhysicalEvaluationPanel` + `aiPhysicalEvaluation.service` | **Keep as legacy** secondary (`<details>`); do not block composer; migrate off Vite key in a follow-up if touched |
| Tab `avaliacao` label “Avaliação” | **Refactor** → label **Resumo IA**; prefer tab id/slug `resumo-ia` with redirect from `avaliacao` for old shortcuts |
| Resumo tab `aiSummary` display | **Keep** — destination surface (D-04) |
| `updatePatient` | **Extend** — add `aiSummary` |
| `@google/genai` dependency | **Ignore** (unused) |
| Phase 7 images | **Pattern source only** — do not mix buckets |

## UI Composition Guidance

1. **Tab:** `PatientProfileHeader` — change Avaliação → **Resumo IA**; `PatientPage` mounts `PatientResumoIaPanel`.
2. **Top:** Composer (mode + hint + session select + CTA). Loading + Portuguese errors.
3. **Middle:** **Avaliações salvas** list (kind badge, createdAt, session_label, Abrir/Baixar, Excluir if canWrite).
4. **Below:** Collapsible **Avaliação estruturada** = existing `PatientEvaluationPanel` (without competing page chrome).
5. **Optional bottom:** Legacy **Importar avaliação de PDF (IA)** details (current markup).
6. **Shortcuts:** Dashboard shortcut “Avaliação” → update label/target to Resumo IA when tab renames.
7. ROADMAP **UI hint: yes** → planner should run `/gsd-ui-phase` (or include UI-SPEC) for composer + list before/execute with plans.

## Recommended Wave Split

| Wave | Scope | Blocking? |
|------|-------|-----------|
| **0** | No Vitest today — gate with `npm run typecheck` + `npm run lint`. Optional later: Zod unit tests for report kind/session constraint | Soft |
| **1** | SQL `11-patient-ai-reports.sql` (bucket + table + RLS) + types/Zod + `UpdatePatientInput.aiSummary` write path | **BLOCKING** (uploads fail without bucket) |
| **2** | Edge Function `patient-ai-summary` + `patientAi.service` + context assembly + focus-key apply + secret checklist | **BLOCKING** for generate mode |
| **3** | `pdf-lib` install (human-verify) + `patientAiPdf.service` + `patientAiReports.service` + hooks | Blocks export persistence |
| **4** | Tab rename + `PatientResumoIaPanel` composer + Avaliações salvas + embed structured eval + canWrite gating + Portuguese copy | Delivers REQ-23 UX |

Do not start Wave 4 generate CTA against missing EF, or export against missing bucket.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client `VITE_GEMINI_*` fetch | Edge Function secret + invoke | Phase 11 (this) | Aligns with D-06 / Phase 8 |
| AI artifacts in `localStorage` | Storage + metadata table | Phase 7 pattern → Phase 11 PDFs | Cross-device durable |
| Display-only `ai_summary` | Generate + UPDATE | Phase 11 | Closes write gap |
| Tab “Avaliação” as AI hub | Tab “Resumo IA” | Phase 11 | Clears naming confusion |

**Deprecated/outdated for REQ-23:**
- Relying on simulated Gemini responses when no key (physical-eval soft-fail) — for Resumo IA **fail closed** with Portuguese “IA indisponível” (CONCERNS recommendation).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pdf-lib` is the right client PDF lib (slopcheck unavailable → `[ASSUMED]` install gate) | Standard Stack | Planner must human-verify before `npm install` |
| A2 | Hosted project can deploy another Edge Function + `GEMINI_API_KEY` secret like Phase 8 | Environment | Generate mode blocked until Dashboard deploy |
| A3 | Additive focus-area updates (not replace-all) match clinical expectation | Pattern 4 | Wrong UX if user expected full replace |
| A4 | Omitting phone/email/emergency from Gemini pack is acceptable under D-03 | Context Pack | If user wants full cadastro in prompt, expand later |
| A5 | Deterministic PDF (no Gemini for export mode) satisfies D-02/D-05 | Architecture | If user wanted AI-authored PDF body, need extra EF path |
| A6 | `storage.objects` policies can call `private.can_*` (same as Phase 7) | SQL | May need thin SECURITY DEFINER wrapper |
| A7 | Pin primary model `gemini-2.5-flash` | Standard Stack | 404s → fallbacks; catalog includes newer 3.x flash ids |

## Open Questions (RESOLVED)

1. **Focus areas: additive vs replace?** — RESOLVED
   - Decision: **Additive only** (mark suggested regions; do not clear unmarked).

2. **Tab slug `avaliacao` vs `resumo-ia`?** — RESOLVED
   - Decision: New slug `resumo-ia` + accept legacy `avaliacao` → same panel.

3. **Migrate physical-eval off Vite key in this phase?** — RESOLVED
   - Decision: **Out of critical path** (D-07); follow-up later. Resumo IA generate uses Edge Function + `GEMINI_API_KEY` secret.

4. **EF writes `ai_summary` with service_role vs client update?** — RESOLVED
   - Decision: EF returns text; **client** `updatePatient` under user JWT (RLS). Optional EF write not required.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | Client build + pdf-lib | ✓ | Node v26.4.0 / npm 12.0.2 | — |
| `@supabase/supabase-js` | invoke + storage | ✓ | package.json | — |
| Supabase Edge Functions (hosted) | Gemini proxy | ✓ (Phase 8 functions present) | — | Block generate until deploy |
| `GEMINI_API_KEY` Function secret | EF | ? (brownfield key exists only as `VITE_*` in local `.env` — **do not commit**) | — | Human sets Dashboard secret from rotated key |
| Supabase Storage | PDF files | ✓ (Phase 7 bucket pattern) | — | — |
| `supabase` CLI | Optional deploy | ✗ (not required) | — | Dashboard Functions UI (Phase 8 path) |
| `deno` CLI | Local EF test | ✗ | — | Deploy + remote test |
| Vitest / Jest | Automated unit tests | ✗ | — | `npm run typecheck` / `lint` |
| ctx7 / Context7 MCP | Doc lookup | ✗ | — | Official URLs via curl |
| slopcheck | Package gate | ✗ | — | Human-verify pdf-lib |

**Missing dependencies with no fallback:** none for planning — human must apply SQL + set `GEMINI_API_KEY` + deploy EF before UAT of generate.

**Missing dependencies with fallback:** CLI tools → Dashboard; Vitest → typecheck gate.

## Validation Architecture

> `workflow.nyquist_validation` absent in `.planning/config.json` → treat as **enabled**.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — use TypeScript + ESLint |
| Config file | none |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-23.1 | Tab label / slug Resumo IA | source grep | `rg "Resumo IA" src/components/patients/PatientProfileHeader.tsx` | ❌ Wave 0 after implement |
| REQ-23.2 | Composer dual mode | manual UAT | — | ❌ |
| REQ-23.3 | `ai_summary` write + focus keys zod | unit (optional) / typecheck | `npm run typecheck` | ❌ no vitest |
| REQ-23.4 | PDF upload + list metadata | manual + SQL | SQL Editor matrix | ❌ |
| REQ-23.5 | RLS read/write | SQL as two JWTs | Editor checklist | ❌ |
| REQ-23.6 | `!canWrite` hides actions | manual UAT | empresa account | ❌ |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** Full commands green + SQL applied + human UAT (generate, export geral/sessão, empresa read-only)

### Wave 0 Gaps

- [ ] No Vitest — defer schema unit tests; document in VALIDATION.md as deferred (same as Phase 7)
- [ ] Human checklist: SQL Editor apply, EF deploy, `GEMINI_API_KEY` secret, rotate away from any leaked Vite key
- [ ] Framework install not required to plan

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (EF) | Supabase JWT `requireUser` on invoke |
| V3 Session Management | partial | Existing supabase-js session (known residual vs security.skill cookie ideal) |
| V4 Access Control | yes | `can_read_patient` / `can_write_patient` on table + storage |
| V5 Input Validation | yes | Zod on client; EF validates `patientId` UUID + hint length |
| V6 Cryptography | no new | TLS + private bucket; do not hand-roll crypto |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Gemini API key in SPA bundle | Information disclosure | EF secret only (D-06) |
| PHI prompt exfiltration / quota abuse | Information disclosure | AuthZ on EF; rate not built-in — document; minimize PII in pack |
| Public Storage PDF | Information disclosure | Private bucket + signed URLs |
| Empresa writes colleague ficha | Elevation of privilege | RLS + hide UI |
| Prompt injection via userHint | Tampering | Treat hint as untrusted; instruct model to ignore instructions that invent clinical data |
| XSS reading localStorage evals | Information disclosure | Do not store new PDFs in localStorage; legacy wipe optional follow-up |
| Oversize PDF upload | Denial of service | Bucket `file_size_limit` + client Zod |

## Sources

### Primary (HIGH confidence)

- Codebase: `PatientPage.tsx`, `PatientProfileHeader.tsx`, `PatientEvaluationPanel.tsx`, `PatientPhysicalEvaluationPanel.tsx`, `aiPhysicalEvaluation.service.ts`, `patients.service.ts`, `patientImages.service.ts`, `sessions.service.ts`, `googleCalendar.service.ts`, `focusRegions.ts`, `accountAccess.ts`
- Phase artifacts: `11-CONTEXT.md`, `REQUIREMENTS.md` REQ-23, `07-patient-images.sql`, `07-RESEARCH.md`, `08-RESEARCH.md`, `CONCERNS.md`, `security.skill.md`
- Gemini structured output — https://ai.google.dev/gemini-api/docs/structured-output
- Gemini models catalog — https://ai.google.dev/gemini-api/docs/models
- pdf-lib README — https://github.com/Hopding/pdf-lib (Browser/Deno/Node)
- npm registry: `pdf-lib@1.17.1`, `jspdf@4.2.1`, `@google/genai` versions [VERIFIED: npm view]

### Secondary (MEDIUM confidence)

- Supabase Edge Function secrets pattern — Phase 8 code + https://supabase.com/docs/guides/functions/secrets (page fetch partially HTML-gated)
- Storage design — https://supabase.com/docs/guides/storage/schema/design (via Phase 7 research citations)

### Tertiary (LOW confidence)

- Exact production Gemini pin among 3.x flash family — catalog lists many preview ids; prefer stable `gemini-2.5-flash` until team confirms

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages and EF/Storage patterns verified in-repo + npm/official README
- Architecture: HIGH — maps cleanly onto Phase 7 + 8; locked D-01–D-07 constrain choices
- Pitfalls: HIGH — several already documented in CONCERNS.md and Phase 7 RESEARCH

**Research date:** 2026-09-19  
**Valid until:** ~2026-10-19 (Gemini model ids may churn sooner — re-check models docs at execute time)
