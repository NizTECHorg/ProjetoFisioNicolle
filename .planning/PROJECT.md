# Fisio — Prontuário clínico

## What This Is

Aplicativo web de fisioterapia (React + Supabase) para clínica: cadastro e ficha do paciente, resumo do caso, alertas clínicos, agenda e quadro. O foco atual é o prontuário por paciente — registrar sessões (passadas e futuras) e a evolução individual de cada atendimento.

## Core Value

Cada atendimento realizado fica documentado (estado, condutas e demais campos clínicos), vinculado ao paciente, profissional, data e horário — e o que for futuro aparece na Agenda.

## Requirements

### Validated

- ✓ Cadastro e listagem de pacientes — existing
- ✓ Ficha do paciente com abas Resumo e Dados cadastrais — existing
- ✓ Resumo do caso (“Entenda o caso”) editável + Resumo do paciente (IA e demais campos) — existing
- ✓ Alertas clínicos na ficha (CRUD) — existing
- ✓ Agenda mensal sobre `patient_sessions` — existing
- ✓ Autenticação Supabase + profiles — existing

### Active

- [ ] **REQ-08 — Evolução individual de cada sessão**
  - Aba **Evoluções** em todo paciente (lista vazia na UI se não houver dados; sem placeholders fake)
  - Modelo: **sessão** + **evolução** (1:1 quando realizada)
  - Formulário com toggle **Agendar ↔ Realizada**
  - Agendar → status agendada → aparece na Agenda
  - Realizada → evolução com **estado do paciente** e **condutas** obrigatórios; opcionais: mudanças desde a última sessão, resposta ao tratamento, intercorrências, planejamento
  - Profissional **selecionável** (profiles ativos)
  - Sessão agendada pode ser aberta para preencher evolução e marcar como realizada
  - Editar e excluir sessão/evolução com confirmação
  - SQL de seed com dados placeholder por paciente (dev)

### Out of Scope (neste marco)

- Abas de Avaliação / Exercícios / Documentos / Financeiro / Reavaliações como módulos funcionais — ficam stub/atalho
- Placeholders visuais na lista da aba Evoluções — a lista começa vazia; seeds só no SQL
- Multi-clínica / isolamento por clínica — ainda não
- Relatórios estatísticos de evolução — depois

## Context

- Codebase map em `.planning/codebase/` (2026-08-23)
- Stack: Vite, React 19, TanStack Query, Zod, RHF, Tailwind 4, Supabase
- Tabela existente `patient_sessions` alimenta a Agenda; evoluções clínicas ainda não existiam como entidade
- RLS atual de pacientes/sessões é permissiva para `authenticated` (dívida conhecida em CONCERNS.md)
- Profiles hoje só permitem `select` do próprio usuário — o REQ-08 precisa listar terapeutas (ajuste de policy / leitura limitada)

## Constraints

- **Tech**: manter camadas page → hooks → services → Supabase
- **UX**: UI em português; minimalista; sem cards decorativos na lista vazia
- **LGPD**: dados clínicos; não vazar secrets; seeds só em SQL de desenvolvimento
- **SQL**: scripts manuais no SQL Editor do Supabase (padrão do projeto)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sessão + evolução separadas | Agenda usa sessão; evolução é o registro clínico da realizada | — Pending |
| Toggle Agendar / Realizada no mesmo formulário | Um fluxo só, menos fricção | — Pending |
| Estado + condutas obrigatórios | Cobrem o mínimo clínico; resto opcional | — Pending |
| Profissional selecionável (profiles) | Clínica com mais de um terapeuta | — Pending |
| Futuras na Agenda existente (`patient_sessions`) | Evita segundo calendário | — Pending |
| Aba Evoluções real; outras seções depois | Entrega REQ-08 sem inflar escopo | — Pending |
| Seeds SQL, lista UI vazia sem fake | Dev com dados; produto sem placeholders | — Pending |

## Evolution

Após cada fase: mover Active → Validated quando shipado; atualizar decisões.

---
*Last updated: 2026-08-23 after REQ-08 scoping*
