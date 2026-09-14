# Phase 5: Financeiro do autônomo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 05-financeiro-autonomo
**Areas discussed:** Local e momento do valor, O que entra no total, Preço mudou, Tela Financeiro

---

## Local e momento do valor

| Option | Description | Selected |
|--------|-------------|----------|
| Dois preços fixos no form (residência / escritório) | ROADMAP original | |
| Marcar local/valor depois no Financeiro | Sem campos na sessão | |
| Vários preços + avulso na sessão | Catálogo variável; alocar na sessão ou valor avulso | ✓ |

**User's choice:** Criar vários preços variados e alocar os criados na sessão **ou** colocar um valor avulso. Follow-up: select XOR avulso (nunca os dois juntos).
**Notes:** Substitui os dois valores fixos por local. Campo Local existente (`place`) permanece clínico.

---

## O que entra no total

| Option | Description | Selected |
|--------|-------------|----------|
| Só sessões Realizada | Sem flag pago | |
| Realizada + Agendar | Qualquer sessão com valor | |
| Realizada + Pago | Primeira resposta do usuário | |
| Se Pago, contabiliza | 3c — flag pago é o que soma | ✓ |

**User's choice:** Primeiro: “soma só as realizadas que estiverem como pago, implemente isso também.” Depois, em 3c: “se estiver como pago contabiliza na aba financeiro.”
**Notes:** CONTEXT trava **Pago** como flag de arrecadação (inclui Agendar pré-pago). Lista do Financeiro continua focada em realizadas (4b).

---

## Preço mudou

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot da época | Sessão guarda o R$ no momento | ✓ |
| Recalcular com preço atual | Totais seguem o catálogo vigente | |
| Nome+valor editável direto | Sem arquivar | |
| Nome+valor; antigos só arquivam | Não apaga | ✓ |

**User's choice:** Mantém o da época. Catálogo: 1b — preços antigos só arquivam.
**Notes:** Editar preço ativo só afeta alocações futuras (Claude discretion).

---

## Tela Financeiro

| Option | Description | Selected |
|--------|-------------|----------|
| Só dois preços + três totais | ROADMAP mínimo | |
| Catálogo + totais, valor só na sessão | Sem lista | |
| Catálogo + totais + lista de realizadas | Marcar pago / completar valor antigo | ✓ |

**User's choice:** 4b.
**Notes:** Autônomo only, reaffirmed every turn.

---

## Claude's Discretion

- Pago visível em Agendar e Realizada no form (autônomo)
- Financeiro no drawer; `mobileNavItems` fica com 4 itens (Phase 3 Equipe pattern)
- Redirect não-autônomo → `/pacientes`
- `formatCurrency` existente; hook de domínio novo; SQL Editor + copy em `.planning/phases/05-financeiro-autonomo/sql/`

## Deferred Ideas

None — financeiro empresa/equipe already out of scope in PROJECT.md
