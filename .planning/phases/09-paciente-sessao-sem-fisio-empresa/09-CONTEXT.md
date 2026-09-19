# Phase 9 — Paciente/sessão sem fisioterapeuta (empresa)

**Source:** User request via `/gsd-plan-phase` (2026-09-18)  
**Status:** Locked for planning (discuss-phase skipped — decisions taken from explicit request)

## Problem

Hoje a criação de **sessão** exige `therapistId` (UUID). Conta **empresa** precisa cadastrar **paciente** e **sessão** sem obrigar a alocação de um fisioterapeuta — o profissional pode ficar vazio e ser atribuído depois.

## Locked Decisions

### D-01 — Escopo só empresa
Opcionalidade de fisioterapeuta na criação de paciente e sessão vale para `account_type === 'empresa'`. Autônomo e fisioterapeuta mantêm o comportamento atual (não regredir).

### D-02 — Sessão: therapistId opcional (empresa)
No fluxo Nova sessão / agendar (ficha, agenda, atalhos), empresa pode salvar com `therapistId` vazio → persistido como `null`. Schema Zod não exige UUID quando o ator é empresa.

### D-03 — Paciente sem fisioterapeuta alocado
Empresa cria paciente sem selecionar/alocar fisioterapeuta (campo de profissional vazio ou omitido). Sem bloquear o cadastro por falta de profissional.

### D-04 — Atribuir depois
Edição de paciente e de sessão permite preencher o profissional depois. Lista/ficha/agenda mostram estado claro quando não há profissional (copy PT: **Sem profissional** ou equivalente já usado no produto).

### D-05 — Sem mudança de modelo de conta
Não criar novo `account_type`. Não alterar fluxo de Equipe (REQ-15). RLS Phase 3 continua autoridade; `created_by` da empresa no paciente permanece.

### D-06 — Fora de escopo desta fase
- Rateio / comissão financeira por fisio
- Auto-atribuição forçada ao criador empresa
- Google Agenda (Phase 8 permanece aberta, UAT pendente — histórico preservado)
- REQ-05 / REQ-14

## Success Criteria (from ROADMAP)

1. Empresa cria paciente sem selecionar/alocar fisioterapeuta
2. Empresa cria ou agenda sessão sem `therapistId` obrigatório
3. UI clara sem profissional + atribuição na edição
4. Autônomo e fisioterapeuta sem regressão
5. Persistência com profissional nulo; RLS válido

## Requirements

- REQ-21

## Notes for planner

- Hotspot atual: `sessionFormSchema.therapistId` é `z.string().uuid(...)` — quebrar isso só para empresa (schema factory / refine por account type / empty→null).
- Avaliar se formulário de paciente já trata `therapistName` como opcional; alinhar UI.
- Calendar create path (`calendar.service`) já aceita `therapistId?` — alinhar forms da Agenda.
- Não apagar nem marcar approved a Phase 8.
