# Phase 4: Atalhos no dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 4-atalhos-dashboard
**Areas discussed:** Depois de salvar

---

## Gray area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Destino do fluxo | Modal no dashboard vs ficha com editor aberto | |
| Como escolhe o paciente | Busca/lista vs sessões de hoje/semana | |
| O que “Nova evolução” cria | Sessão realizada vs sessão agendada vs mesmo modal da ficha | |
| Depois de salvar | Volta ao dashboard vs ficha vs fica no form | ✓ |

**User's choice:** Só “Depois de salvar”. As outras três ficaram a critério da implementação (CONSTRAINT: D-01/D-02 forçam overlay no `/painel`).

---

## Depois de salvar

| Option | Description | Selected |
|--------|-------------|----------|
| Volta ao dashboard | Toast de sucesso; dá para repetir com outro paciente | ✓ |
| Cai na ficha | Aba evoluções ou avaliação | |
| Fica no formulário | Conferir ou criar outro no mesmo paciente | |
| Você decide | | |

**User's choice:** Volta ao dashboard, com toast de sucesso.
**Notes:** O atalho existe para não entrar na ficha.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fecha tudo | Volta ao dashboard — mesmo destino do salvar | ✓ |
| Volta à escolha do paciente | Trocar de pessoa sem recomeçar o botão | |
| Você decide | | |

**User's choice:** Cancelar fecha tudo e volta ao dashboard.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Só o toast | “Evolução salva” / “Avaliação salva”, sem atalho extra | |
| Toast com “Ver ficha” | Fica no dashboard; um clique leva à aba certa | ✓ |
| Você decide | | |

**User's choice:** Toast com “Ver ficha”.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Clica de novo no atalho | Fluxo fecha; o próximo começa do zero | ✓ |
| Salvar e registrar outra | Fecha o form mas reabre a escolha de paciente | |
| Você decide | | |

**User's choice:** Clica de novo no atalho do dashboard.

---

## Claude's Discretion

- Formulário do atalho como overlay em `/painel` (não navegar para a ficha no meio do fluxo)
- Reusar editores de sessão/avaliação existentes; sem CRUD paralelo
- Picker só com pacientes writable (`canWritePatient`); empresa não vê colega
- Botões no header do dashboard; lista vazia mostra o picker com ponte para `/pacientes`
- Erro ao salvar mantém o formulário aberto

## Deferred Ideas

None
