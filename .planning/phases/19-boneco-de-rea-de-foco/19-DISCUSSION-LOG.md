# Phase 19: Boneco de área de foco - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-24
**Phase:** 19-boneco-de-rea-de-foco
**Areas discussed:** Divisões do braço, Pés separados, Marcas já salvas

---

## Divisões do braço

| Option | Description | Selected |
|--------|-------------|----------|
| Braço e antebraço | Duas partes depois do ombro | |
| Braço, antebraço e mão | Três partes depois do ombro | ✓ |

**User's choice:** Braço, antebraço e mão.
**Notes:** Ombro continua separado.

| Option | Description | Selected |
|--------|-------------|----------|
| Frente e costas, esquerda e direita | As duas vistas e os dois lados | |
| Só na frente | Sem costas | |
| Você decide | | |

**User's choice:** Só frente e costas.
**Notes:** Esquerda e direita permanecem como no boneco atual.

| Option | Description | Selected |
|--------|-------------|----------|
| Mão inteira | Uma região por lado | ✓ |
| Separar os dedos | Cada dedo é região | |
| Você decide | | |

**User's choice:** Mão inteira. Um nome é Palma da mão e o outro é Mão.
**Notes:** Dedos ficam de fora.

| Option | Description | Selected |
|--------|-------------|----------|
| Frente: Palma da mão. Costas: Mão. | Nome muda por vista | ✓ |
| Frente: Mão. Costas: Palma da mão. | O inverso | |
| Você decide | | |

**User's choice:** 1.
**Notes:** Braço e Antebraço usam o mesmo nome nas duas vistas. Cotovelo é limite, não região.

---

## Pés separados

| Option | Description | Selected |
|--------|-------------|----------|
| Pé separado, perna até o tornozelo | Esquerda, direita, frente e costas | ✓ |
| Pé continua dentro da perna | Sem região nova | |

**User's choice:** Isso. A perna tem tornozelo, perna e pé.
**Notes:** Depois virou nomes por vista, não três faixas iguais nas duas vistas.

| Option | Description | Selected |
|--------|-------------|----------|
| Frente: Planta do pé. Costas: Pé. | Nome diferente por vista | |
| Pé nas duas vistas | Mesmo nome | |

**User's choice:** Pé na frente, tornozelo nas costas.
**Notes:** Não escolheu planta do pé.

| Option | Description | Selected |
|--------|-------------|----------|
| Frente: Canela e Pé. Costas: Panturrilha e Tornozelo. | Nome da perna muda por vista | ✓ |
| Canela e panturrilha nas duas vistas, além de pé e tornozelo | As quatro peças em cada vista | |
| Você decide | | |

**User's choice:** 1. Pediu a divisão canela/panturrilha antes de confirmar.
**Notes:** Coxa e joelho não mudam de nome.

| Option | Description | Selected |
|--------|-------------|----------|
| Pé inteiro | Sem separar os dedos | ✓ |
| Separar os dedos do pé | Cada dedo é região | |
| Você decide | | |

**User's choice:** 1. Pediu para não fazer mais perguntas e seguir.
**Notes:** Dedos do pé ficam de fora.

---

## Marcas já salvas

| Option | Description | Selected |
|--------|-------------|----------|
| Remover só as marcas das regiões que saem | O resto permanece | ✓ |
| Repartir a marca antiga nas partes novas | Braço inteiro vira as três partes | |
| Apagar todas as marcas | Recomeço total | |

**User's choice:** Retire as marcas que vão sair. As que não mudam, deixe.
**Notes:** Não houve pergunta extra. A área já tinha sido respondida na seleção inicial.

---

## Scroll ao selecionar

Não foi uma área escolhida para discutir. O pedido original e o objetivo da fase travam o resultado: selecionar uma área não cria scroll; se o boneco atual não permitir a correção, ele é refeito.

## Claude's Discretion

- Nomes das `region_key` novas e o desenho SVG.
- SQL que apaga só as keys obsoletas, no SQL Editor.
- Ajuste do scroll no boneco atual ou substituição do desenho.

## Deferred Ideas

- Separar os dedos da mão ou do pé.
- Cotovelo como região própria.
- Granularidade muscular.
- Seletor de sexo ou tipo de corpo.
