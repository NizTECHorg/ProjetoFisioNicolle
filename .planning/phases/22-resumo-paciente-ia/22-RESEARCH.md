# Phase 22: Resumo do paciente editável e preenchido pela IA - Research

**Researched:** 2026-10-03
**Domain:** Supabase (SQL Editor + Edge Function Deno/Gemini) + React 19 SPA (TanStack Query, RHF + Zod)
**Confidence:** HIGH sobre o estado do código e o esquema proposto; MEDIUM sobre o comportamento do Gemini (só provável em UAT hospedado)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Persistência**
- Salvar apenas o último resumo de IA. Uma geração nova substitui a anterior. Sem histórico de versões.
- O texto original da geração e o texto editado pelo profissional são coisas distintas: editar não apaga o original mostrado na aba Resumo IA.

**Onde se edita**
- A edição acontece na aba Resumo (Resumo do paciente), não na aba Resumo IA.
- A aba Resumo IA fica só com o resumo original criado pela IA.

**O que a geração preenche**
- A IA preenche todas as caixas do Resumo do paciente que esta fase definir, não só o bloco Resumo IA.
- Áreas de foco entram nessa geração: a IA marca as regiões que o prontuário sustenta.
- O conjunto de campos é global. Não muda de paciente para paciente. A escolha é feita agora e vale para todo mundo.
- Se um card atual não puder ser preenchido com as informações que a IA tem (o exemplo dado foi Programa), ele é substituído agora, para todos, por um campo que a IA consiga preencher. Não deixar o card vazio como desculpa.

**Prompt**
- O system prompt da função de resumo é reescrito para esta tarefa: quais campos existem, o que cada um significa, e que a IA só afirma o que está no prontuário.

### Claude's Discretion
- Quais cards atuais (Programa, Condutas, Evolução geral, Dor) permanecem e quais são trocados, desde que o conjunto final seja único, preenchível pela IA e igual para todos.
- Como separar no banco o texto original do texto editado, desde que a UI obedeça as duas abas.
- A série de EVA e a lista de objetivos continuam vindo dos registros reais se a IA não tiver como produzi-los sem inventar números ou metas. Nesse caso o card é trocado ou permanece como dado clínico já gravado, nunca como número inventado.

### Deferred Ideas (OUT OF SCOPE)
Nenhuma ideia adiada foi registrada em 22-CONTEXT.md.

**Restrições de projeto (tratar como travadas):** SQL só por scripts do SQL Editor (nunca `supabase/migrations`, nunca `supabase db push`); UI em português; sem pacote npm novo; não publicar Edge Function por CLI (documentar o passo de colar/publicar no Dashboard); `can_write_patient`/RLS continua sendo a parede de escrita e quem só consulta não recebe controle de edição com cara de clicável; segredos só no Dashboard.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-33.1 | Cada nova geração substitui a anterior; sem lista de versões | Uma única linha em `patients`: `ai_summary` + `ai_summary_fields` sobrescritos em um só `UPDATE`; `summary_edits` zerado na mesma escrita (ver Schema) |
| REQ-33.2 | Aba Resumo IA mostra o texto original, sem edição | Novo bloco somente leitura em `PatientResumoIaPanel` lendo `aiSummary` + `aiSummaryFields`; hoje a aba **não mostra** o resumo (só diz "aparece em Resumo do paciente") |
| REQ-33.3 | Aba Resumo permite editar o texto e a edição fica salva | `summary_edits jsonb` (sobreposição por chave) + um modal único "Editar resumo" aberto por lápis no bloco Resumo IA, escondido sem `canWrite` |
| REQ-33.4 | Geração preenche os campos definidos, iguais para todos, incluindo áreas de foco | Conjunto fixo de 7 cards (tabela abaixo); EF devolve 6 textos + `focusRegionKeys`; foco segue aditivo via `applyAiFocusRegionKeys` |
| REQ-33.5 | Card que não dá para preencher com honestidade é trocado globalmente | Programa → Plano de tratamento; Dor (EVA) → Dor e limitações; badge `eva/10` removido (evidência: nenhuma escrita no app para `program_*`, `current_eva`, `patient_pain_logs`) |
| REQ-33.6 | System prompt descreve os campos e o que não inventar | Reescrever `buildPrompt` (modo resumo) em `.planning/phases/13-.../functions/patient-ai-summary/index.ts`; contrato de JSON e regras na seção Prompt |
</phase_requirements>

## Summary

O código responde quase tudo. A geração atual (`generatePatientAiSummary`) grava só `patients.ai_summary` e marca regiões de foco de forma aditiva. O Resumo do paciente (`ResumoDoPaciente` em `src/pages/PatientPage.tsx`) lê outras seis colunas de `patients` — `program_name`, `program_progress`, `current_eva`, `evolution_summary`, `last_conducts`, `next_session_plan` — e a série de `patient_pain_logs`. **Nenhum código do app escreve em nenhuma delas** (`updatePatient` só mapeia identidade, queixa, diagnóstico, frequência e `ai_summary`; `patient_pain_logs` só tem `select`). Por isso o print mostra tudo vazio: "—", "0% concluído", "0/10", "Sem registros de dor ainda." Não há como o usuário preencher esses campos na UI. [VERIFIED: grep em `src/`, `patients.service.ts` `updatePatient` linhas 590–622]

Esses campos vazios também **poluem o prompt**: a Edge Function manda `eva: patient.current_eva ?? undefined` e `programProgress`, e `0` passa por `omitEmpty` (só descarta `undefined/null/''`). O modelo recebe `eva: 0` e `programProgress: 0` como se fossem fatos. [VERIFIED: phase 13 `index.ts` linhas 368–372 e `omitEmpty` 124–131]

Recomendação: **sete cards fixos** (Resumo IA, Plano de tratamento, Evolução geral, Condutas + próxima sessão, Dor e limitações, Áreas de foco, Todos os objetivos). Seis são texto gerado a partir de avaliação e evoluções reais, com original em `ai_summary` + nova `ai_summary_fields jsonb` e edição em nova `summary_edits jsonb` (sobreposição por chave). Áreas de foco continuam aditivas e editáveis pelo boneco que já existe. Objetivos continuam 100% humanos. Duas colunas novas, nenhuma política RLS nova (`patients_update` + `can_write_patient` já cobre).

**Primary recommendation:** Duas colunas `jsonb` em `patients`, um contrato JSON plano na Edge Function (`summary`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, `painLimitations`, `focusRegionKeys`), um helper puro `resolveSummaryFields(original, edits)` testável com `node:test`, e um modal único de edição na aba Resumo.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Montar contexto clínico e chamar Gemini | API / Backend (Edge Function) | — | `GEMINI_API_KEY` só no Dashboard; pack lido com o JWT do usuário (RLS) |
| Impedir invenção de dados (prompt + parse) | API / Backend | Browser (Zod re-valida) | Primeira barreira no prompt/parse; o cliente nunca grava o que não passa no Zod |
| Persistir original da geração | Database (PostgREST `UPDATE` do cliente) | — | Mantém o padrão atual; RLS `patients_update` é a parede |
| Persistir edições | Database | Browser | Coluna própria; o cliente calcula o diff e envia |
| Resolver "texto exibido" (edição ?? original) | Browser (helper puro) | — | Regra de exibição; sem lógica no banco |
| Marcar áreas de foco | Database (`patient_focus_areas`) | Browser (insert aditivo) | Catálogo fechado no Zod e no CHECK de formato |
| Esconder controles de edição sem permissão | Browser (UX) | Database (RLS) | Cliente só esconde; RLS recusa |

## Decisão: conjunto único de cards

Inventário do que o modelo recebe hoje (`assembleContextPack`): paciente, metas, áreas de foco, alertas, até 20 sessões com evolução (estado, mudanças, condutas, resposta, intercorrências, próximo plano) e até 10 avaliações (queixa, anamnese, dor, limitações, exame físico, testes, diagnóstico fisioterapêutico, plano). [VERIFIED: phase 13 `index.ts` linhas 227–390]

| # | Card (UI, PT) | Hoje | Decisão | Fonte honesta no prontuário | Dono |
|---|---------------|------|---------|-----------------------------|------|
| 1 | **Resumo IA** (largura total) | `ai_summary` | **Fica** | Todo o pack | IA gera; humano edita |
| 2 | **Plano de tratamento** | era **Programa** (`program_name`, barra de `program_progress`) | **Troca.** Nenhum campo de programa é gravável no app; progresso 0% é artefato de default | `evaluations[].plan`, `physioDiagnosis`, `patient.frequency`, `sessionsPlanned` | IA gera; humano edita |
| 3 | **Evolução geral** | `evolution_summary` + badge `current_eva` | **Fica o texto; badge `eva/10` sai** | `sessions[].evolution.changesSinceLast`, `treatmentResponse`, `patientState` em ordem cronológica | IA gera; humano edita |
| 4 | **Condutas** + sub-bloco **Plano próxima sessão** | `last_conducts`, `next_session_plan` | **Fica** (dois textos) | `evolution.conducts` recentes; `nextPlan` **só** da evolução mais recente | IA gera; humano edita |
| 5 | **Dor e limitações** | era **Dor (EVA)** (`EvaChart`, série vazia) | **Troca.** IA não produz série numérica sem inventar | `evaluations[].pain`, `limitations`; `evolution.patientState`, `incidents` | IA gera texto; série EVA real aparece abaixo **só se existir** |
| 6 | **Áreas de foco** | boneco | **Fica** | `mainComplaint`, `pain`, `physicalExam`, notas de sessão que citem a região | IA marca (aditivo); humano marca/desmarca no boneco |
| 7 | **Todos os objetivos** | `PatientGoalsPanel` | **Fica como está** | `patient_goals` (registros reais). A IA não cria metas | **Humano** |

Notas de decisão:
- Card 5 mantém `EvaChart` como bloco secundário condicional (`painSeries.length > 0`). Isso cobre a regra "permanece como dado clínico já gravado" sem criar número. Se ninguém grava `patient_pain_logs`, o gráfico some e o card vira só texto. Não apagar tabela nem política. [ASSUMED: ninguém grava `patient_pain_logs` por fora do app; ver Open Question 3]
- Card 7: o texto de avaliação tem um campo `goals`, mas converter isso em linhas de `patient_goals` criaria metas que parecem do profissional (com checkbox e data). Decisão travada #9 proíbe inventar metas. Fica humano.
- Eliminar a leitura de `program`, `programProgress`, `eva`, `evolutionSummary`, `lastConducts`, `nextSessionPlan` em `ResumoDoPaciente`. As colunas **não** são removidas do banco. Esses getters só são usados em `PatientPage.tsx`. [VERIFIED: grep `\.programProgress|\.evolutionSummary|\.lastConducts|\.nextSessionPlan|detail\.eva`]

## Schema: original vs. editado

Menor esquema que cumpre a regra das duas abas: **duas colunas `jsonb` novas** em `public.patients`, mais a coluna `ai_summary` que já existe.

| Coluna | Tipo | Conteúdo | Quem escreve |
|--------|------|----------|--------------|
| `ai_summary` (existe) | text | **Original** do campo `summary`. Mantém leitura atual e fallback para pacientes já gerados antes da fase | Geração |
| `ai_summary_fields` (nova) | jsonb | Original dos outros 5 textos + `generatedAt` ISO: `{"generatedAt","treatmentPlan","evolution","conducts","nextSessionPlan","painLimitations"}` | Geração (substitui inteiro) |
| `summary_edits` (nova) | jsonb | Sobreposição do profissional, **só chaves editadas**, mesmas 6 chaves (`summary` incluída): `{"summary":"...","conducts":"..."}`. `null` = nada editado | Modal de edição; **zerada** a cada nova geração |

Regras:
- Texto exibido na aba Resumo: `edits[key] ?? original[key] ?? ''`. Chave presente em `edits` com string vazia significa "o profissional apagou" e mostra "—".
- A aba Resumo IA lê **só** `ai_summary` + `ai_summary_fields`; nunca `summary_edits`. Isso garante que editar não apaga o original.
- Nova geração: um `UPDATE` com `ai_summary`, `ai_summary_fields` e `summary_edits = null`. Um só comando evita estado meio escrito. Como o histórico não existe, substituir é o contrato.
- Se o profissional já editou, o composer deve pedir confirmação (`ConfirmDialog` já existe) antes de gerar: "Gerar de novo substitui o resumo e as suas edições." [ASSUMED: apagar edições na regeneração é o desejado; ver Assumption A1]
- Edição sem geração prévia é permitida (só `summary_edits`); `original` ausente vira `''`.
- Alternativa descartada: uma coluna única `{original, edits}`. Exigiria ler-modificar-escrever no cliente a cada edição e arrisca sobrescrever o original. Duas colunas deixam cada fluxo escrever só a sua.
- Alternativa descartada: espelhar tudo em colunas `text` por campo (12 colunas). Mais DDL, mais mapeamento, sem ganho.

### Script SQL Editor (esboço, **não** é migration)

Arquivo sugerido: `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql`. O espelho em `supabase/` é gitignorado (`/supabase/`) e não conta.

```sql
-- REQ-33. Idempotente. Cole no SQL Editor. Nao use supabase db push.
-- Nao cria policy: patients_update + private.can_write_patient ja cobre colunas novas.

alter table public.patients
  add column if not exists ai_summary_fields jsonb,
  add column if not exists summary_edits jsonb;

alter table public.patients
  drop constraint if exists patients_ai_summary_fields_shape,
  drop constraint if exists patients_summary_edits_shape;

-- NULL passa nos dois CHECKs (expressao NULL nao reprova).
alter table public.patients
  add constraint patients_ai_summary_fields_shape
    check (jsonb_typeof(ai_summary_fields) = 'object'
           and octet_length(ai_summary_fields::text) <= 20000),
  add constraint patients_summary_edits_shape
    check (jsonb_typeof(summary_edits) = 'object'
           and octet_length(summary_edits::text) <= 20000);

notify pgrst, 'reload schema';

-- Checagens (rodar separado, depois de Success):
-- 1. select column_name, data_type from information_schema.columns
--    where table_schema='public' and table_name='patients'
--      and column_name in ('ai_summary_fields','summary_edits');   -- 2 linhas, jsonb
-- 2. update patients set summary_edits = '"x"'::jsonb where id = '<id proprio>';  -- 23514
-- 3. como colega empresa (consulta): update na ficha de outro -> 0 linhas / 42501
-- 4. select has_column_privilege('authenticated','public.patients','summary_edits','UPDATE'); -- true
```

O item 4 cobre o risco de existir GRANT por coluna no projeto hospedado; os `.sql` do repo não têm `grant ... on public.patients`, então a tabela usa os grants padrão do Supabase. [VERIFIED: grep em `.planning/**/*.sql`; comportamento hospedado → UAT]

## Standard Stack

### Core (já no projeto; nenhuma instalação)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react / react-hook-form / @hookform/resolvers / zod | 19.1 / 7.56 / 5.0 / 3.25 | Modal de edição validado | Mesmo padrão de `EntendaOCaso` e `PatientGoalsPanel` |
| @tanstack/react-query | 5.76 | Mutação de edição + `invalidatePatient` | Hook `useUpdatePatient`/`invalidatePatient` existentes |
| @supabase/supabase-js | 2.117.1 | `functions.invoke` + `update` | Padrão atual de `patientAi.service.ts` |
| lucide-react | 1.25 | `Pencil`, `Sparkles` | Já importados em `PatientPage.tsx` |
| node:test (Node 26.4) | embutido | Teste do helper puro | Já usado: `src/lib/sessionSeries.test.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `response_mime_type: 'application/json'` + prompt | `responseSchema`/JSON Schema no `generateContent` | Não consegui confirmar na doc atual o nome do parâmetro para `generateContent` (a página mostra a Interactions API). Manter o mecanismo que já funciona e validar no parse. [LOW] |
| Modal único de edição | Lápis por card | 6 modais = 6 vezes o boilerplate e 6 `UPDATE`s; um modal salva uma vez |

**Installation:** nenhuma. `npm view`/slopcheck não se aplicam.

## Package Legitimacy Audit

Nenhum pacote externo novo nesta fase. **Packages removed due to slopcheck [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
[Aba Resumo IA: PatientAiComposer, só canWrite]
      │ (se há summary_edits → ConfirmDialog "substitui suas edições")
      ▼
generatePatientAiSummary ──invoke──► Edge Function patient-ai-summary (mode resumo)
                                       │ JWT do usuário → RLS
                                       ├─ assembleContextPack (SEM program/eva/priorAiSummary)
                                       ├─ buildPrompt (reescrito, 7 chaves)
                                       ├─ Gemini (response_mime_type json) ─► parse + clamp + filtra foco (42 chaves)
                                       ▼
      ◄── { summary, treatmentPlan?, evolution?, conducts?, nextSessionPlan?, painLimitations?, focusRegionKeys[] }
      │ Zod (aiSummaryResponseSchema)
      ├─► UPDATE patients SET ai_summary, ai_summary_fields, summary_edits=NULL   (RLS can_write_patient)
      └─► applyAiFocusRegionKeys (INSERT aditivo em patient_focus_areas; 23505 ignorado)
      │ invalidatePatient
      ▼
[getPatientById → Patient{aiSummary, aiSummaryFields, summaryEdits, focusAreas, goals, painSeries}]
      ├──► Aba Resumo IA: bloco SOMENTE LEITURA com o original (summary + 5 campos + data)
      └──► Aba Resumo: resolveSummaryFields(original, edits) → 7 cards
                 └─ lápis (canWrite) → Modal "Editar resumo" (6 Textareas) → UPDATE summary_edits
```

### Recommended Project Structure
```
src/
├── lib/patientSummary.ts          # NOVO: SUMMARY_FIELD_KEYS, labels, resolveSummaryFields, diffEdits (puro, import relativo)
├── lib/patientSummary.test.ts     # NOVO: node:test
├── schemas/patientAi.schema.ts    # + aiSummaryResponseSchema, summaryEditsSchema, copy novo
├── types/patient.ts               # + AiSummaryFields, SummaryEdits; Patient.aiSummaryFields/summaryEdits
├── services/patients.service.ts   # DETAIL_COLUMNS +2, PatientRow +2, mapPatient, savePatientSummaryEdits
├── services/patientAi.service.ts  # grava os 3 campos de uma vez; Zod no corpo da EF
├── hooks/usePatients.ts           # + useSavePatientSummaryEdits (invalida via invalidatePatient)
├── components/patients/PatientSummaryEditorModal.tsx  # NOVO
├── components/patients/PatientResumoIaPanel.tsx       # + bloco original somente leitura
├── components/patients/PatientAiComposer.tsx          # + ConfirmDialog antes de substituir edições
└── pages/PatientPage.tsx          # ResumoDoPaciente: 7 cards; remove programa/EVA badge
.planning/phases/22-resumo-paciente-ia/
├── sql/22-patient-summary-fields.sql
└── 22-USER-SETUP.md               # passos do Dashboard
```

### Pattern 1: edição em modal com lápis escondido sem permissão
**What:** `EntendaOCaso` renderiza o lápis só com `canWrite`, abre `Modal`, usa RHF + `zodResolver`, `useUpdatePatient`. O lápis usa `opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100` e `min-h-11 min-w-11`. [VERIFIED: `PatientPage.tsx` linhas 103–253]
**When to use:** edição do resumo. Não existe edição inline em nenhum card do app; adotar inline seria padrão novo.
**Decisão:** **um** lápis no cabeçalho do bloco "Resumo IA" abre **um** modal com 6 `Textarea` (`summary`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, `painLimitations`). Quem só consulta não vê lápis nem modal (nem desabilitado), igual `EntendaOCaso`/`PatientGoalsPanel` (D-07 da fase 3).

### Pattern 2: sobreposição por chave (helper puro)
```ts
// src/lib/patientSummary.ts — sem imports com alias '@/', para rodar em node:test
export const SUMMARY_FIELD_KEYS = [
  'summary', 'treatmentPlan', 'evolution', 'conducts', 'nextSessionPlan', 'painLimitations',
] as const
export type SummaryFieldKey = (typeof SUMMARY_FIELD_KEYS)[number]
export type SummaryTexts = Partial<Record<SummaryFieldKey, string>>

export function resolveSummaryFields(
  original: SummaryTexts | null | undefined,
  edits: SummaryTexts | null | undefined,
): Record<SummaryFieldKey, string> {
  const out = {} as Record<SummaryFieldKey, string>
  for (const key of SUMMARY_FIELD_KEYS) {
    const edited = edits?.[key]
    out[key] = typeof edited === 'string' ? edited : (original?.[key] ?? '')
  }
  return out
}

/** Só chaves que diferem do original; vazio → null (coluna fica NULL). */
export function diffSummaryEdits(
  original: SummaryTexts | null | undefined,
  next: SummaryTexts,
): SummaryTexts | null {
  const out: SummaryTexts = {}
  for (const key of SUMMARY_FIELD_KEYS) {
    const value = (next[key] ?? '').trim()
    if (value !== (original?.[key] ?? '').trim()) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}
```

### Pattern 3: geração em uma escrita
```ts
// patientAi.service.ts (esboço)
const parsed = aiSummaryResponseSchema.parse(body) // summary obrigatório; demais opcionais; trim + max
const { summary, focusRegionKeys, ...fields } = parsed
const { data, error } = await supabase.from('patients').update({
  ai_summary: summary,
  ai_summary_fields: { generatedAt: new Date().toISOString(), ...fields },
  summary_edits: null,
}).eq('id', patientId).select('id')
// 0 linhas = RLS recusou → mesmo erro de updatePatient
await applyAiFocusRegionKeys(patientId, focusRegionKeys) // inalterado, aditivo
```

### Anti-Patterns to Avoid
- **Alargar `payload: Record<string, string | number | null>` em `updatePatient` para jsonb.** Quebra o typecheck e mistura fluxos. Criar `savePatientSummaryEdits` e uma função de gravação da geração, cada uma com seu `update`.
- **Ler `summary_edits` na aba Resumo IA.** Viola a regra das duas abas.
- **Desmarcar regiões na regeneração.** Apagaria marcações manuais; manter aditivo (decisão herdada da fase 11, Pitfall 7).
- **Criar terceira cópia da Edge Function.** Editar a fonte da fase 13 no lugar.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmar substituição de edições | Modal próprio | `ConfirmDialog` (`src/components/ui`) | Já existe, com `tone` e `isLoading` |
| Formulário de edição | `useState` por campo | RHF + `zodResolver` + `Textarea` | Mesmo padrão de `EntendaOCaso` |
| Validar chaves de foco | Regex nova | `focusRegionKeySchema` + `getFocusRegion` | Já filtram no cliente (`applyAiFocusRegionKeys`) |
| Mapear erros da EF | Toasts novos | `mapPatientAiError` / `PATIENT_AI_COPY` | Já cobre 401/403/404/503/misconfigured |
| Marcar foco | Toggle (`togglePatientFocusArea`) | `applyAiFocusRegionKeys` | O toggle **desmarca** quem já está marcado |
| Estado de permissão | Novo predicado | `canWritePatient` já passado como `canWrite` | UX; RLS decide |

## Contrato de prompt (reescrever `buildPrompt`, modo resumo)

**JSON de saída (exatamente estas chaves; `summary` obrigatório, o resto opcional — omitir a chave se o prontuário não sustenta):**

| Chave | Significado | Fonte permitida | Limite |
|-------|-------------|-----------------|--------|
| `summary` | Visão geral do caso em PT-BR, 3–6 frases | Todo o contexto | 1500 |
| `treatmentPlan` | Plano/abordagem de tratamento já registrado | `evaluations[].plan`, `physioDiagnosis`, `patient.frequency`, `sessionsPlanned` | 500 |
| `evolution` | Como o paciente evoluiu entre as sessões | `sessions[].evolution.changesSinceLast`, `treatmentResponse`, `patientState` | 500 |
| `conducts` | Condutas aplicadas nas sessões recentes | `sessions[].evolution.conducts` | 500 |
| `nextSessionPlan` | Plano da próxima sessão | **Somente** `nextPlan` da evolução mais recente | 400 |
| `painLimitations` | Dor e limitações descritas | `evaluations[].pain`, `limitations`; `patientState`, `incidents` | 500 |
| `focusRegionKeys` | Regiões sustentadas pelo texto | Catálogo fechado de 42 chaves | array |

**Regras que o prompt deve exigir (em PT-BR, imperativas):**
1. Usar APENAS o JSON de contexto. Nunca inventar sintomas, diagnósticos, medidas, datas, condutas ou planos.
2. **Não emitir número de EVA, percentual de progresso ou contagem que não esteja escrita no texto do prontuário.** Se um valor de dor aparece literalmente em `pain`/`patientState`, pode citá-lo entre aspas como registrado; não derivar nem converter.
3. **Não criar nem sugerir objetivos/metas.** (Metas existentes no contexto podem ser citadas no `summary` como registradas.)
4. Omitir a chave quando não houver base. Nunca preencher com "não informado" nem com hipótese. Se o contexto for insuficiente, `summary` diz isso em uma frase e as demais chaves são omitidas.
5. `focusRegionKeys`: só chaves do catálogo e só quando queixa, dor, exame físico ou evolução citam a região. Array vazio quando nenhuma. `focusAreas` já marcadas no contexto não precisam repetir.
6. `nextSessionPlan` não pode ser deduzido de `conducts`; se a última evolução não tem `nextPlan`, omitir.
7. O pedido do profissional (`userHint`) continua marcado como NÃO CONFIÁVEL e só ajusta ênfase, nunca fatos.
8. Responder estritamente em JSON, sem markdown.

**Mudanças no pack (mesmo arquivo):** remover `program`, `programProgress`, `eva`, `evolutionSummary`, `lastConducts`, `nextSessionPlan` e **`priorAiSummary`** do `patient` do modo resumo. As cinco primeiras só carregam defaults nunca preenchidos; `priorAiSummary` faz o modelo repetir texto antigo (e, depois de edições, o prompt não deve ancorar em nada que não seja prontuário). `eva: 0` hoje chega ao modelo. [VERIFIED: `index.ts` linhas 368–383] Não mexer em `assembleEvolucaoContextPack`/`buildEvolucaoPrompt` (modo PDF, REQ-25).

**Parse (`parseGeminiJson`):** `summary` obrigatório como hoje; para cada texto opcional `typeof === 'string'`, `trim()`, cortar no limite, descartar vazio; `filterFocusKeys` inalterado. Resposta HTTP achatada: `{ summary, treatmentPlan?, evolution?, conducts?, nextSessionPlan?, painLimitations?, focusRegionKeys }`. Backward compatible: cliente antigo lê `summary` e `focusRegionKeys` como antes.

## Common Pitfalls

### Pitfall 1: Função antiga publicada, app novo
**What goes wrong:** O app novo chama a função hospedada antiga (que só devolve `summary` + `focusRegionKeys`). Os 5 cards ficam vazios após "gerar".
**Why it happens:** O app não publica a Edge Function; é passo manual no Dashboard. Já existe uma pendência aberta: a função hospedada pode estar até com as 30 chaves antigas. [VERIFIED: `STATE.md` linha 197; `19-USER-SETUP.md`]
**How to avoid:** O cliente aceita resposta só com `summary` (campos opcionais no Zod), grava `ai_summary_fields` vazio e não quebra. `22-USER-SETUP.md` obriga publicar **a fonte da fase 13 editada**, nunca a da fase 11. A cópia `supabase/functions/patient-ai-summary/index.ts` é gitignorada e **já está defasada** (30 chaves); ignorar.
**Warning signs:** Resumo atualiza, demais cards "—".

### Pitfall 2: `0` passa por `omitEmpty`
**What goes wrong:** O modelo recebe `eva: 0`, `programProgress: 0` e escreve "dor 0/10".
**How to avoid:** Remover esses campos do pack (acima). Teste de contrato que o texto do pack não contém `current_eva`/`programProgress`.

### Pitfall 3: Regeneração apaga edição sem aviso
**How to avoid:** `ConfirmDialog` no composer quando `detail.summaryEdits != null`. Sem esse aviso o profissional perde trabalho.

### Pitfall 4: Aba Resumo IA mostrando texto editado
**How to avoid:** Esse painel só importa `aiSummary` e `aiSummaryFields`. Revisão de código/grep: `summaryEdits` não pode aparecer em `PatientResumoIaPanel.tsx`.

### Pitfall 5: Foco "volta" depois de o profissional desmarcar
**What goes wrong:** Aditivo remarca região que o profissional tirou.
**How to avoid / accept:** Decisão: manter aditivo. É a escolha menos destrutiva. Registrado como risco aceito (A2).

### Pitfall 6: Tipagem do `update` com jsonb
`updatePatient` tipa `payload` como `Record<string, string | number | null>`. Objetos jsonb não cabem. Usar funções dedicadas.

### Pitfall 7: Escrita parcial (ai_summary ok, foco falha)
`generatePatientAiSummary` já faz duas etapas (texto, depois foco). Se o foco falhar, o texto fica salvo e o toast mostra erro. Aceitável; não tentar transação cliente.

### Pitfall 8: Tela vazia antes da primeira geração
Cards mostram "—" (padrão atual). O lápis continua disponível para escrever à mão. Não mostrar placeholder inventado.

## Code Examples

### Aba Resumo IA: bloco original somente leitura
```tsx
// PatientResumoIaPanel.tsx — usa usePatient (mesma query em cache); sem controles de escrita
const { data: detail } = usePatient(patientId)
// ...
{detail?.aiSummary ? (
  <section aria-label="Resumo original da IA" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
    {/* summary + os 5 campos de aiSummaryFields, rótulos de SUMMARY_FIELD_LABELS, data de generatedAt */}
  </section>
) : null}
```
Copiar também o texto de ajuda: hoje diz "O texto gerado aparece em Resumo do paciente." Trocar por algo como "Aqui fica o texto original da última geração. Para corrigir, abra a aba Resumo." Visível para quem só consulta; o composer continua escondido sem `canWrite`.

### ResumoDoPaciente (esqueleto)
```tsx
const text = resolveSummaryFields(
  { summary: detail.aiSummary, ...detail.aiSummaryFields },
  detail.summaryEdits,
)
// card 1 usa text.summary || 'Sem resumo ainda.'; lápis só se canWrite
// card 5: <p>{text.painLimitations || '—'}</p> + (detail.painSeries.length > 0 ? <EvaChart .../> : null)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Geração grava só `ai_summary` | Geração grava original em 2 colunas e zera edições | Fase 22 | 7 cards preenchidos |
| Cards lendo colunas sem escritor (`program_*`, `current_eva`, `*_summary`) | Texto gerado e editável | Fase 22 | Fim do resumo vazio |
| Prompt pedia `{summary, focusRegionKeys}` | 7 chaves, regras de não invenção por campo | Fase 22 | REQ-33.6 |

**Deprecated/outdated:** `ai_summary` como única fonte do resumo (continua como original de `summary`); cards Programa e Dor (EVA).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Nova geração deve **apagar** `summary_edits` (com confirmação) | Schema | Se o profissional espera preservar edições, trocar por "manter edições e mostrar aviso"; muda um `UPDATE` e o ConfirmDialog |
| A2 | Foco da IA continua **aditivo** (não desmarca) | Pitfall 5 | Se o profissional quer "substituir", seria preciso deletar marcas manuais — destrutivo, não recomendado |
| A3 | Ninguém grava `patient_pain_logs` por fora do app (SQL manual); por isso o gráfico entra como secundário condicional | Cards | Se há linhas, o gráfico condicional já cobre; custo zero |
| A4 | Gemini devolve as 7 chaves corretamente com `response_mime_type` + prompt (sem `responseSchema`) | Prompt | Parse defensivo cobre; comprovável só em UAT hospedado |
| A5 | Limites de caracteres (1500/500/400) cabem nos cards | Prompt | Ajuste de número; sem impacto de schema |
| A6 | O banco hospedado usa grants padrão do Supabase para `patients` (sem GRANT por coluna) | SQL | Checagem 4 do script detecta; se falhar, adicionar `grant update (...)` |

## Open Questions

1. **Editar só o resumo (REQ-33.3) ou todos os textos?** — **RESOLVED.** REQ-33.3 pede editar "o texto do resumo", e a decisão travada fala em "esse texto". Como os outros campos agora vêm da mesma geração e ficam errados do mesmo jeito, o modal cobre os 6 textos; custa uma chave a mais no mesmo objeto. Se o usuário quiser só o `summary`, remover 5 `Textarea`.
2. **Edição inline no card ou editor único?** — **RESOLVED.** Editor único em modal, lápis no bloco Resumo IA. Evidência: todo editor existente (`EntendaOCaso`, alertas, metas) é lápis + `Modal`; não há inline editing no app.
3. **Há linhas reais em `patient_pain_logs`?** — Não dá para saber pelo código (sem escritor). Tratado: gráfico condicional. Conferir com `select count(*) from patient_pain_logs;` durante o UAT.
4. **O que a função hospedada tem hoje?** — Não verificável do repositório. `22-USER-SETUP.md` deve exigir publicar a fonte editada e conferir as 42 chaves e as 7 chaves de saída.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `node --test`, typecheck, build | ✓ | 26.4.0 | — |
| Supabase CLI | — (proibido pelo projeto) | n/a | — | SQL Editor + Dashboard |
| Supabase Dashboard (SQL Editor, Edge Functions) | Aplicar SQL e publicar função | Operador | — | Passo manual obrigatório |
| `GEMINI_API_KEY` | Geração | Já configurado se a função da fase 11/13 funcionou | — | Erro `misconfigured` já mapeado em PT |

**Missing dependencies with no fallback:** acesso do operador ao Dashboard (aplicar SQL, publicar função). Bloqueia UAT, não bloqueia código.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript 5.8 (`tsc --noEmit`) + `node:test` (Node 26, sem Vitest) |
| Config file | `tsconfig.json`; nenhum para `node:test` |
| Quick run command | `node --test src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts && npm run typecheck` |
| Full suite command | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-33.1 | Geração é um único `update` que zera `summary_edits` | typecheck + revisão | `npm run typecheck` | ❌ Wave 0 (código novo) |
| REQ-33.2 | Painel Resumo IA não referencia `summaryEdits` | node:test lendo o fonte | `node --test src/lib/patientSummaryContract.test.ts` | ❌ Wave 0 |
| REQ-33.3 | `resolveSummaryFields` (edição vence; `''` apaga; sem original ok) e `diffSummaryEdits` (só diferenças; tudo igual → `null`) | unit | `node --test src/lib/patientSummary.test.ts` | ❌ Wave 0 |
| REQ-33.4 | Resposta Zod aceita só `summary`; descarta vazios; chaves de foco fora do catálogo caem | unit (Zod puro, sem alias) | idem | ❌ Wave 0 |
| REQ-33.5 | `ResumoDoPaciente` não lê `programProgress`, `eva`, `evolutionSummary`, `lastConducts`, `nextSessionPlan` | node:test lendo o fonte | contract test | ❌ Wave 0 |
| REQ-33.6 | Fonte da EF contém as 7 chaves, `NÃO CONFIÁVEL`, e **não** contém `priorAiSummary`, `programProgress`, `eva:` no pack; conjunto de 42 chaves igual a `src/lib/focusRegions.ts` | node:test lendo o `.ts` da EF como texto | contract test | ❌ Wave 0 |
| REQ-33 (UI) | Sem `canWrite` não há lápis nem modal | typecheck + UAT | `npm run typecheck` | manual |
| REQ-33 (IA) | Resposta real do Gemini respeita não-invenção | **UAT hospedado** | — | manual |

O arquivo da EF tem `Deno.serve` e imports `npm:`; **não é importável** em `node:test`. O teste de contrato lê o arquivo como string (`readFileSync`) e compara conjuntos por regex. Isso prova o espelho de chaves e a presença do contrato, não o comportamento do modelo.

### Sampling Rate
- **Por commit de tarefa:** `npm run typecheck` (+ `node --test` do helper quando existir)
- **Por onda:** suíte completa acima
- **Gate da fase:** suíte verde + UAT hospedado antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/patientSummary.ts` e `.test.ts` — REQ-33.3/33.4 (imports relativos; `node --test` não resolve `@/`)
- [ ] `src/lib/patientSummaryContract.test.ts` — REQ-33.2/33.5/33.6
- [ ] Nenhuma instalação de framework

### Só UAT hospedado (não provável em CI local)
1. Aplicar o SQL no SQL Editor e rodar as 4 checagens.
2. Publicar a função (fonte fase 13 editada) e conferir no Dashboard as 7 chaves e as 42 chaves de foco.
3. Gerar em paciente com avaliação e evoluções reais: os 6 textos aparecem; regiões do boneco marcadas; nenhuma EVA/meta que não esteja no prontuário.
4. Gerar em paciente quase vazio: `summary` diz que o contexto é insuficiente; demais cards "—"; nenhuma região marcada.
5. Editar na aba Resumo → aba Resumo IA continua com o original; recarregar mantém a edição.
6. Gerar de novo → confirmação aparece; depois, edições zeradas e original novo.
7. Conta empresa em ficha de colega: sem lápis, sem composer; `UPDATE` direto recusado.
8. Viewport móvel: modal rola, lápis ≥ 44 px.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (EF) | `requireUser` + `auth.getUser(token)` já existente |
| V3 Session Management | no | — |
| V4 Access Control | yes | RLS `patients_update` + `private.can_write_patient`; UI esconde controles |
| V5 Input Validation | yes | Zod no cliente (texto máx., chaves de foco), parse com clamp na EF, CHECK `jsonb_typeof` + tamanho no banco |
| V6 Cryptography | no | `GEMINI_API_KEY` só em `Deno.env`; nada em `VITE_*` |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via `userHint` ou texto de prontuário | Tampering | Bloco `NÃO CONFIÁVEL`; saída só em JSON; Zod/parse descarta qualquer chave fora das 7; regiões só do catálogo |
| Alucinação clínica gravada como fato | Tampering / Repudiation | Prompt "só afirma o que está no prontuário"; resultado fica editável; original separado; sem EVA/meta gerada |
| Escrita em ficha alheia (empresa → colega) | Elevation | `UPDATE` sob `can_write_patient` retorna 0 linhas → erro; `select('id')` já detecta |
| JSON gigante em coluna | DoS | CHECK de 20 000 bytes; clamp por campo |
| Log de PHI na EF | Information disclosure | Manter a regra atual: só status do Gemini no log, nunca corpo |

## Sources

### Primary (HIGH confidence)
- Código lido neste projeto: `src/pages/PatientPage.tsx` (`ResumoDoPaciente`, `EntendaOCaso`), `src/components/patients/{PatientResumoIaPanel,PatientAiComposer,PatientFocusAreasPanel,PatientGoalsPanel}.tsx`, `src/services/{patientAi,patients,sessions}.service.ts`, `src/schemas/patientAi.schema.ts`, `src/types/patient.ts`, `src/lib/{focusRegions,accountAccess}.ts`, `src/lib/security/index.ts`
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` (fonte a publicar)
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (políticas de `patients`)
- `.planning/phases/19-boneco-de-rea-de-foco/19-USER-SETUP.md`, `STATE.md`, `REQUIREMENTS.md` (REQ-33), `ROADMAP.md`
- `.planning/phases/21-agendar-sessoes-varios-dias/21-VALIDATION.md` (padrão `node --test` com Node 26)

### Secondary (MEDIUM confidence)
- https://ai.google.dev/gemini-api/docs/structured-output — mostra saída estruturada pela Interactions API; não confirma o parâmetro equivalente em `generateContent`, por isso não é recomendado trocar o mecanismo atual.

### Tertiary (LOW confidence)
- Comportamento real do Gemini com este prompt (A4): só UAT.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nenhuma dependência nova; tudo lido do código
- Architecture / schema: HIGH — evidência direta de leitura/escrita das colunas
- Prompt / não invenção: MEDIUM — contrato claro, resultado do modelo só em UAT
- Pitfalls: HIGH — `eva: 0`, função hospedada defasada e tipagem do `update` verificados no código

**Research date:** 2026-10-03
**Valid until:** 2026-11-02 (30 dias; o risco de mudança é o ID dos modelos Gemini em `GEMINI_MODELS`)
