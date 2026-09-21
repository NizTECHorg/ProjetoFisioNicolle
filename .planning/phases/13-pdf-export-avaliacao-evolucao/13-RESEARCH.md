# Phase 13: PDF export Avaliação / Evolução - Research

**Researched:** 2026-09-20  
**Domain:** Selective clinical PDF export (field-picker) + multi-session evolution synthesis (Gemini EF) + ficha-styled pdf-lib rendering  
**Confidence:** HIGH (brownfield composer/PDF/SQL/EF inventoried + locked D-01..D-07); MEDIUM (exact EF response shape for evolution synthesis; SQL kind migration UX labels for legacy rows)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Duas seções de export: Avaliação | Evolução
No composer PDF do Resumo IA, substituir rótulos/escopos atuais (“Avaliação salva”, “Por sessão”) por:
1. **Avaliação** — PDF a partir de uma avaliação musculoesquelética salva (`patient_evaluations` / ficha)
2. **Evolução** — PDF a partir de uma ou mais sessões/evoluções do paciente

Não confundir com a aba Avaliações (CRUD). Isto é só o fluxo de **exportar PDF**.

#### D-02 — Seletor de campos (só preenchidos; todos on por padrão)
Antes de gerar o PDF:
- Listar **apenas campos/blocos que têm conteúdo** na fonte escolhida
- Todos vêm **selecionados**
- Usuário **desmarca** o que não deve ir (privacidade / cliente)
- PDF renderiza só o selecionado

Granularidade (campo vs bloco A/B/C…): Claude’s discretion — preferir blocos + campos sensíveis destacados se lista ficar enorme; deve ser usável no mobile.

#### D-03 — Avaliação: uma avaliação + picker
Mantém escolha da avaliação (incl. “mais recente”). Depois o field-picker sobre o `ficha` dessa avaliação. Estilo PDF alinhado às refs (01–04 / blocos).

#### D-04 — Evolução: multi-sessão + IA agrega
Usuário seleciona **uma ou mais** sessões (evoluções). A IA recebe o pacote clínico dessas sessões (e contexto mínimo do paciente se necessário) e produz conteúdo para o PDF de evolução — não limitar a uma única sessão. Campo-picker também se aplica ao que for exportado (campos preenchidos das sessões + trechos gerados pela IA, conforme research).

#### D-05 — Visual do PDF ≈ fichas de referência
Layout com blocos rotulados, bordas, hierarquia tipográfica semelhante às imagens em `refs/` — adaptado à marca FLUXO. Sem inventar dados; omissões = campos não selecionados ou vazios.

#### D-06 — Persistência / lista “Avaliações salvas”
PDFs continuam salvos na lista do Resumo IA (Storage + `patient_ai_reports`). Ajustar `kind`/rótulos UI se necessário (evolução vs avaliação) — research decide se precisa SQL novo ou reusa `geral`/`sessao` com metadata.

#### D-07 — Fora de escopo
- Redesign da aba Avaliações CRUD
- Phase 8–11 UAT pendente
- Impressão idêntica ao papel A4 da clínica
- Export sem autenticação / link público

### Claude's Discretion
- Campo vs bloco no picker
- EF nova vs estender `patient-ai-summary` para síntese de evolução multi-sessão
- Schema `kind` no Storage (`evolucao` vs reuso)
- Onde montar o picker (Modal step vs inline no composer)

### Deferred Ideas (OUT OF SCOPE)
- Templates de exclusão salvos por profissional
- Watermark “uso interno” automático
- Comparativo visual entre duas avaliações no mesmo PDF
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-25 | PDF export Avaliação / Evolução — seções, field-picker, multi-sessão + IA, estilo ficha | Composer rename (D-01); catalog + picker (D-02); ficha PDF filter (D-03/D-05); EF mode `evolucao` + multi-select (D-04); SQL kinds `avaliacao`/`evolucao` (D-06); `canWrite` hide (REQ-25.5) |
| REQ-25.1 | Composer PDF com seções **Avaliação** \| **Evolução** | Replace `PdfExportScope` + `PATIENT_AI_COPY.pdfScope*` |
| REQ-25.2 | Field-picker: só preenchidos; todos selected; desmarcar exclui | `buildFilledFieldCatalog` + Modal checklist |
| REQ-25.3 | Avaliação: avaliação salva + picker + PDF blocos | Extend `drawAvaliacao(selectedIds)` |
| REQ-25.4 | Evolução: multi-select + IA agrega + picker + PDF | EF discriminant + `drawEvolucao` |
| REQ-25.5 | PDFs na lista; consulta-only sem exportar | Existing Storage + composer `if (!canWrite) return null` |
| REQ-25.6 | Visual refs; sem inventar dados | Block chrome + Gemini omit/never-invent rules |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

Nenhum arquivo em `.cursor/rules/` no workspace neste momento. Aplicar padrões já estabelecidos no código e nas phases 11–12:

- SQL Editor apply path (não `supabase db push`) [VERIFIED: STATE.md / Phase 03 decisions]
- UX `canWritePatient` fail-closed; RLS é autoridade [VERIFIED: `src/lib/accountAccess.ts`]
- Copy de erro em português (`PATIENT_AI_COPY`) [VERIFIED: `src/schemas/patientAi.schema.ts`]
- pdf-lib client-side; Gemini só via Edge Function secret [VERIFIED: Phase 11 RESEARCH + código]

## Summary

Phase 13 refatora o modo PDF do `PatientAiComposer` (hoje: escopos UI `avaliacao` | `sessao`, storage `geral` | `sessao`) para **Avaliação** e **Evolução**, com um **field-picker** sobre conteúdo preenchido e PDF no estilo das fichas (blocos A–…). A avaliação continua determinística a partir de `EvaluationFicha` (já renderizada em `drawAvaliacao`). A evolução passa a ser **multi-sessão** e exige **síntese via Gemini** — o PDF atual de sessão é só SOAP local, sem IA.

O brownfield já omite vazios no PDF de ficha e mapeia avaliação→`kind: 'geral'` (comentário no composer). Isso polui a lista (“Geral” ≠ ficha). Para multi-sessão, `session_id` singular + CHECK atual não bastam. Recomendação: **SQL idempotente** ampliando `kind` para `avaliacao` | `evolucao` (mantendo `geral`/`sessao` legados legíveis) e **estender** a EF `patient-ai-summary` com `mode: 'evolucao'` em vez de nova função.

**Primary recommendation:** Catalog de blocos preenchidos (~27 unidades ficha + 6 campos SOAP/sessão + seções IA) → Modal picker (todos on) → `buildPatientAiReportPdf` com `selectedFieldIds` + chrome de bloco FLUXO; Evolução chama EF estendida; persistir com kinds novos via SQL Editor.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| UI seções Avaliação \| Evolução + multi-select | Browser / Client | — | Composer já dual-mode; só troca escopos |
| Derivar catálogo de campos preenchidos | Browser / Client | — | Dados já em hooks (`usePatientEvaluations` / `usePatientSessions`) |
| Field-picker UX | Browser / Client | — | Modal existente, mobile-first |
| Render PDF ficha seletiva | Browser / Client | — | `pdf-lib` já no cliente; sem Deno PDF |
| Síntese IA multi-sessão | API / Backend (Edge Function) | Browser monta payload | Secret Gemini; nunca `VITE_*` |
| Upload PDF + metadados | API / Backend (Storage + PostgREST) | Database | Mirror `patientAiReports.service` |
| Constraint `kind` / RLS | Database / Storage | — | CHECK + `can_write_patient` |
| Lista “Avaliações salvas” labels | Browser / Client | — | Badge por kind |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdf-lib` | `1.17.1` (já instalado) [VERIFIED: npm registry + package.json] | PDF A4 no browser | Phase 11–12; README oficial browser/Deno/Node [CITED: pdf-lib.js.org] |
| `zod` | `^3.25.28` / npm latest `4.6.5` available — **keep repo ^3** [VERIFIED: package.json + npm view] | Validar body EF + upload kind | Já usado em `patientAi.schema` / `evaluationFicha.schema` |
| `@supabase/supabase-js` | `^2.49.8` [VERIFIED: package.json] | invoke EF, Storage, PostgREST | Brownfield |
| Gemini `generateContent` REST | modelos na EF (`gemini-3.6-flash` … fallbacks) [VERIFIED: `supabase/functions/patient-ai-summary/index.ts`] | Síntese evolução | Mesmo pipeline do resumo |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Query hooks | existing | Cache patient/sessions/evals/reports | Invalidation após export |
| `Modal` (`src/components/ui/Modal.tsx`) | existing | Picker step mobile | `wide` opcional |
| `FichaBlock` patterns | existing UI | Espelhar labels A–H no PDF | Alinhar copy com form |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Estender `patient-ai-summary` | Nova EF `patient-ai-evolucao` | Nova EF isola deploy; dobra secret/CORS/auth boilerplate — pior para uma fase |
| Kinds `avaliacao`/`evolucao` | Reusar `geral`/`sessao` + `session_label` | Sem SQL; lista e CHECK XOR mentem para multi-sessão |
| pdf-lib block borders | HTML→PDF / Puppeteer | Fora do stack Vite SPA; sem servidor print |
| Campo-a-campo (~90+) | Só blocos | Bloco é usável no mobile; campo puro explode UX |

**Installation:** nenhuma lib nova obrigatória.

```bash
# Sem npm install novo — reutilizar pdf-lib@1.17.1
npm run typecheck && npm run lint
```

**Version verification:** `pdf-lib@1.17.1` modified 2022-05-12; stable, no postinstall [VERIFIED: npm view]. `drawRectangle` **não** expõe `borderRadius` [VERIFIED: `node_modules/pdf-lib/src/api/PDFPageOptions.ts` + GitHub raw]. Cantos arredondados: `drawSvgPath` ou bordas retas FLUXO (preferir retas + header bar — mais simples e legível).

## Package Legitimacy Audit

> Nenhuma instalação nova. Audit documenta o que já está no projeto.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `pdf-lib` | npm | since 2017-09 (~9 yrs) | mature | github.com/Hopding/pdf-lib | unavailable | Already installed — Approved (no new install) |
| `zod` | npm | mature | mature | github.com/colinhacks/zod | unavailable | Already installed |
| `@supabase/supabase-js` | npm | mature | mature | github.com/supabase/supabase-js | unavailable | Already installed |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

*slopcheck not available — new installs would be `[ASSUMED]`; Phase 13 recommends **zero** new packages.*

## Architecture Patterns

### System Architecture Diagram

```
┌─ Resumo IA / PatientAiComposer (canWrite) ─────────────────────────┐
│  mode=pdf                                                            │
│    ├─ Avaliação ──► Select avaliação (latest|id)                     │
│    │                  └─ Modal field-picker (filled blocks)          │
│    │                       └─ buildPatientAiReportPdf(avaliacao, ids)│
│    │                            └─ upload kind=avaliacao             │
│    └─ Evolução ───► Multi-select sessões (1..N)                      │
│                       └─ Modal picker (SOAP filled + slots IA)       │
│                            ├─ invoke patient-ai-summary mode=evolucao │
│                            │     (sessionIds + patientId)            │
│                            │     └─ Gemini → synthesis sections      │
│                            └─ buildPatientAiReportPdf(evolucao, ids) │
│                                 └─ upload kind=evolucao              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              Storage bucket patient-ai-reports + patient_ai_reports
                              │
                              ▼
                    PatientAiReportsList (badges)
```

### Recommended Project Structure

```
src/
├── lib/
│   └── pdfFieldCatalog.ts          # NEW — filled catalog + sensitive defaults
├── schemas/
│   └── patientAi.schema.ts         # EXTEND — kinds, evolucao invoke, copy PT-BR
├── services/
│   ├── patientAi.service.ts        # EXTEND — invokeEvolucaoSynthesis(...)
│   ├── patientAiPdf.service.ts     # EXTEND — selectedIds + block chrome + drawEvolucao
│   └── patientAiReports.service.ts # EXTEND — new kinds
├── components/patients/
│   ├── PatientAiComposer.tsx       # REFACTOR — scopes + multi-select + Modal
│   ├── PatientAiFieldPicker.tsx    # NEW — checklist UI
│   └── PatientAiReportsList.tsx    # EXTEND — badges Avaliaação / Evolução
supabase/
├── 13-patient-ai-reports-kinds.sql # NEW — alter CHECK kind + insert policy
└── functions/patient-ai-summary/
    └── index.ts                    # EXTEND — mode discriminant
```

### Pattern 1: Filled field catalog (block-first)

**What:** Função pura que, dado `EvaluationFicha` ou lista de evoluções, devolve `{ id, page, letter, label, preview?, sensitive? }[]` só com itens “preenchidos”.  
**When to use:** Sempre antes do picker e como contrato do renderer.

**Filled rules (alinhar a `drawAvaliacao` / `textFilled`):**

| Tipo | Considerar preenchido quando |
|------|------------------------------|
| `string` | `trim().length > 0` |
| `number` (EVA) | `!== undefined && !== null` (0 é válido) |
| `boolean` flags | qualquer `true` no grupo → bloco/grupo on |
| `enum` | valor definido pós-`emptyToUndefined` |
| `marks[]` / `linhas[]` | array com ≥1 item útil |
| Sessão SOAP | campo string não-vazio |

**IDs canônicos (exemplos):**

```
01.A  anamnese.identificacao
01.B  anamnese.queixa
…
02.C  sintomas.intensidade
03.E  funcao.triagemSeguranca   # sensitive
03.F  funcao.medicacoes        # sensitive
04.H  avaliacaoPlano.planejamento
evo.session.{id}.patientState
evo.ai.sintese
evo.ai.tendencias
evo.ai.condutasAgregadas
```

**Example:**

```typescript
// Source: codebase pattern from patientAiPdf.service.ts textFilled/checkedLabels
export type PdfFieldId = string

export type PdfFieldItem = {
  id: PdfFieldId
  label: string
  groupLabel: string // e.g. "01 · Anamnese · Bloco B"
  sensitive?: boolean
}

export function buildEvaluationFilledCatalog(ficha: EvaluationFicha): PdfFieldItem[] {
  // Mirror hasId / hasQueixa / … gates already in drawAvaliacao
  // One catalog entry per FichaBlock letter that has content
}
```

### Pattern 2: Selective render

**What:** `drawAvaliacao(ctx, input, selected: Set<PdfFieldId>)` — se o bloco não está no set, pular inteiro; se está, renderizar só conteúdo preenchido (já omitia vazios).  
**When to use:** Todo export Avaliação.

### Pattern 3: EF mode discriminant

**What:** Body `{ patientId, mode: 'resumo' | 'evolucao', sessionIds?: string[], userHint? }`.  
**When to use:** `mode=evolucao` monta pack só das sessões pedidas + paciente mínimo; responde JSON estruturado para o PDF (**não** grava `ai_summary`).

```typescript
// Source: extend existing EF assembleContextPack + buildPrompt pattern
// [ASSUMED] response shape — planner locks Zod mirror on client
type EvolucaoSynthesis = {
  sintese: string
  tendencias?: string
  condutasAgregadas?: string
  alertas?: string
  // only keys present in model output; empty omitted
}
```

### Pattern 4: Modal picker step

**What:** Após escolher fonte, abrir `Modal` com checklist (min-h-11), “Desmarcar sensíveis”, Confirmar → gera PDF.  
**When to use:** Mobile (REQ-22 adjacency); evita inflar o composer inline.

### Anti-Patterns to Avoid

- **Reusar `kind: 'geral'` para ficha** — lista mente; Phase 12 já usou esse atalho — Phase 13 corrige com SQL.
- **Campo-a-campo no picker** (~90 leaves) — inutilizável em 360px.
- **IA inventar SOAP** — mesmas regras do resumo: só contexto JSON; omitir lacunas.
- **Nova lib PDF** — pdf-lib já resolve.
- **Link público / bucket público** — D-07.
- **Chamar Gemini no modo Avaliação** — ficha é determinística (Phase 12 D-07 / Phase 11 A5).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF binary | Writer PDF custom | `pdf-lib` | Páginas, fonts, wrap já resolvidos |
| Rounded rect API | Assumir `borderRadius` | `drawRectangle` reto ou `drawSvgPath` | API sem borderRadius [VERIFIED: PDFPageOptions] |
| Auth Gemini | `VITE_GEMINI_*` no export | EF + `GEMINI_API_KEY` | Phase 11 D-06 |
| Checkbox UI library | Novo pacote | `<input type="checkbox" className="accent-forest">` + `FichaBlock` patterns | Já no form ficha |
| Multi-session join SQL | Tabela de junction | `session_label` denormalizado + kind `evolucao` | CHECK simples; lista sobrevive delete |

**Key insight:** O trabalho duro é **catalog + filter contract** compartilhado entre picker e renderer — não o motor PDF.

## Common Pitfalls

### Pitfall 1: Catalog ≠ renderer gates
**What goes wrong:** Picker mostra bloco; PDF sai vazio (ou o inverso).  
**Why:** Duplicar lógica `hasQueixa` em dois lugares.  
**How to avoid:** Uma função `isBlockFilled` / catalog usada por ambos.  
**Warning signs:** UAT “desmarquei B mas B ainda aparece”.

### Pitfall 2: `kind` CHECK / INSERT policy desatualizados
**What goes wrong:** Upload 400/42501 após UI nova.  
**Why:** `patient_ai_reports_kind_ck` e policy INSERT só conhecem `geral`|`sessao` [VERIFIED: `supabase/11-patient-ai-reports.sql`].  
**How to avoid:** Script `13-*.sql` altera CHECK + WITH CHECK; Zod espelha.  
**Warning signs:** Export UI ok, mutate falha.

### Pitfall 3: Multi-sessão sem `session_id`
**What goes wrong:** Forçar um `session_id` ou reusar `geral`.  
**How to avoid:** `kind='evolucao' AND session_id IS NULL`; label tipo `3 sessões · 01/09–15/09`.  
**Warning signs:** Constraint XOR antiga.

### Pitfall 4: EVA `0` tratado como vazio
**What goes wrong:** Intensidade 0 some do PDF/picker.  
**How to avoid:** Distinguir `undefined` de `0` (já em `drawOptionalField` numérico).  

### Pitfall 5: Enums `''` / null
**What goes wrong:** Zod ou UI mostra “fantasma”.  
**How to avoid:** Reusar `emptyToUndefined` do schema ficha [VERIFIED: `evaluationFicha.schema.ts`].

### Pitfall 6: Consulta-only
**What goes wrong:** Botões visíveis que falham no RLS.  
**How to avoid:** Manter `if (!canWrite) return null` no composer; lista sem Excluir [VERIFIED: `PatientAiComposer.tsx`].

### Pitfall 7: Prompt truncation multi-sessão
**What goes wrong:** Gemini vazio / 503.  
**How to avoid:** Cap sessões selecionadas (ex. 8–12); truncar campos como `MAX_FIELD_CHARS`; cap prompt ~90k (já na EF).  

### Pitfall 8: Unicode WinAnsi
**What goes wrong:** `?` em “avaliação”.  
**How to avoid:** Manter `toWinAnsiSafe` [VERIFIED: patientAiPdf.service].  

### Pitfall 9: Sensíveis vazam no PDF “para o cliente”
**What goes wrong:** Endereço / red flags / alergias exportados por default.  
**How to avoid:** Flag `sensitive` no catalog + CTA “Desmarcar sensíveis” (defaults ainda todos on — D-02 — CTA é opt-in uncheck).

## Code Examples

### Catalog gate (espelhar PDF)

```typescript
// Source: src/services/patientAiPdf.service.ts (textFilled / hasQueixa pattern)
function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
```

### pdf-lib block chrome (sem borderRadius)

```typescript
// Source: https://pdf-lib.js.org + PDFPageDrawRectangleOptions (no borderRadius)
ctx.page.drawRectangle({
  x: MARGIN_X,
  y: blockBottom,
  width: CONTENT_WIDTH,
  height: blockHeight,
  borderColor: COLORS.accent,
  borderWidth: 1,
  color: COLORS.white,
})
// Header bar
ctx.page.drawRectangle({
  x: MARGIN_X,
  y: blockTop - headerH,
  width: CONTENT_WIDTH,
  height: headerH,
  color: COLORS.accentSoft,
})
```

### EF invoke evolucao (cliente)

```typescript
// Source: pattern from src/services/patientAi.service.ts generatePatientAiSummary
const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
  body: {
    patientId,
    mode: 'evolucao',
    sessionIds, // 1..N UUIDs
    userHint,
  },
})
```

### SQL kind extension (idempotent sketch)

```sql
-- Source: extend supabase/11-patient-ai-reports.sql constraints
alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_ck
  check (kind in ('geral', 'sessao', 'avaliacao', 'evolucao'));

alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_session_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_session_ck check (
    (kind in ('geral', 'avaliacao', 'evolucao') and session_id is null)
    or (kind = 'sessao')
  );
-- Also update INSERT policy WITH CHECK branches for avaliacao/evolucao
```

## Answers to Key Research Questions

### 1. Scopes atuais e o que renomear/substituir

| Hoje | Depois (D-01) |
|------|----------------|
| UI `pdfScope: 'avaliacao' \| 'sessao'` | UI `pdfScope: 'avaliacao' \| 'evolucao'` |
| Copy `pdfScopeAvaliacao` = “Avaliação salva”, `pdfScopeSessao` = “Por sessão” | “Avaliação” / “Evolução” |
| PDF builder `kind: 'avaliacao' \| 'sessao' \| 'geral'` | Manter `avaliacao`; substituir fluxo `sessao` single por `evolucao` multi (+ IA); `geral` legado só leitura lista |
| Storage map `avaliacao → geral` [VERIFIED: PatientAiComposer L130–131] | Storage `avaliacao` / `evolucao` (SQL) |

Remover Select single-session como caminho principal; multi-select + síntese.

### 2. Catalog a partir de ficha + evolução

- **Avaliação:** percorrer blocos 01-A…04-ID (mesmos que `FichaBlock` / `drawAvaliacao`) — ~**27** unidades se bloco-level.  
- **Evolução:** por sessão selecionada, 6 campos SOAP (`SessionEvolution`) só se preenchidos; mais slots IA pós-síntese (`evo.ai.*`) sempre oferecidos se a EF retornou texto.

Não inferir catálogo via Zod shape walk genérico — **lista explícita** alinhada ao form (manutenção previsível).

### 3. Granularidade: campo vs bloco (recomendação)

**Usar bloco-letter como unidade principal** (~27 itens filled-subset), com:

- preview curto (primeiros ~40 chars) no picker;
- `sensitive: true` em: Identificação (contato/endereços — ou bloco 01-A inteiro), Triagem 03-E, Medicações 03-F, e campos SOAP `incidents` se sensível clinicamente;
- CTA **“Desmarcar sensíveis”**;
- **não** expor cada checkbox leaf (dezenas por bloco).

Mobile: Modal scroll + checkboxes `min-h-11` (já padrão ficha).

### 4. EF: estender vs nova

**Estender `patient-ai-summary`** com `mode`:

| mode | Efeito |
|------|--------|
| omitido / `resumo` | comportamento atual → summary + focusRegionKeys (compat) |
| `evolucao` | exige `sessionIds[]` (1..N, cap); não escreve paciente; retorna síntese estruturada |

Steel man nova EF: isolamento. Rejeitado: custo de deploy/auth duplicado para um discriminant.

### 5. kind SQL: `evolucao` vs reuso

**Adicionar `avaliacao` e `evolucao`** via SQL Editor (não só reuso):

| kind | session_id | session_label | Uso |
|------|------------|---------------|-----|
| `avaliacao` | null | título/data avaliação (opcional) | PDF ficha |
| `evolucao` | null | resumo multi-sessão | PDF evolução |
| `geral` | null | — | legado Phase 11 |
| `sessao` | set / null pós-delete | label sessão | legado |

Lista: mapear badges PT-BR; legado `geral` pode exibir “Geral (legado)” ou “Avaliação” se metadata ambígua — preferir label literal por kind.

### 6. O que mudar em `patientAiPdf.service`

Hoje: seções com título accent + underline; omite vazios; **sem** caixa de bloco estilo ficha.  
Mudar:

1. Aceitar `selectedFieldIds?: ReadonlySet<string>` (default = all filled — back-compat).  
2. `drawFichaBlockFrame(letter, title, …)` com borda accent + header soft.  
3. Condicionar cada bloco ao set.  
4. Novo `kind: 'evolucao'` input: header paciente + blocos IA + opcionalmente SOAP por sessão selecionada.  
5. Títulos doc: “Avaliação musculoesquelética” / “Evolução clínica”.  
6. Não precisa redesenhar silhueta corporal no PDF — manter lista de marcas (Phase 12 já faz); silhueta gráfica = fora de escopo visual mínimo (refs têm diagrama; D-05 “aproximar”, não pixel-perfect — D-07 impressão idêntica deferred).

### 7. Riscos: vazios, enums, consulta-only

| Risco | Mitigação |
|-------|-----------|
| Campos vazios no PDF | Só selected ∩ filled |
| Enums null/`''` | Schema preprocess + não listar no catalog |
| `canWrite` false | Composer null; RLS INSERT |
| Sessão sem evolução | Não listar no multi-select ou listar disabled + toast |
| EF falha | Toast PT-BR; não upload PDF parcial inventado |
| Legacy rows | Lista continua lendo `geral`/`sessao` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PDF “geral” snapshot clínico | PDF ficha `avaliacao` from JSONB | Phase 12 | Export alinhado ao documento |
| PDF “por sessão” local SOAP | Evolução multi + IA | Phase 13 | REQ-25.4 |
| Storage kind só geral\|sessao | + avaliacao\|evolucao | Phase 13 | Labels honestos |
| Omit empty only | Omit empty **and** unselected | Phase 13 | Privacidade cliente |

**Deprecated/outdated:**

- Mapping `avaliacao → storage geral` no composer  
- Escopos copy “Avaliação salva” / “Por sessão” como labels principais  
- Assumir `drawRectangle({ borderRadius })` — API não tem

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Response JSON da síntese evolução (`sintese`, `tendencias`, …) é shape aceitável | Pattern 3 | Planner deve lockar Zod com user se quiser outras seções |
| A2 | Cap 8–12 sessões por export é suficiente clinicamente | Pitfall 7 | Ajustar se profissionais exportam histórico longo |
| A3 | Bordas retas FLUXO satisfazem D-05 sem SVG rounded | Standard Stack | Só polish visual |
| A4 | `session_label` text basta para multi-sessão (sem JSON metadata column) | kind SQL | Se precisar machine-readable session ids depois, ADD COLUMN jsonb |
| A5 | Zero packages novos | Package Audit | Se quiser fontkit/custom font — out of scope unless Unicode regress |

**If empty:** N/A — assumptions listed for planner/discuss confirmation on A1–A2.

## Open Questions (RESOLVED)

1. **Shape exato das seções IA no PDF de evolução**
   - What we know: D-04 pede agregação; picker inclui trechos IA.
   - What's unclear: quantas seções nomeadas.
   - Recommendation: 3 blocos — Síntese / Tendências / Condutas agregadas (+ Alertas opcional).
   - **RESOLVED:** Locked in plans 13-02/03/05 — EF returns `{ sintese, tendencias?, condutasAgregadas?, alertas? }`; catalog ids `evo.ai.sintese|tendencias|condutasAgregadas|alertas`; PDF draws those blocks only when selected and non-empty.

2. **Migrar rows `geral` antigas que são fichas Phase 12?**
   - What we know: novos exports usam `avaliacao`.
   - What's unclear: backfill.
   - Recommendation: **não migrar** nesta fase; só labels legados.
   - **RESOLVED:** Plan 13-01 — no backfill; legacy `geral`/`sessao` remain readable with existing badges; new exports use `avaliacao`/`evolucao`.

3. **Manter PDF single-session sem IA como atalho?**
   - Deferred by D-01 (Evolução substitui Por sessão).
   - Recommendation: não; multi+IA cobre N=1.
   - **RESOLVED:** Plans 13-04/05 — Evolução always goes through EF synthesis (N≥1); no local SOAP-only Evolução shortcut.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | typecheck/lint | ✓ | v26.4.0 / 12.0.2 | — |
| `pdf-lib` | PDF | ✓ | 1.17.1 | — |
| Supabase project + SQL Editor | kind migration | ✓ (padrão projeto) | — | Human apply `13-*.sql` |
| Edge Function `patient-ai-summary` deploy | Evolução IA | ? (deploy marker in source) | — | Human re-deploy após patch |
| `GEMINI_API_KEY` secret | Evolução IA | ? | — | Mesmo secret do resumo |
| Vitest / Jest | unit tests | ✗ | — | typecheck + lint + UAT manual |
| slopcheck | package gate | ✗ | — | N/A (no new pkgs) |
| ctx7 CLI | docs | ✗ | — | Official pdf-lib site + local typings |

**Missing dependencies with no fallback:**

- Deploy EF atualizado + SQL kinds — bloqueiam Evolução/persistência nova se não aplicados.

**Missing dependencies with fallback:**

- Test runner → UAT manual + `npm run typecheck`.

## Validation Architecture

> `workflow.nyquist_validation` ausente em `.planning/config.json` → tratar como **enabled**.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none (no Vitest/Jest in package.json) [VERIFIED] |
| Config file | none |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-25.1 | Scopes Avaliação \| Evolução | manual UAT | — | ❌ Wave 0 |
| REQ-25.2 | Catalog só filled; default all on | unit (pure fn) | `npm run typecheck` até haver runner | ❌ Wave 0 — add `src/lib/pdfFieldCatalog.test.ts` **se** Vitest for introduzido; senão checklist UAT |
| REQ-25.3 | PDF omite unselected blocks | manual PDF open | — | ❌ |
| REQ-25.4 | Multi-session + EF synthesis | manual + EF logs | — | ❌ |
| REQ-25.5 | !canWrite hides export | manual empresa colega | — | ❌ |
| REQ-25.6 | No invented data | prompt review + UAT | — | ❌ |
| SQL kinds | INSERT avaliacao/evolucao | SQL Editor matrix | — | ❌ Wave 0 script |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** SQL applied + EF redeployed + UAT checklist (abaixo)

### Wave 0 Gaps

- [ ] `supabase/13-patient-ai-reports-kinds.sql` — CHECK + policy  
- [ ] Pure `pdfFieldCatalog.ts` (testável sem runner via typecheck)  
- [ ] UAT script mental: Avaliação picker; Evolução 2 sessões; desmarcar 03-E; empresa read-only  
- [ ] Framework install: **não** introduzir Vitest só por esta fase (consistente Phase 11) salvo pedido explícito

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Bearer JWT → EF `requireUser` |
| V3 Session Management | no | — |
| V4 Access Control | yes | RLS `can_read/write_patient`; UI `canWrite` |
| V5 Input Validation | yes | Zod patientId/sessionIds/kind/size |
| V6 Cryptography | no | — (signed URLs existing) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Export PDF sem write | Elevation | Composer null + RLS INSERT |
| Gemini key no bundle | Info disclosure | EF secret only |
| Prompt injection via userHint | Tampering | “NÃO CONFIÁVEL” block (já no resumo) |
| PHI em PDF para cliente | Info disclosure | Field-picker + sensitive uncheck |
| Oversized upload | DoS | 8 MiB Zod + bucket limit |
| Public bucket | Info disclosure | Keep private `patient-ai-reports` |

## Reference Style Notes (PDF visual)

Das refs 01 / 02 / 04 (e UI `FichaBlock`):

- Blocos lettered com **header** + **borda**  
- Checkboxes → no PDF: bullets / chips dos marcados (já padrão)  
- Tabelas mobilidade/força → linhas `D: … · E: …` (já)  
- Cores: mapear navy/sage das refs → **FLUXO** `forest` / `accent` / `accentSoft` (D-05)  
- Não copiar serif da ref se conflitar com Helvetica WinAnsi

## Sources

### Primary (HIGH confidence)

- Codebase: `PatientAiComposer.tsx`, `patientAiPdf.service.ts`, `patientAi.schema.ts`, `evaluationFicha.schema.ts`, `11-patient-ai-reports.sql`, `patient-ai-summary/index.ts`, `fichaFormPrimitives.tsx`  
- pdf-lib typings: `PDFPageDrawRectangleOptions` sem `borderRadius` [VERIFIED: local node_modules + GitHub raw]  
- Official: https://pdf-lib.js.org/  
- npm view: `pdf-lib@1.17.1`  
- Phase docs: `13-CONTEXT.md`, `11-RESEARCH.md`, `12-RESEARCH.md`, `REQUIREMENTS.md` REQ-25

### Secondary (MEDIUM confidence)

- Phase 11 pitfalls (Unicode, session delete, canWrite) — still apply  
- Gemini model id churn — usar fallback chain existente na EF

### Tertiary (LOW confidence)

- Exact clinical section titles for AI synthesis (A1) — confirm in plan if needed  
- Graphify disabled — sem grafo semântico [VERIFIED: gsd-tools graphify status]

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — reuso total verificado no repo  
- Architecture: **HIGH** — paths claros; SQL kind é decisão prescritiva  
- Pitfalls: **HIGH** — derivados de código + Phase 11/12  
- AI response shape: **MEDIUM** — A1  

**Research date:** 2026-09-20  
**Valid until:** 2026-10-20 (stack estável; EF model ids podem mudar antes)

## RESEARCH COMPLETE
