# Fisio — Prontuário clínico

## What This Is

Aplicativo web de fisioterapia (React + Supabase) para clínica: cadastro e ficha do paciente, resumo do caso, alertas clínicos, agenda, quadro e prontuário (evoluções + avaliação inicial).

## Core Value

Cada atendimento realizado fica documentado e a avaliação inicial estruturada é a base clínica para acompanhar o tratamento.

## Requirements

### Validated

- ✓ Cadastro e listagem de pacientes — existing
- ✓ Ficha do paciente com abas Resumo e Dados cadastrais — existing
- ✓ Resumo do caso (“Entenda o caso”) editável + Resumo do paciente — existing
- ✓ Alertas clínicos na ficha (CRUD) — existing
- ✓ Agenda mensal sobre `patient_sessions` — existing
- ✓ Autenticação Supabase + profiles — existing
- ✓ REQ-08 — Evolução individual de cada sessão — existing
- ✓ REQ-15 — Tipos de conta e equipe — Validated in Phase 3
- ✓ REQ-16 — Atalhos no dashboard — Validated in Phase 4: Nova evolução / Nova avaliação no `/painel`, picker de pacientes graváveis, overlay reusa os editores da ficha

### Active

- [ ] **REQ-17 — Financeiro do autônomo**
  - Só autônomo vê a aba
  - Valor fixo residência vs escritório; alocar em cada sessão
  - Totais mês / ano / sempre

- [ ] **REQ-14 — Metas do tratamento** *(código entregue; SQL + UAT depois)*
  - Objetivos específicos por paciente
  - Status: em andamento / concluído
  - Clique no card marca como feito

### Deferred

- [ ] **REQ-05 — Registro da avaliação inicial** *(código entregue; SQL + UAT depois)*
  - Aba **Avaliação** com ficha estruturada
  - Campos: anamnese, queixa principal, história, dor, limitações, objetivos, exame, testes, medidas, diagnóstico e planejamento
  - Persistida em `patient_evaluations`

### Out of Scope (neste marco)

- Relatórios comparativos automáticos entre avaliações
- Módulo separado de Reavaliações
- Multi-clínica / isolamento por clínica
- Financeiro para empresa/equipe (rateio, comissão)
- Tela bakery de despesas (`FinancePage`)

## Constraints

- **Tech**: manter camadas page → hooks → services → Supabase
- **UX**: UI em português; lista vazia sem placeholders fake
- **LGPD**: dados clínicos; seeds só em SQL de desenvolvimento
- **SQL**: scripts manuais no SQL Editor do Supabase

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tabela `patient_evaluations` | Avaliação é registro clínico datado, distinto de sessão/evolução | Implemented |
| Data obrigatória | Requisito: permanecer vinculada à data da realização | Implemented |
| Queixa principal obrigatória | Mínimo clínico para o registro existir | Implemented |
| Múltiplos registros | Permite comparar depois; o mais antigo é a inicial | Implemented |
| PDF só como rascunho | Fonte oficial é a ficha estruturada | Implemented |

## Evolution

Após cada fase: mover Active → Validated quando shipado; atualizar decisões.

---
*Last updated: 2026-09-14 — Phase 4 complete (REQ-16); next is Phase 5 financeiro (REQ-17)*
