# Phase 12: Avaliações musculoesqueléticas - Research

**Researched:** 2026-09-20  
**Domain:** Structured clinical evaluation (musculoskeletal anamnesis ficha) + ficha tab UX + pdf-lib export  
**Confidence:** HIGH (brownfield `patient_evaluations` + Phase 11 PDF/tab patterns + 4 reference PNGs inventoried); MEDIUM (exact JSONB shape size / Zod form performance with 100+ fields)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01** — Aba própria **Avaliações** (`avaliacoes`); não embutida em Resumo IA
- **D-02** — Dashboard picker → navega ficha com criar aberto (`?aba=avaliacoes&nova=1`)
- **D-03** — N avaliações; salvamento parcial (mínimo: data); completar depois
- **D-04** — Campos + design das 4 fichas refs (blocos A–H)
- **D-05** — Persistência Supabase + RLS `can_read/write_patient`
- **D-06** — Resumo IA só resumo + PDF lista; sem CRUD de avaliação
- **D-07** — PDF export de avaliação usa o documento 01–04 como referência
- **D-08** — Fora: Google Agenda UAT, Phase 9–10, diagnóstico sistêmico, multi-clínica, comparativo automático

### Claude's Discretion
- JSONB vs colunas tipadas vs tabelas filhas
- Reuso silhueta Phase 6 no mapa corporal (02-A)
- Dashboard: só picker+navigate vs passo intermediário
- Migração dos registros antigos (texto simples REQ-05)

### Deferred Ideas (OUT OF SCOPE)
- Relatórios comparativos entre avaliações
- Assinatura digital CREFITO com certificado
- Impressão A4 idêntica ao papel da clínica
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tab + form UI (4 sections) | Browser/Client | — | React ficha panels |
| Partial create/update | Browser/Client | Database | Zod + PostgREST RLS |
| Schema / JSONB column | Database/Storage | — | SQL Editor apply |
| Dashboard → deep link | Browser/Client | — | `navigate` + query |
| PDF ficha export | Browser/Client | — | pdf-lib (existing) |
| Detach eval from Resumo IA | Browser/Client | — | Remove panel embed |
</architectural_responsibility_map>

<research_summary>
## Summary

Brownfield already has `patient_evaluations` (text columns: anamnesis, main_complaint, …) with RLS and SPA CRUD (`evaluations.service`, `PatientEvaluationPanel`). Phase 11 moved the ficha hub to **Resumo IA** and currently still embeds structured eval as a subsection — Phase 12 reverses that: **dedicated Avaliações tab** + rich ficha matching 4 reference pages.

**Recommended approach:** keep one row per evaluation; add a **`payload jsonb`** (or `ficha jsonb`) holding the structured blocks 01–04; keep legacy text columns for backward compat / migration seed; require only `performed_on` on create (relax Zod `mainComplaint` min). UI: accordion or stepper by page (01–04) with block cards (letter badge + border). Dashboard: drop inline `PatientEvaluationEditorForm` modal destination; after patient pick → `patientFichaPath(id, 'avaliacoes', { nova: true })`. PDF: rebuild `buildPatientAiReportPdf` “geral” / add `kind: 'avaliacao'` that renders filled sections from a selected evaluation (or latest), styled like FLUXO + ficha blocks.

**Primary recommendation:** `ALTER … ADD COLUMN ficha jsonb NOT NULL DEFAULT '{}'::jsonb` + Zod schema mirroring pages/blocks; UI tab `avaliacoes`; PDF maps `ficha` → printable sections.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + RHF + Zod | repo | Forms | Existing evaluation/cadastro pattern |
| TanStack Query | repo | CRUD cache | `usePatientEvaluations*` |
| Supabase PostgREST | hosted | Persist + RLS | Phase 3 policies already on table |
| pdf-lib | ^1.17 | PDF export | Phase 11 already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind + design tokens | repo | Block UI | Match FLUXO, not copy serif ref blindly |
| Focus silhouette SVG | Phase 6 | Body map 02-A | Local selection into `ficha`, not chart toggle |
</standard_stack>

<field_inventory>
## Field Inventory (from reference PNGs)

### 01 — Anamnese inicial
- **A Identificação:** nome, nasc, naturalidade, gênero, estado civil, profissão; endereço residencial/profissional; contato; data avaliação (+ nota COFFITO)
- **B Queixa:** o que trouxe; região; lado (D/E/bilateral/central/N/A); há quanto tempo
- **C História atual:** início (checkboxes); data aprox; como começou; evolução (melhorando/piorando/estável/oscilando); já aconteceu; se sim quando/como
- **D Tratamentos/investigações:** fisio/meds/infiltração/cirurgia/imobilização/outro; exames (RX/US/RM/TC/ENMG/outros); achados
- **E Histórico pregresso:** cirurgias, fraturas, lesões, neuro, cardio, diabetes, câncer, inflamatório/reuma, outros; observações

### 02 — Comportamento dos sintomas
- **A Mapa corporal:** frente/costas + legendas X / //// / O / ↑ / ★ (store as marks[]: `{regionKey, symbol}`)
- **B Característica:** dor, rigidez, fraqueza, parestesia, dormência, instabilidade, travamento, estalo, edema, outro
- **C Intensidade:** agora / melhor / pior (0–10) + VAS
- **D 24h:** manhã/dia/noite (melhor/igual/pior); interfere sono; acorda por sintomas
- **E Piora:** checklist + detalhe
- **F Melhora:** checklist + detalhe
- **G Irritabilidade:** esforço para provocar; tempo para voltar

### 03 — Função, contexto e segurança
- **A Limitação funcional:** 3 itens texto
- **B Atividades afetadas:** checklist + capacidade atual / atividade / consigo por / antes
- **C Rotina:** trabalho (sentado/em pé/…); horas/dia; atividade física sim/não + qual/freq
- **D Expectativas:** texto + objetivos principais checklist
- **E Triagem segurança (red flags):** checklist + conduta + observações
- **F Medicações / alergias / outras info:** 3 text areas

### 04 — Avaliação e plano
- **A Inspeção:** checklist + achados
- **B Mobilidade:** tabela movimento/D/E/dor/obs + ativo/passivo/bilateral
- **C Força:** tabela grupo/D/E/dor/obs
- **D Neurológico:** checklist + achados
- **E Palpação/testes/função:** linhas texto
- **F Síntese:** 3 problemas + diagnóstico fisio + prognóstico
- **G Objetivos:** curto (2) + médio/longo (2)
- **H Planejamento:** checklist + frequência / qtd atendimentos / progressão / reavaliação / encaminhamento
- **ID profissional:** fisio, CREFITO, data, assinatura (texto)

Many identification fields (01-A) can **prefill from patient** but stay editable copies inside `ficha` for that evaluation date.
</field_inventory>

<schema_recommendation>
## Schema Recommendation

**Preferred:** additive JSONB on existing table.

```sql
alter table public.patient_evaluations
  add column if not exists ficha jsonb not null default '{}'::jsonb;
```

- Keep legacy text columns; on read, if `ficha` empty, map old fields into a compatibility view for UI/PDF.
- Zod: `evaluationFichaSchema` (deep optional) + form schema with `performedOn` required only; `mainComplaint` becomes optional (D-03).
- Do **not** create 4 separate tables — one document per evaluation matches print/PDF and partial save.
- Index optional: none required for MVP; GIN only if later filtering by red-flag keys.

**SQL apply path:** SQL Editor only (same as Phases 3/7/11); twin under `supabase/` + phase `sql/`.
</schema_recommendation>

<ui_recommendation>
## UI Recommendation

1. **Tab** `Avaliações` / `avaliacoes` after Evoluções (or after Resumo IA — prefer after Evoluções for clinical flow).
2. **Panel:** list (date, “Inicial”, completeness hint) + create/edit composer.
3. **Form:** 4 page sections (tabs or accordion) with block cards (`BLOCO A` badge + `border-line` + accent header) — design language from refs, colors from FLUXO tokens.
4. **Partial save:** CTA “Salvar” always enabled when `performedOn` valid; empty sections OK.
5. **`openCreate`:** `PatientPage` reads `nova=1`, passes `openCreate` to panel, clears query after open (`replace`).
6. **Dashboard:** picker only for `avaliacao` kind → navigate; remove mounting full editor in Modal (or keep Modal as thin “abrindo ficha…” then navigate — prefer immediate navigate).
7. **Resumo IA:** remove `PatientEvaluationPanel` embed / structured subsection.
8. **Body map:** reuse FocusAreas SVG; store marks in `ficha.sintomas.mapa`; do not call `togglePatientFocusArea` unless user explicitly syncs (discretion: no auto-sync).
</ui_recommendation>

<pdf_recommendation>
## PDF Export (D-07)

- Extend `patientAiPdf.service` with renderer for evaluation ficha (pages/sections), FLUXO header already present.
- Resumo IA composer PDF mode:
  - Prefer **select saved evaluation** (or “mais recente”) for “avaliação” export; keep **sessão** as evolution SOAP PDF.
  - Rename UX copy if needed: “Exportar avaliação (PDF)” binds to structured eval document.
- Omit empty blocks in PDF (legibility); show checkmarks as filled text lists.
- Do not call Gemini for PDF content.
</pdf_recommendation>

<pitfalls>
## Pitfalls

1. **Reusing slug `avaliacao`** for the new tab — conflicts with Phase 11 legacy → Resumo IA. Use **`avaliacoes`**.
2. **Keeping `mainComplaint` required** — blocks D-03 partial create.
3. **Writing 80 DB columns** — prefer JSONB; avoid migration hell.
4. **Embedding form in dashboard Modal again** — user asked to land on tab with create open.
5. **Auto-toggling patient focus areas from body map** — can wipe/alter chart unintentionally; keep local to ficha.
6. **Huge form re-renders** — split into page subcomponents; defaultValues once.
7. **PDF dumping empty sections** — filter empties.
8. **SQL via `db push`** — not available; Editor only.
</pitfalls>

<codebase_facts>
## Codebase Facts

- Table `patient_evaluations` + RLS in Phase 03 SQL
- Service: `src/services/evaluations.service.ts`
- Schema today requires `mainComplaint` min 2 — must relax
- `PatientResumoIaPanel` still mounts `PatientEvaluationPanel`
- `DashboardClinicalShortcut` mounts `PatientEvaluationEditorForm` in Modal after pick
- `patientFichaPath` currently `'evolucoes' | 'avaliacao' | 'resumo-ia'` — extend
- pdf-lib brand layout already in `patientAiPdf.service.ts`
- PATTERNS.md mapped 15 files; invent `nova=1` handling
</codebase_facts>

<validation>
## Validation Notes

- Nyquist: typecheck + lint; human SQL apply; UAT create partial → reopen → fill → PDF export
- UI-SPEC recommended for block chrome + dashboard deep link
</validation>

---
*Phase: 12-avaliacoes-musculoesqueleticas*  
*Researched: 2026-09-20*
