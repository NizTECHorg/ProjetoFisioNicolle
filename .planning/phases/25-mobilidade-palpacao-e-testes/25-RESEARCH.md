# Phase 25: Mobilidade, palpação e testes - Research

**Researched:** 2026-10-05
**Domain:** Blocos B e E da página 04 · Avaliação e plano (`ficha` jsonb) — mobilidade por região, achado de palpação, testes pesquisáveis
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Mobilidade por região
- O bloco B organiza por região e, dentro dela, pelos movimentos dessa região. Não é uma lista solta de movimentos digitados.
- O profissional escolhe uma região. Os movimentos dessa região aparecem com um checkbox à esquerda. Só o movimento marcado abre a linha de medida. A tela não lista os campos de todos os movimentos de uma vez.
- Dá para acrescentar outra região (`Adicionar outra região`). Cada região escolhida tem o próprio bloco.
- Catálogo de regiões e movimentos, nesta ordem, fechado. Não inventar movimento fora da lista.

### Tipo e comparação
- No topo de cada região, não em três checkboxes globais do bloco:
  - Tipo de avaliação: Ativo, Passivo, Ambos (uma escolha).
  - Comparação: Bilateral, Unilateral (uma escolha).
- Os checkboxes atuais Movimento ativo, Movimento passivo e Comparação bilateral saem. Eles contradizem a escolha por região.
- Bilateral e unilateral não escondem direito nem esquerdo. Os dois lados continuam no mesmo campo.

### Direito, esquerdo e valor
- Direito e esquerdo ficam no mesmo campo do movimento, como D e E. Não são dois formulários.
- O valor não é só número. Aceita graus (exemplo `110°`) ou um destes rótulos: Completo, Limitado, Não avaliado. Grau não é obrigatório.
- A leitura compacta junta os lados. Exemplo: `Flexão  D 110°  E 115°`. Com dor: `Dor E 90°`. Frase de exemplo travada: `Flexão de quadril: ADM 115° → dor inicia aos 90°`.

### Dor do movimento
- A dor não é um texto único nem um checkbox que só diz que doeu.
- No mesmo campo do movimento há D e E. Clicar no lado abre um painel pequeno daquele lado:
  - Início da dor (graus)
  - Dor máxima (`/10`)
  - Observação
- Cada lado tem o próprio painel. Marcar D não preenche E.

### Palpação
- O texto livre Palpação relevante sai. No lugar, um formulário de um achado e, abaixo, a lista dos achados já registrados (editar e remover).
- Campos do achado, nesta ordem: Região, Local/estrutura, Lado, Achado, Dor (0–10), Observação.
- Primeiro a região. Local/estrutura mostra só as opções daquela região, com busca, e Outro para digitar. Instrução visível embaixo do campo: `Primeiro selecione a região. Local/estrutura mostra só as opções dessa região, com busca e Outro para digitar.`
- Lado: Direito, Esquerdo, Bilateral, Central, Não se aplica.
- Achado (uma escolha, chips): Sem alteração, Doloroso, Edema, Tensão aumentada, Crepitação, Alteração de temperatura, Outro.
- A estrutura visual segue a imagem de referência (formulário em cima, tabela de achados embaixo, botão para adicionar outro). As cores são as do Fluxo, não o tema escuro da imagem.
- Teste funcional / medida de desempenho e Resultado inicial permanecem como estão. Não viram catálogo nesta fase.

### Testes clínicos
- O texto livre Testes clínicos selecionados sai. O campo Teste é uma lista pesquisável. Dá para marcar vários. Outro fica sempre por último em cada região.
- Não é grade de cards. A imagem de coluna vale como referência de agrupamento e de busca, não como layout de cartão.
- Além do catálogo escrito, entram os testes da imagem de coluna que o texto não repetiu: Lasègue cruzado, Valsalva, Schober, Compressão axial e Distração (sinais não orgânicos / Waddell). Distração de Waddell não é a distração cervical.
- Não inventar aba Fraturas nem testes de fratura. A imagem mostra a aba sem lista.

### Leitura e export
- A leitura da ficha, o catálogo de export e o PDF do bloco B e do bloco E mostram a mesma região, o mesmo movimento com D/E e dor, o mesmo achado e os mesmos testes. Não continuam imprimindo só o texto livre antigo.
- Ficha antiga não perde o que já foi digitado e não copia um valor para todos os movimentos. O que não der para atribuir a um item do catálogo fica como registro anterior.

### Claude's Discretion
- Como gravar no jsonb e como o preprocess reconhece uma linha antiga cujo movimento coincide com o catálogo.
- Se o painel de dor abre inline ou num popover, desde que caiba no campo e mostre início, dor máxima e observação daquele lado.
- O texto curto de resultado de um teste marcado, desde que a lista pesquisável e o Outro existam. Não recriar o parágrafo único de testes.
- Espaçamento e tipografia, desde que sigam o contrato visual da fase quando ele existir.

### Deferred Ideas (OUT OF SCOPE)
- Aba Fraturas e qualquer teste que a imagem não listou
- Redesenho do bloco C (Força), do bloco D (neurológico como exame) e dos blocos F e G
- Catálogo para Teste funcional / medida de desempenho e Resultado inicial
- Publicar a função de resumo ou gerar SQL
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-36 | No bloco B o profissional escolhe a região, marca só os movimentos dela e preenche D e E no mesmo campo, com a dor de cada lado. No bloco E a palpação vira achados e os testes viram lista pesquisável. Leitura, PDF e catálogo mostram a mesma coisa. | Catálogo fechado num módulo puro. `z.preprocess` na leitura e no save. Formatadores únicos para detalhe, `04.B` / `04.E` e o draw do PDF. Busca com `<input type="search">` e `<ul>` nativo. Sem SQL e sem pacote novo. |
</phase_requirements>

## Summary

Os blocos B e E da página 04 ainda são texto. B é `mobilidade.linhas[]` (`movimento`, `direito`, `esquerdo`, `dor`, `observacao`) mais três booleanos globais (`ativo`, `passivo`, `bilateral`). E é cinco strings, das quais esta fase troca só `palpacao` e `testesClinicos`. `resultados`, `testeFuncional` e `resultadoInicial` ficam. A força (bloco C) continua a tabela que já existe.

A gravação continua em `patient_evaluations.ficha` jsonb. O Zod 3.25.76 do projeto apaga chaves desconhecidas no `safeParse` de `resolveEvaluationFicha` e de `toRow`. Sem `preprocess`, o próximo save apaga `linhas` / `palpacao` / `testesClinicos`. Se o schema novo exigir objeto e a ficha antiga ainda trouxer string, o `safeParse` falha e a ficha inteira deixa de abrir e de salvar. A normalização tem de ser pura, nunca lançar, e devolver só o que o schema novo aceita. Linha ambígua (a palavra `Flexão` existe em cinco regiões) vai para registro anterior. Não se copia um valor para todos os movimentos.

**Primary recommendation:** Um módulo `src/lib/mobilidadePalpacao.ts` com os catálogos copiados de `25-CONTEXT.md`, o `preprocess` e os formatadores. A UI usa `RadioRow`, checkbox nativo e lista filtrada. O painel de dor abre inline no lado clicado. Cada teste marcado ganha um resultado curto opcional. Detalhe, catálogo e PDF consomem as mesmas strings.

## Project Constraints (from phase brief)

Não há `.cursor/rules/` neste repositório. O brief da fase manda:

- Só os blocos B e E da página 04. Blocos A, C, D, F, G e H, e as páginas 01–03, ficam como estão.
- A ficha já é jsonb. Sem SQL e sem `supabase db push`.
- Não editar `patient-ai-summary`. Sem pacote npm novo.
- Leitura, catálogo de export e PDF mostram o que a ficha nova grava.
- UI em português. Esconder escrita quando `readOnly`. O editor da avaliação só monta com `canWrite`.
- Catálogos de `25-CONTEXT.md` fechados. Não encolher, não reordenar, não traduzir rótulo.

O app se chama Fluxo (`package.json` `"name": "fluxo"`). Chips e blocos usam `bg-surface`, `border-line`, `text-ink`, `text-muted`, `bg-accent-soft`, `text-forest`, `accent-forest`. Não copiar o tema escuro das imagens de referência.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Região, movimento, D/E, dor, achado, busca de teste | Browser / Client | — | Tudo em `EvaluationPage04`. Não há endpoint novo. |
| Validar e migrar jsonb antigo | Browser / Client | — | `evaluationFichaSchema.safeParse` já roda na leitura e no `toRow`. O `preprocess` mora nesse schema. |
| Persistir | Database / Storage | Browser / Client | Coluna `ficha jsonb` já existe. O cliente grava o objeto parseado. Sem migração SQL. |
| Leitura da ficha | Browser / Client | — | `EvaluationFichaDetail` hoje imprime `palpacao` e `testesClinicos` como string e não lista mobilidade. |
| Catálogo `04.B` / `04.E` e PDF | Browser / Client | — | `pdfFieldCatalog.ts` e `patientAiPdf.service.ts` leem a `EvaluationFicha` já parseada. |
| Coluna texto `tests` | Browser / Client | — | `patient-ai-summary` faz `select` dessa coluna e não lê `ficha`. O espelho no submit continua string. A função não se edita. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 3.25.76 (instalado) | Schema da ficha + `preprocess` da forma antiga | Já valida `ficha` no save e na leitura. Não subir para Zod 4. |
| react-hook-form | 7.81.0 | `useFieldArray` das regiões e dos achados, `RadioRow`, `register` | Já liga a página 04. `shouldUnregister: false` no editor. |
| @hookform/resolvers | 5.4.0 | `zodResolver(evaluationFormSchema)` | Já usado. Sem resolver novo. |
| pdf-lib | 1.17.1 | Draw dos blocos B e E | Já desenha a página 04. Sem lib de PDF nova. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | — | Nenhum pacote novo. Busca, chips e painel de dor são HTML nativo. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<input type="search">` + `<ul>` | Combobox / cmdk / downshift | Proibido: pacote novo, e o brief pede filtro + lista nativa. Não existe combobox em `src/`. |
| Painel de dor inline | Popover | Não existe `Popover` em `src/`. Portal exigiria pacote ou posicionamento à mão. Inline cabe no campo. |
| `z.preprocess` | `UPDATE` SQL do jsonb | O brief proíbe SQL e `supabase db push`. A leitura já parseia. |

**Installation:**

```bash
# nenhum pacote — zod, react-hook-form e pdf-lib já estão no projeto
```

**Version verification:** `npm ls zod react-hook-form pdf-lib @hookform/resolvers --depth=0` → zod@3.25.76, react-hook-form@7.81.0, pdf-lib@1.17.1, @hookform/resolvers@5.4.0. `node` v26.4.0, `npm` 12.0.2. [VERIFIED: npm ls neste workspace]

## Package Legitimacy Audit

Nenhum pacote novo. O protocolo de slopcheck não se aplica. Não rodar `npm install`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | Nenhum install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Locked catalog sizes

Copiar as listas de `<specifics>` em `25-CONTEXT.md` para o módulo, na mesma ordem, com o mesmo rótulo. Um teste de contagem falha se um item sumir. Contagem feita lendo esse arquivo nesta sessão. [VERIFIED: parse de `25-CONTEXT.md`]

| Catálogo | Regiões | Itens | Trava |
|----------|---------|-------|-------|
| Mobilidade | 13 | 71 movimentos | 6, 6, 6, 8, 2, 2, 4, 13, 6, 2, 4, 6, 6 |
| Palpação (local/estrutura) | 20 | 192 opções, `outro` incluso em cada região | A linha `Outra: outro (digitação manual)` é uma opção só, rótulo `outro`. O parêntese não é nome de estrutura. |
| Testes | 12 | 120, e o último de cada região é `Outro` | Lombar inclui `Lasègue cruzado (contralateral)`, `Valsalva`, `Schober`, `Compressão axial`, `Distração (sinais não orgânicos / Waddell)`. Não existe região Fraturas. |

`O’Brien` no ombro usa apóstrofo curvo U+2019 (`4f 2019 42 72 69 65 6e`). Não trocar por `'`. [VERIFIED: code point no CONTEXT.md]

`PIP` e `DIP` na mão são itens separados, não um único “articulações MCP, PIP, DIP”.

## Architecture Patterns

### System Architecture Diagram

```text
Página 04 bloco B                         Página 04 bloco E
região + checkbox de movimento            achado (região → local filtrado)
tipo / comparação por região              lista de testes (busca + ul)
D/E + painel de dor inline                resultado curto só se marcado
        │                                          │
        └──────── useFieldArray / setValue ────────┘
                            │
                            ▼
              evaluationFichaSchema.safeParse
              preprocess (não lança, idempotente)
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
   toRow grava ficha    detalhe / 04.B     PDF draw 04.B
   coluna tests =       e 04.E usam o      e 04.E usam o
   string formatada     mesmo formatador   mesmo formatador
```

Ficha antiga entra no mesmo `preprocess`: linha com movimento único vira um movimento marcado; linha ambígua ou parágrafo solto vira `registroAnterior`. O banco não muda até o próximo save.

### Recommended Project Structure

```text
src/lib/mobilidadePalpacao.ts          # catálogos, normalize, formatadores
src/lib/mobilidadePalpacao.test.ts     # REQ-36 e legado
src/schemas/evaluationFicha.schema.ts  # preprocess em mobilidade e palpacaoTestes
src/components/patients/evaluation/EvaluationPage04.tsx  # só blocos B e E
src/components/patients/evaluation/EvaluationFichaDetail.tsx
src/lib/pdfFieldCatalog.ts             # só 04.B e 04.E
src/services/patientAiPdf.service.ts   # só o draw 04.B e 04.E
src/components/patients/PatientEvaluationEditorForm.tsx  # espelho string da coluna tests
src/components/patients/PatientEvaluationPanel.tsx       # draft do PDF de IA → registro anterior
src/services/evaluations.service.ts    # legacyToFicha grava no campo novo, não numa string
```

Não criar rota, tabela nem componente de força. `ForcaTable` permanece.

### Pattern 1: Forma jsonb (decisão de gravação)

**What:** Dois objetos sob `avaliacaoPlano`, chaves estáveis em ASCII, rótulos só no catálogo.
**When to use:** Save, releitura, detalhe, catálogo, PDF.

```ts
mobilidade: {
  regioes: Array<{
    regiao: RegiaoMobilidadeKey
    tipo?: 'ativo' | 'passivo' | 'ambos'
    comparacao?: 'bilateral' | 'unilateral'
    movimentos: Array<{
      movimento: string
      valorDireito?: string
      valorEsquerdo?: string
      dorDireito?: { inicio?: string; maxima?: number; observacao?: string }
      dorEsquerdo?: { inicio?: string; maxima?: number; observacao?: string }
      observacao?: string
    }>
  }>
  registroAnterior?: string
}

palpacaoTestes: {
  achados: Array<{
    regiao: RegiaoPalpacaoKey
    local: string
    localOutro?: string
    lado?: 'direito' | 'esquerdo' | 'bilateral' | 'central' | 'naoSeAplica'
    achado?: 'semAlteracao' | 'doloroso' | 'edema' | 'tensao' | 'crepitacao' | 'temperatura' | 'outro'
    achadoOutro?: string
    dor?: number
    observacao?: string
  }>
  testes: Array<{
    regiao: RegiaoTesteKey
    teste: string
    resultado?: string
    outroTexto?: string
  }>
  palpacaoRegistroAnterior?: string
  testesRegistroAnterior?: string
  resultados?: string
  testeFuncional?: string
  resultadoInicial?: string
}
```

Uma região de mobilidade aparece uma vez. `Adicionar outra região` oferece só as que ainda não estão. Movimento só entra no array se estiver marcado. Desmarcar remove o item. Tipo e comparação ficam na região, não em booleanos globais.

O valor de D/E é texto (`optionalText(80)`), nunca `z.number()`. Os chips escrevem exatamente `Completo`, `Limitado` ou `Não avaliado`. `110°` permanece como o profissional digitou.

Chaves de movimento são únicas dentro da região (`flexao` em ombro e em quadril). O preprocess recusa movimento que não pertence àquela região. Não usar `z.enum` gigante que lance: item inválido sai do array e, se veio de texto legado, vai para o registro anterior. `parse({})` continua válido.

### Pattern 2: Preprocess da linha antiga

**What:** `normalizeMobilidade` e `normalizePalpacaoTestes` rodam dentro de `z.preprocess` antes do strip. [VERIFIED: probe zod@3.25.76 — `z.object` devolve só as chaves do schema; string dentro de objeto faz o parse lançar `Expected object, received string`; `preprocess` que devolve o objeto novo aceita a string.]
**When to use:** Sempre, na borda do schema. A função não lança. Rodar duas vezes devolve o mesmo objeto.

Regras de match do movimento, nesta ordem:

1. Dobrar texto como a fase 24: NFD, tirar marca, minúsculas, espaços colapsados. Apóstrofo curvo vira reto só na comparação.
2. Match exato do rótulo inteiro. Se esse rótulo existe numa região só, atribuir.
3. Segmento depois de ` / ` conta como alias só se continuar único. `extensão lombar` aponta para `Extensão de tronco / extensão lombar`. `extensão` sozinho não, porque colide com Ombro, Cotovelo, Punho, Quadril e Joelho.
4. Composição `{movimento} de {região}` ou `{região} {movimento}` só para o rótulo curto que não traz a região no nome. `Flexão de quadril` → Quadril / Flexão. `Flexão cervical` já é o rótulo único do item, não o curto `Flexão`.
5. `includes` é proibido. `Flexão` não pode casar `Flexão cervical`, `Flexão de tronco`, `Flexão dos dedos`, `Flexão do hálux`, `Flexão do polegar` nem `Flexão plantar`.
6. Se o alias aponta para mais de uma região, a linha inteira vai para `registroAnterior`. Não escolher a primeira. Não criar a região nos dois lugares. Não preencher os outros movimentos da região.

Rótulos de movimento ambíguos (não atribuir sem a região no texto):

| Rótulo | Regiões |
|--------|---------|
| Inclinação lateral direita / esquerda | Cervical, Tronco / coluna |
| Rotação direita / esquerda | Cervical, Tronco / coluna |
| Flexão, Extensão | Ombro, Cotovelo, Punho, Quadril, Joelho |
| Abdução, Adução, Rotação interna, Rotação externa | Ombro, Quadril |
| Flexão / Extensão / Abdução / Adução dos dedos | Mão / dedos, Pé / dedos |

Quando a linha casa:

- `direito` → `valorDireito`, `esquerdo` → `valorEsquerdo`, copiados como texto.
- `dor` e `observacao` antigos vão para `observacao` do movimento, unidos. Não entram no painel de dor: o texto velho não diz o lado.
- A região criada recebe `tipo` só a partir dos booleanos globais daquela ficha: os dois verdadeiros → `ambos`; só ativo → `ativo`; só passivo → `passivo`. `bilateral: true` → `comparacao: 'bilateral'`. Ausente ou falso não vira `unilateral`.
- Esses tipo e comparação aplicam-se só às regiões que receberam movimento. Não abrir região vazia por causa do checkbox.

Quando a linha não casa, uma frase só, pulando pedaço vazio: `{movimento} · D {direito} · E {esquerdo} · Dor {dor} · {observacao}`. Várias linhas, unidas por `\n`, em `registroAnterior` (teto 4000). Se não houve linha casada e sobrou checkbox global, acrescentar `Movimento ativo`, `Movimento passivo` e/ou `Comparação bilateral` nesse registro, para o booleano não sumir no strip.

Palpação antiga: a string inteira vai para `palpacaoRegistroAnterior`. Não inventar achado.

Testes antigos: quebrar por `\n` e `;`. A linha inteira, depois do trim, só vira teste marcado se o rótulo dobrado for único no catálogo. Resultado fica vazio. Linha ambígua ou frase (`Schober: 5 cm`) fica no `testesRegistroAnterior`. Não procurar o nome no meio do parágrafo. Não marcar `SLR` a partir de `SLR / Lasègue` nem o contrário: são rótulos diferentes.

Testes cujo rótulo existe em duas regiões (não auto-atribuir): `PA central`, `PA unilateral`, `Slump`, `Femoral Nerve Stretch`, `Valgo stress test`, `Varo stress test`, `Gaveta anterior`.

`Distração cervical`, `Distração (sinais não orgânicos / Waddell)`, `Teste de distração` e `Distraction` são quatro rótulos. A palavra solta `distração` não marca nenhum.

Forma já nova: sanitizar chaves, dropar movimento fora da região, manter registros anteriores, ignorar `linhas` / `ativo` / `passivo` / `bilateral` / `palpacao` / `testesClinicos` se ainda vierem junto. Não acrescentar de novo ao registro o que já está nas listas.

`legacyToFicha` e o rascunho de PDF em `PatientEvaluationPanel` hoje escrevem string em `testesClinicos`. Passam a escrever `testesRegistroAnterior` com o parágrafo, lista de testes vazia. O componente não pode dar `.map` numa string.

### Pattern 3: Lista nativa com filtro

**What:** `<input type="search">` filtra um `<ul>` de `<label><input type="checkbox"></label>` (testes) ou botões de uma escolha (local/estrutura). Agrupamento com `<fieldset><legend>`.
**When to use:** Local/estrutura da palpação e a lista de testes. Não usar `<select multiple>`: o resultado curto precisa sentar debaixo do item marcado. Não usar `<datalist>`: é um valor só.

O filtro é `fold(label).includes(fold(query))`. Não construir `RegExp` com o texto digitado. Com busca vazia, o catálogo inteiro aparece e `Outro` é o último de cada região. Com busca, a região some se nenhum item dela casa; se algum casa, `Outro` continua por último nessa região. A busca de local só olha a região já escolhida. Trocar a região limpa o local se ele não existir na lista nova.

Instrução visível, literal, debaixo do campo de local: `Primeiro selecione a região. Local/estrutura mostra só as opções dessa região, com busca e Outro para digitar.`

### Pattern 4: Painel de dor inline e resultado curto

**What:** Um botão `Dor` em D e outro em E abre um `<fieldset>` no próprio campo, com início (texto), dor máxima (`EvaField`, 0–10) e observação. Estado de aberto é `useState` local, não vai para o jsonb. D não copia E.
**When to use:** Só no movimento marcado. Em `readOnly`, o fieldset aparece se aquele lado tiver algum dos três valores, com inputs desabilitados.

Resultado do teste: `optionalText(200)` só quando o checkbox está marcado. Não recriar o textarea único. `Resultados relevantes` continua o campo `resultados` que já existe.

### Pattern 5: Uma frase para detalhe, catálogo e PDF

**What:** Funções puras no mesmo módulo. Os três leitores não montam a frase por conta própria.
**When to use:** Sempre que for exibir.

- Compacta: `Flexão  D 110°  E 115°` (dois espaços antes de `D` e antes de `E`). Lado vazio sai. Movimento marcado sem valor fica só o rótulo.
- Dor: `Dor E 90°`. Se `inicio` for só número, o formatador acrescenta `°`. Se já terminar em `°` ou não for número, fica como está.
- Frase travada quando o mesmo lado tem valor e início: `Flexão de quadril: ADM 115° → dor inicia aos 90°`. O `de {região}` só entra se o rótulo do movimento ainda não cita a região (`Flexão cervical` não vira `Flexão cervical de cervical`). Valor `Completo` não ganha `°`.
- Dor máxima: `dor máxima E 7/10` quando o número existe. Observação da dor em seguida.
- Cabeçalho da região: `{Região} · Ativo · Bilateral`, pulando o que estiver vazio.
- Achado: `{Região} · {local ou localOutro} · {lado} · {achado} · dor {n}/10 · {observação}`.
- Teste: `{rótulo}` ou `{rótulo}: {resultado}`. Outro: `Outro: {outroTexto}`.
- Registro anterior com o rótulo `Registro anterior`, igual ao bloco 03.B da fase 24.

`DetailLeaf` devolve `null` para objeto e para array. Passar a string. `whitespace-pre-wrap` já preserva quebra de linha. [VERIFIED: `fichaFormPrimitives.tsx`]

`drawOptionalField` faz `String(value)`. Objeto vira `[object Object]`. Passar a string formatada. [VERIFIED: `patientAiPdf.service.ts`]

`previewFrom` corta em 40 caracteres. O preview do catálogo é a primeira linha; a frase inteira fica no detalhe e no PDF.

O PDF usa fonte WinAnsi. `toWinAnsiSafe` troca `→` (U+2192) por `?` e o apóstrofo curvo de `O’Brien` por `'`. `°` (U+00B0) sobrevive. No draw de 04.B e 04.E, trocar `→` por `->` só na string que entra no draw. O detalhe e o preview no browser mantêm `→`. Não alterar `toWinAnsiSafe`: ele serve o PDF inteiro.

`hasMob` / `hasPalp` passam a ser verdadeiros quando há região, achado, teste marcado ou registro anterior. Senão o bloco some do PDF mesmo com ficha preenchida.

### Anti-Patterns to Avoid

- **Copiar `direito` para todos os movimentos da região** quando o texto é só `Flexão`.
- **Grade de cards** da imagem de coluna.
- **Popover** ou pacote de combobox.
- **Enum que rejeita `110°`** ou `type="number"` no valor do movimento.
- **Esconder D ou E** quando a comparação é unilateral.
- **Editar `patient-ai-summary`**, o bloco C, ou os blocos A, D, F, G, H.
- **SQL / `supabase db push`.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migrar jsonb antigo | `UPDATE`, script, coluna nova | `z.preprocess` no schema que o serviço já chama | A coluna já é jsonb. Um SQL não roda no app, e o brief proíbe push. |
| Busca de teste e de local | cmdk, downshift, fuse.js | `fold` + `includes` + `<ul>` | Pacote novo proibido. O catálogo cabe inteiro na tela. |
| Painel de dor | Popover com portal | `<fieldset>` inline | Não há popover no repo. D e E precisam caber no campo. |
| Dor 0–10 | Slider novo | `EvaField` já existente | `setValueAs` já devolve `undefined` no vazio. O schema já tem `evaScore` 0–10. |
| Tipo / comparação / lado | Checkbox group caseiro | `RadioRow` | Uma escolha, já usado na ficha. |
| Frase de leitura | Três templates copiados | `formatMovimento` / `formatAchado` / `formatTeste` | O aceite exige a mesma frase na leitura, no catálogo e no PDF. |
| Seta no PDF | Mexer na fonte ou em `toWinAnsiSafe` | `->` só na string do draw 04.B / 04.E | U+2192 não existe em WinAnsi. O helper global trocaria em todo o PDF. |

**Key insight:** O risco não é o checkbox. É o `safeParse` único da ficha: ou o preprocess consome a string antiga e devolve só a forma nova, ou o próximo save apaga a medida — ou a ficha inteira deixa de parsear.

## Runtime State Inventory

A fase muda a forma do jsonb já gravado. Não é rename de string solta, mas o dado velho continua no banco até alguém salvar.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `patient_evaluations.ficha` jsonb: `avaliacaoPlano.mobilidade.{linhas,ativo,passivo,bilateral}` e `palpacaoTestes.{palpacao,testesClinicos}` como texto. Colunas texto `tests` e `measurements` continuam. | Código: preprocess na leitura e no save. Sem migração de linhas. `measurements` e `resultados` não mudam de forma. |
| Live service config | Nenhuma. A função de resumo lê a coluna `tests`, não `ficha`. [VERIFIED: `patient-ai-summary/index.ts` select sem `ficha`] | Não editar a função. O submit espelha uma string na coluna `tests`. |
| OS-registered state | Nenhum. | Nenhum. |
| Secrets/env vars | Nenhum nome novo. | Nenhum. |
| Build artifacts | Nenhum pacote instalado com o nome antigo. | Nenhum. |

## Common Pitfalls

### Pitfall 1: O strip apaga a ficha antiga
**What goes wrong:** O profissional reabre, salva, e a mobilidade some.
**Why it happens:** Zod 3.25.76 devolve só as chaves do object schema. `linhas`, `ativo`, `passivo`, `bilateral`, `palpacao` e `testesClinicos` não existem na forma nova.
**How to avoid:** O `preprocess` consome essas chaves e devolve `regioes`, `achados`, `testes` e os registros anteriores.
**Warning signs:** `evaluationFichaSchema.parse` de uma ficha com `linhas` devolve `regioes: []` e sem `registroAnterior`.

### Pitfall 2: String no lugar de objeto derruba a ficha inteira
**What goes wrong:** `safeParse` falha, `resolveEvaluationFicha` cai no legado ou no vazio, e `toRow` lança `Ficha de avaliação inválida`.
**Why it happens:** Probe: objeto esperando objeto rejeita string. `testesClinicos` hoje é string. `draftFromPdf` e `legacyToFicha` ainda atribuem string.
**How to avoid:** O preprocess aceita string, objeto antigo e objeto novo. Os call sites passam a usar o campo de registro anterior no tipo de saída.
**Warning signs:** Uma avaliação antiga não abre depois do deploy, ou o save da página 01 quebra por causa do bloco E.

### Pitfall 3: `Flexão` preenche cinco regiões
**What goes wrong:** Ombro, cotovelo, punho, quadril e joelho nascem com o mesmo grau.
**Why it happens:** O rótulo curto não identifica a região. O aceite proíbe copiar um valor para todos os movimentos.
**How to avoid:** Match exato único, ou região escrita na linha (`Flexão de quadril`). O resto é registro anterior.
**Warning signs:** Teste com a linha `{ movimento: 'Flexão', direito: '110°' }` cria mais de uma região.

### Pitfall 4: Desmarcar não apaga a medida
**What goes wrong:** O movimento sai da tela e volta no PDF.
**Why it happens:** O editor usa `shouldUnregister: false`. Campo desmontado continua no payload.
**How to avoid:** O array só contém movimento marcado. Desmarcar dá `remove` / `setValue`. O preprocess também descarta movimento vazio e movimento fora do catálogo da região.
**Warning signs:** JSON salvo tem movimento cujo checkbox está off.

### Pitfall 5: Leitor recebe objeto
**What goes wrong:** Detalhe em branco, preview `[object Object]`, coluna `tests` `null`.
**Why it happens:** `DetailLeaf` ignora objeto e array. `drawOptionalField` faz `String(objeto)`. `emptyToNull` só aceita string: objeto sem `.trim` vira `''` e a coluna fica `null`. A função de IA deixa de ver os testes.
**How to avoid:** Formatadores devolvem string. O submit faz `tests: formatTestesParaColuna(bloco)` (linhas dos testes marcados mais o registro anterior). Não passar o objeto. Não cair em `values.tests` quando o bloco novo está vazio de propósito: a ficha é a fonte.
**Warning signs:** PDF do bloco E mostra `[object Object]`. Resumo da IA perde testes que a ficha tem.

### Pitfall 6: A seta vira interrogação
**What goes wrong:** O PDF imprime `ADM 115° ? dor inicia`.
**Why it happens:** `toWinAnsiSafe` troca U+2192 por `?`.
**How to avoid:** Detalhe e preview usam `→`. O draw troca por `->` na hora de desenhar.
**Warning signs:** Snapshot do PDF com `?` no meio da frase de quadril.

### Pitfall 7: `Outro` some na busca, ou a distração errada é marcada
**What goes wrong:** A região filtrada fica sem `Outro`, ou `distração` marca a cervical e o Waddell.
**Why it happens:** Filtro que esconde o último item; match por substring.
**How to avoid:** `Outro` fica por último em toda região visível. Match de legado é rótulo inteiro e único.
**Warning signs:** Busca por `Schober` esconde o `Outro` da lombar. Texto `distração` marca mais de um teste.

### Pitfall 8: Catálogo encolhe na cópia
**What goes wrong:** Mão perde pinça, lombar perde Schober, `OBrien` troca o apóstrofo.
**Why it happens:** Alguém resume a lista ou “normaliza” o texto.
**How to avoid:** Copiar de `<specifics>`. O teste trava 13/71, 20/192 e 12/120, mais os cinco testes da imagem de coluna e a ausência de Fraturas.
**Warning signs:** Contagem menor, ou `O'Brien` com U+0027 no fonte do catálogo.

## Code Examples

Padrões verificados no repo e no Zod instalado.

### Preprocess antes do strip

```ts
// Source: node_modules/zod/v3/types.js ZodEffects.createWithPreprocess (zod@3.25.76)
// e o mesmo encaixe de src/schemas/evaluationFicha.schema.ts (atividadesAfetadas)
mobilidade: z
  .preprocess(normalizeMobilidade, mobilidadeSchema)
  .default({}),
```

O helper é importado por caminho relativo com extensão `.ts`, como `normalizeAtividadesAfetadas`. O teste também. A UI pode usar `@/lib/mobilidadePalpacao`.

### Frases travadas

```ts
formatMovimentoCompacto('Flexão', '110°', '115°')
// 'Flexão  D 110°  E 115°'

formatDor('E', '90')
// 'Dor E 90°'

formatFraseAdm('Quadril', 'Flexão', '115°', '90')
// 'Flexão de quadril: ADM 115° → dor inicia aos 90°'
```

### Filtro nativo

```tsx
<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
<ul>
  {visiveis.map((item) => (
    <li key={item.key}>
      <label>
        <input type="checkbox" checked={marcado(item.key)} onChange={() => alternar(item.key)} />
        {item.label}
      </label>
    </li>
  ))}
</ul>
```

`Outro` é concatenado no fim depois do filtro, não entra no meio da lista ordenada por busca.

### Espelho da coluna `tests`

```ts
tests: formatTestesParaColuna(ficha.avaliacaoPlano?.palpacaoTestes) ?? ''
```

`formatTestesParaColuna` devolve `string`, nunca o array. `emptyToNull` em `evaluations.service.ts` faz `value?.trim()`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `linhas[]` + três booleanos globais | `regioes[]` com tipo, comparação e só os movimentos marcados | Esta fase | Ficha antiga sobrevive via preprocess |
| `palpacao` e `testesClinicos` string | `achados[]`, `testes[]`, registros anteriores | Esta fase | `resultados`, `testeFuncional`, `resultadoInicial` ficam string |
| Coluna `tests` copiada da string | Coluna `tests` copiada da frase formatada | Esta fase | A função de IA, que não lê `ficha`, continua recebendo texto |

**Deprecated/outdated:**

- Checkboxes `Movimento ativo`, `Movimento passivo`, `Comparação bilateral` no bloco B.
- Campos `Palpação relevante` e `Testes clínicos selecionados` como textarea.
- Tabela PDF de cinco colunas (`Movimento`, `Direito`, `Esquerdo`, `Dor/Sintoma`, `Observacao`) para o bloco B. A leitura nova é a frase D/E, não essa grade.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | Nenhuma. Contagens, Zod, leitores e a coluna `tests` foram verificados neste workspace. A regra de match e o painel inline são a decisão desta pesquisa, no espaço que o CONTEXT deixou em aberto. | — | — |

## Open Questions

1. **Nenhuma que bloqueie o plano.**
   - What we know: Catálogos, forma do jsonb, preprocess, lista nativa, painel inline e resultado curto estão fechados acima.
   - What's unclear: Nada que mude de arquivo ou de aceite.
   - Recommendation: O plano segue esta pesquisa. Não reabrir popover, combobox nem SQL.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `node --test` do helper | ✓ | v26.4.0 | — |
| npm / tsc | `npm run typecheck` | ✓ | npm 12.0.2, TypeScript do projeto | — |
| zod, react-hook-form, pdf-lib | Schema, form, PDF | ✓ | 3.25.76 / 7.81.0 / 1.17.1 | — |
| Supabase SQL | — | não usado | — | A coluna `ficha jsonb` já existe |
| Vitest / Jest | — | ✗ | — | `node --test` |
| ctx7 | Docs externas de Zod | ✗ | — | Probe local e `node_modules/zod/v3/types.js` |

**Missing dependencies with no fallback:**
- Nenhuma.

**Missing dependencies with fallback:**
- Vitest ausente de propósito. Usar `node --test`.
- Documentação web do Zod respondeu 403. O comportamento usado (strip e preprocess) foi medido no Zod instalado.

Step 2.6 não está skipped: a fase lê e grava jsonb já existente e roda teste local. Não há CLI nova.

Graph: `.planning/graphs/graph.json` ausente. Sem consulta de grafo.

## Validation Architecture

`workflow.nyquist_validation` ausente em `.planning/config.json` → seção incluída. `security_enforcement` também ausente → seção de segurança incluída.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node v26.4.0) + `tsc --noEmit`. Sem Vitest. |
| Config file | `tsconfig.json`. Nenhum config de `node:test`. |
| Quick run command | `node --test src/lib/mobilidadePalpacao.test.ts && npm run typecheck` |
| Full suite command | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` |

O helper não importa com alias `@/`. O schema importa o helper por caminho relativo com `.ts`. O teste importa os dois assim. Não há teste de componente: a página 04 entra no UAT manual.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-36.1 | Região guarda tipo e comparação; só movimento marcado entra; segunda região não herda a medida | unit | `node --test src/lib/mobilidadePalpacao.test.ts` | ❌ Wave 0 |
| REQ-36.2 | Compacta `Flexão  D 110°  E 115°`, `Dor E 90°`, frase `Flexão de quadril: ADM 115° → dor inicia aos 90°`; chips não são número | unit | mesmo comando | ❌ Wave 0 |
| REQ-36.3 | Local fora da região é descartado; achado guarda lado, dor e observação | unit | mesmo comando | ❌ Wave 0 |
| REQ-36.4 | Vários testes; `Outro` é o último de cada uma das 12 regiões; busca não faz parte do schema | unit | mesmo comando (ordem do catálogo) | ❌ Wave 0 |
| REQ-36.5 | As três saídas usam o mesmo formatador (o teste trava a string; detalhe e PDF importam a função) | unit | mesmo comando | ❌ Wave 0 |
| REQ-36 legado | `Flexão` ambígua vira registro; `Dorsiflexão` e `Flexão de quadril` atribuem; dor antiga não vira painel; string de testes não derruba a ficha; anamnese e força sobrevivem; segundo parse é idêntico | unit | mesmo comando, com `evaluationFichaSchema.parse` | ❌ Wave 0 |
| REQ-36 catálogo | 13/71, 20/192, 12/120; cinco testes da imagem; sem Fraturas; `O’Brien` é U+2019 | unit | mesmo comando | ❌ Wave 0 |
| REQ-36 UAT | Duas regiões, D/E com dor, achado editado, busca de teste com Outro, reabrir, detalhe, PDF. Blocos A, C–H intactos | manual | — | Manual no app |

Casos mínimos (nomes estáveis para `--test-name-pattern`):

- `REQ-36: catálogo não encolhe`
- `REQ-36: Flexão sem região vai para registro anterior`
- `REQ-36: Flexão de quadril marca só quadril e não copia para os outros movimentos`
- `REQ-36: Dorsiflexão único marca tornozelo`
- `REQ-36: dor antiga não preenche painel D nem E`
- `REQ-36: checkbox global não abre região vazia`
- `REQ-36: string de testesClinicos não derruba a ficha`
- `REQ-36: linha Schober exata marca; Schober com texto fica no registro`
- `REQ-36: PA central ambíguo não escolhe torácica nem lombar`
- `REQ-36: distração solta não marca cervical nem Waddell`
- `REQ-36: segundo parse é idêntico`
- `REQ-36: anamnese e força sobrevivem`
- `REQ-36: formatadores da frase travada`
- `REQ-36: Outro é o último item de cada região de teste`

### Sampling Rate

- **Per task commit:** `node --test src/lib/mobilidadePalpacao.test.ts && npm run typecheck`
- **Per wave merge:** `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build`
- **Phase gate:** Suíte verde antes de `/gsd-verify-work`, mais UAT manual (duas regiões, dor por lado, achado, busca, detalhe, PDF). Confirmar que A, C–H e as páginas 01–03 não ganharam campo novo.

### Wave 0 Gaps

- [ ] `src/lib/mobilidadePalpacao.ts` — catálogos, normalize, format
- [ ] `src/lib/mobilidadePalpacao.test.ts` — cobre REQ-36, legado e contagem
- [ ] Framework install: nenhum

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Sessão Supabase já existente. Esta fase não mexe em login. |
| V3 Session Management | no | — |
| V4 Access Control | yes | Editor só monta se `canWrite`. Inputs novos com `disabled={readOnly}`. Sem botão de adicionar/remover quando `readOnly`. RLS de `patient_evaluations` não muda: mesma coluna jsonb. |
| V5 Input Validation | yes | Zod no save. Chaves só do catálogo, enums fechados de tipo, comparação, lado e achado, `max` nos textos, dor 0–10, preprocess que descarta o resto e não lança. Não confiar no jsonb cru na UI. |
| V6 Cryptography | no | — |

### Known Threat Patterns for this ficha jsonb

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Chave de região ou movimento fora do catálogo | Tampering | Normalize só aceita as chaves copiadas do CONTEXT. Zod não vê o resto. |
| Texto enorme que quebra o parse ou o PDF | Denial of service | Clamp: valor 80, observação 400, resultado de teste 200, registros 4000, início da dor 40. |
| Busca com regex do usuário | Denial of service | `includes` na string dobrada. Não usar `new RegExp(query)`. |
| HTML no valor do detalhe | Tampering (XSS) | React escapa texto. PDF é string no pdf-lib. Não usar `dangerouslySetInnerHTML`. |
| Colega sem escrita altera medida | Elevation | Não montar o editor sem `canWrite`. Detalhe não tem input. |
| Grau clínico copiado para toda a região na migração | Repudiation / integridade | Match único. Ambiguidade vira registro anterior. Dor antiga não escolhe lado. |
| Coluna `tests` anulada e o resumo perde o dado | Information loss | Espelho continua string formatada. A função de IA não é editada e não lê `ficha`. |

## Sources

### Primary (HIGH confidence)

- `25-CONTEXT.md` — decisões, catálogos e contagens (13/71, 20/192, 12/120, U+2019 em `O’Brien`)
- Código do repo: `EvaluationPage04.tsx`, `evaluationFicha.schema.ts`, `evaluations.service.ts` (`resolveEvaluationFicha`, `toRow`, `legacyToFicha`, `emptyToNull`), `PatientEvaluationEditorForm.tsx` (`shouldUnregister: false` e o espelho `tests`), `PatientEvaluationPanel.tsx` (`draftFromPdf`), `EvaluationFichaDetail.tsx`, `fichaFormPrimitives.tsx` (`RadioRow`, `EvaField`, `DetailLeaf`), `pdfFieldCatalog.ts` blocos `04.B` e `04.E`, `patientAiPdf.service.ts` (`drawOptionalField`, `toWinAnsiSafe`, draw 04.B / 04.E)
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` — `select` de `patient_evaluations` sem `ficha`; usa a coluna `tests`
- Probe local zod@3.25.76: object strip, string rejeitada por objeto, preprocess aceitando string
- `node_modules/zod/v3/types.js` — `ZodEffects.createWithPreprocess`
- `npm ls` / `node --version` neste workspace

### Secondary (MEDIUM confidence)

- Nenhuma. A documentação web do Zod não abriu (HTTP 403). O comportamento necessário foi lido no pacote instalado.

### Tertiary (LOW confidence)

- Nenhuma.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — bibliotecas já instaladas neste fluxo; nenhum pacote novo
- Architecture: HIGH — schema, jsonb, três leitores e a coluna `tests` localizados no código
- Pitfalls: HIGH — strip, falha do parse e WinAnsi reproduzidos no probe e no fonte

**Research date:** 2026-10-05
**Valid until:** 2026-11-04 (estável: sem dependência de API externa em mudança)
