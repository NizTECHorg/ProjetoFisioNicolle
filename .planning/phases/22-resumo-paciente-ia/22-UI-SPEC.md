---
phase: 22
slug: resumo-paciente-ia
status: approved
reviewed_at: 2026-10-03
shadcn_initialized: false
preset: none
created: 2026-10-03
---

# Phase 22 — UI Design Contract

> Contrato visual e de interação para "Resumo do paciente editável e preenchido pela IA" (REQ-33). Gerado por gsd-ui-researcher, verificado por gsd-ui-checker.
>
> Convenções: **[LOCKED]** = decisão do profissional, não reabrir. **[DEFAULT]** = padrão adotado pelo pesquisador, sem pergunta ao usuário. **[EXISTING]** = já implementado no repositório, não alterar.
>
> Fontes pré-preenchidas: `22-CONTEXT.md`, `22-RESEARCH.md`, `locked_decisions` da invocação, `src/index.css`, `src/pages/PatientPage.tsx` (`ResumoDoPaciente`, `EntendaOCaso`, `EvaChart`), `src/components/ui/{Modal,ConfirmDialog,Textarea}.tsx`, `PatientResumoIaPanel.tsx`, `PatientGoalsPanel.tsx`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (sem `components.json`; shadcn não se aplica) [EXISTING] |
| Preset | not applicable |
| Component library | none. Componentes próprios em `src/components/ui` (`Modal`, `ConfirmDialog`, `Textarea`, `Button`, `Input`). **Nenhuma biblioteca nova** [LOCKED] |
| Styling | Tailwind CSS v4 com tokens em `@theme` (`src/index.css`) [EXISTING] |
| Icon library | `lucide-react`: `Pencil`, `Sparkles` (já importados em `PatientPage.tsx`); `Flag` já usado em Objetivos [EXISTING] |
| Font | `Plus Jakarta Sans` (`font-sans`) para toda a fase. `Cormorant Garamond` (`font-display`) **não** é usada nesta fase [EXISTING] |

Fora de escopo de gate: nenhum registro de terceiros, nenhum bloco de registry.

---

## Visão geral das superfícies

| # | Superfície | Arquivo | Papel nesta fase |
|---|-----------|---------|------------------|
| S1 | Aba **Resumo** → card "Resumo do paciente" | `PatientPage.tsx` (`ResumoDoPaciente`) | Mostra o texto **resolvido** (edição vence o original). Único lugar com lápis [LOCKED] |
| S2 | Modal **Editar resumo** | novo `PatientSummaryEditorModal.tsx` | Um modal, seis textos, um salvar [LOCKED] |
| S3 | Aba **Resumo IA** | `PatientResumoIaPanel.tsx` | Bloco **somente leitura** com o original da última geração. Sem lápis, sem textarea [LOCKED] |
| S4 | Confirmação de nova geração | `PatientAiComposer.tsx` via `ConfirmDialog` | Só aparece quando existem edições [LOCKED] |

**Âncora visual:** o bloco Resumo IA em largura total é a âncora da tela. Hierarquia: Resumo IA, depois os cards de texto (Plano de tratamento, Evolução geral, Condutas, Dor e limitações), depois Áreas de foco, depois Objetivos.

Regra de dados de exibição (alinha UI e RESEARCH.md): S1 lê `resolveSummaryFields(original, edits)`; S3 lê **somente** `aiSummary` + `aiSummaryFields` e nunca `summaryEdits` [LOCKED].

---

## S1 — Grade "Resumo do paciente" (aba Resumo)

### Estrutura [LOCKED conjunto de cards; DEFAULT detalhes]

Container externo, título "Resumo do paciente", bloco Resumo IA em largura total e grade 3 colunas: **mesmo ritmo atual** (`rounded-2xl`, rótulos maiúsculos em accent, `gap-4`).

Ordem no DOM (determina a posição com `lg:grid-flow-col lg:grid-rows-[auto_auto]`, mantido sem alteração; no celular empilha nesta ordem):

| Posição desktop | Card | Substitui | Conteúdo |
|-----------------|------|-----------|----------|
| Linha 1, col 1 | **Plano de tratamento** | Programa + barra de % | Texto `treatmentPlan` |
| Linha 2, col 1 | **Evolução geral** | Evolução geral + badge EVA | Texto `evolution`, **sem badge `eva/10`** |
| Linha 1, col 2 | **Condutas** (+ sub-bloco **Plano próxima sessão**) | Condutas | Texto `conducts` + `nextSessionPlan` dentro do mesmo card |
| Linha 2, col 2 | **Dor e limitações** | Dor (EVA) | Texto `painLimitations`; gráfico EVA só se houver registros reais |
| Linha 1, col 3 | **Áreas de foco** | igual | Boneco existente (`min-h-[16rem]`) |
| Linha 2, col 3 | **Todos os objetivos** | igual | `PatientGoalsPanel` sem alteração |

O mesmo conjunto vale para todos os pacientes. Nenhum card é omitido por paciente [LOCKED].

### Bloco "Resumo IA" (largura total, acima da grade)

Mantém o contêiner atual: `mt-4 rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5`, mais a classe `group` (para o lápis).

- Cabeçalho: rótulo "Resumo IA" à esquerda; à direita um cluster `flex items-center gap-1`:
  - `Sparkles` 16px, `text-accent`, `aria-hidden` (decorativo; permanece para todos).
  - **Lápis** (apenas se `canWrite`), idêntico ao de `EntendaOCaso`: `Pencil size={16}`, botão `inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-accent-soft hover:text-forest group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100`, `aria-label="Editar resumo do paciente"`, `type="button"`.
- **Sem `canWrite`: o botão não é renderizado.** Nada desabilitado, nada com aparência clicável [LOCKED].
- Rótulo "Resumo IA": `text-xs font-semibold uppercase tracking-[0.14em] text-accent` (12px; antes 11px).
- Corpo: `mt-4 text-sm leading-7 text-ink/90 sm:text-base whitespace-pre-line break-words`. Texto = `text.summary`; se vazio, "Sem resumo ainda." (inalterado).
- Legenda (`mt-2 text-xs text-muted`), mostrada só se existir `aiSummary` ou `summaryEdits`: 
  - sem edições: "Gerado pela IA a partir do prontuário. Revise antes de usar."
  - com edições (`summaryEdits != null`): "Texto editado. O original gerado pela IA está na aba Resumo IA."

### Card de texto (padrão para Plano de tratamento, Evolução geral, Condutas, Dor e limitações)

Reaproveitar o invólucro atual: `flex h-full min-h-[11rem] min-w-0 flex-col rounded-2xl border border-line p-4` (sem fundo explícito, como hoje).

- Rótulo: `text-xs font-semibold uppercase tracking-[0.14em] text-accent` (12px; todos os rótulos de card que hoje usam `text-[11px]` passam a `text-xs`).
- Corpo: `mt-2 break-words whitespace-pre-line text-sm leading-6 text-ink`. **Sem `line-clamp`**: o texto gerado tem no máximo 500 caracteres (400 no próximo plano) e o card cresce; a linha da grade é `auto`.
- Vazio: caractere `—` (em dash) em `text-ink`, dentro de `<span aria-label="Sem informação">—</span>`. Nunca texto placeholder inventado (RESEARCH Pitfall 8).
- Campo apagado pelo profissional (string vazia em `summary_edits`) cai no mesmo estado `—` [LOCKED].

### Detalhe por card

| Card | Rótulo exato | Particularidades |
|------|-------------|------------------|
| Plano de tratamento | `Plano de tratamento` | Remove `h3` do nome do programa, barra de progresso e "% concluído" por inteiro. Só texto |
| Evolução geral | `Evolução geral` | Remove o rodapé do badge (`{eva}/10` e "EVA na sessão de …"). Só texto. Nenhum número de EVA derivado |
| Condutas | `Condutas` | Texto no topo. Rodapé `mt-auto pt-4`: rótulo `text-xs text-muted` "Plano próxima sessão", abaixo `mt-1 break-words whitespace-pre-line text-sm text-ink` com `nextSessionPlan` ou `—` |
| Dor e limitações | `Dor e limitações` | Texto no topo. Se `detail.painSeries.length > 0`: abaixo do texto, `mt-4`, sub-rótulo `text-xs text-muted` "Registros de dor (EVA)" e o `EvaChart` existente. Se a série está vazia: **nenhum gráfico e nenhuma mensagem "Sem registros de dor ainda."** (o card fica só com o texto ou `—`). O `EvaChart` mantém sua renderização atual e nunca recebe valores fabricados [LOCKED] |
| Áreas de foco | `Áreas de foco` | Sem mudança visual. A IA marca regiões de forma aditiva; o profissional continua marcando/desmarcando no boneco [LOCKED]. Não há marcador "marcado pela IA" (o banco não guarda a origem) |
| Todos os objetivos | `Todos os objetivos` | Sem mudança de comportamento ou layout. Humano apenas; mantém ícone de bandeira, botão "+ Nova" e estado vazio "Sem objetivos cadastrados." A IA não cria metas [LOCKED]. **Ajuste só de classes de tipografia em `PatientGoalsPanel.tsx`** para a tela renderizar apenas a escala declarada: rótulo `text-[11px]` → `text-xs`; selos de status e datas das metas `text-[10px]` → `text-xs`; `font-medium` → `font-semibold` nos selos |

### Estados de S1

| Estado | Comportamento |
|--------|---------------|
| Carregando `detail` | Spinner atual (`h-6 w-6 animate-spin … border-forest`), inalterado [EXISTING] |
| Paciente sem geração e sem edição | Resumo IA: "Sem resumo ainda."; quatro cards de texto mostram `—`; lápis disponível para quem escreve (permite redigir à mão) |
| Gerado e sem edição | Cards com o original; legenda "Gerado pela IA…" |
| Editado | Cards com texto editado; legenda "Texto editado…" |
| Consulta apenas (`canWrite=false`) | Mesma leitura; sem lápis; sem nenhum controle de escrita no bloco Resumo IA |

---

## S2 — Modal "Editar resumo"

Componente: `Modal` existente com `wide` (`max-w-3xl`). No celular o modal é folha inferior com rolagem interna (`max-h-[90vh] overflow-y-auto`), já resolvido pelo `Modal` [EXISTING].

| Elemento | Especificação |
|----------|---------------|
| Título | `Editar resumo` |
| Descrição | `Corrija os textos do Resumo do paciente. O original gerado pela IA continua na aba Resumo IA. Campo vazio aparece como —.` |
| Formulário | RHF + `zodResolver`, mesmo padrão de `EntendaOCaso`. `space-y-4`, coluna única em todos os viewports |
| Campos (ordem fixa) | Seis `Textarea` existentes |
| Valores iniciais | Texto **resolvido** de cada chave (edição ?? original ?? `''`). Nunca pré-preencher com `—` |
| Salvar | Um único `UPDATE` em `summary_edits` com o diff contra o original (`diffSummaryEdits`). Se tudo igual ao original, grava `null` (edições removidas) |

Campos, rótulos e limites (limites vêm da RESEARCH, mesmas chaves da Edge Function):

| Chave | Rótulo do `Textarea` | `rows` | Máx. caracteres |
|-------|---------------------|--------|-----------------|
| `summary` | `Resumo IA` | 6 | 1500 |
| `treatmentPlan` | `Plano de tratamento` | 3 | 500 |
| `evolution` | `Evolução geral` | 3 | 500 |
| `conducts` | `Condutas` | 3 | 500 |
| `nextSessionPlan` | `Plano próxima sessão` | 3 | 400 |
| `painLimitations` | `Dor e limitações` | 3 | 500 |

- Ids dos `Textarea`: o componente deriva o id do rótulo; rótulos são únicos, sem conflito. Manter `htmlFor` ligado.
- Validação: acima do limite → erro inline do `Textarea` (`role="alert"`, `text-xs text-error`): `Use no máximo {N} caracteres.` Campo vazio é válido (apaga o campo) [LOCKED].
- Formulário: classe `[&_label]:font-semibold` no `<form>` do modal. O `Textarea` compartilhado não expõe `className` para o rótulo, então o modal aplica o peso 600 aos `<label>` filhos por seletor de descendente, **sem alterar o componente compartilhado**. Resultado: rótulos dos seis campos em 14px/600, nunca 500.
- Texto digitado dentro dos `Textarea` herda 16px/400 do `body` (`font: inherit`), dentro da escala declarada.
- Rodapé: `flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:justify-end`.
  - `Button variant="secondary"` "Fechar sem salvar" (fecha sem salvar; sem confirmação de descarte, igual a `EntendaOCaso`).
  - `Button type="submit"` "Salvar edições", `isLoading` durante a mutação. Altura mínima 44px (já garantida pelo `Button`; conferir `min-h-11`).
- Sucesso: fecha o modal, `toast('Resumo salvo', 'success')`, invalida o paciente. As cartas de S1 atualizam; S3 não muda (usa só o original).
- Erro: modal permanece aberto com os textos digitados; `toast('Não foi possível salvar o resumo. Tente de novo.', 'error')`. Falha de permissão (RLS, 0 linhas): `toast('Você não tem permissão para editar este paciente.', 'error')`.
- O modal só é montado se `canWrite` (igual a `EntendaOCaso`) [LOCKED].
- Não há botão "Restaurar original" nesta fase. Para voltar ao original basta reaplicar o texto (o diff remove a chave quando igual) ou gerar de novo [DEFAULT].

---

## S3 — Aba "Resumo IA" (somente leitura)

Ordem vertical em `PatientResumoIaPanel` (`space-y-6`): cabeçalho → composer (apenas `canWrite`) → **novo bloco do original** → lista de PDFs.

Cabeçalho (rótulo `text-xs font-semibold uppercase tracking-[0.16em] text-accent` "Resumo IA", inalterado) com texto de apoio novo, `mt-1 text-sm text-muted`:

> `Gere o resumo clínico ou exporte PDFs. Aqui fica o texto original da última geração. Para corrigir, abra a aba Resumo.`

Bloco do original (`<section aria-label="Resumo original da IA">`, `rounded-2xl border border-line bg-surface p-4 sm:p-5`):

- Rótulo: `text-xs font-semibold uppercase tracking-[0.14em] text-accent` "Resumo original da IA" (12px). Sem lápis, sem botão, sem textarea, sem link de ação [LOCKED].
- Data de geração (`aiSummaryFields.generatedAt`): `mt-1 text-xs text-muted`, formato `Gerado em 03/10/2026 às 20:14`. Omitir se não houver `generatedAt` (pacientes gerados antes da fase).
- Resumo: `mt-4 text-sm leading-7 text-ink sm:text-base whitespace-pre-line break-words`.
- Campos adicionais (apenas os que têm texto): lista `mt-4 space-y-4`; cada item = rótulo `text-xs text-muted` + texto `mt-1 text-sm leading-6 text-ink whitespace-pre-line break-words`. Rótulos e ordem: `Plano de tratamento`, `Evolução geral`, `Condutas`, `Plano próxima sessão`, `Dor e limitações`. Chaves ausentes **não** aparecem (sem `—` aqui: é o relato literal da IA).
- Vazio (sem `aiSummary`): `text-sm text-muted`. Com `canWrite`: `Nenhum resumo gerado ainda. Use "Gerar resumo" acima.` Sem `canWrite`: `Nenhum resumo gerado ainda.`
- Visível a quem só consulta; o composer segue escondido sem `canWrite` [EXISTING].
- As áreas de foco marcadas pela IA não são listadas aqui (aparecem no boneco da aba Resumo).
- Este arquivo não pode importar nem referenciar `summaryEdits` (verificável por grep/teste de contrato, RESEARCH Pitfall 4).

---

## S4 — Confirmação antes de gerar de novo

Gatilho: o profissional aciona "Gerar resumo" em `PatientAiComposer` e `detail.summaryEdits != null`. Se não há edições, gera direto, sem diálogo [LOCKED].

Componente: `ConfirmDialog` existente, `tone="danger"` (a ação descarta trabalho do profissional).

| Elemento | Copy |
|----------|------|
| Título | `Gerar de novo?` |
| Descrição | `Gerar de novo substitui o resumo e as suas edições. O texto editado e o resumo original anterior serão perdidos.` |
| Botão de confirmação | `Substituir e gerar` |
| Botão de cancelar | `Manter meu resumo`, passado em `cancelLabel`. É o foco inicial seguro: ao abrir o diálogo o foco vai para este botão (nunca para "Substituir e gerar"). O `ConfirmDialog` atual não move o foco; o executor adiciona `autoFocus` ao botão de cancelar dentro de `ConfirmDialog` (mudança aditiva e retrocompatível, sem alterar outros usos) |
| Enquanto gera | `isLoading` no botão de confirmação; diálogo fecha ao terminar |
| Sucesso | `toast('Resumo atualizado', 'success')` (copy existente `generateSuccess`) |
| Erro | copy existente `generateError`: `Não foi possível gerar o resumo. Tente de novo em instantes.` O diálogo fecha e as edições anteriores continuam intactas se a geração falhar |

---

## Spacing Scale

Valores declarados (múltiplos de 4), usando as classes Tailwind que a página já usa:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | `gap-1` entre Sparkles e lápis, `mt-1` entre rótulo e texto |
| sm | 8px | `mt-2` rótulo → corpo do card, `gap-2` em cabeçalhos |
| md | 16px | `p-4` dos cards internos, `gap-4` da grade e do rodapé do modal, `space-y-4` do modal, `mt-4` entre blocos e antes do corpo de texto do Resumo IA |
| lg | 24px | `p-6` do Modal, `space-y-6` do painel Resumo IA |
| xl | 32px | não usado nesta fase |
| 2xl | 48px | não usado nesta fase |
| 3xl | 64px | não usado nesta fase |

Exceções:
- `sm:p-5` (20px) no invólucro externo e nos blocos de largura total, herdado de `ResumoDoPaciente`/`EntendaOCaso` [EXISTING].
- Alvo de toque do lápis e de botões: `min-h-11 min-w-11` (44px) [LOCKED].
- Alturas mínimas dos cards: `min-h-[11rem]` (176px) e `min-h-[16rem]` (256px, Áreas de foco), herdadas [EXISTING].
- Código novo desta fase **não usa** 12px (`mt-3`, `gap-3`, `space-y-3`) nem meios-passos (`mt-1.5`, 6px). Usar 8px (`mt-2`, `gap-2`) ou 16px (`mt-4`, `gap-4`).
- Valores internos dos componentes compartilhados `Modal`, `ConfirmDialog` e `Button` (`mb-5`, `gap-3` no rodapé do `ConfirmDialog`, `py-3.5`) são herdados e **não são alterados** nesta fase [EXISTING]. O rodapé do modal de edição (S2) não os reutiliza.

---

## Typography

Quatro tamanhos (**12 / 14 / 16 / 18px**) e dois pesos (**400 / 600**) em tudo que renderiza nas superfícies S1 a S4. Não há tamanho nem peso fora dessa lista [DEFAULT, extraído do código existente].

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label e caption (rótulos maiúsculos de card e de página com `tracking-[0.14em]`/`[0.16em]`, legendas, rótulos de sub-campo, datas, mensagens de erro, "Plano próxima sessão", selos e datas das metas) | 12px (`text-xs`) | 600 (semibold) nos rótulos maiúsculos; 400 (regular) em legendas, datas, sub-rótulos e erros; 600 nos selos de status das metas | 1.33 (16px, padrão `text-xs`) |
| Body (texto dos cards, texto do Resumo IA abaixo de `sm`, rótulos dos campos do modal, botões, descrição do modal) | 14px (`text-sm`) | 400 no texto; 600 nos botões (`Button`) e nos rótulos dos campos do modal | 1.71 (`leading-6`, 24px) em card; 2.0 (`leading-7`, 28px) no Resumo IA |
| Body large (texto do Resumo IA a partir de `sm`; texto digitado nos `Textarea`) | 16px (`sm:text-base`; `textarea` herda do `body`) | 400 | 1.75 (`leading-7`, 28px) no Resumo IA; padrão do navegador no `textarea` |
| Heading (título do `Modal` e do `ConfirmDialog`) | 18px (`text-lg`) | 600 | 1.56 (28px, padrão `text-lg`) |

Pesos: **400 regular** e **600 semibold**. Nenhum `font-bold` nem `font-medium` renderiza nestas superfícies.

Como a regra é cumprida sem mexer em componentes compartilhados:
- O título do `Modal` já é 18px/600; ele passa a fazer parte da escala (por isso 11px e 12px foram unificados em 12px).
- Rótulo do `Textarea` (hoje `font-medium`, 500): o modal de edição aplica `[&_label]:font-semibold` no `<form>` (ver S2). O `Textarea` compartilhado não muda.
- Rótulos de card e do bloco Resumo IA: `text-[11px]` → `text-xs`. Mesma troca no rótulo e nos selos/datas de `PatientGoalsPanel` (ver tabela "Detalhe por card").
- Fora do escopo desta fase e não tocado: o cartão "Entenda o caso" e o componente `Metric` (`text-[11px]`, `text-[10px] font-medium`) não fazem parte das superfícies S1 a S4.

Texto gerado preserva quebras de linha com `whitespace-pre-line` e quebra palavras longas com `break-words`.

---

## Color

Tokens existentes de `src/index.css`. Nenhum token novo [LOCKED].

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `canvas` `#f3f5f8` | Fundo da página; fundo `canvas/60` do bloco Resumo IA e dos `Textarea` |
| Secondary (30%) | `surface` `#ffffff` + borda `line` `#e1e8f0` | Cards, bloco do original em S3, modal |
| Accent (10%) | `accent` `#2f7dff` | Lista abaixo |
| Texto | `ink` `#102038`, `muted` `#5a6b80`, `forest` `#0b1d36` | Corpo, legendas/estado vazio, hover do lápis |
| Soft accent | `accent-soft` `#e7f0fb` | Fundo de hover do lápis |
| Destructive | `error` `#dc4a4a` | Somente o botão "Substituir e gerar" do `ConfirmDialog` e as mensagens de erro de validação/toast |

Accent reservado para (lista fechada, nenhuma outra aplicação):
1. Rótulos maiúsculos dos cards e do bloco (Resumo do paciente, Resumo IA, Plano de tratamento, Evolução geral, Condutas, Dor e limitações, Áreas de foco, Resumo original da IA).
2. Ícone `Sparkles` do bloco Resumo IA.
3. Linha do `EvaChart` e anel de foco (`focus-visible` e `focus:ring-accent/25`) já existentes.
4. Regiões marcadas no boneco (existente).

Fora do accent: lápis (muted → forest no hover), texto de corpo, legendas, datas, botão "Salvar edições" (variante primária do `Button` existente).

Contraste: texto `muted` em branco ≈ 5,2:1 (ok). Rótulos de 12px em `accent` sobre branco têm contraste ≈ 3,9:1. **Desvio aceito explicitamente:** manter `accent` nos rótulos maiúsculos é o padrão visual de toda a página, e trocar para `forest`/`ink` só nesta fase quebraria a coerência com as demais abas. O rótulo é estrutural e vem sempre acompanhado de conteúdo textual em `ink`.

---

## Copywriting Contract

Tudo em português do Brasil [LOCKED].

| Element | Copy |
|---------|------|
| Primary CTA da fase | Lápis (ícone) com `aria-label="Editar resumo do paciente"`; no modal, `Salvar edições`. CTA de geração existente: `Gerar resumo` |
| Título do modal | `Editar resumo` |
| Rótulos de campo | `Resumo IA`, `Plano de tratamento`, `Evolução geral`, `Condutas`, `Plano próxima sessão`, `Dor e limitações` |
| Empty state (Resumo IA, S1) | heading implícito: `Sem resumo ainda.` |
| Empty state (cards de texto) | `—` com `aria-label="Sem informação"`. Next step: o lápis permite escrever à mão (quem pode editar); sem texto extra |
| Empty state (aba Resumo IA, `canWrite`) | `Nenhum resumo gerado ainda. Use "Gerar resumo" acima.` |
| Empty state (aba Resumo IA, consulta) | `Nenhum resumo gerado ainda.` |
| Empty state (Objetivos) | `Sem objetivos cadastrados.` (inalterado) |
| Empty state removido | `Sem registros de dor ainda.` deixa de aparecer no card Dor e limitações |
| Legenda IA | `Gerado pela IA a partir do prontuário. Revise antes de usar.` |
| Legenda editado | `Texto editado. O original gerado pela IA está na aba Resumo IA.` |
| Ajuda aba Resumo IA | `Gere o resumo clínico ou exporte PDFs. Aqui fica o texto original da última geração. Para corrigir, abra a aba Resumo.` |
| Erro ao salvar edição | `Não foi possível salvar o resumo. Tente de novo.` (mantém o texto digitado) |
| Erro de permissão | `Você não tem permissão para editar este paciente.` |
| Erro de validação de campo | `Use no máximo {N} caracteres.` |
| Erro ao gerar | `Não foi possível gerar o resumo. Tente de novo em instantes.` (`generateError`, existente) |
| Sucesso | `Resumo salvo` (edição); `Resumo atualizado` (geração, existente) |
| Destructive confirmation | `Gerar de novo`: título `Gerar de novo?`; corpo `Gerar de novo substitui o resumo e as suas edições. O texto editado e o resumo original anterior serão perdidos.`; botões `Manter meu resumo` (cancela, foco inicial) / `Substituir e gerar` (confirma) |
| Rótulo de saída do modal de edição | `Fechar sem salvar` (botão secundário do rodapé de S2); `Salvar edições` (primário) |

Ações destrutivas na fase: **uma**, a regeneração que descarta edições (S4). Apagar o conteúdo de um campo no modal não é destrutivo (sem confirmação), porque o original continua na aba Resumo IA.

Regra de conteúdo: nunca exibir número de EVA, percentual de progresso ou contagem que a IA não tenha citado do prontuário. Nenhum texto "não informado" ou hipótese preenchendo cards vazios (a IA omite a chave; a UI mostra `—`).

---

## Interaction & Accessibility Contract

| Aspecto | Regra |
|---------|-------|
| Permissão | `canWrite` governa lápis, modal e composer. Sem permissão, nada de escrita é renderizado [LOCKED]. A RLS (`can_write_patient`) é a barreira real |
| Alvos de toque | Lápis `min-h-11 min-w-11`; botões do modal e do `ConfirmDialog` ≥ 44px; `Textarea` `min-h-24` [LOCKED] |
| Revelação do lápis | Opacidade 0 até hover do grupo ou foco dentro; sempre visível em dispositivos sem hover (`[@media(hover:none)]:opacity-100`). Navegação por teclado revela via `group-focus-within` |
| Foco | `:focus-visible` global (`outline-2 outline-offset-2 outline-accent`) em todos os controles novos |
| Teclado | `Esc` fecha o modal e o diálogo (comportamento do `Modal`). `Enter` dentro de `Textarea` insere quebra de linha e não envia |
| Leitor de tela | Modal com `role="dialog"` e `aria-modal` (existente). Lápis com `aria-label`. `—` com `aria-label="Sem informação"`. `Sparkles` `aria-hidden`. Bloco do original com `aria-label="Resumo original da IA"`. Erros de campo com `role="alert"` (existente no `Textarea`) |
| Movimento | Sem animação nova. Transição de opacidade do lápis já existente; respeita `prefers-reduced-motion` do app |
| Responsivo | Grade: 1 coluna no celular, 3 colunas em `lg`. Modal: folha inferior no celular; botões empilhados (`flex-col-reverse`) e lado a lado em `sm`. Texto longo quebra sem estourar o card (`min-w-0 break-words`) |
| Concorrência | Salvar edição e gerar usam `UPDATE`s distintos; após qualquer um, `invalidatePatient` refaz a leitura |

---

## Mapa de requisitos para a interface

| Requisito | Onde se cumpre na UI |
|-----------|----------------------|
| REQ-33.1 (substituir, sem histórico) | S4 confirma; nenhuma lista de versões em S3 |
| REQ-33.2 (aba Resumo IA mostra o original, sem edição) | S3 |
| REQ-33.3 (editar na aba Resumo, fica salvo) | S1 lápis + S2 |
| REQ-33.4 (geração preenche os cards, iguais para todos, inclui foco) | S1 conjunto de seis cards + bloco Resumo IA |
| REQ-33.5 (card não preenchível é trocado) | Programa → Plano de tratamento; Dor (EVA) → Dor e limitações; badge `eva/10` removido |
| REQ-33.6 (prompt) | Sem UI; copy de rótulos do modal e de S3 deve espelhar as chaves do prompt |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | nenhum (shadcn não inicializado) | not applicable |
| Terceiros | nenhum | not applicable |

Nenhum registro de terceiros declarado, nenhuma vistoria necessária. Nenhum pacote npm novo [LOCKED].

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-10-03
