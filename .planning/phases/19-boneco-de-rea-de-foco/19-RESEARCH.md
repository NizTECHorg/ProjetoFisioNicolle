# Phase 19: Boneco de área de foco - Research

**Researched:** 2026-09-24
**Domain:** Existing focus-area silhouette (inline SVG catalog, `patient_focus_areas`, PDF body map)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Divisões do braço
- **D-01:** Depois do ombro, cada lado se divide em Braço, Antebraço e mão. Vale na frente e nas costas, esquerda e direita. O ombro continua uma região própria.
- **D-02:** Na frente a mão se chama Palma da mão. Nas costas se chama Mão. Braço e Antebraço usam o mesmo nome nas duas vistas.
- **D-03:** A mão é uma região só. Os dedos não se separam. O cotovelo é só o limite entre Braço e Antebraço, não uma região.

### Perna, canela e pé
- **D-04:** Coxa e joelho continuam com o mesmo nome na frente e nas costas. Abaixo do joelho, a frente é Canela e depois Pé. As costas são Panturrilha e depois Tornozelo. Esquerda e direita.
- **D-05:** O pé é uma região só. Os dedos do pé não se separam. Não há faixa de tornozelo entre Canela e Pé na frente. Nas costas a ponta é Tornozelo, não Pé.

### Marcas já salvas
- **D-06:** Apagar só as marcas das regiões que deixam de existir: braço inteiro (frente e costas, esquerda e direita) e perna inteira que hoje inclui o pé (`front.arm_l`, `front.arm_r`, `back.arm_l`, `back.arm_r`, `front.leg_l`, `front.leg_r`, `back.leg_l`, `back.leg_r`). Marcas de regiões que não mudam permanecem. Não repartir a marca antiga nas partes novas.

### Scroll ao selecionar
- **D-07:** Selecionar uma área de foco não cria scroll na página. Se o boneco atual não puder ser corrigido sem esse scroll, ele é substituído por um desenho em que a seleção não cria scroll.

### O que permanece da fase 6
- **D-08:** O card continua Áreas de foco no Resumo, frente e costas lado a lado, visual minimalista da clínica. Hover de 500ms abre a abinha; o clique na abinha marca ou desmarca. Clique só na silhueta não marca. Catálogo fixo de regiões, persistido em `patient_focus_areas`. Quem não pode escrever só vê.

### Claude's Discretion
- Nomes estáveis das `region_key` novas e o desenho SVG de cada parte.
- Como aplicar a exclusão das marcas obsoletas no SQL Editor, sem `supabase db push` e sem apagar linhas de regiões que permanecem.
- O meio de tirar o scroll (ajuste do boneco atual ou boneco novo). O resultado é obrigatório: a página não rola ao selecionar.

### Deferred Ideas (OUT OF SCOPE)
- Separar os dedos da mão ou do pé.
- Cotovelo como região própria.
- Granularidade muscular (já adiada na fase 6).
- Seletor de sexo ou tipo de corpo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-30 | Braços com divisões que marcam e desmarcam; pés como região própria; seleção sem scroll; substituir o boneco se o desenho atual não eliminar o scroll; marcas de regiões que permanecem continuam visíveis e as regiões novas usam o mesmo marcar/desmarcar | Catálogo em `src/lib/focusRegions.ts` (hoje 30 keys; braço e perna são uma peça só). Toggle já é `togglePatientFocusArea` (INSERT/DELETE por `region_key`). D-06 restringe o aceite “o que já está salvo continua visível”: as 8 keys que somem são apagadas e não são repartidas; coxa, joelho, ombro e o resto permanecem. Scroll é foco do SVG/`button` dentro de `.panel-scroll`, não a geometria. Membros precisam de paths novos porque a mão e o pé atuais não são alvos utilizáveis. |
</phase_requirements>

## Summary

A fase não troca a stack. O catálogo único continua em `src/lib/focusRegions.ts`. `focusRegionKeySchema` é `z.enum(FOCUS_REGION_KEYS)`, então as keys novas entram no Zod sem uma segunda lista em `patient.schema.ts`. O painel do Resumo, o mapa da avaliação (`BodyMapPicker`) e o PDF (`drawSvgPath` + `BODY_MAP_CENTROIDS`) leem esse catálogo. A constraint SQL `^(front|back)\.[a-z0-9_]+$` já aceita as keys novas. O script da fase é só um `DELETE` das 8 keys obsoletas, colado no SQL Editor.

O scroll não se resolve desenhando outro contorno com o mesmo `tabIndex={0}` no `<path>`. O browser rola o elemento focado para a vista, e o padrão é rolar (`preventScroll` default `false`) [CITED: https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/focus]. `preservePanelScroll` lê `scrollTop` dentro do `onFocus`, depois que essa rolagem já aconteceu, e grava o mesmo valor de volta. A correção é impedir o foco nativo de rolar: `preventDefault` no `pointerdown` do path e da abinha, e `focus({ preventScroll: true })` só quando o código move o foco. Redesenhar os quatro membros continua obrigatório por causa do tamanho do alvo, no mesmo `viewBox="0 0 140 240"`.

**Primary recommendation:** Trocar as 8 keys de braço inteiro e perna inteira pelas 20 keys da tabela abaixo, redesenhar só os membros, apagar só aquelas 8 linhas em `patient_focus_areas`, e tirar o scroll pelo foco (`preventScroll`), não por um boneco novo com `tabIndex` no path.

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` não existe neste repositório. O plano segue o que o código e a fase 6 já travaram:

- Catálogo único em `src/lib/focusRegions.ts`. Não duplicar as keys em `patient.schema.ts`.
- Camadas já existentes: catálogo → Zod → `patients.service.ts` → `useTogglePatientFocusArea` → `PatientFocusAreasPanel`. Sem rota nova, sem tabela nova, sem widget de terceiro.
- SQL colado no SQL Editor. Cópia commitada em `.planning/phases/19-boneco-de-rea-de-foco/sql/` e cópia em `supabase/` (gitignored), no mesmo padrão da fase 6. O comentário de aviso contém a frase `não use supabase db push` e não é um comando.
- Quem não pode escrever não vê a abinha e o path não recebe `tabIndex`. Não mostrar controle desabilitado.
- Abinha é `<button type="button">` no wrapper da silhueta. Sem portal, sem `title` nativo, sem modal. O chip visível não acrescenta “(frente)” / “(costas)”; a lista `sr-only` acrescenta. [VERIFIED: `06-UI-SPEC.md` e `PatientFocusAreasPanel.tsx`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Desenho e hit-test das regiões | Browser / Client | — | Paths SVG e a abinha vivem em `PatientFocusAreasPanel` e `BodyMapPicker`. |
| Impedir scroll ao selecionar | Browser / Client | — | Quem rola é o foco dentro de `.panel-scroll` (`AppShell`). Não há endpoint para isso. |
| Catálogo de keys, labels e paths | Browser / Client | — | `FOCUS_REGIONS` é a fonte. O banco guarda a key; o label exibido vem do catálogo. |
| Marcar / desmarcar área de foco | API / Backend (Supabase client) | Database | `togglePatientFocusArea` faz SELECT + INSERT ou DELETE. RLS `can_write_patient` continua a parede. |
| Apagar marcas das 8 keys | Database | — | `DELETE` idempotente no SQL Editor. O client não apaga em massa. |
| Mapa corporal da avaliação e PDF | Browser / Client | — | Mesmos paths e centroids. Marcas da ficha ficam no JSON da avaliação, não em `patient_focus_areas`. |
| Allow-list da IA (`patient-ai-summary`) | API / Backend (Edge Function) | — | Set duplicado no twin da fase 13. O client já descarta key fora do Zod. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.0 (package.json `^19.1.0`; lock não reconsultado nesta sessão) | Painel e mapa | Já desenha a silhueta. Sem biblioteca de body-map. |
| TypeScript | 5.8.3 | `Record<FocusRegionKey, …>` no PDF quebra o typecheck se faltar centroid | `npm run typecheck` é o Nyquist desta fase. |
| Zod | 3.25.28 (`^3.25.28`) | `z.enum(FOCUS_REGION_KEYS)` | Já é o cadeado de escrita. |
| SVG inline | nativo | Hit-test por `<path>` | Fase 6. pdf-lib desenha o mesmo `d` com `drawSvgPath`. |
| Supabase client | 2.117.1 | INSERT/DELETE em `patient_focus_areas` | Toggle existente. Sem migration CLI. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdf-lib | 1.17.1 (`^1.17.1`) | Silhueta no PDF da avaliação | Já importa `FOCUS_REGIONS`. Atualizar centroids junto com as keys. |
| Tailwind 4 | 4.1.7 | Classes já usadas no painel (`h-44`, `sm:h-52`, `overflow-hidden`) | Não criar sistema visual novo. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Paths no catálogo atual | Biblioteca de body-map / Jotform | Fora de D-08 e da fase 6. Não instalar. |
| `DELETE` das 8 keys | Reusar `front.arm_l` para o Braço novo | A marca antiga acenderia só o braço proximal. Isso reparte a marca. Proibido por D-06. |
| `focus({ preventScroll: true })` | Gravar `scrollTop` no `onFocus` e restaurar | O valor lido já é o da página rolada. O restore atual não desfaz o salto. |

**Installation:**

Nenhum pacote novo.

**Version verification:** versões lidas de `package.json` e `node node_modules/typescript/bin/tsc --version` → `Version 5.8.3`. Node `v26.4.0`, npm `12.0.2`. [VERIFIED: repo + shell]

## Package Legitimacy Audit

Esta fase não instala pacote externo. Auditoria slopcheck não se aplica.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
Resumo (PatientPage)
  PatientFocusAreasPanel
    hover 500ms → abinha
    clique na abinha → useTogglePatientFocusArea
      → togglePatientFocusArea
        → Zod enum → INSERT ou DELETE patient_focus_areas
    foco do path/abinha NÃO chama scroll-into-view
         │
         ▼
    .panel-scroll (AppShell)  scrollTop estável

Catálogo FOCUS_REGIONS
  ├─ Painel de foco (highlight)
  ├─ BodyMapPicker (ficha.sintomas.mapa.marks — JSON, clique direto)
  ├─ patientAiPdf BODY_MAP_CENTROIDS + drawSvgPath
  └─ applyAiFocusRegionKeys (descarta key fora do enum)

SQL Editor (humano)
  DELETE só as 8 keys obsoletas
  CHECK e RLS intactos

Edge Function patient-ai-summary (twin fase 13)
  Set espelhado do catálogo → humano faz o deploy da função
```

### Recommended Project Structure

```text
src/lib/focusRegions.ts                         # keys, labels, paths, sortOrder
src/components/patients/PatientFocusAreasPanel.tsx  # abinha + sem scroll
src/components/patients/evaluation/BodyMapPicker.tsx # mesmos paths; mesmo guarda de foco
src/services/patientAiPdf.service.ts            # centroids das keys novas; tirar as 8
src/services/patients.service.ts                # sem mudança de contrato do toggle
.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
                                                # set espelhado; não editar o twin da fase 11
.planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql
supabase/19-focus-region-retire.sql             # gitignored; mesmos bytes
```

Não criar componente paralelo de silhueta. `BodyMapPicker` e o PDF devem continuar importando `FOCUS_REGIONS`.

### Pattern 1: Keys novas, sem reusar as 8

**What:** Cada parte nova tem `region_key` que não está na lista de D-06.
**When to use:** Sempre. Inclusive o Braço proximal, que não se chama `front.arm_l`.

Labels bilaterais levam “esquerdo” / “direito”, como o catálogo atual. Sem o lado, as duas palmas compartilhariam o label e `focusRegionPathAriaLabel` só acrescentaria “(frente)”, sem distinguir esquerda de direita. [VERIFIED: `focusRegions.ts` `sharedFocusLabels`]

O nome curto de D-02 é o nome da parte. O label completo segue o padrão já visível na abinha (“Marcar Ombro esquerdo”).

| Key | Label | Vista |
|-----|-------|-------|
| `front.upper_arm_l` / `front.upper_arm_r` | Braço esquerdo / Braço direito | frente |
| `front.forearm_l` / `front.forearm_r` | Antebraço esquerdo / Antebraço direito | frente |
| `front.palm_l` / `front.palm_r` | Palma da mão esquerda / Palma da mão direita | frente |
| `back.upper_arm_l` / `back.upper_arm_r` | Braço esquerdo / Braço direito | costas |
| `back.forearm_l` / `back.forearm_r` | Antebraço esquerdo / Antebraço direito | costas |
| `back.hand_l` / `back.hand_r` | Mão esquerda / Mão direita | costas |
| `front.shin_l` / `front.shin_r` | Canela esquerda / Canela direita | frente |
| `front.foot_l` / `front.foot_r` | Pé esquerdo / Pé direito | frente |
| `back.calf_l` / `back.calf_r` | Panturrilha esquerda / Panturrilha direita | costas |
| `back.ankle_l` / `back.ankle_r` | Tornozelo esquerdo / Tornozelo direito | costas |

Contagem: 30 − 8 + 20 = 42 keys. Ombro, coxa e joelho ficam com a mesma key e o mesmo label.

Não criar `front.ankle_*`, `back.foot_*`, `back.shin_*`, `*.elbow_*`, nem key de dedo.

`sortOrder` das keys que permanecem não muda, para as linhas já salvas continuarem na mesma ordem. As keys novas recebem `sortOrder` livre depois de 29 (30 em diante), na ordem anatômica dentro de cada vista. A ordem visual é a ordem dos `<path>` no SVG, não `sort_order`. Não dar `UPDATE` em `sort_order` das linhas que permanecem.

### Pattern 2: Lateralidade já desenhada

**What:** Esquerda e direita são do paciente, não de quem olha a tela.
**When to use:** Ao espelhar os paths novos.

Medido nos paths atuais [VERIFIED: `src/lib/focusRegions.ts`]:

- Frente: `*_l` fica à direita de quem olha (`front.shoulder_l` em x≈89–106; `front.shoulder_r` em x≈33–51).
- Costas: `*_l` fica à esquerda de quem olha (`back.shoulder_l` em x≈33–51; `back.shoulder_r` em x≈89–106).

O membro `back.*_l` usa a faixa x do `front.*_r`, não uma cópia do `front.*_l`. Eixo de espelho: x = 70 (centro do viewBox 140).

Encaixe nos paths que permanecem: o ombro termina em y=70 e o braço atual começa em y=71; o joelho termina em y=204 e a perna atual começa em y=206. Os membros novos continuam nessas juntas. Não absorver o ombro no Braço nem o joelho na Canela/Panturrilha.

### Pattern 3: Redesenhar os membros, manter o tronco

**What:** Paths novos para braço, antebraço, mão, canela, pé, panturrilha e tornozelo. Cabeça, pescoço, ombros, tórax, abdômen, quadril, coxas, joelhos, cervical, dorsal, lombar e glúteos conservam o `d` atual e o centroid atual.
**When to use:** O path atual não separa um alvo de mão nem de pé.

O braço `front.arm_l` vai de y=71 até o controle da curva em y=155.2. O “punho” é a curva entre y=150 e y=155.2 (~5 unidades). A perna vai de y=206 a y=232; o pé é a aba de y=224 a y=232 (~8 unidades). Com `h-44` (176px) sobre viewBox 240, 1 unidade ≈ 0,73px: a mão tem ~4px e o pé ~6px. Em `sm:h-52` (208px) continuam abaixo de 7px. [VERIFIED: paths em `focusRegions.ts` + classes em `PatientFocusAreasPanel.tsx`]

Cada parte distal (palma, mão, pé, tornozelo) precisa de altura própria de pelo menos 28 unidades de viewBox (~20px em `h-44`) para o hover de 500ms acertar. Encurtar Braço/Antebraço e Canela/Panturrilha para abrir esse espaço. O cotovelo é só o encontro dos dois paths, sem path próprio. Sem faixa entre Canela e Pé.

Paths fechados, sem sobrepor hit-test, `pointerEvents="fill"`, fill real (nunca `fill="none"`). Comandos só `M`, `L`, `H`, `V`, `C`, `Z`, os mesmos já usados nos paths atuais que o PDF desenha. Sem arco `A`. [ASSUMED: pdf-lib rejeita arco; o desenho atual não usa arco e o PDF já chama `drawSvgPath` com esses comandos.]

Manter `viewBox="0 0 140 240"` e as classes `h-44 w-auto sm:h-52`. O PDF usa `scale = mapHeight / 240` com `mapHeight = 150`. Mudar o viewBox desloca todas as marcas do PDF.

### Pattern 4: Scroll é o foco, não o desenho

**What:** Selecionar (hover 500ms + clique na abinha) não move `.panel-scroll`.
**When to use:** No painel de áreas de foco. O mesmo guarda de foco no `BodyMapPicker`, sem trocar o clique-direto da avaliação pela abinha.

Fatos do código atual:

1. Cada path com `canWrite` tem `tabIndex={0}`.
2. `onPointerDown` já chama `preventDefault` no path.
3. `onFocus` chama `preservePanelScroll`, que lê `scrollTop` e o regrava no `requestAnimationFrame`.
4. A abinha é um `<button>` sem `preventDefault` no pointer. O clique foca o botão.
5. O `<svg>` tem `overflow="hidden"` e a classe `overflow-hidden`.

O default de `SVGElement.focus()` e de `HTMLElement.focus()` rola o elemento para a vista. `preventScroll: true` é o que desliga isso, e só vale na chamada que o código faz. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/focus] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus]

A rolagem do foco sequencial (Tab) e do clique acontece antes do handler `focus`. Ler `scrollTop` nesse handler captura a página já rolada. Apagar `preservePanelScroll`. Não estender esse helper.

Fazer, nesta ordem:

1. No `pointerdown` do path, manter `preventDefault()` para o clique não mover o foco para o path. A MDN diz que `preventDefault` no mousedown é o que impede o foco de sair quando se chama `focus()` a partir desse handler; o mesmo `preventDefault` no pointerdown do path evita o foco-por-clique. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/focus]
2. No `pointerdown` da abinha, `preventDefault()` para o clique em “Marcar/Desmarcar” não focar o botão. O `click` continua e chama `toggle.mutate`.
3. Paths ficam `tabIndex={-1}` quando `canWrite` (programáticos, fora da ordem de Tab). Um único tab stop no wrapper da figura (`tabIndex={0}` só se `canWrite`). Setas ou o hover chamam `path.focus({ preventScroll: true })`. Escape continua com `preventScroll: true`, como já está.
4. Se a abinha precisar de foco para teclado, `chipRef.current.focus({ preventScroll: true })` depois de posicionar. Nunca `focus()` sem essa opção.
5. Tirar `overflow="hidden"` e a classe `overflow-hidden` do `<svg>`. A folha de estilo do UA já deixa `<svg>` inline com overflow hidden; CSS `overflow` ganha do atributo. [CITED: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/overflow] Usar `overflow-visible` no svg para ele não ser um scrollport. Manter `[overflow-anchor:none]` no grupo. Não portar a abinha.
6. Prova manual: com o card fora do topo de `.panel-scroll`, hover 500ms e clique na abinha de uma palma e de um pé. `document.querySelector('.panel-scroll').scrollTop` igual antes e depois. Repetir no mapa da avaliação (clique no path).

Se depois desses seis passos a página ainda rolar, aí sim substituir o hit-test: paths só visuais (`tabIndex` ausente, `pointerEvents="none"` no path de pintura) e botões HTML posicionados pelo `getBBox()` de cada região, cada um com `onPointerDown` → `preventDefault` e ativação no `click`. Esse é o “boneco substituído” de D-07. Um desenho novo com `tabIndex={0}` no path repete o bug.

Não aplicar esse modelo de botões se o passo 1–5 já deixar `scrollTop` estável.

### Pattern 5: SQL só apaga as 8 keys

**What:** Um `DELETE` com lista explícita. Sem `ALTER` da constraint, sem policy, sem `UPDATE` das linhas que ficam.
**When to use:** Script único, idempotente, executado pelo humano no SQL Editor.

A constraint `patient_focus_areas_region_key_format` já é `region_key is null or region_key ~ '^(front|back)\.[a-z0-9_]+$'`. `front.upper_arm_l`, `front.palm_l`, `back.ankle_r` casam. Não enumerar as 42 keys no CHECK. O Zod continua sendo o cadeado do catálogo. [VERIFIED: `06-patient-focus-region-key.sql`]

O comentário inicial segue o arquivo da fase 18: a frase `não use supabase db push` aparece como aviso em comentário SQL, não como linha de shell.

Não usar `LIKE '%arm%'` nem `LIKE '%leg%'`. `upper_arm` contém `arm`. A lista `IN` é exatamente as 8 strings de D-06.

Não mexer em `ficha` JSON. `evaluationFicha.schema.ts` guarda `regionKey` como string livre. `BodyMapPicker`, `EvaluationFichaDetail` e o PDF ignoram key que não está em `FOCUS_REGIONS`. A marca antiga de braço/perna na avaliação deixa de desenhar e não é repartida. Reescrever o JSON clínico não está em D-06.

Não editar o twin da fase 11. O deploy vigente da função é o twin da fase 13 (`.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`), que ainda lista as 30 keys e as injeta no prompt. Atualizar esse `Set` para as 42 keys e o humano faz o deploy da função no Dashboard. Enquanto o deploy não acontece, `applyAiFocusRegionKeys` usa `focusRegionKeySchema.safeParse` e descarta key desconhecida, então a função velha não reinsere `front.arm_l`. [VERIFIED: `patientAi.service.ts` e o twin da fase 13]

### Anti-Patterns to Avoid

- **Reusar `*.arm_*` ou `*.leg_*`:** a marca velha passaria a significar outra parte.
- **Restaurar `scrollTop` dentro de `onFocus`:** grava o salto.
- **Portal da abinha:** a fase 6 tirou o portal por causa de scroll fantasma. O comentário no painel ainda diz isso.
- **`supabase db push`:** não entra no plano, nem como comando comentado para o executor rodar.
- **CHECK com a lista das 42 keys:** a fase 6 deixou o catálogo no Zod de propósito.
- **Paths com arco ou viewBox diferente:** o PDF escala 240 e desenha o `d` cru.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Silhueta clicável | Widget Jotform / lib de body-map | `<path>` no catálogo existente | D-08 e fase 6. |
| Impedir scroll | Ler e gravar `scrollTop` no `focus` | `preventDefault` no pointerdown + `focus({ preventScroll: true })` | A API já existe e o helper atual lê tarde demais. [CITED: MDN `SVGElement.focus`] |
| Catálogo no banco | Enum SQL das 42 keys | `z.enum(FOCUS_REGION_KEYS)` + CHECK de formato já existente | Keys novas já passam no regex. |
| Repartir marca antiga | Script que copia `front.arm_l` para braço+antebraço+mão | `DELETE` das 8 keys | D-06. |
| Segunda lista de keys no client | Copiar o tuple em `patient.schema.ts` | Import do tuple | Já é assim. O único espelho extra é o `Set` da Edge Function, que não importa de `src/`. |

**Key insight:** O desenho novo não corrige o scroll. O foco corrige o scroll. O desenho novo existe porque a mão e o pé atuais não cabem como região.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `public.patient_focus_areas.region_key` pode ter as 8 keys de D-06. Linhas com as outras keys, e linhas com `region_key` null, permanecem. | `DELETE` só das 8 keys (data migration no SQL Editor). Sem backfill e sem repartir. |
| Stored data | `ficha.sintomas.mapa.marks[].regionKey` no JSON da avaliação pode repetir as mesmas 8 strings. Não é coluna. | Nenhuma escrita. O renderer descarta key fora do catálogo. Não repartir. |
| Live service config | Edge Function `patient-ai-summary` no hosted Supabase tem o `Set` de 30 keys (fonte no git: twin da fase 13). Não está no client. | Atualizar o twin e deploy humano da função. Não é SQL. Até o deploy, o client ignora key fora do enum. |
| OS-registered state | Nenhum. Verificado: a key não aparece em unit de serviço, agendador ou plist neste repo. | Nenhuma. |
| Secrets/env vars | Nenhum nome de secret ou env usa `front.arm_l` ou `region_key`. | Nenhuma. |
| Build artifacts | Nenhum pacote instalado carrega o catálogo. O PDF e o painel leem o fonte. | `npm run typecheck` depois da edição. Sem reinstall. |

## Common Pitfalls

### Pitfall 1: O restore de scroll trava o salto

**What goes wrong:** A página desce ao marcar e não volta.
**Why it happens:** `preservePanelScroll` amostra `scrollTop` no `onFocus`, depois da rolagem default. O `rAF` grava esse valor.
**How to avoid:** Remover o helper. Impedir o foco de rolar, como no Pattern 4.
**Warning signs:** `scrollTop` muda no clique da abinha mesmo com o card já visível.

### Pitfall 2: Mão e pé invisíveis como alvo

**What goes wrong:** A região existe no catálogo e o hover não acerta.
**Why it happens:** Fatiar o path atual deixa a mão com ~4px.
**How to avoid:** Paths novos com a parte distal ≥ 28 unidades de viewBox, tronco intacto.
**Warning signs:** A abinha da palma só abre se o cursor está num traço de poucos pixels.

### Pitfall 3: Esquerda espelhada na vista de costas

**What goes wrong:** “Braço esquerdo” nas costas marca o lado direito do paciente.
**Why it happens:** Copiar o path `front.*_l` para `back.*_l`.
**How to avoid:** Costas `*_l` na faixa x da frente `*_r`.
**Warning signs:** Ombro esquerdo (path antigo) e braço esquerdo novo não se tocam.

### Pitfall 4: `LIKE` apaga `upper_arm`

**What goes wrong:** O `DELETE` some com as marcas novas se rodar de novo.
**Why it happens:** `upper_arm` contém `arm`.
**How to avoid:** `IN` com as 8 strings exatas. O script pode rodar de novo e só zera essas keys.
**Warning signs:** Contagem de `front.upper_arm_l` cai depois do script.

### Pitfall 5: PDF quebra no typecheck ou marca no lugar errado

**What goes wrong:** `BODY_MAP_CENTROIDS` é `Record<FocusRegionKey, {x,y}>`. Key nova sem centroid não compila. Centroid velho de `front.arm_l` não existe mais.
**Why it happens:** O mapa é exaustivo.
**How to avoid:** Uma entrada por key nova, dentro do path, no espaço do viewBox (Y para baixo). Centros atuais das regiões que não mudam permanecem.
**Warning signs:** `npm run typecheck` aponta `patientAiPdf.service.ts`.

### Pitfall 6: IA continua oferecendo a key morta

**What goes wrong:** O resumo pede `front.arm_l` e nada é marcado.
**Why it happens:** O prompt da função lista o catálogo velho; o client rejeita a key.
**How to avoid:** Atualizar o `Set` do twin da fase 13 e fazer deploy. Não tratar isso como `db push`.
**Warning signs:** A função ainda contém `front.arm_l` no `Set`.

### Pitfall 7: Aceite do REQ-30 lido como “não apagar nada”

**What goes wrong:** O plano preserva `front.arm_l` para “continuar visível”.
**Why it happens:** O aceite 5 do REQ-30 diz que o que já está salvo continua visível. D-06, posterior e travado, manda apagar só as 8 keys e manter o resto.
**How to avoid:** Visível = regiões que não mudam. As 8 keys somem e não viram três marcas.
**Warning signs:** O SQL não tem `DELETE`, ou tem `UPDATE` que reparte.

## Code Examples

### Foco sem rolar

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/focus
path.focus({ preventScroll: true })
```

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
chip.focus({ preventScroll: true })
```

O `pointerdown` da abinha e do path chamam `event.preventDefault()` antes disso, para o clique não disparar o foco default (que rola).

### DELETE no SQL Editor

```sql
-- REQ-30 boneco de área de foco. D-06.
-- Idempotente. O operador cola este arquivo no SQL Editor do Supabase e executa uma vez.
-- Aviso ao operador: não use supabase db push.
--
-- Apaga só as marcas das chaves que deixam de existir.
-- Não reparte a marca antiga nas partes novas.
-- Não apaga coxa, joelho, ombro nem as outras regiões.
-- Não altera patient_focus_areas_region_key_format.
-- Não DROP POLICY. Não CREATE TABLE. Não SET NOT NULL.

delete from public.patient_focus_areas
where region_key in (
  'front.arm_l',
  'front.arm_r',
  'back.arm_l',
  'back.arm_r',
  'front.leg_l',
  'front.leg_r',
  'back.leg_l',
  'back.leg_r'
);
```

Prova no SQL Editor, depois do Success:

```sql
select region_key, count(*)
from public.patient_focus_areas
where region_key in (
  'front.arm_l', 'front.arm_r', 'back.arm_l', 'back.arm_r',
  'front.leg_l', 'front.leg_r', 'back.leg_l', 'back.leg_r'
)
group by region_key;
-- esperado: zero linhas
```

Uma key que permanece (`front.head`, `front.thigh_l`, `back.knee_r`) continua selecionável. Policies `patient_focus_areas_select/insert/update/delete` continuam as da fase 3.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `element.focus()` sempre rola | `focus({ preventScroll: true })` em `SVGElement` e `HTMLElement` | SVGElement.focus com options desde abril de 2018; `preventScroll` no Chrome 78+, Firefox 68+, Safari 15+ | O projeto não suporta IE. Usar a opção. [CITED: MDN SVGElement.focus; Can I use `mdn-api_svgelement_focus_options_preventscroll_parameter`] |
| Catálogo de 30 keys (braço e perna inteiros) | 42 keys, sem as 8 | Esta fase | Zod, PDF e a função de IA acompanham o tuple. |

**Deprecated/outdated:**

- `preservePanelScroll` neste painel: não desfaz o scroll-into-view.
- Keys `front.arm_*`, `back.arm_*`, `front.leg_*`, `back.leg_*`: saem do catálogo e das linhas.
- A nota da UI-SPEC da fase 6 que proibia `front.hand_*` e `front.foot_*`: a fase 19 reabre mão e pé com as keys da tabela (palma na frente, mão nas costas, pé só na frente, tornozelo só nas costas). Não reintroduzir `back.head`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Paths novos devem evitar o comando de arco `A` porque o `drawSvgPath` do pdf-lib pode não desenhar arco. Os paths atuais usam só `M` `L` `H` `C` `Z` e o PDF já os desenha. | Pattern 3 | Um arco no path novo some ou quebra a página do PDF. Ficar nos comandos já usados elimina o risco. |

**If this table is empty:** não se aplica — há uma claim assumida.

## Open Questions

1. **O salto some com o guarda de foco, ou ainda exige hit-test em HTML?**
   - What we know: o helper atual não pode funcionar, e a API `preventScroll` é o mecanismo padrão. O tamanho do path não é a causa do scroll.
   - What's unclear: não houve reprodução no browser nesta pesquisa.
   - Recommendation: implementar o Pattern 4 primeiro, no mesmo PR dos paths novos. A prova é o `scrollTop`. Só partir para botões HTML se essa prova falhar. Não bloquear o plano nessa dúvida.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | typecheck | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| TypeScript | `npm run typecheck` | ✓ | 5.8.3 | — |
| SQL Editor do Supabase | DELETE das 8 keys | humano, fora desta máquina | — | Sem fallback. O plano para no checkpoint humano, como a fase 6. |
| Edge Function deploy | catálogo da IA | humano | twin fase 13 no git | O client já ignora key desconhecida. O silhueta não espera o deploy. |

**Missing dependencies with no fallback:**

- Nenhum para o código. O `DELETE` só vale depois que o humano cola o script.

**Missing dependencies with fallback:**

- Deploy da Edge Function: até lá a IA não marca as regiões novas; também não reinsere as keys apagadas.

## Validation Architecture

Nyquist deste projeto: `npm run typecheck` mais a prova no SQL Editor. Não há Vitest (`package.json` não tem script de teste; `TESTING.md` manda não automatizar RLS).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript 5.8.3 (`tsc --noEmit`). Sem Vitest. |
| Config file | `tsconfig.json` (script `typecheck` em `package.json`) |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-30.1 | Cada divisão do braço é uma key do catálogo e o painel a desenha | typecheck | `npm run typecheck` | ✅ `src/lib/focusRegions.ts` (a editar) |
| REQ-30.2 | Pé, canela, panturrilha e tornozelo são keys distintas; sem `*.leg_*` | typecheck | `npm run typecheck` | ✅ mesmo catálogo |
| REQ-30.3 | Clicar a abinha não muda `scrollTop` de `.panel-scroll` | manual | Prova no browser descrita no Pattern 4. Sem comando automatizado. | ❌ manual-only — não há harness de browser |
| REQ-30.4 | Se o guarda de foco falhar, hit-test passa a botões HTML | manual | Mesma prova de `scrollTop` | ❌ manual-only |
| REQ-30.5 | 8 keys com zero linhas; keys que permanecem intactas | SQL Editor | Query de contagem do Code Examples, colada pelo humano | ✅ script a criar em `sql/19-focus-region-retire.sql` |
| REQ-30 PDF | `BODY_MAP_CENTROIDS` cobre toda `FocusRegionKey` | typecheck | `npm run typecheck` | ✅ `patientAiPdf.service.ts` |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck`
- **Phase gate:** typecheck verde, mais o humano confirma o `DELETE` (zero linhas nas 8 keys) e o `scrollTop` estável ao marcar palma e pé

### Wave 0 Gaps

- None — o typecheck já existe. Não instalar Vitest. O script SQL é tarefa da fase, não infra de teste.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Sessão Supabase já existente. Esta fase não mexe em login. |
| V3 Session Management | no | Sem cookie novo. |
| V4 Access Control | yes | Policies `patient_focus_areas_*` da fase 3 permanecem. O toggle continua atrás de `can_write_patient`. O `DELETE` roda no SQL Editor (role do operador), não vira RPC nem botão no client. `canWrite === false` continua sem abinha e sem `tabIndex`. |
| V5 Input Validation | yes | `focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)` antes do INSERT. CHECK de formato já rejeita key fora de `^(front\|back)\.[a-z0-9_]+$`. Não aceitar label livre. |
| V6 Cryptography | no | Sem segredo novo. |

### Known Threat Patterns for this change

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `DELETE` amplo que apaga todas as áreas de foco | Tampering / Denial | Lista `IN` com as 8 strings. Sem `LIKE`. Sem `DELETE` sem `WHERE`. |
| Reinserir `front.arm_l` pelo client ou pela IA | Tampering | A key sai do enum. `safeParse` descarta. CHECK de formato sozinho não impede a string antiga (ela ainda casa no regex); o enum é quem impede a reinserção pelo app. |
| Marcar região na ficha de colega | Elevation | RLS existente. Não recriar policy. |
| Key desconhecida no mapa da avaliação | Tampering | Renderer ignora key fora de `FOCUS_REGIONS`. O schema da ficha continua string livre de propósito (save parcial). Não apertar esse schema nesta fase. |

## Sources

### Primary (HIGH confidence)

- `src/lib/focusRegions.ts` — 30 keys, paths, lateralidade, labels
- `src/components/patients/PatientFocusAreasPanel.tsx` — hover 500ms, abinha, `preservePanelScroll`, `overflow-hidden`
- `src/components/layout/AppShell.tsx` — `.panel-scroll` é o scroller (`lg:overflow-y-auto`)
- `src/services/patients.service.ts` — `togglePatientFocusArea`, mapper que pula key desconhecida
- `src/schemas/patient.schema.ts` — `z.enum(FOCUS_REGION_KEYS)`
- `src/services/patientAiPdf.service.ts` — `BODY_MAP_CENTROIDS` exaustivo e `drawSvgPath`
- `src/components/patients/evaluation/BodyMapPicker.tsx` — mesmo catálogo, `tabIndex={0}`, não grava `patient_focus_areas`
- `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` — CHECK e índice único parcial
- `.planning/phases/18-minha-conta/sql/18-account.sql` — forma do aviso no comentário SQL
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` — `Set` das 30 keys no prompt
- [MDN SVGElement.focus](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement/focus) — default rola; `preventScroll: true` não rola
- [MDN HTMLElement.focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) — o mesmo para o botão da abinha
- [MDN SVG overflow](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/overflow) — CSS overflow ganha do atributo; `hidden` recorta o viewport SVG

### Secondary (MEDIUM confidence)

- [Can I use: SVGElement focus preventScroll](https://caniuse.com/mdn-api_svgelement_focus_options_preventscroll_parameter) — Chrome 78+, Firefox 68+, Safari 15+. Lido via busca em 2026-09-24.

### Tertiary (LOW confidence)

- Nenhuma decisão do plano depende de fonte terciária. O suporte de arco no `drawSvgPath` está no Assumptions Log, não aqui como fato.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — nenhum pacote novo; versões do `package.json` e do `tsc` local
- Architecture: HIGH — catálogo, toggle, PDF, CHECK e lateralidade lidos no fonte
- Pitfalls: HIGH para o scroll (o helper lê `scrollTop` tarde demais, confirmado no fonte + MDN) e para o tamanho da mão (medido nos paths). LOW só para arco no pdf-lib (A1)

**Research date:** 2026-09-24
**Valid until:** 2026-10-24 (domínio estável; sem lib nova)

Graphify: desligado (`graphify is not enabled`). Sem contexto de grafo.
