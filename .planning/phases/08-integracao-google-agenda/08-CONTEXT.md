# Phase 8: Integração Google Agenda - Context

**Gathered:** 2026-09-18
**Status:** Ready for planning
**Source:** PRD Express Path (pedido do usuário em /gsd-plan-phase)

<domain>
## Phase Boundary

Na Agenda da aplicação (`/agenda`, `CalendarPage` + `patient_sessions`), o profissional **conecta a conta Google** e **sobe as sessões/tarefas agendadas** para o **Google Calendar**. Entrega mínima obrigatória: **app → Google**.

Se for **viável e seguro** trazer eventos do Google Calendar para dentro da agenda da aplicação (Google → app), incluir na fase com as alterações necessárias. Se **não** for possível sem quebrar o modelo clínico (sessões ligadas a pacientes, RLS, status clínico), **ignorar** a importação e documentar o motivo — entregar só a exportação.

This phase does **not** replace a Agenda da aplicação pelo Google, nem exige sync contínuo em tempo real, nem integra Outlook/Apple Calendar.

</domain>

<decisions>
## Implementation Decisions

### Direção da integração
- **D-01:** Obrigatório: exportar sessões da agenda da aplicação para o Google Calendar (criar/atualizar eventos).
- **D-02:** Condicional: importar / espelhar eventos do Google na agenda da app **somente se** a pesquisa concluir que é viável sem inventar pacientes fictícios nem furar RLS. Caso contrário, **não implementar** Google → app nesta fase.
- **D-03:** Se só app → Google: a UI deixa claro que a integração é **exportação** (não agenda espelhada bidirecional).

### Conta e escopo
- **D-04:** Conexão OAuth por usuário autenticado (cada profissional conecta a própria conta Google).
- **D-05:** Escopo mínimo do Google Calendar necessário para criar/atualizar eventos do export; não pedir escopos extras sem necessidade.
- **D-06:** Conectar e desconectar a partir da tela Agenda (ou fluxo iniciado nela).

### O que sobe
- **D-07:** Fonte: sessões em `patient_sessions` visíveis na Agenda (`listSessionsInRange` / `CalendarSession`).
- **D-08:** Evento no Google deve carregar identificação útil (paciente, horário, tipo/local quando existirem) — sem vazar dados clínicos sensíveis além do necessário no título/descrição do evento.
- **D-09:** Evitar duplicar o mesmo evento: guardar vínculo sessão ↔ `google_event_id` (ou equivalente) para update em re-export.

### Claude's Discretion
- Biblioteca / Edge Function / PKCE vs token no Supabase — escolher o caminho mais seguro compatível com o stack atual (Vite + Supabase, sem pacote novo se der; se precisar de pacote, justificar).
- Duração padrão do evento se a sessão não tiver fim explícito.
- UX de “exportar selecionadas” vs “exportar intervalo / todas do mês”.
- Se Google → app for viável: como mapear evento externo sem `patient_id` (só leitura? card separado?).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Produto
- `.planning/ROADMAP.md` — Phase 8 goal e success criteria
- `.planning/REQUIREMENTS.md` — REQ-20
- `.planning/phases/08-integracao-google-agenda/08-CONTEXT.md` — this file

### Agenda existente
- `src/pages/CalendarPage.tsx` — UI da Agenda
- `src/services/calendar.service.ts` — `listSessionsInRange`, `CalendarSession`, create/update status
- `src/hooks/useClinic.ts` — `useCalendarSessions`, `useCreateSession`

### Auth / segurança
- `src/services/auth.service.ts` — sessão Supabase
- `src/lib/security/index.ts` — mapAuthError / sanitize
- `.planning/codebase/ARCHITECTURE.md` — page → hook → service → RLS; SQL Editor only
- `.planning/codebase/CONVENTIONS.md` — named exports, single quotes, no semicolons, português UI
- `.planning/phases/03-tipos-de-conta-e-equipe/03-CONTEXT.md` — contas; hide-don't-disable

### Stack
- `.planning/codebase/STACK.md` — React + Vite + Supabase; sem pacote novo salvo justificado

</canonical_refs>

<specifics>
## Specific Ideas

- Usuário: “caso não seja possível integrar as agendas do Google na agenda dentro da aplicação, ignore essa etapa, só faça a integração das agendas de dentro para o Google”
- Usuário: “caso dê para integrar, pode fazer as alterações necessárias”

</specifics>

<deferred>
## Deferred Ideas

- Sync contínuo / webhook push do Google
- Outlook / Apple Calendar
- Substituir a Agenda interna pelo Google embed
- Export em lote de evoluções clínicas completas (texto SOAP) para o evento

</deferred>

---

*Phase: 08-integracao-google-agenda*
*Context gathered: 2026-09-18 via PRD Express Path*
