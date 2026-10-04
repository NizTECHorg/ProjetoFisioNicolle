# Phase 23: Ajustes do resumo IA e rolagem do Entenda o caso - Research

**Researched:** 2026-10-04
**Domain:** Resumo do paciente (edição inline, pack da Edge Function, overflow do Entenda o caso)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Edição na aba Resumo
- Editar todos os campos de texto do Resumo do paciente, não só o bloco Resumo IA.
- A edição acontece no texto dentro de cada caixa, de uma vez. Não abrir uma janela que mostre todos os campos juntos.
- A aba Resumo IA continua só com o original da última geração.

### Geração: fatos certos
- A IA deve pegar as informações certas do prontuário. O exemplo dado: o número de sessões já feitas está vindo errado. A contagem que vale é a das sessões concluídas, a mesma que o card Entenda o caso mostra, não um campo solto que possa estar desatualizado.
- Área de foco: marcar exatamente o que está no prontuário, mais o que a descrição adicional pediu ao criar o resumo. Sem região extra.

### Descrição adicional
- A descrição escrita antes de clicar em gerar tem 100% de atenção. Hoje ela é ignorada ou tratada como nota sem peso. Nesta fase ela é fonte, junto com o prontuário.

### Entenda o caso
- Quando queixa ou diagnóstico são longos, o texto não pode cortar a página.
- Nesse caso o card ganha um slider simples e minimalista, de baixa opacidade, para rolar de cima para baixo.
- Só essa mudança de overflow. Não redesenhar o restante do card.

### Claude's Discretion
- Como persistir a edição inline (blur, salvar por campo, ou um único save ao sair da caixa), desde que não volte o modal.
- Como contar sessões concluídas no pack da função (query das sessões vs coluna `sessions_done`).
- Como o prompt nomeia a descrição extra, desde que ela deixe de ser "NÃO CONFIÁVEL / só ênfase".

### Deferred Ideas (OUT OF SCOPE)
Nenhuma seção Deferred Ideas em `23-CONTEXT.md`. Fora desta fase: redesenhar os cards do Resumo, a aba Resumo IA, o PDF de evolução, metas, EVA, e qualquer coluna nova.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-34.1 | Na aba Resumo, cada campo de texto gerado se edita dentro da própria caixa. Não abre uma janela listando todos os campos. | Um editor por chave de `SUMMARY_FIELD_KEYS`, no card, com `diffSummaryEdits` sobre o texto resolvido. Remover `PatientSummaryEditorModal`. |
| REQ-34.2 | A geração usa o número de sessões já feitas contado das sessões concluídas do prontuário. | `count: 'exact', head: true` em `patient_sessions` com `status = 'realizada'`. Não usar `patients.sessions_done` nem o array limitado a 20. |
| REQ-34.3 | As áreas de foco marcadas pela geração são as que o prontuário sustenta, mais as que a descrição adicional pede. Nada além disso. | A função substitui `focusRegionKeys` pelo conjunto de rótulos do catálogo achados no texto clínico e na descrição. O cliente continua só inserindo. Não apaga marca manual. |
| REQ-34.4 | A descrição adicional escrita antes de gerar é fonte da geração, com o mesmo peso do restante do prontuário. | `buildPrompt` deixa de chamar `hintBlockFor` e nomeia a descrição como fonte. `patient.sessionsDone` não cede a um número pedido na descrição. |
| REQ-34.5 | No Entenda o caso, queixa e diagnóstico longos rolam no card por um slider simples, de baixa opacidade, de cima para baixo. O card não cresce até cortar a página. | Trocar `line-clamp-3` dos dois parágrafos por `max-h-[4.5rem] overflow-y-auto` e uma classe de scrollbar fina. O `<article>` não rola. |
</phase_requirements>

## Summary

A fase 22 já persiste original e edição (`ai_summary`, `ai_summary_fields`, `summary_edits`) e já desenha os seis textos na aba Resumo. O que falha é o invólucro da edição (um modal com os seis campos), o fato que a função manda para o modelo (`patients.sessions_done` e um pedido marcado como não confiável) e o corte de três linhas em Queixa e Diagnóstico. Não há schema novo. Não há pacote novo. O único corpo de função a editar é o gêmeo da fase 13.

A edição inline reutiliza `resolveSummaryFields`, `diffSummaryEdits` e `useSavePatientSummaryEdits`. O save continua sendo um `UPDATE` da coluna inteira `summary_edits`. Por isso cada caixa salva o diff das seis chaves, com as outras cinco copiadas do texto já resolvido. Salvar só a chave editada apagaria o resto. O save é explícito, no card, não no blur.

A contagem que o card Entenda o caso mostra é `countCompletedSessions`: linhas de `patient_sessions` com `status === 'realizada'`. A coluna `patients.sessions_done` não é escrita em `src/`. O pack da função hoje copia essa coluna, e ainda por cima só carrega 20 sessões. A função deve contar com `{ count: 'exact', head: true }` filtrando `realizada`, no cliente do usuário (RLS), e gravar esse número em `patient.sessionsDone`.

**Primary recommendation:** Tirar o modal, salvar cada texto no próprio card pelo diff já existente, contar `realizada` na função, tratar a descrição adicional como fonte sem deixá-la trocar `sessionsDone` nem inventar região, e rolar só os dois parágrafos de Queixa e Diagnóstico.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Editar cada texto do Resumo | Browser / Client | Database (`patients.summary_edits` via cliente já autenticado) | O estado do rascunho é da caixa. A escrita já existe e a RLS continua sendo a barreira. |
| Contagem de sessões concluídas no pack | API / Edge Function | Database (`patient_sessions`) | O modelo só vê o JSON. A contagem tem de nascer na função, com o JWT do usuário, não no browser. |
| Conjunto de `focusRegionKeys` | API / Edge Function | Database (insert aditivo no cliente) | Prontuário e descrição só estão juntos na função. O cliente só insere chaves já filtradas. |
| Descrição adicional como fonte | API / Edge Function | Browser (o composer só envia `userHint`) | O peso é do prompt e da lista de regiões, não de um componente novo. |
| Rolagem de Queixa e Diagnóstico | Browser / Client | — | CSS no parágrafo. Sem ida ao servidor. |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` não tem arquivos. Os limites abaixo vêm da invocação desta fase e do deploy já usado na fase 22. O planner trata todos como obrigatórios.

- SQL Editor só se houver mudança de schema. Esta fase não tem. Não criar coluna de origem da marca, não alterar CHECK de `summary_edits`.
- Nunca `supabase db push`. Não publicar a função pelo CLI.
- UI em português.
- Nenhum pacote npm novo.
- Editar só `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`. Não tocar o gêmeo da fase 11.
- Publicar a função é passo de Dashboard (colar o fonte e conferir o corpo).
- Esconder controle de escrita quando `!canWrite`. Não renderizar lápis desabilitado.
- Não inventar EVA, meta, percentual ou número que o prontuário não tenha. O `EvaChart` e o `PatientGoalsPanel` ficam como estão.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.0 | Estado de uma caixa em edição | Já é o UI. Sem editor novo. |
| Zod | 3.25.28 | Teto de caracteres por chave (`summaryEditsSchema.shape`) | O modal já valida com esse objeto. Uma chave usa o mesmo `.shape`. |
| Supabase JS | 2.117.1 no app; `npm:@supabase/supabase-js@2` na função | `select` com `count: 'exact', head: true` | Contagem oficial, sem baixar as linhas. [CITED: https://supabase.com/docs/reference/javascript/select] |
| Tailwind CSS | 4.1.7 | `max-h-[4.5rem] overflow-y-auto` no parágrafo | Já estiliza o card. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.76.1 | `useSavePatientSummaryEdits` já invalida a ficha | Todo save de texto. |
| `node:test` | Node v26.4.0 | Contrato do pack, da contagem e do prompt | Sem framework novo. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Textarea nativo na caixa + botão Salvar | Blur save | Blur dispara ao abrir outra caixa e corre com o `UPDATE` da coluna inteira. Ver Pitfall 1. |
| Textarea nativo na caixa | `contentEditable` | Não existe no projeto. O `Textarea` compartilhado exige um `<label>` visível e duplicaria o título do card. |
| Contagem `exact` | Contar o array `sessions` do pack | Esse array tem `.limit(20)` (`MAX_SESSIONS`). Subconta. |
| Contagem `exact` | `patients.sessions_done` | A coluna não é escrita em `src/`. É o número errado de hoje. |
| Rótulos do catálogo com limite à esquerda | Lista de sinônimos clínicos | Sinônimo inventa região ("joelho" marcaria os dois lados). Fora desta fase. |
| Scroll nos dois `<p>` | Scroll no `<article>` | O artigo também leva métricas e objetivos. Rolar o artigo redesenha o card. |

**Installation:** nenhum.

**Version verification:** `package.json` declara `zod` `^3.25.28`, `@supabase/supabase-js` `2.117.1`, `react` `^19.1.0`, `tailwindcss` `^4.1.7`. `node --version` neste ambiente: `v26.4.0`. Nenhum `npm view` — não entra pacote novo.

## Package Legitimacy Audit

Não se aplica. Esta fase não instala pacote. Não rodar `slopcheck`.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Aba Resumo (leitura)
  resolveSummaryFields(original, summary_edits)
        │
        ▼
  seis textos nos cards
        │  lápis (só canWrite), uma chave por vez
        ▼
  rascunho local → summaryEditsSchema.shape[key]
        │  Salvar
        ▼
  diffSummaryEdits(original, { ...resolvido, [chave]: rascunho })
        │
        ▼
  UPDATE patients.summary_edits     ← coluna inteira, não um patch
        │
        ▼
  invalidatePatient → cards; aba Resumo IA lê só ai_summary / ai_summary_fields

Gerar resumo
  PatientAiComposer userHint
        │
        ▼
  Edge Function (JWT do usuário, sem service role)
        ├─ count exact patient_sessions status=realizada → patient.sessionsDone
        ├─ texto clínico cru + descrição → allowedFocusRegionKeys
        └─ buildPrompt (descrição = FONTE; não chama hintBlockFor)
        │
        ▼
  Gemini → textos
        │
        ▼
  jsonResponse substitui focusRegionKeys pelo conjunto permitido
        │
        ▼
  saveGeneratedPatientSummary (summary_edits = null)
  applyAiFocusRegionKeys (insert se não existe; nunca delete)

Entenda o caso
  Queixa / Diagnóstico
        │  texto longo
        ▼
  <p max-height 4.5rem overflow-y auto>   métricas e objetivos ficam fora
```

### Recommended Project Structure

```
src/pages/PatientPage.tsx
  EntendaOCaso          # só o overflow dos dois parágrafos
  ResumoDoPaciente      # um editor por SUMMARY_FIELD_KEYS; sem modal
src/lib/focusRegionAllow.ts
  allowedFocusKeys      # função pura, testável; rótulos de FOCUS_REGIONS
src/lib/focusRegionAllow.test.ts
src/lib/patientSummaryContract.test.ts
  # REQ-34 no pack, no prompt e na ausência do modal
.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
  # único corpo da função; cópia autocontida do matcher
```

Não criar componente de modal. Apagar `src/components/patients/PatientSummaryEditorModal.tsx` quando `PatientPage.tsx` deixar de importá-lo. Não criar arquivo em `supabase/functions/` (o deploy é o fonte da fase 13 colado no Dashboard).

### Pattern 1: Save de um campo sem apagar os outros

**What:** A coluna `summary_edits` é substituída por inteiro em `savePatientSummaryEdits`. O diff tem de partir do texto resolvido das seis chaves.
**When to use:** Todo Salvar de caixa.
**Example:**

```typescript
// Source: src/lib/patientSummary.ts (diffSummaryEdits) e src/services/patients.service.ts (UPDATE da coluna)
const resolved = resolveSummaryFields(original, edits)
const next = { ...resolved, [key]: draft }
const diff = diffSummaryEdits(original, next)
save.mutate(diff) // null só quando as seis chaves voltaram ao original
```

`original` é `{ summary: detail.aiSummary, ...detail.aiSummaryFields }`. `edits` é `detail.summaryEdits`. O rascunho vazio é `''` (apaga de propósito). Nunca pré-preencher com `—`.

Uma chave por vez: `editingKey: SummaryFieldKey | null`. Abrir outra caixa descarta o rascunho não salvo. Enquanto `isPending`, os outros lápis não abrem. Sucesso: sair do modo edição (o hook já invalida e mostra `Resumo salvo`). Erro: ficar na caixa com o rascunho.

Validar só a chave: `summaryEditsSchema.shape[key].safeParse(draft)`. A mensagem já é `Use no máximo N caracteres.` Não montar react-hook-form. Não alterar o `Textarea` compartilhado: ele sempre desenha um `<label>`. Usar `<textarea>` com as classes visuais desse componente, `aria-labelledby` no título que o card já tem, e `<p role="alert">` para o erro.

Lápis: as classes já usadas no bloco Resumo IA e no Entenda o caso (`min-h-11 min-w-11`, opacidade no `group`, `[@media(hover:none)]:opacity-100`). `aria-label={`Editar ${SUMMARY_FIELD_LABELS[key]}`}`. Só se `canWrite`. O bloco Resumo IA edita a chave `summary`. Plano de tratamento, Evolução geral e Dor e limitações editam a chave do card. No card Condutas há duas caixas: `conducts` e, no rodapé, `nextSessionPlan`. Áreas de foco e Todos os objetivos não ganham editor.

Botões do card: `Button` existente, `Salvar` e `Cancelar`. Cancelar descarta. Não usar blur.

### Pattern 2: Contagem igual à do Entenda o caso

**What:** `getPatientDashboard` carrega sessões `agendada | confirmada | realizada` sem `limit` e `countCompletedSessions` filtra `status === 'realizada'`. `cancelada` e `faltou` não entram. O resultado é o mesmo que contar todas as linhas `realizada`.
**When to use:** Dentro de `assembleContextPack`, em paralelo às outras leituras, com o mesmo `userClient`.
**Example:**

```typescript
// Source: https://supabase.com/docs/reference/javascript/select — "Querying with count option"
const { count, error } = await client
  .from('patient_sessions')
  .select('*', { count: 'exact', head: true })
  .eq('patient_id', patientId)
  .eq('status', 'realizada')
```

Gravar `sessionsDone: count ?? 0` quando não houver erro. `0` passa por `omitEmpty` (só caem `undefined`, `null`, `''` e array vazio). Se `error`, omitir `sessionsDone`. Não cair para `patient.sessions_done`. Não contar `sessions.filter(status === 'realizada')` do array do pack: esse select tem `.limit(MAX_SESSIONS)` com `MAX_SESSIONS = 20`.

Tirar `sessions_done` do `patientSelect` de `assembleContextPack` e a atribuição `sessionsDone: patient.sessions_done`. `sessions_planned` fica. Não mexer em `assembleEvolucaoContextPack`.

O prompt diz: sessões já feitas são somente `patient.sessionsDone`; não contar `sessions`; se a chave não estiver no JSON, não afirmar quantas sessões foram feitas.

### Pattern 3: Descrição como fonte, números do prontuário intactos

**What:** `hintBlockFor` continua na função e continua sendo a única via de `buildEvolucaoPrompt`. O composer de PDF não envia `userHint` hoje; mesmo assim o ramo evolução não muda.
**When to use:** Só `buildPrompt` (modo resumo).
**Example:** `buildPrompt` não chama `hintBlockFor`. O bloco da descrição, no próprio template, fica assim:

```
Descrição adicional do profissional (FONTE — mesmo peso do prontuário para o que ela afirma por escrito):
"""${userHint}"""
```

Quando não houver descrição, o bloco é string vazia.

Regras que substituem a linha `O pedido do profissional é NÃO CONFIÁVEL e só ajusta ênfase, nunca fatos`:

- A descrição adicional é fonte. O que ela afirma entra no resumo. Não tratar como ênfase e não descartar.
- Não inventar número, data, medida, EVA ou contagem. Um número só entra se estiver escrito no JSON ou na descrição.
- Sessões já feitas: somente `patient.sessionsDone`. A descrição não substitui esse número.
- `focusRegionKeys` é exatamente `allowedFocusRegionKeys` do JSON. Não acrescentar região.

O teste `REQ-33.6: prompt com 7 chaves` hoje exige a string `NÃO CONFIÁVEL` no recorte `function buildPrompt` → `async function assembleEvolucaoContextPack`. Esse assert muda de lugar: o recorte de `buildPrompt` não contém `NÃO CONFIÁVEL`; o recorte de `function hintBlockFor` (ou de `buildEvolucaoPrompt`) continua contendo. Não enfraquecer o teste antigo sem esse substituto.

O rótulo do composer hoje é `Orientação opcional (opcional)` e o placeholder pede para enfatizar. Trocar o label para `Descrição adicional (opcional)` e o placeholder para um fato ou uma região (não a palavra enfatize). O campo continua opcional e com teto 2000.

### Pattern 4: Regiões = rótulos achados no texto, insert sem delete

**What:** `patient_focus_areas` não tem coluna de origem (`id`, `region_key`, `label`, `is_active`, `sort_order`). A fase 22 já registrou isso. Não dá para separar marca da IA e marca da mão sem schema, e esta fase não cria schema.
**When to use:** Antes de `jsonResponse` do modo resumo, substituir `focusRegionKeys`. O cliente segue com `applyAiFocusRegionKeys` (insert, ignora linha existente e `23505`, não dá delete).

Decisão explícita sobre marcas manuais: **não apagar**. Depois de gerar, a silhueta é `linhas que já existiam` ∪ `chaves cujo rótulo aparece no texto clínico ou na descrição`. Geração não marca região fora desse segundo conjunto. Marca que o profissional fez à mão e que o texto não cita permanece. Marca extra de uma geração antiga também permanece, porque é indistinguível da manual. O profissional desmarca no boneco. Não fazer delete das chaves que ficaram de fora.

O conjunto permitido não é a saída do modelo e não é a união com `focusAreas` já gravadas. `filterFocusKeys` do Gemini é descartado para a resposta. Calcular o conjunto no texto cru, antes do `truncate` (`MAX_FIELD_CHARS` é 1200; um rótulo no fim da queixa sumiria do pack).

Texto que entra na varredura:

- `complaint`, `diagnosis`
- em cada avaliação: `main_complaint`, `anamnesis`, `history`, `pain`, `limitations`, `physical_exam`, `tests`, `measurements`, `physio_diagnosis`, `plan`, `goals`
- em cada evolução carregada: `patient_state`, `changes_since_last`, `conducts`, `treatment_response`, `incidents`, `next_plan`
- a descrição adicional inteira

Não varre: `admin_notes`, alertas, nome do terapeuta, rótulos já salvos em `patient_focus_areas`.

Algoritmo (puro, em `src/lib/focusRegionAllow.ts`, e a mesma função colada na Edge Function — o fonte da função não pode importar `@/`):

1. Normalizar com `NFD`, remover marcas, minúsculas.
2. Para cada item de `FOCUS_REGIONS`, testar o rótulo inteiro no texto com limite à esquerda: `(?<![a-z])` + rótulo escapado. Isso impede que `antebraço esquerdo` conte como `braço esquerdo`.
3. Rótulo igual em duas vistas marca as duas chaves (`Joelho direito` → `front.knee_r` e `back.knee_r`). É a mesma parte nas duas silhuetas, não uma região a mais.
4. `joelho` sem lado não contém `joelho esquerdo` nem `joelho direito`, então não marca lado nenhum.
5. Sem tabela de sinônimos. `joelho D` e `joelhos` não marcam.

O pack leva `allowedFocusRegionKeys` para o modelo copiar, e a resposta substitui de novo com o mesmo array. Paridade de teste: os 42 rótulos do lib e os 42 rótulos colados na função são o mesmo conjunto. Não editar o `Set` de chaves da fase 22 sem essa paridade.

Atualizar o comentário de `applyAiFocusRegionKeys`: insere só o que a função devolveu; não apaga.

### Pattern 5: Slider nos dois parágrafos

**What:** `line-clamp-3` em Queixa e Diagnóstico corta em três linhas (`-webkit-line-clamp` não rola). `clampText` só troca vazio por `—`; esse helper fica.
**When to use:** Só os dois `<p>` de Queixa e Diagnóstico dentro de `EntendaOCaso`.
**Example:**

```tsx
<p
  tabIndex={0}
  aria-label="Queixa"
  className="case-scroll mt-1 max-h-[4.5rem] overflow-y-auto overscroll-contain text-sm leading-6 text-ink"
>
  {clampText(patient.complaint)}
</p>
```

`4.5rem` é três linhas de `leading-6` (1.5rem). O card não cresce além do que as três linhas já ocupavam. `overflow-y-auto` só mostra slider quando passa disso. `overscroll-contain` evita a rolagem vazar para a página.

Não colocar o overflow no `<article>`, nem no grid dos dois campos. No mobile o grid empilha; um `max-height` no grid esconderia Diagnóstico atrás de Queixa. Não mexer no `line-clamp-2` dos objetivos, nas métricas, no lápis, nem no modal de edição do Entenda o caso (esse modal é de queixa/diagnóstico/início/planejados, não é o modal do resumo).

Classe nova em `src/index.css`, ao lado de `.panel-scroll`, sem alterar o scrollbar global de `*`:

```css
.case-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(16, 32, 56, 0.28) transparent;
}
.case-scroll::-webkit-scrollbar { width: 4px; }
.case-scroll::-webkit-scrollbar-track { background: transparent; }
.case-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(16, 32, 56, 0.28);
  border-radius: 999px;
}
```

`#102038` é o `ink` já usado no produto. Opacidade 0.28 é o slider baixo. `.nav-scroll` não serve: ele é branco sobre fundo escuro.

`tabIndex={0}` coloca o parágrafo no tab para o teclado rolar. Quem não pode escrever também rola; overflow não é controle de escrita.

### Anti-Patterns to Avoid

- **Salvar `{ [key]: draft }` sem espalhar o resolvido:** zera as outras edições porque o UPDATE troca a coluna.
- **Blur save:** dois cards disparam dois UPDATE e o último ganha.
- **Unir as chaves do Gemini com o conjunto permitido:** a região extra volta.
- **Delete de `patient_focus_areas` no gerar:** apaga marca feita à mão.
- **`line-clamp` junto com `overflow-y-auto`:** o clamp força corte e o slider não corre.
- **Chamar `hintBlockFor` dentro de `buildPrompt`:** o runtime do resumo continua dizendo NÃO CONFIÁVEL mesmo que o teste olhe só o texto novo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Editor dos seis textos | Modal novo, contentEditable, lib de rich text | `<textarea>` + `summaryEditsSchema.shape` + `diffSummaryEdits` | A persistência e o teto já existem. |
| Contagem de sessões | Loop no array de 20, ou escrever em `sessions_done` | `select('*', { count: 'exact', head: true })` | A API devolve o total sob RLS sem o limite de linhas. [CITED: https://supabase.com/docs/reference/javascript/select] |
| Região a partir de frase clínica | Dicionário de sinônimos ou NLP | Rótulo do catálogo com limite à esquerda | Sinônimo marca lado e vista que o texto não citou. |
| Slider | Componente de scrollbar | CSS `scrollbar-width` / `::-webkit-scrollbar` | O projeto já faz isso em `.panel-scroll` e `.nav-scroll`. |
| Deploy | `supabase functions deploy` / `db push` | Colar o fonte da fase 13 no Dashboard | É o caminho da fase 22. |

**Key insight:** O bug de sessão e o bug de região não se resolvem com mais texto no prompt. O array de sessões é capado e o modelo inventa chave. A função conta e substitui a lista; o prompt só impede o modelo de narrar outro número.

## Common Pitfalls

### Pitfall 1: UPDATE de `summary_edits` não é patch
**What goes wrong:** Salvar Condutas apaga o Resumo IA que o profissional já tinha editado.
**Why it happens:** `savePatientSummaryEdits` faz `.update({ summary_edits: edits })`. `diffSummaryEdits` percorre as seis chaves; chave ausente vira `''` e, se o original tinha texto, entra no diff como apagada. Se o diff volta `null`, a coluna vai para `NULL` e todas as edições caem.
**How to avoid:** Sempre passar `{ ...resolveSummaryFields(original, edits), [key]: draft }`.
**Warning signs:** Depois de salvar uma caixa, outra volta ao texto gerado.

### Pitfall 2: O teste REQ-33.6 exige `NÃO CONFIÁVEL` dentro de `buildPrompt`
**What goes wrong:** A suíte fica vermelha, ou alguém recoloca a frase para ficar verde e a descrição continua sem peso.
**Why it happens:** O assert está no recorte `function buildPrompt` → `assembleEvolucaoContextPack`. A frase está numa regra desse template, não só em `hintBlockFor`. `hintBlockFor` fica **antes** de `buildPrompt`, fora desse recorte. O recorte do pack (`assembleContextPack` → `buildPrompt`) **inclui** `hintBlockFor`.
**How to avoid:** `buildPrompt` perde a frase e deixa de chamar `hintBlockFor`. O assert de `NÃO CONFIÁVEL` passa para `hintBlockFor` / `buildEvolucaoPrompt`. O recorte de `buildPrompt` passa a exigir `FONTE` e a ausência de `NÃO CONFIÁVEL`.
**Warning signs:** O modo evolução muda de tom, ou o resumo ainda recebe o bloco antigo.

### Pitfall 3: Contar as 20 sessões do pack
**What goes wrong:** O número continua menor que o do Entenda o caso em paciente com mais de 20 sessões, ou mistura `agendada`.
**Why it happens:** O select de contexto tem `.order('scheduled_at', { ascending: false }).limit(MAX_SESSIONS)`.
**How to avoid:** Query de count separada, só `realizada`, sem `limit`.
**Warning signs:** `sessionsDone: patient.sessions_done` ou `sessions.filter` sobre o array do pack.

### Pitfall 4: `antebraço` marca `braço`
**What goes wrong:** Uma região a mais na silhueta.
**Why it happens:** `antebraço esquerdo` contém `braço esquerdo` se a busca for `includes`.
**How to avoid:** Limite `(?<![a-z])` depois de tirar acento. Teste de unidade com essas duas frases.
**Warning signs:** Gerar com "antebraço esquerdo" acende Braço esquerdo.

### Pitfall 5: Matcher no texto já truncado
**What goes wrong:** Região citada no fim de uma queixa longa não marca.
**Why it happens:** `truncate` corta em `MAX_FIELD_CHARS` (1200) antes do JSON.
**How to avoid:** Varre as strings cruas das queries. O pack truncado é só para o modelo.
**Warning signs:** A função calcula as chaves a partir de `contextPack` já passado por `truncate`.

### Pitfall 6: Scroll no artigo ou `line-clamp` mantido
**What goes wrong:** Métricas somem no scroll, ou o texto continua cortado com reticências.
**Why it happens:** `line-clamp-3` define overflow hidden. O `<article>` também contém a grade de métricas e os objetivos.
**How to avoid:** Só os dois `<p>`. Remover `line-clamp-3`. Não usar os dois juntos.
**Warning signs:** O objetivo ou o contador de atendimentos rola junto com a queixa.

### Pitfall 7: Reset do rascunho quando a query invalida
**What goes wrong:** O texto digitado some no meio da edição.
**Why it happens:** Um `useEffect` que depende de `detail` refaz o rascunho. A fase 22 já viu isso no modal.
**How to avoid:** O rascunho nasce quando o lápis abre e não observa `detail` enquanto `editingKey` está setado.
**Warning signs:** Spinner ou refetch devolve o parágrafo por cima do textarea.

### Pitfall 8: Publicar o fonte errado ou esquecer o Dashboard
**What goes wrong:** O app local muda e o resumo hospedado continua com `sessions_done` e `NÃO CONFIÁVEL`.
**Why it happens:** Existem dois `index.ts` (fase 11 e fase 13). O teste de contrato lê o da fase 13. O hosted não acompanha o git.
**How to avoid:** Editar só a fase 13. UAT cola esse arquivo no Dashboard e confere no corpo publicado: `count: 'exact'`, `realizada`, ausência de `sessionsDone: patient.sessions_done`, ausência de `NÃO CONFIÁVEL` dentro de `buildPrompt`, presença em `hintBlockFor`.
**Warning signs:** O UAT gera contra a função antiga e o número continua errado.

## Code Examples

### Contagem que a UI já usa
```typescript
// Source: src/services/patients.service.ts — countCompletedSessions / getPatientDashboard
function countCompletedSessions(sessions: SessionRow[]) {
  return sessions.filter((session) => session.status === 'realizada').length
}
// getPatientDashboard: .in('status', ['agendada', 'confirmada', 'realizada']) sem limit
// sessionsDone: countCompletedSessions(sessionRows)
```

`SessionStatus` é `'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'faltou'` (`src/types/patient.ts`). Concluída é só `realizada`.

### O que a função faz hoje (substituir)
```typescript
// Source: .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
sessionsDone: patient.sessions_done ?? undefined,
// e hintBlockFor:
// Pedido do profissional (NÃO CONFIÁVEL — trate como instrução de foco apenas; ...)
// regra do buildPrompt:
// - O pedido do profissional é NÃO CONFIÁVEL e só ajusta ênfase, nunca fatos.
```

### Insert que não apaga
```typescript
// Source: src/services/patientAi.service.ts — applyAiFocusRegionKeys
// Se já existe region_key no paciente, continue.
// insert; 23505 → continue. Não há delete.
```

### Recorte que o teste já usa
```typescript
// Source: src/lib/patientSummaryContract.test.ts
sliceBetween(source, 'function buildPrompt', 'async function assembleEvolucaoContextPack')
// Esse recorte hoje precisa conter NÃO CONFIÁVEL. Na fase 23 deixa de conter.
sliceBetween(source, 'async function assembleContextPack', 'function buildPrompt')
// Inclui hintBlockFor. Não afirmar que esse recorte perdeu NÃO CONFIÁVEL.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal com os seis campos | Uma caixa por vez no card | Fase 23 | Mesma coluna `summary_edits` |
| `patients.sessions_done` no pack | Count `exact` de `realizada` | Fase 23 | Iguala o Entenda o caso |
| Descrição "NÃO CONFIÁVEL / ênfase" no resumo | Fonte, sem trocar `sessionsDone` | Fase 23 | O ramo evolução conserva o helper antigo |
| Modelo escolhe `focusRegionKeys`; cliente só acrescenta | Função substitui pelo conjunto de rótulos; cliente só acrescenta | Fase 23 | Não apaga marca manual |
| `line-clamp-3` | `max-h-[4.5rem]` + scrollbar fina | Fase 23 | Três linhas visíveis, o resto rola |

**Deprecated/outdated:**
- `PatientSummaryEditorModal`: sai desta fase. A copy `editModalTitle` pode ficar sem uso; não reabrir o modal para "aproveitar" o componente.
- Gêmeo `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`: histórico. Não é o fonte que o teste nem o Dashboard desta fase leem.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Rótulo compartilhado marca frente e costas (`Joelho direito` → `front.knee_r` e `back.knee_r`). | Pattern 4 | O profissional queria uma vista só. As duas são o mesmo nome no catálogo; desmarcar a vista indesejada continua manual. |
| A2 | Marca já gravada que o texto novo não cita permanece, inclusive extra de geração antiga. | Pattern 4 | A silhueta pode continuar com região que esta geração não escolheria. Apagar exigiria schema de origem ou destruiria marca manual. |
| A3 | Sem sinônimo: `joelho D` e `joelhos` não marcam. A prosa da descrição ainda entra no resumo. | Pattern 4 | Descrição com abreviação não acende a silhueta. O texto pede o rótulo (`joelho direito`). |
| A4 | A janela visível fica em 4.5rem (as três linhas de hoje), não um card mais alto. | Pattern 5 | Se a leitura de três linhas for curta demais, só o `max-h` muda. O slider continua nos dois `<p>`. |

## Open Questions

1. **Como persistir a edição inline?** — RESOLVED. Save explícito por chave, com `diffSummaryEdits` do texto resolvido. Não é blur. Não é modal. O código de `savePatientSummaryEdits` impede salvar só um pedaço da coluna.
2. **Como contar sessões na função?** — RESOLVED. `count: 'exact', head: true` com `status = 'realizada'` no `userClient`. Não é `sessions_done` e não é o array de 20. É o mesmo critério de `countCompletedSessions`.
3. **Como o prompt nomeia a descrição?** — RESOLVED. Bloco `FONTE` só em `buildPrompt`. `hintBlockFor` fica para a evolução. Números já presentes no JSON, em especial `patient.sessionsDone`, não são substituídos pela descrição.
4. **Gerar substitui as regiões ou continua aditivo?** — RESOLVED. A lista devolvida é substituída pelo conjunto de rótulos. O insert no cliente continua aditivo. Marca manual não é apagada. Não há coluna de origem para apagar só o que a IA marcou antes.
5. **Onde fica o slider do Entenda o caso?** — RESOLVED. Nos dois `<p>` de Queixa e Diagnóstico, não no `<article>` e não no grid. O resto do card não muda.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `node:test`, typecheck | ✓ | v26.4.0 | — |
| npm / Vite | App local | ✓ | scripts em `package.json` | — |
| Supabase Dashboard | Publicar a função | Externo (humano) | — | Sem fallback: sem colar, o hosted fica na função antiga |
| Gemini | UAT da geração | Externo (`GEMINI_API_KEY` na função) | modelos já listados no fonte | UAT manual; teste local não chama a API |
| Deno | Rodar a função na máquina | Não é necessário | — | O contrato é `node:test` lendo o fonte; a execução é o hosted |

**Missing dependencies with no fallback:**
- Nenhum para implementar. Publicar no Dashboard é passo humano de UAT, como na fase 22.

**Missing dependencies with fallback:**
- Deno local: não usar. Não criar `supabase/functions` e não fazer deploy por CLI.

Step 2.6: a fase depende do hosted para o UAT de Gemini e do save, não de CLI local além do Node.

## Validation Architecture

`workflow.nyquist_validation` está ausente em `.planning/config.json` (tratado como ligado). Não há script `npm test`. O harness é `node:test`, como em `src/lib/patientSummary.test.ts` e `src/lib/patientSummaryContract.test.ts`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node v26.4.0) |
| Config file | nenhum — os arquivos são invocados direto |
| Quick run command | `node --test src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts` |
| Full suite command | `node --test src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts src/lib/sessionSeries.test.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-34.1 | `ResumoDoPaciente` não importa o modal; há editor por chave de texto; `!canWrite` não desenha lápis de edição do resumo | unit (contrato de fonte) | `node --test --test-name-pattern "REQ-34.1" src/lib/patientSummaryContract.test.ts` | ❌ Wave 0 |
| REQ-34.2 | Recorte de `assembleContextPack` não atribui `sessionsDone: patient.sessions_done`; contém `count: 'exact'` e `realizada` | unit (contrato de fonte) | `node --test --test-name-pattern "REQ-34.2" src/lib/patientSummaryContract.test.ts` | ❌ Wave 0 |
| REQ-34.3 | `antebraço esquerdo` não inclui `front.upper_arm_l`; `joelho direito` inclui frente e costas; `joelho` sozinho não inclui lado; descrição soma chave; chave fora do rótulo não entra | unit | `node --test src/lib/focusRegionAllow.test.ts` | ❌ Wave 0 |
| REQ-34.4 | Recorte de `buildPrompt` contém `FONTE` e não contém `NÃO CONFIÁVEL`; `hintBlockFor` ainda contém `NÃO CONFIÁVEL`; `buildPrompt` não chama `hintBlockFor` | unit (contrato de fonte) | `node --test --test-name-pattern "REQ-34.4" src/lib/patientSummaryContract.test.ts` | ❌ Wave 0 — o assert antigo de `NÃO CONFIÁVEL` em `buildPrompt` tem de ser reescrito neste caso, não duplicado |
| REQ-34.5 | `EntendaOCaso` não tem `line-clamp-3` nos parágrafos de queixa/diagnóstico; tem `overflow-y-auto` e `case-scroll`; o `line-clamp-2` dos objetivos permanece | unit (contrato de fonte) | `node --test --test-name-pattern "REQ-34.5" src/lib/patientSummaryContract.test.ts` | ❌ Wave 0 |
| REQ-34.2 + REQ-34.4 | Geração hospedada usa a contagem de `realizada` e a descrição | manual (UAT Dashboard) | Colar a função e gerar | Não automatizar Gemini |
| REQ-34.1 | Salvar uma caixa e ver as outras edições intactas; aba Resumo IA permanece no original | manual (UAT no app) | Abrir a ficha, editar, recarregar | Não há browser harness no `node:test` |

O caso `REQ-33.6: prompt com 7 chaves` fica vermelho de propósito até o plano que reescreve o prompt atualizar o assert. Não comentar o teste. Não manter `NÃO CONFIÁVEL` dentro de `buildPrompt` para segurar o verde.

Paridade: o bloco de rótulos colado na função e `FOCUS_REGIONS[].label` em `src/lib/focusRegions.ts` têm de casar, no mesmo estilo do teste das 42 chaves.

### Sampling Rate
- **Per task commit:** `node --test --test-name-pattern "REQ-34" src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts`
- **Per wave merge:** suíte completa da tabela acima, mais `npm run typecheck`
- **Phase gate:** Suíte verde e UAT hospedado (gerar + salvar inline + rolagem) antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/focusRegionAllow.ts` + `src/lib/focusRegionAllow.test.ts` — REQ-34.3
- [ ] Casos `REQ-34.*` em `src/lib/patientSummaryContract.test.ts` — REQ-34.1, REQ-34.2, REQ-34.4, REQ-34.5
- [ ] Reescrever o assert `NÃO CONFIÁVEL` de `REQ-33.6` para o recorte de `hintBlockFor`, sem apagar as sete chaves nem a paridade das 42 chaves
- [ ] Framework: nenhum install. `node --test` já roda os arquivos `.ts` deste repo

UAT hospedado (não é Wave 0, é o portão da fase):

1. Colar o `index.ts` da fase 13 no Dashboard. Conferir no corpo: `count: 'exact'`, `realizada`, `FONTE` em `buildPrompt`, `NÃO CONFIÁVEL` só em `hintBlockFor`.
2. Paciente em que `patients.sessions_done` difere do número de sessões `realizada`. O resumo gerado cita o número do card, não o da coluna.
3. Descrição `inclua o joelho direito` marca frente e costas do joelho e não marca uma região que o texto não cita. Descrição com um fato que não está no prontuário aparece no texto gerado. Um número de sessões escrito na descrição não substitui `sessionsDone`.
4. Editar só Condutas, recarregar: as outras caixas editadas continuam; a aba Resumo IA mostra o original, sem lápis de edição.
5. Conta sem escrita: sem lápis e sem textarea. Queixa longa rola dentro do parágrafo; métricas e objetivos continuam visíveis; a página não estica.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireUser` já exige `Bearer` na função. Não abrir o pack com service role. |
| V3 Session Management | yes | JWT do Supabase no `userClient`. Sem sessão paralela. |
| V4 Access Control | yes | `canWrite` só esconde UI. `savePatientSummaryEdits` e o insert de foco seguem na RLS `can_write_patient`. A contagem usa o mesmo JWT, então não vaza sessão de outro paciente. |
| V5 Input Validation | yes | `summaryEditsSchema` por chave; `userHint` já tem teto 2000 na função (`MAX_HINT_CHARS`) e no Zod do cliente; `focusRegionKeys` só sai do catálogo. |
| V6 Cryptography | no | Sem segredo novo. `GEMINI_API_KEY` continua só em `Deno.env`. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Descrição adicional vira injeção de fato clínico | Tampering | É o pedido do profissional sobre a própria ficha (fonte de propósito). Não deixa substituir `patient.sessionsDone`. Não acrescenta chave fora do catálogo. O ramo evolução não usa esse bloco. |
| Count com service role | Information disclosure | Usar `userClient`. O Dashboard já lê as mesmas sessões com esse JWT. |
| `focusRegionKeys` do modelo | Tampering | Substituir pela lista calculada. O cliente ainda ignora chave que `focusRegionKeySchema` recusa. |
| Texto de edição acima do teto | Tampering | Zod recusa antes do UPDATE. A função já corta a resposta da geração; o editor não corta em silêncio, mostra `Use no máximo N caracteres.` |
| Log do prompt | Information disclosure | A função já não loga corpo do Gemini. Não adicionar `console.log` do pack nem da descrição. |

## Sources

### Primary (HIGH confidence)
- Código do repositório: `src/pages/PatientPage.tsx` (`EntendaOCaso`, `ResumoDoPaciente`), `src/components/patients/PatientSummaryEditorModal.tsx`, `src/services/patientAi.service.ts`, `src/services/patients.service.ts` (`countCompletedSessions`, `savePatientSummaryEdits`), `src/lib/patientSummary.ts`, `src/lib/patientSummaryContract.test.ts`, `src/lib/focusRegions.ts`, `src/types/patient.ts`, `src/index.css`, `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
- [Supabase JS `select` com count](https://supabase.com/docs/reference/javascript/select) — `count: 'exact', head: true` não devolve as linhas
- `package.json` e `node --version` (v26.4.0) neste workspace

### Secondary (MEDIUM confidence)
- `.planning/phases/22-resumo-paciente-ia/22-UI-SPEC.md` e `22-USER-SETUP.md` — modal único, ausência de origem na marca, publish pelo Dashboard
- Busca no `src/`: nenhuma escrita em `sessions_done`, só `select`

### Tertiary (LOW confidence)
- Nenhuma. A1–A4 estão no Assumptions Log, não como fato de API.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nada novo; versões lidas do `package.json` e o count citado na doc do Supabase
- Architecture: HIGH — save, contagem, prompt e clamp foram lidos no fonte; as decisões de discrição estão fechadas em Open Questions
- Pitfalls: HIGH — o teste `REQ-33.6`, o `limit(20)` e o UPDATE da coluna estão no código

**Research date:** 2026-10-04
**Valid until:** 2026-11-03
