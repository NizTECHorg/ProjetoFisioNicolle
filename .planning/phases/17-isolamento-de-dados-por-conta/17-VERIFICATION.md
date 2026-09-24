---
phase: 17-isolamento-de-dados-por-conta
verified: 2026-09-24T02:38:21Z
status: gaps_found
score: 7/9 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Uma conta nova não vê tarefas do quadro, pacientes, sessões nem notas criados em outra conta"
    status: failed
    reason: "O RLS do script isolaria a leitura no Postgres, mas o React Query entrega o cache da conta anterior sem nova consulta. signOut não limpa o QueryClient. As chaves de quadro, pacientes, sessões e financeiro não incluem o uid. staleTime global é 60s e refetchOnWindowFocus está desligado."
    artifacts:
      - path: "src/hooks/useClinic.ts"
        issue: "useBoard usa queryKey ['board'] e useCalendarSessions usa ['calendar-sessions', fromIso, toIso], sem uid"
      - path: "src/hooks/usePatients.ts"
        issue: "usePatients usa queryKey ['patients'] com staleTime 60_000, sem uid"
      - path: "src/providers/AuthProvider.tsx"
        issue: "signOut zera a sessão local e não chama queryClient.clear()"
      - path: "src/main.tsx"
        issue: "QueryClient default staleTime 60_000 e refetchOnWindowFocus false; o cache sobrevive ao logout no mesmo separador"
    missing:
      - "Limpar o QueryClient no signOut antes de a próxima conta montar as telas"
      - "Incluir o uid nas chaves de quadro, pacientes, sessões, notas da ficha e financeiro, com enabled só quando houver usuário"
      - "Não substituir o RLS por .eq('owner_id') no cliente"
  - truth: "Toda tabela de dado digitável está coberta por regra de acesso no banco e pela leitura no app"
    status: failed
    reason: "Os scripts SQL cobrem as tabelas digitáveis (quadro neste arquivo; ficha, imagens, laudos, financeiro e Google Calendar nas fases anteriores). A leitura na tela não espera essa regra quando o cache ainda está fresco: a conta seguinte vê as linhas da anterior sem o Postgres responder."
    artifacts:
      - path: "src/hooks/useClinic.ts"
        issue: "listBoard e listDueCards só rodam de novo depois que o cache de ['board'] fica stale"
      - path: "src/hooks/useFinance.ts"
        issue: "Chaves ['finance', ...] também não levam uid"
      - path: ".planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql"
        issue: "Políticas corretas no arquivo; não anulam o cache do browser"
    missing:
      - "A leitura do app tem de ser por conta, além do RLS"
deferred: []
---

# Phase 17: Isolamento de dados por conta — Relatório de verificação

**Phase Goal:** Uma conta não vê dados digitados em outra conta. O quadro, pacientes, sessões, notas e todo o resto do site ficam isolados. Qualquer dado mockado sai do produto. Autônomo nunca vê outro autônomo (D-05). A mesma empresa continua compartilhando via viewer_org_id() (D-06). O SQL é aplicado pelo operador no SQL Editor, não por supabase db push.
**Verified:** 2026-09-24T02:38:21Z
**Status:** gaps_found
**Re-verification:** Não — verificação inicial

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Uma conta nova não vê tarefas do quadro, pacientes, sessões nem notas criados em outra conta | ✗ FAILED | `useBoard` em `src/hooks/useClinic.ts` usa `queryKey: ['board']`. `usePatients` usa `['patients']` com `staleTime: 60_000`. `useCalendarSessions` usa `['calendar-sessions', fromIso, toIso]`. `src/main.tsx` define `staleTime: 60_000` e `refetchOnWindowFocus: false`. `signOut` em `src/providers/AuthProvider.tsx` não limpa o QueryClient. No mesmo separador, a conta seguinte recebe o cache fresco e `isLoading` fica falso sem `listBoard` / `listPatients` rodarem de novo. |
| 2 | Toda tabela de dado digitável está coberta por regra de acesso no banco e pela leitura no app | ✗ FAILED | O arquivo `sql/17-account-isolation.sql` fecha `board_columns` / `board_cards` e recria `patients_select` sem o OR de dono nulo. Ficha, imagens, laudos, financeiro e Google Calendar já têm política nas fases 3, 5, 7, 8, 11 e 16. A leitura na UI fica na frente dessa parede pelo cache descrito na verdade 1. |
| 3 | Nenhuma tela mostra paciente, sessão, valor ou texto de exemplo que não veio do banco daquela conta | ✓ VERIFIED | `rg "Disfunção cinesiológica" src` não acha linha. `analyzePhysicalEvaluationPdf` lança erro sem chave. `KanbanPage` mostra `Nenhuma lista ainda.` e não cita `board.sql`. |
| 4 | Autônomo B não lê coluna nem card de A; `organization_id` nulo não é balde; a empresa segue em `private.viewer_org_id()` e `can_read_patient` não é reescrito (D-05, D-06) | ✓ VERIFIED | Políticas do quadro exigem `organization_id is null and owner_id = (select auth.uid())` ou `organization_id is not null and organization_id = (select private.viewer_org_id())`. O arquivo não contém `create or replace function private.can_read_patient`. |
| 5 | `patients_select` deixa de liberar `created_by` nulo e mantém o ramo `created_by = auth.uid()` | ✓ VERIFIED | `create policy patients_select` tem só o ramo do criador (com pending/rejected) e `private.can_read_patient(id)`. A sequência `created_by is null` não está no arquivo. |
| 6 | Card com `patient_id` de outra conta falha no WITH CHECK; `owner_id` do cliente é sobrescrito | ✓ VERIFIED | `stamp_board_column_scope` grava `auth.uid()` no INSERT. `stamp_board_card_scope` copia o par da coluna pai. `board_cards_insert` / `board_cards_update` chamam `private.can_read_patient(patient_id)`. `createColumn` e `createCard` mandam `owner_id` de `getUser()` e não mandam `organization_id`. |
| 7 | Sem `VITE_GEMINI_API_KEY` a aba Avaliações não mostra laudo inventado; recarregar não restaura o item cujo digest é `d7513069ba374c9f`; a mensagem do serviço aparece; análises reais com outro diagnóstico permanecem | ✓ VERIFIED | Throw com a frase `A análise do PDF precisa da chave da IA. Sem ela, nenhum laudo é gerado.` O catch usa `err.message`. O FNV-1a 64 da frase simulada (só no planning, fora de `src/`) confere com `d7513069ba374c9f`. O filtro descarta só esse digest. |
| 8 | `createColumn` e `createCard` carimbam `owner_id` e o quadro vazio não aponta para seed global | ✓ VERIFIED | Inserts em `src/services/board.service.ts`. `KanbanPage` usa `Nenhuma lista ainda.` e `Não foi possível carregar o quadro.` Placeholder `Ex.: Aguardando retorno` permanece. |
| 9 | `listBoard` e `listDueCards` continuam sem filtro de dono no cliente; a agenda não filtra dono em memória | ✓ VERIFIED | Nenhum `.eq('owner_id')` nem `.filter` em `board.service.ts`. `CalendarPage` deriva prazos de `useBoard()` e só filtra por `dueOn`. O efeito “a outra conta não vê” está na verdade 1, não neste contrato. |

**Score:** 7/9 truths verified

As verdades 1 e 2 falham pela mesma causa: o cache do cliente não é por conta.

O script em `sql/17-account-isolation.sql` está no repositório e o cabeçalho avisa para não usar `supabase db push`. Este agente não aplicou o SQL no banco hospedado. Isso não entra como gap de código: a fase entrega o arquivo para o operador colar no SQL Editor. A prova com dois autônomos continua obrigatória depois que o cache for corrigido. Sem o cache corrigido, colar o SQL não impede a conta seguinte de ver o quadro, os pacientes e as sessões já carregados no mesmo separador por até 60 segundos.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` | Políticas do quadro, trigger de escopo, `patients_select` sem o OR de nulo, prova comentada | ✓ VERIFIED | 449 linhas. Oito políticas `TO authenticated`, ENABLE e FORCE RLS, backfill e prova com `begin`/`rollback` só em comentário. |
| `src/services/aiPhysicalEvaluation.service.ts` | Falha fechada sem chave | ✓ VERIFIED | Throw da mensagem exata; ramo com chave e `Falha no Google Gemini` permanecem. |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | Descarte do laudo inventado | ✓ VERIFIED | Hidrata `fisio.evaluations.${patientId}`, filtra o digest, grava o estado já filtrado, renderiza `errorMessage`. |
| `src/services/board.service.ts` | Carimbo `owner_id` no insert | ✓ VERIFIED | `requireUserId` + insert; leituras sem predicado de dono. |
| `src/pages/KanbanPage.tsx` | Estado vazio sem seed | ✓ VERIFIED | Texto exato do vazio e do erro. Dados vêm de `useBoard()`. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `sql/17-account-isolation.sql` | `private.viewer_org_id` | Ramo empresa de `board_columns_select` e `board_cards_select` | WIRED | `organization_id = (select private.viewer_org_id())` com `organization_id is not null` |
| `sql/17-account-isolation.sql` | `private.can_read_patient` | WITH CHECK do card quando `patient_id` não é nulo | WIRED | Insert e update |
| `public.patients` | `patients_select` | Política recriada sem o OR de `created_by` nulo | WIRED | `drop policy` + `create policy` no mesmo arquivo |
| `PatientPhysicalEvaluationPanel.tsx` | `aiPhysicalEvaluation.service.ts` | `analyzePhysicalEvaluationPdf` e `err.message` | WIRED | Import e catch |
| `PatientPhysicalEvaluationPanel.tsx` | `localStorage` | Digest `d7513069ba374c9f` em `fisio.evaluations.${patientId}` | WIRED | Filtro na hidratação; `useEffect` grava o array filtrado |
| `board.service.ts` | `public.board_columns` / `board_cards` | Insert com `owner_id` | WIRED | `createColumn` e `createCard` |
| `KanbanPage.tsx` | `useBoard` | `columns.length === 0` | WIRED | Estado vazio; a chave da query não é por usuário (verdade 1) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `KanbanPage.tsx` | `data` de `useBoard()` | `listBoard()` → `board_columns` / `board_cards` | A query é real, mas o cache de `['board']` pode ser da conta anterior | ⚠️ HOLLOW |
| `CalendarPage.tsx` | `dueCards` derivados de `useBoard()` | Mesmo cache do quadro | Prazo da conta anterior permanece na agenda enquanto o cache está fresco | ⚠️ HOLLOW |
| `PatientPhysicalEvaluationPanel.tsx` | `evaluations` | `localStorage` filtrado pelo digest | Descarta o laudo simulado; não inventa item novo no erro | ✓ FLOWING |
| `aiPhysicalEvaluation.service.ts` | retorno de `analyzePhysicalEvaluationPdf` | Gemini se houver chave; throw se não houver | Sem chave não devolve queixa nem diagnóstico | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Digest FNV-1a 64 do diagnóstico simulado | `node` com TextEncoder, offset `0xcbf29ce484222325`, primo `0x100000001b3` | `d7513069ba374c9f` | ✓ PASS |
| Frase do laudo fora de `src/` | busca `Disfunção cinesiológica` em `src` | nenhuma linha | ✓ PASS |
| Prova RLS no banco hospedado com dois autônomos | não executada | SQL não foi colado por este agente; o papel padrão do SQL Editor ignora RLS | ? SKIP |

### Probe Execution

Nenhum `probe-*.sh` declarado nos planos desta fase.

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | sem probe | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-28 | 17-01, 17-02, 17-03 | Isolamento por conta — cada conta vê só os próprios dados; sem mocks | ✗ BLOCKED | Aceite 1 e 2 falham no cache do app. Aceite 3 (sem texto de exemplo no lugar de registro) está no código da aba Avaliações e do quadro vazio. Nenhum outro ID de requisito está mapeado à fase 17 em `REQUIREMENTS.md`. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/hooks/useClinic.ts` | 53–57 | `queryKey: ['board']` sem uid | 🛑 Blocker | Quadro da conta anterior na conta seguinte |
| `src/providers/AuthProvider.tsx` | 78–83 | `signOut` sem limpar o cache | 🛑 Blocker | Mesma causa |
| `src/services/aiPhysicalEvaluation.service.ts` | 107–112 | Fallbacks clínicos quando o modelo omite um campo (`Testes padrão realizados.`, `Avaliação fisioterapêutica completa.`, `Seguir plano recomendado.`) | ⚠️ Warning | O plano 17-02 mandou manter esses fallbacks no ramo com chave. Não são o laudo lombar removido. Podem ir para o prontuário se o JSON vier incompleto. |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | 70–88 | Hidratação só no estado inicial; `useEffect` grava ao mudar `storageKey` | ⚠️ Warning | Troca de paciente com o painel montado pode gravar o laudo na chave do próximo. A chave não inclui uid. Não é o vazamento do quadro entre autônomos. |
| `sql/17-account-isolation.sql` | 119–129 | UPDATE do card copia o escopo da coluna de destino | ⚠️ Warning | Arrastar entre coluna pessoal e coluna da empresa troca quem vê o card. Dois autônomos distintos não compartilham coluna. |

Nenhum `TBD`, `FIXME` ou `XXX` nos arquivos desta fase.

### Human Verification Required

Estas provas continuam necessárias depois do fechamento do cache. O banco hospedado ainda não recebeu este SQL.

### 1. Colar o isolamento e provar dois autônomos

**Test:** No SQL Editor, se a contagem de quadro ou de pacientes sem dono for maior que zero, tratar o backfill comentado. Colar `sql/17-account-isolation.sql` uma vez. Não usar `supabase db push`. Rodar à parte o bloco comentado com `set local role authenticated` e o sub do autônomo B.
**Expected:** Select do card, da coluna, do paciente, da sessão e da evolução de A devolve 0 linhas. Insert na coluna de A devolve 42501. Com o sub do dono da empresa, o paciente do fisioterapeuta ativo continua visível. Insert de paciente com `created_by` igual ao uid e `RETURNING` sucede. A prova no papel padrão do Editor não vale.
**Why human:** O papel do Editor ignora RLS até `set local role authenticated`, e este agente não aplicou o script no projeto hospedado.

### 2. Trocar de conta no mesmo navegador

**Test:** Na conta A, abrir quadro, lista de pacientes e agenda. Sair. Entrar na conta B em até um minuto, sem recarregar o site à força, e abrir as mesmas telas.
**Expected:** Depois da correção do cache, B não vê tarefa, paciente, sessão nem nota de A. Hoje o código mostra o cache de A.
**Why human:** O tempo de frescura do cache e o que a tela pinta dependem da sessão no browser.

### Gaps Summary

O script do quadro faz o que a fase pediu no Postgres: ramo pessoal com `organization_id` nulo e `owner_id = auth.uid()`, ramo da empresa com `private.viewer_org_id()`, trigger que ignora o dono enviado pelo cliente, `patients_select` sem o terceiro OR, e `can_read_patient` intacto. O laudo lombar saiu do serviço e o quadro vazio não pede seed.

O objetivo não está cumprido na leitura do site. O `QueryClient` vive acima do login, o logout não o esvazia, e as chaves clínicas não levam o usuário. Com `staleTime` de 60 segundos, a conta seguinte vê quadro, pacientes e sessões da anterior sem o RLS ser consultado. As duas verdades que falharam são esse mesmo furo.

Não há fase posterior no roadmap para absorver esse item.

---

_Verified: 2026-09-24T02:38:21Z_
_Verifier: Claude (gsd-verifier)_
