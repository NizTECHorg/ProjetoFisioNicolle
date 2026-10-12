# Phase 28: Excluir paciente por completo - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning
**Source:** Pedido do profissional na invocação de `/gsd-plan-phase` ("dar pra apagar usuários; ao apagar, exclui 100% do banco de dados") + respostas às perguntas de esclarecimento. discuss-phase pulado — intenção explícita.

<domain>
## Phase Boundary

"Usuário" aqui é o **paciente**. Hoje não existe exclusão de paciente. Esta fase cria a ação **Excluir paciente** na ficha. A exclusão é definitiva: o paciente e tudo ligado a ele saem do banco, e os arquivos dele saem do storage.

Fora desta fase: excluir a conta de login do profissional, excluir membro da equipe, lixeira/restaurar, exclusão em lote, exclusão pela lista de pacientes.

</domain>

<decisions>
## Implementation Decisions

### Quem pode excluir
- Quem pode editar o paciente hoje (`canWritePatient` em `src/lib/accountAccess.ts` = quem criou o paciente; no banco, `private.can_write_patient`, que também barra membership pending/rejected). O dono da empresa **não** exclui ficha criada por colega — a mesma regra de edição de hoje.
- A regra vale também no banco: a exclusão no servidor rejeita paciente de outra conta ou de quem não pode escrever, mesmo que alguém chame a API direto.

### Onde fica
- Só na ficha do paciente (cabeçalho ou menu de ações da ficha). Não entra na lista de pacientes.
- Ação destrutiva: texto em `error`, nunca o CTA principal.

### Confirmação
- Diálogo de perigo com o título `Excluir paciente?`.
- O corpo diz que a exclusão é definitiva e lista o que some: sessões, avaliações, evoluções, metas, imagens, PDFs, relatórios da IA e cobranças.
- Campo para digitar o nome do paciente. O botão `Excluir paciente` só habilita quando o texto digitado bate com o nome (ignorando espaços nas pontas e maiúsculas/minúsculas).
- Botão de saída: `Voltar sem excluir`.
- Durante a exclusão, botão em loading e diálogo não fecha.

### O que é apagado (100%)
- A linha em `patients` e **toda** linha de qualquer tabela que aponte para o paciente, direta ou indiretamente (via `patient_sessions`, avaliações etc.). Inclui cobranças do financeiro (`autonomo_session_charges`) e vínculos do Google Agenda (`google_calendar_session_links`). O pesquisador deve levantar a lista completa a partir dos SQL do projeto e do código.
- Arquivos do storage do paciente: foto, imagens, PDFs gerados/salvos — todos os buckets que guardam algo por paciente.
- No banco, tudo-ou-nada (uma transação / uma função). Se falhar, nada some.
- Ordem: banco e storage devem terminar consistentes. Se o storage falhar depois do banco, não pode sobrar arquivo órfão sem caminho de limpeza — o plano decide como (ex.: apagar arquivos antes, ou listar caminhos e apagar depois com retry).

### Depois de excluir
- Toast de sucesso curto: `Paciente excluído.`
- Navega para `/pacientes`.
- Invalida os caches que mostram o paciente: lista e ficha de pacientes, dashboard, agenda/calendário, quadro, financeiro.
- Erro: toast `Não foi possível excluir o paciente. Tente de novo em instantes.` e nada muda na tela.

### Padrões fechados após a pesquisa
- Cards do quadro (`board_cards`) ligados ao paciente são apagados junto.
- Google Agenda: apaga só o vínculo local (`google_calendar_session_links`). O evento já exportado continua na agenda Google do profissional. O diálogo avisa numa linha: `Eventos já enviados ao Google Agenda continuam lá.`
- Limpeza de storage que falhar fica registrada (tombstone) e é refeita na próxima tentativa; sweep automático fica para depois.

### Claude's Discretion
- SQL via função `security definer` com checagem de dono vs. `on delete cascade` nas FKs, ou combinação — escolher o mais seguro dado o schema atual.
- Se a remoção do storage roda no cliente (com RLS do storage) ou numa Edge Function.
- O que fazer com o evento já exportado para o Google Agenda do profissional (apagar no Google ou só o vínculo local) — preferir apagar só o vínculo local se apagar no Google exigir fluxo novo; registrar a escolha.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Paciente e ficha
- `src/services/patients.service.ts` — CRUD de paciente; não há delete hoje
- `src/hooks/usePatients.ts` — chaves de cache `['patients', ...]` e padrões de mutation
- `src/lib/accountAccess.ts` — `canWritePatient`
- `src/pages/` e `src/components/patients/` — ficha do paciente (cabeçalho `PatientProfileHeader`)
- `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/Modal.tsx` — diálogo de perigo existente

### Dados ligados ao paciente
- `supabase/*.sql` e `.planning/phases/*/sql/*.sql` — tabelas, FKs e políticas RLS
- `src/services/*` — serviços que leem/escrevem por `patient_id` ou `session_id` (sessions, evaluations, patientImages, patientPhoto, patientAiReports, patientAiPdf, finance, googleCalendar, board)
- `supabase/functions/*` — Edge Functions existentes (padrão, se precisar de service role)

### Regras do projeto
- SQL só pelo SQL Editor do Supabase: entregar arquivo `.sql` em `.planning/phases/28-excluir-paciente-por-completo/sql/`. Não criar `supabase/migrations`. Não rodar `supabase db push`.
- Sem pacote npm novo.

</canonical_refs>

<specifics>
## Specific Ideas

- Ação: `Excluir paciente`
- Diálogo: `Excluir paciente?` · `Voltar sem excluir` · campo "Digite o nome do paciente para confirmar"
- Sucesso: `Paciente excluído.`
- Erro: `Não foi possível excluir o paciente. Tente de novo em instantes.`

</specifics>

<deferred>
## Deferred Ideas

- Lixeira com restaurar por N dias.
- Excluir pela lista de pacientes / em lote.
- Excluir a conta do profissional e membros da equipe.
- Exportar os dados do paciente antes de excluir (LGPD — portabilidade).
- Apagar o evento remoto no Google Agenda.
- Sweep automático de limpezas de storage pendentes.

</deferred>

---

*Phase: 28-excluir-paciente-por-completo*
*Context gathered: 2026-10-10*
