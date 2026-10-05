---
phase: 23
slug: ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
status: approved
reviewed_at: 2026-10-04
shadcn_initialized: false
preset: none
created: 2026-10-04
---

# Phase 23 — UI Design Contract

> Contrato visual e de interação para "Ajustes do resumo IA e rolagem do Entenda o caso" (REQ-34). Gerado por gsd-ui-researcher, verificado por gsd-ui-checker.
>
> Convenções: **[LOCKED]** = decisão do profissional, não reabrir. **[DEFAULT]** = padrão adotado pelo pesquisador, sem pergunta ao usuário. **[EXISTING]** = já implementado no repositório, não alterar.
>
> Fontes pré-preenchidas: `23-CONTEXT.md`, `23-RESEARCH.md`, `locked_decisions` da invocação, `22-UI-SPEC.md` (baseline visual), `src/index.css`, `src/pages/PatientPage.tsx` (`ResumoDoPaciente`, `EntendaOCaso`), `src/components/ui/{Textarea,Button}.tsx`, `src/components/patients/PatientAiComposer.tsx`, `src/lib/patientSummary.ts`.
>
> Gate shadcn: `components.json` ausente. Decisão travada: não inicializar. `Tool: none`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (sem `components.json`; shadcn não se aplica) [LOCKED] |
| Preset | not applicable |
| Component library | none. Componentes próprios em `src/components/ui` (`Button`, `Textarea`, `Modal`, `ConfirmDialog`). **Nenhum pacote npm novo** [LOCKED] |
| Styling | Tailwind CSS v4 com tokens em `@theme` (`src/index.css`) [EXISTING] |
| Icon library | `lucide-react` `Pencil` e `Sparkles`, já usados em `PatientPage.tsx` [EXISTING] |
| Font | `Plus Jakarta Sans` (`font-sans`) em toda a fase. `Cormorant Garamond` (`font-display`) não entra [LOCKED] |

Fora de escopo de gate: nenhum registro de terceiros, nenhum bloco de registry.

**Baseline:** o contrato visual da fase 22 permanece. Esta fase não redesenha os cards do Resumo, o boneco, os objetivos, o gráfico EVA nem a aba Resumo IA [LOCKED].

---

## O que muda e o que fica

| Superfície | Arquivo | Nesta fase |
|------------|---------|------------|
| Aba Resumo, textos gerados | `PatientPage.tsx` (`ResumoDoPaciente`) | Editar **dentro** de cada caixa, uma chave por vez. O modal some |
| Modal de todos os campos | `PatientSummaryEditorModal.tsx` | **Apagar** a superfície. Não montar, não substituir por outro modal [LOCKED] |
| Aba Resumo IA | `PatientResumoIaPanel.tsx` | Original da última geração. **Sem lápis** [LOCKED] |
| Composer, modo resumo | `PatientAiComposer.tsx` | Só o rótulo e o placeholder da descrição adicional |
| Confirmação de nova geração | `ConfirmDialog` já ligado ao composer | Permanece, com a copy da fase 22. Nenhuma copy destrutiva nova [LOCKED] |
| Entenda o caso | `PatientPage.tsx` (`EntendaOCaso`) | Só o overflow de Queixa e Diagnóstico. O modal de queixa/diagnóstico/início/planejados **permanece** [LOCKED] |
| Áreas de foco, Objetivos, EVA | boneco, `PatientGoalsPanel`, `EvaChart` | Sem editor de texto e sem mudança visual [LOCKED] |

Hierarquia da aba Resumo, inalterada: bloco Resumo IA em largura total, depois Plano de tratamento, Evolução geral, Condutas, Dor e limitações, Áreas de foco, Todos os objetivos [EXISTING].

Regra de dados, inalterada: a aba Resumo lê `resolveSummaryFields(original, edits)`. A aba Resumo IA lê somente `aiSummary` e `aiSummaryFields`, nunca `summaryEdits` [EXISTING].

---

## Edição inline na aba Resumo

Uma chave de `SUMMARY_FIELD_KEYS` por vez. Estado: `editingKey: SummaryFieldKey | null`. Não há react-hook-form. Não há blur save [LOCKED].

| Caixa | Chave | Onde o lápis fica |
|-------|-------|-------------------|
| Bloco Resumo IA | `summary` | Cluster à direita do rótulo, ao lado do `Sparkles`, como hoje |
| Plano de tratamento | `treatmentPlan` | Cabeçalho do card |
| Evolução geral | `evolution` | Cabeçalho do card |
| Condutas | `conducts` | Cabeçalho do card |
| Plano próxima sessão | `nextSessionPlan` | Rodapé do mesmo card Condutas, ao lado do rótulo do rodapé |
| Dor e limitações | `painLimitations` | Cabeçalho do card |
| Áreas de foco | — | Sem lápis de texto |
| Todos os objetivos | — | Sem lápis de texto |

### Lápis

Só se `canWrite`. Sem `canWrite`, o botão **não é renderizado**. Não existe lápis desabilitado [LOCKED].

Classes, iguais às de Entenda o caso e da fase 22:

`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-accent-soft hover:text-forest group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100`

`Pencil size={16}`. `type="button"`.

`aria-label={`Editar ${SUMMARY_FIELD_LABELS[key]}`}` [LOCKED]. Resultados: `Editar Resumo IA`, `Editar Plano de tratamento`, `Editar Evolução geral`, `Editar Condutas`, `Editar Plano próxima sessão`, `Editar Dor e limitações`.

O invólucro da caixa (bloco Resumo IA, ou o card) leva `group`, para a opacidade. No card Condutas um único `group` no card revela os dois lápis juntos; só um abre.

Enquanto `isPending`, os outros lápis não abrem outra chave [LOCKED].

### Modo leitura

O parágrafo de cada caixa permanece com as classes da fase 22.

- Bloco Resumo IA: `mt-4 text-sm leading-7 text-ink/90 sm:text-base whitespace-pre-line break-words`. Vazio: `Sem resumo ainda.`
- Cards: `mt-2 break-words whitespace-pre-line text-sm leading-6 text-ink`. Vazio: `—` dentro de `<span aria-label="Sem informação">—</span>`.
- Rodapé Condutas: rótulo `text-xs text-muted` `Plano próxima sessão`; texto `mt-1 break-words whitespace-pre-line text-sm text-ink` ou `—`.
- Legendas do bloco Resumo IA permanecem: `Gerado pela IA a partir do prontuário. Revise antes de usar.` e `Texto editado. O original gerado pela IA está na aba Resumo IA.`

### Modo edição

O parágrafo da chave aberta é substituído por um `<textarea>` nativo. O `Textarea` compartilhado **não** é usado aqui: ele sempre desenha um `<label>` e duplicaria o título do card [LOCKED]. O componente compartilhado não é alterado.

Classes copiadas do `<textarea>` interno de `src/components/ui/Textarea.tsx`:

`min-h-24 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted/50 transition-colors duration-200 hover:border-forest/25 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25`

Com erro de Zod, trocar `border-line hover:border-forest/25` por `border-error`.

`rows` = `SUMMARY_FIELD_ROWS[key]` (`summary` 6; as outras cinco, 3). `aria-labelledby` aponta para o título visível da caixa (o rótulo que o card já mostra). Ids estáveis:

| Chave | Id do título | Id do textarea |
|-------|--------------|----------------|
| `summary` | `resumo-summary-label` | `resumo-summary` |
| `treatmentPlan` | `resumo-treatment-plan-label` | `resumo-treatment-plan` |
| `evolution` | `resumo-evolution-label` | `resumo-evolution` |
| `conducts` | `resumo-conducts-label` | `resumo-conducts` |
| `nextSessionPlan` | `resumo-next-session-plan-label` | `resumo-next-session-plan` |
| `painLimitations` | `resumo-pain-limitations-label` | `resumo-pain-limitations` |

`nextSessionPlan` é rotulado por `Plano próxima sessão`, não por `Condutas`.

Valor inicial do rascunho: o texto resolvido daquela chave (`edição` se for string, senão original, senão `''`). String vazia é válida e apaga o campo de propósito. **Nunca** pré-preencher com `—` nem com `Sem resumo ainda.` [LOCKED]. O rascunho nasce ao abrir o lápis e não observa `detail` enquanto `editingKey` está setado.

Erro de validação, abaixo do textarea (`mt-2`): `<p role="alert" className="text-xs text-error">`. Mensagem já definida em `summaryEditsSchema.shape[key]`: `Use no máximo N caracteres.` N por chave: `summary` 1500, `treatmentPlan` 500, `evolution` 500, `conducts` 500, `nextSessionPlan` 400, `painLimitations` 500. Validar com `safeParse` só da chave. Não cortar o texto em silêncio.

### Salvar e Cancelar

Abaixo do textarea, `mt-4 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end`:

| Botão | Variante | Copy | Tipo |
|-------|----------|------|------|
| Cancelar | `Button` `variant="secondary"` `type="button"` `className="min-h-11"` | `Cancelar` | Descarta o rascunho e sai do modo edição. Sem diálogo |
| Salvar | `Button` padrão (primary) `type="button"` `className="min-h-11"` | `Salvar` | CTA primário. `isLoading` enquanto `isPending` |

`Salvar` grava o diff das **seis** chaves: `{ ...resolveSummaryFields(original, edits), [key]: draft }` passado a `diffSummaryEdits`. Não enviar só a chave aberta. Sucesso: sair do modo edição. O hook já mostra `Resumo salvo`. Erro: permanecer na caixa com o rascunho. Toasts inalterados: `Não foi possível salvar o resumo. Tente de novo.` e `Você não tem permissão para editar este paciente.` [LOCKED].

Enquanto `isPending`: Salvar mostra o estado de carregamento já existente do `Button` (`Aguarde...`); Cancelar fica `disabled`; outro lápis não abre.

Abrir outro lápis com `editingKey` setado e sem `isPending` descarta o rascunho não salvo e abre a nova chave. Sem diálogo [LOCKED].

`Enter` no textarea insere quebra de linha e não salva. `Esc` equivale a Cancelar, exceto durante `isPending`. Ao abrir, o foco vai para o textarea. Ao sair (Cancelar, Esc ou sucesso), o foco volta ao lápis daquela chave.

O bloco Resumo IA em edição mantém a legenda abaixo dos botões. O gráfico EVA, quando houver série, permanece abaixo do texto de Dor e limitações e não entra no editor.

---

## Aba Resumo IA

Sem lápis, sem textarea, sem link de edição [LOCKED]. O bloco "Resumo original da IA", a data, a lista dos campos com texto e os vazios `Nenhum resumo gerado ainda.` / `Nenhum resumo gerado ainda. Use "Gerar resumo" acima.` permanecem como na fase 22.

O diálogo de gerar de novo permanece **somente se já estiver presente**, com a copy travada:

| Elemento | Copy |
|----------|------|
| Título | `Gerar de novo?` |
| Descrição | `Gerar de novo substitui o resumo e as suas edições. O texto editado e o resumo original anterior serão perdidos.` |
| Confirmar | `Substituir e gerar` |
| Cancelar (foco inicial) | `Manter meu resumo` |

Não acrescentar outra confirmação destrutiva [LOCKED].

---

## Composer — descrição adicional

Só o modo resumo. O campo continua o `Textarea` compartilhado (aqui o rótulo é o próprio campo). Opcional. Teto 2000, já no Zod [LOCKED].

| Propriedade | Valor |
|-------------|-------|
| Rótulo | `Descrição adicional (opcional)` |
| Placeholder | `Ex.: dor no joelho direito ao subir escada` |
| Proibido no placeholder | a palavra enfatize, ênfase, ou um pedido para enfatizar |

O modo PDF não muda.

---

## Entenda o caso — só overflow

Única mudança visual do card. Não rolar o `<article>`. Não rolar o grid. Não alterar métricas, lápis, modal, nem `line-clamp-2` dos objetivos [LOCKED].

Nos dois parágrafos de Queixa e Diagnóstico, remover `line-clamp-3` e aplicar:

`case-scroll mt-1 max-h-[4.5rem] overflow-y-auto overscroll-contain text-sm leading-6 text-ink`

`4.5rem` são três linhas de `leading-6`. O card não cresce além disso. `overflow-y-auto` só mostra o slider quando o texto passa. `overscroll-contain` impede o scroll de vazar para a página.

`tabIndex={0}`. `aria-label="Queixa"` e `aria-label="Diagnóstico"`. Quem não escreve também rola: overflow não é controle de escrita. `clampText` continua trocando vazio por `—`.

Classe nova em `src/index.css`, imediatamente depois de `.panel-scroll`. Não alterar o scrollbar de `*` nem `.nav-scroll` [LOCKED]:

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

`#102038` é o token `ink`. Opacidade 0.28. Não criar token novo.

---

## Spacing Scale

Valores declarados (múltiplos de 4), os mesmos da fase 22 nas superfícies que permanecem:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | `gap-1` entre Sparkles e lápis; largura do scrollbar `.case-scroll` (4px) |
| sm | 8px | `mt-2` rótulo → corpo, erro Zod abaixo do textarea, `gap-2` nos cabeçalhos |
| md | 16px | `p-4` dos cards, `gap-4` da grade e da fileira Salvar/Cancelar, `mt-4` antes do corpo do Resumo IA e antes dos botões |
| lg | 24px | `space-y-6` do painel Resumo IA (inalterado) |
| xl | 32px | não usado nesta fase |
| 2xl | 48px | não usado nesta fase |
| 3xl | 64px | não usado nesta fase |

Exceções:
- Alvo de toque do lápis e de Salvar/Cancelar: `min-h-11` / `min-w-11` (44px) [LOCKED].
- `sm:p-5` (20px) nos invólucros já existentes [EXISTING].
- `max-h-[4.5rem]` (72px) nos parágrafos de Queixa e Diagnóstico: três linhas de `leading-6` [LOCKED].
- `min-h-24` (96px) no textarea, herdado das classes do `Textarea` [EXISTING].
- `min-h-[11rem]` e `min-h-[16rem]` dos cards, herdados [EXISTING].
- Código novo não usa 12px (`mt-3`, `gap-3`, `space-y-3`) nem 6px (`mt-1.5`). `mt-1` (4px) só onde a fase 22 já usa (rótulo → texto curto).
- `py-3.5` interno do `Button` não é alterado [EXISTING].

---

## Typography

Três tamanhos (**12 / 14 / 16px**) e dois pesos (**400 / 600**) nas superfícies que esta fase desenha ou edita [LOCKED].

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label | 12px (`text-xs`) | 600 nos rótulos maiúsculos dos cards; 400 em legendas, sub-rótulos (`Plano próxima sessão`, `Queixa`, `Diagnóstico`), erros e datas | 1.33 (padrão `text-xs`) |
| Body | 14px (`text-sm`) | 400 no texto dos cards, nos parágrafos roláveis e no placeholder; 600 nos botões (`Button` já é `font-semibold`) | 1.71 (`leading-6`, 24px) nos cards e em Queixa/Diagnóstico |
| Heading | 16px (`text-base`) | 400 | 1.75 (`leading-7`, 28px) no corpo do bloco Resumo IA a partir de `sm` |
| Display | não usado | — | — |

O textarea nativo herda 16px/400 do `body` (`font: inherit` não é forçado; o elemento não declara `text-sm`). Quebras com `whitespace-pre-line` e `break-words` nos parágrafos de leitura. O textarea não recebe `font-medium`.

O título 18px do `ConfirmDialog` e do modal de Entenda o caso é cromo compartilhado e **não é restilizado** nesta fase [EXISTING].

---

## Color

Tokens existentes. Nenhum token novo. A única cor nova é o slider, em CSS ao lado de `.panel-scroll`, usando `ink` a 0,28 de opacidade [LOCKED].

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `canvas` `#f3f5f8` | Fundo da página; fundo `canvas/60` do bloco Resumo IA; fundo do textarea |
| Secondary (30%) | `surface` `#ffffff` + borda `line` `#e1e8f0` | Cards, aba Resumo IA, botão Cancelar |
| Accent (10%) | `accent` `#2f7dff` | Lista fechada abaixo |
| Texto | `ink` `#102038`, `muted` `#5a6b80`, `forest` `#0b1d36` | Corpo, legendas, hover do lápis, botão Salvar |
| Soft accent | `accent-soft` `#e7f0fb` | Hover do lápis |
| Destructive | `error` `#dc4a4a` | Só `Substituir e gerar`, o `border-error` / `text-error` da validação, e os toasts de erro já existentes |
| Slider | `rgba(16, 32, 56, 0.28)` | Somente o polegar de `.case-scroll`. Não é token |

Accent reservado para (lista fechada):
1. Rótulos maiúsculos já em accent (Resumo do paciente, Resumo IA, Plano de tratamento, Evolução geral, Condutas, Dor e limitações, Áreas de foco, Entenda o caso, Objetivos atuais, Resumo original da IA).
2. Ícone `Sparkles` do bloco Resumo IA.
3. Anel `focus:ring-accent/25` e `focus:border-accent` do textarea, e o `:focus-visible` global.
4. Linha do `EvaChart` e regiões marcadas no boneco, já existentes.

Fora do accent: lápis (muted → forest), Salvar (forest), Cancelar (surface/ink), corpo, legendas, slider.

Contraste dos rótulos de 12px em `accent` sobre branco permanece o desvio aceito na fase 22 (≈ 3,9:1). Não trocar esses rótulos para `ink` nesta fase.

---

## Copywriting Contract

Português do Brasil [LOCKED].

| Element | Copy |
|---------|------|
| Primary CTA | `Salvar` |
| Secondary | `Cancelar` |
| Lápis | `Editar {SUMMARY_FIELD_LABELS[key]}` |
| Empty state heading | Cards de texto: `—`. Bloco Resumo IA sem texto: `Sem resumo ainda.` (inalterado) |
| Empty state body | `—` com `aria-label="Sem informação"`. Sem frase extra. Quem pode escrever abre o lápis e digita. O rascunho de um campo vazio começa em string vazia |
| Empty state (aba Resumo IA) | `Nenhum resumo gerado ainda. Use "Gerar resumo" acima.` com escrita; `Nenhum resumo gerado ainda.` em consulta. Inalterados |
| Composer label | `Descrição adicional (opcional)` |
| Composer placeholder | `Ex.: dor no joelho direito ao subir escada` |
| Error state | `Não foi possível salvar o resumo. Tente de novo.` A caixa permanece aberta com o rascunho |
| Erro de permissão | `Você não tem permissão para editar este paciente.` A caixa permanece aberta com o rascunho |
| Erro de validação | `Use no máximo N caracteres.` |
| Sucesso | `Resumo salvo` (toast já emitido pelo hook). A caixa fecha |
| Destructive confirmation | Nenhuma copy nova. A regeneração já existente permanece: título `Gerar de novo?`; corpo `Gerar de novo substitui o resumo e as suas edições. O texto editado e o resumo original anterior serão perdidos.`; botões `Manter meu resumo` / `Substituir e gerar` |

Cancelar e abrir outro lápis descartam o rascunho sem confirmação. Apagar o texto de uma caixa e salvar não pede confirmação: o original continua na aba Resumo IA.

Legendas inalteradas: `Gerado pela IA a partir do prontuário. Revise antes de usar.` e `Texto editado. O original gerado pela IA está na aba Resumo IA.`

---

## Interaction & Accessibility Contract

| Aspecto | Regra |
|---------|-------|
| Permissão | `canWrite` esconde lápis, textarea, Salvar e Cancelar. Sem permissão, nenhum controle de escrita do resumo é renderizado. A RLS continua sendo a barreira. A rolagem de Queixa e Diagnóstico aparece para todos |
| Uma chave | Só uma caixa em edição. Abrir outra descarta o rascunho, salvo durante `isPending`, quando os outros lápis não abrem |
| Persistência | Sem blur save. Só o clique em Salvar. O save cobre as seis chaves a partir do texto resolvido |
| Alvos de toque | Lápis `min-h-11 min-w-11`. Salvar e Cancelar `min-h-11`. Textarea `min-h-24` |
| Revelação do lápis | Opacidade 0 até hover do `group` ou foco dentro; sempre visível sem hover (`[@media(hover:none)]:opacity-100`) |
| Foco | `:focus-visible` global. Textarea usa o anel accent já copiado do `Textarea`. Foco entra no textarea ao editar e volta ao lápis ao sair |
| Teclado | `Enter` quebra linha. `Esc` cancela, exceto com save pendente. Parágrafos de Queixa e Diagnóstico estão na ordem de tab (`tabIndex={0}`) para rolar pelo teclado |
| Leitor de tela | Lápis com `aria-label` da chave. Textarea com `aria-labelledby` no título visível. `—` com `aria-label="Sem informação"`. Erro com `role="alert"`. `Sparkles` continua `aria-hidden` |
| Movimento | Sem animação nova. A transição de opacidade do lápis já existe |
| Responsivo | Grade inalterada (1 coluna no celular, 3 em `lg`). Botões empilhados e, a partir de `sm`, lado a lado alinhados ao fim. Texto longo quebra com `min-w-0 break-words`. No Entenda o caso o grid continua empilhando Queixa e Diagnóstico; cada um rola no próprio parágrafo |

---

## Mapa de requisitos para a interface

| Requisito | Onde se cumpre na UI |
|-----------|----------------------|
| REQ-34.1 | Lápis e textarea dentro de cada caixa de texto; `PatientSummaryEditorModal` removido; aba Resumo IA sem lápis |
| REQ-34.2 | Sem UI nova. O número exibido no Entenda o caso não muda de layout |
| REQ-34.3 | Sem UI nova no boneco. Áreas de foco não ganha editor de texto |
| REQ-34.4 | Rótulo `Descrição adicional (opcional)` e placeholder de fato/região no composer |
| REQ-34.5 | Queixa e Diagnóstico com `max-h-[4.5rem] overflow-y-auto overscroll-contain case-scroll`; artigo sem scroll; objetivos com `line-clamp-2` |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | nenhum | not applicable — shadcn não inicializado — 2026-10-04 |
| Terceiros | nenhum | not applicable — nenhum registro de terceiros — 2026-10-04 |

Nenhum pacote npm novo. Nenhum bloco de registry para vistoriar.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
