# Phase 17: Isolamento de dados por conta - Research

**Researched:** 2026-09-23
**Domain:** RLS no Postgres (Supabase) + consultas do SPA que hoje não filtram dono
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Contas independentes não compartilham dados. Uma tarefa, paciente ou nota da conta A nunca aparece na conta B.
- **D-02:** O buraco do quadro é obrigatório, mas a fase procura o mesmo tipo de falha em todo dado digitável do site, no banco e nas consultas do app.
- **D-03:** A leitura e a escrita seguem o dono do registro. Não basta esconder no front se o banco ainda devolve a linha.
- **D-05:** O vazamento ocorreu de conta autônomo para conta autônomo. Autônomo nunca vê dados de outro autônomo.
- **D-06:** Quem está na mesma empresa continua vendo os dados dessa empresa. O isolamento novo não desfaz a equipe.

### Mocks
- **D-04:** Qualquer dado mockado, fixture de demonstração ou texto de exemplo que finja registro real sai do site. Telas vazias mostram estado vazio, não um paciente ou tarefa inventados.

### Claude's Discretion
- Ordem dos planos (mapa dos buracos, correção de políticas, limpeza de mocks), desde que D-01 a D-04 sejam cumpridos.
- Como nomear a coluna ou a política quando o padrão já existente de dono/organização puder ser reutilizado sem alargar o que cada conta vê.

### Deferred Ideas (OUT OF SCOPE)
None — phase covers the isolation audit, the fixes, and mock removal.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-28 | Isolamento por conta — cada conta vê só os próprios dados; sem mocks. Aceite: conta nova não lista tarefa, paciente, sessão ou nota de outra conta; banco e consultas recusam leitura e escrita fora do dono; nenhuma tela usa paciente, tarefa, valor ou texto de exemplo no lugar de dado real. | Quadro (`board_columns` / `board_cards`) é o vazamento confirmado no código e no SQL da fase 3. Pacientes com `created_by` nulo ainda são legíveis por qualquer autenticado. O restante clínico já usa `private.can_read_patient` / `can_write_patient`. O único registro falso ainda renderizado é a simulação do Gemini na aba Avaliações. |
</phase_requirements>

## Summary

O incidente (conta autônomo nova viu uma tarefa do quadro criada na conta do operador) está no código: `listBoard` e `listDueCards` leem `board_columns` e `board_cards` sem coluna de dono, e o SQL da fase 3 declara de propósito que essas tabelas ficam inalteradas. Políticas permissivas no Postgres se combinam com OR. Criar uma política estreita sem derrubar a antiga `USING (true)` não fecha o vazamento. A correção é no banco, aplicada no SQL Editor, em `.planning/phases/17-isolamento-de-dados-por-conta/sql/`. O front não é a fronteira.

O restante digitável da clínica já está amarrado ao paciente (`can_read_patient` / `can_write_patient`), ao `owner_id` do financeiro ou ao `user_id` do Google Calendar. Dois furos residuais continuam no SQL já aplicado: `patients_select` ainda libera `created_by is null` para qualquer JWT autenticado, e o quadro não tem escopo. A equipe da fase 3 permanece: dono da empresa lê a ficha dos fisioterapeutas ativos; fisioterapeuta não lê a ficha do colega; autônomo não tem organização e não pode cair num balde `organization_id IS NULL` compartilhado.

O mock que ainda aparece como registro é a simulação em `analyzePhysicalEvaluationPdf`: sem `VITE_GEMINI_API_KEY` o painel mostra um laudo lombar inventado (L5-S1) e grava em `localStorage`. Placeholders `Ex.:` em inputs vazios não são registros. Páginas da confeitaria (`OrdersPage`, `TasksPage`, etc.) não estão em `src/routes/index.tsx` e o shell não as importa.

**Primary recommendation:** Novo SQL idempotente que (1) dá dono ao quadro — `owner_id` pessoal quando não há organização, `organization_id` só quando `private.viewer_org_id()` não é nulo — e apaga as políticas antigas do quadro; (2) remove o `OR created_by is null` de `patients_select`; (3) troca a simulação do Gemini por erro em português e estado vazio. Prova com `set local role authenticated` + `request.jwt.claim.sub` no SQL Editor e com as telas `/quadro`, `/agenda`, `/pacientes` e a aba Avaliações.

## Project Constraints (from .cursor/rules/)

Não existe `.cursor/rules/` neste repositório. As restrições abaixo vêm do pedido da fase, do `17-CONTEXT.md` e das decisões já gravadas em `.planning/STATE.md`.

- Supabase + React/Vite. RLS é a fronteira real. Predicados em `src/lib/accountAccess.ts` são só UX (ASVS 4.1.1).
- SQL novo em `.planning/phases/17-isolamento-de-dados-por-conta/sql/`. O operador cola no SQL Editor. Nunca planejar `supabase db push`.
- Não alterar código de convite (`join_code`) nem o modelo de equipe, exceto onde uma política larga vaza entre organizações ou entre autônomos.
- Não reescrever `private.can_read_patient` / `private.can_write_patient`. Reutilizá-los nas tabelas que já têm `patient_id`.
- Não montar o domínio da confeitaria (`src/services/modules.service.ts`, `src/lib/permissions.ts`) nas rotas da clínica.
- `response_language`: português (pt-BR).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Recusar SELECT/INSERT/UPDATE/DELETE de outra conta | Database / Storage | — | D-03. O browser usa a anon key; PostgREST aplica RLS. Esconder card no React não impede um `select` direto. |
| Escopo do quadro (autônomo vs empresa) | Database / Storage | Browser / Client | Colunas `owner_id` / `organization_id` e políticas. O cliente só carimba o dono no insert, no mesmo papel do `created_by` de paciente. |
| Leitura da ficha, sessões, notas, metas, fotos, PDFs, imagens | Database / Storage | — | Já delegada a `can_read_patient` / `can_write_patient`. Esta fase só fecha o `OR` de `created_by` nulo. |
| Lista e agenda na tela | Browser / Client | Database / Storage | `listPatients` e `listSessionsInRange` não filtram dono no JS de propósito: o RLS devolve o conjunto. Manter assim. |
| Estado vazio e remoção do laudo inventado | Browser / Client | — | Não há linha no banco. O texto falso nasce em `aiPhysicalEvaluation.service.ts` e em `localStorage`. |
| Equipe (código, aceite, recusa) | Database / Storage | — | Fora do escopo, salvo se uma política do quadro usar `viewer_org_id()` sem checar membership ativo. |

## Standard Stack

Nenhum pacote novo. O isolamento usa Postgres RLS já adotado nas fases 3, 5, 7, 8, 11 e 16.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Postgres RLS + `auth.uid()` | Supabase hospedado (políticas `TO authenticated`, `(select auth.uid())`) | Fronteira de leitura e escrita | [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| `@supabase/supabase-js` | `^2.49.8` (já em `package.json`) | Cliente do SPA | Já é o único caminho de dados. Não trocar. |
| Helpers `private.can_read_patient` / `can_write_patient` / `viewer_org_id` | SQL da fase 3, já aplicado | Ficha e, no quadro da empresa, o id da organização | Reutilizar sem alargar. [VERIFIED: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | `^5.76.1` | Invalidar `['board']` e `['board-dues']` depois do insert | Já em `src/hooks/useClinic.ts`. Sem filtro de dono no cache além do que o RLS devolveu. |
| Zod | `^3.25.28` | Formulários já existentes | Não criar schema de autorização. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RLS no quadro | `.filter` no React depois do `select` | Viola D-03. Qualquer cliente com a anon key ainda lê a linha. |
| `organization_id IS NULL` = “visível para todos os autônomos” | `owner_id = auth.uid()` quando não há org | `NULL = NULL` no predicado vaza entre autônomos. É o formato do incidente. |
| Reescrever `can_read_patient` para o quadro | Colunas próprias `owner_id` + `organization_id` | O quadro não é filho de paciente. Card pode existir sem `patient_id`. |
| Apagar o domínio da confeitaria nesta fase | Deixar páginas fora das rotas | Elas não renderizam. Apagar é refactor largo, fora do incidente. |

**Installation:**

```bash
# nenhum pacote
```

**Version verification:** versões lidas de `package.json` neste repositório. Não há pacote novo para `npm view`.

## Package Legitimacy Audit

Nenhum pacote externo será instalado. `slopcheck` não foi executado porque não há recomendação de pacote.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | Nenhum pacote |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
Conta autônomo B (JWT)
        │
        ▼
SPA  /quadro  /agenda  /pacientes  /painel  ficha
        │
        │  supabase.from('board_cards').select(...)     sem filtro de dono
        │  supabase.from('patients').select(...)        sem filtro de dono
        ▼
PostgREST  (role authenticated, anon key)
        │
        ├─ board_columns / board_cards
        │     HOJE: políticas da fase 3 não tocam nestas tabelas
        │     ALVO: owner_id = uid  OU  organization_id = viewer_org_id()
        │           organization_id nulo NUNCA significa “todos”
        │
        ├─ patients (+ goals, alerts, sessions, evolutions, evaluations,
        │            focus, pain, images, ai reports, avatars)
        │     HOJE: can_read_patient, EXCETO patients_select com
        │           created_by IS NULL visível a qualquer autenticado
        │     ALVO: remover esse OR
        │
        ├─ autonomo_prices / autonomo_session_charges
        │     owner_id = uid E account_type = autonomo  (já isolado)
        │
        └─ google_calendar_* 
              user_id = uid; secrets sem GRANT (já isolado)

Empresa + fisioterapeuta ativo
        │
        ▼
viewer_org_id() = organizations.id daquela empresa
        │
        ├─ ficha: can_read_patient (dono da empresa lê; colega não lê a ficha do outro)
        └─ quadro: uma linha com organization_id dessa empresa
              (tarefa da clínica, não ficha)
```

### Recommended Project Structure

```text
.planning/phases/17-isolamento-de-dados-por-conta/sql/
└── 17-account-isolation.sql    # quadro + fechar created_by nulo; idempotente; SQL Editor

src/services/board.service.ts   # carimbar owner no insert; select continua sem filtro JS
src/pages/KanbanPage.tsx        # estado vazio, sem “execute supabase/board.sql”
src/services/aiPhysicalEvaluation.service.ts   # sem laudo inventado
src/components/patients/PatientPhysicalEvaluationPanel.tsx  # não reidratar localStorage falso
```

Não criar tabela nova de “tenant”. Não criar helper de autorização no browser.

### Pattern 1: Dono pessoal ou organização, nunca NULL compartilhado

**What:** Autônomo não ganha `organizations` no `handle_new_user`. `private.viewer_org_id()` devolve null. O quadro pessoal usa `owner_id`. O quadro da empresa usa `organization_id` não nulo igual a `viewer_org_id()`, e só para membership que não está `pending` nem `rejected`.

**When to use:** `board_columns` e `board_cards`. Card herda o escopo da coluna (`column_id`), para ninguém enfiar card na coluna de outra conta.

**Example:**

```sql
-- Source: padrão já usado em 03-account-types-team.sql (select auth.uid())
-- e em supabase.com/docs/guides/database/postgres/row-level-security
-- ((select auth.uid()) = user_id) + TO authenticated

create policy board_columns_select
  on public.board_columns
  for select
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );
```

O mesmo predicado em INSERT (`WITH CHECK`), UPDATE (`USING` e `WITH CHECK`) e DELETE (`USING`). Trigger `BEFORE INSERT` força `owner_id := auth.uid()` e, se a conta não tem org ativa, `organization_id := null`. Não confiar no valor enviado pelo cliente.

`WITH CHECK` do card: `patient_id is null OR private.can_read_patient(patient_id)`, e a coluna-pai tem o mesmo `owner_id` / `organization_id`.

### Pattern 2: Derrubar políticas antigas antes de criar as novas

**What:** Políticas permissivas (o padrão) se somam com OR. Uma política `USING (true)` que permanecer anula a política nova.

**When to use:** Sempre no quadro. O `CREATE TABLE` original não está no git; os nomes das políticas ao vivo são desconhecidos. Apagar pelo catálogo, como a fase 3 fez nas tabelas clínicas.

**Example:**

```sql
-- Source: postgresql.org/docs/current/sql-createpolicy.html
-- “All permissive policies … combined together using the Boolean OR operator.”
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'board_cards'
  loop
    execute format('drop policy if exists %I on public.board_cards', r.policyname);
  end loop;
end
$$;
```

Repetir para `board_columns`. Depois `ENABLE` e `FORCE ROW LEVEL SECURITY` (mesmo motivo da fase 5: o owner da tabela não fura a parede no papel `authenticated`).

### Pattern 3: Fechar o SELECT transitório de paciente sem dono

**What:** `patients_select` ainda tem `or (created_by is null and auth.uid() is not null)`. Isso foi dívida documentada da fase 3 quando havia mais de um profile e o backfill não rodou. Qualquer autenticado, inclusive fisioterapeuta em `/aguardando`, lê essas linhas.

**When to use:** No mesmo arquivo SQL, depois de um `SELECT count(*)` de pacientes com `created_by` nulo. Se a contagem for maior que zero, o operador atribui um dono conhecido ou aceita que essas linhas sumam (fail closed). Em seguida recriar `patients_select` sem esse OR, copiando o restante de `03-fix-patients-select-insert-returning.sql` (o ramo `created_by = auth.uid()` precisa continuar, porque `can_read_patient` é `STABLE` e não vê a linha do `INSERT … RETURNING`).

Não alterar `can_read_patient`. Tabelas-filhas já não têm o OR de nulo.

### Pattern 4: Prova no SQL Editor, não no CLI

**What:** O editor roda como role que ignora RLS. A prova troca o role e o `sub` do JWT, como na documentação do Supabase.

**Example:**

```sql
-- Source: supabase.com/docs/guides/database/postgres/row-level-security
-- seção “Switch role and identity with set local role and set local request.jwt.claim.sub”
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<uuid-do-autonomo-B>';

-- vazio: card criado pelo autônomo A
select id from public.board_cards where id = '<uuid-do-card-de-A>';

rollback;
```

`USING` que esconde a linha não gera erro: o `SELECT` volta 0 linhas. `WITH CHECK` que recusa o insert gera `42501`. [CITED: supabase.com/docs/guides/database/postgres/row-level-security]

### Anti-Patterns to Avoid

- **Filtro só no React:** `cards.filter(card => card.ownerId === me)` com o `select` ainda devolvendo a linha do outro. D-03.
- **`organization_id IS NOT DISTINCT FROM viewer_org_id()`:** dois autônomos com org nula passam os dois. O incidente se repete.
- **Política nova ao lado da antiga:** OR permissivo. [CITED: postgresql.org/docs/current/sql-createpolicy.html]
- **Backfill “se só existe um profile”:** a fase 3 já fez isso e parou de valer no dia em que a segunda conta nasceu. Não repetir essa condição para o quadro.
- **`supabase db push` ou arquivo só em `supabase/`:** `supabase/` está no `.gitignore`. A cópia que vale é `.planning/phases/17-isolamento-de-dados-por-conta/sql/`.
- **Reescrever `can_read_patient` para a empresa ver tudo de todo mundo:** isso alarga a ficha entre fisioterapeutas. D-06 preserva o modelo da fase 3, não o substitui por um tenant único.
- **Deixar o texto “execute o script supabase/board.sql”:** esse arquivo não existe no repositório. A tela vazia deve dizer só para criar uma lista.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Isolar contas | Array filtrado no cliente, ou coluna só na UI | RLS `TO authenticated` com `(select auth.uid())` | O SPA não é o único cliente da anon key. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| “Quem é o usuário” | Ler `user_metadata` no JWT dentro da política | `auth.uid()` e tabelas `profiles` / `organization_memberships` | `user_metadata` o próprio usuário altera. [CITED: a mesma página, `auth.jwt()`] |
| Quadro da empresa | Segunda árvore de papéis no React | `private.viewer_org_id()` já existente | Evita divergir do código de equipe. |
| Laudo sem chave de API | Objeto com diagnóstico L5-S1 | Erro em português e lista vazia | O objeto é apresentado como avaliação do PDF. |
| Teste de RLS | `supabase test db` / pgTAP | Bloco `begin; set local role …; rollback;` no SQL Editor | CLI Supabase e `psql` não estão instalados. O fluxo do projeto é o Editor. |

**Key insight:** O vazamento já passou pelo banco. Qualquer correção que não mude `pg_policies` em `board_cards` deixa a tarefa do operador visível na conta nova.

## Runtime State Inventory

Fase de migração de acesso: depois de editar o repositório, o Postgres hospedado ainda tem as linhas e as políticas velhas.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `board_columns` / `board_cards` no projeto hospedado, sem `owner_id` no insert do app. Linhas atuais são as tarefas que vazaram. | Migração de dados: adicionar colunas; o operador preenche `owner_id` das linhas existentes com o profile dele **antes** de ligar a política que esconde `owner_id` nulo. Sem esse update, o quadro dele também fica vazio (fail closed, aceitável só se ele topar recriar). |
| Stored data | `patients.created_by is null`, se ainda houver depois do backfill da fase 3 (só rodou quando `count(profiles) = 1`). | Migração: contar; atribuir dono ou aceitar que somem; então dropar o OR. Código novo já grava `created_by`. |
| Stored data | `localStorage` `fisio.evaluations.${patientId}` no browser de quem rodou a simulação. | Código: apagar essas chaves ao abrir o painel ou no logout. Não é linha no Postgres. |
| Live service config | Políticas ao vivo de `board_*` não estão no git. O dump `00-live-handle-new-user.md` (2026-09-08) manda deixá-las inalteradas. | O primeiro passo do SQL é `select` em `pg_policies` (leitura). Aplicar o script no Editor. Não há export de política no repositório para “atualizar”. |
| OS-registered state | Nenhum. Verificado: não há unit systemd, cron ou agendador neste escopo. | Nenhum. |
| Secrets/env vars | Nenhum nome de segredo muda. `VITE_GEMINI_API_KEY` continua opcional; sem ela o app passa a falhar fechado em vez de inventar laudo. | Nenhum rename de chave. |
| Build artifacts | Nenhum pacote instalado com o nome antigo. | Nenhum. |

## Mapa do que o app grava (auditoria)

Veredito para autônomo A ler ou escrever linha do autônomo B. “Isolado” assume que o SQL da fase correspondente foi colado no Editor (os SUMMARYs dizem que foi).

| Dado na tela | Tabela / bucket | Onde o app escreve | A lê B? |
|--------------|-----------------|--------------------|---------|
| Quadro e prazo na Agenda | `board_columns`, `board_cards` | `src/services/board.service.ts` — select/insert sem dono | **Sim, hoje.** Fase 3 não criou política. É o incidente. |
| Pacientes, resumo, notas administrativas (`admin_notes`, `ai_summary`) | `patients` | `patients.service.ts` carimba `created_by` | **Não**, se `created_by` está preenchido. **Sim**, se `created_by` é nulo (`patients_select`). |
| Sessões e notas da sessão | `patient_sessions` | `calendar.service.ts`, `sessions.service.ts` | Não, via `can_read_patient(patient_id)`. |
| Evolução | `patient_session_evolutions` | `sessions.service.ts` grava `patient_id` | Não, via `can_read_patient(patient_id)`. |
| Avaliações (ficha) | `patient_evaluations` | `evaluations.service.ts` | Não. Coluna `ficha` (fase 12) não criou política nova. |
| Metas, alertas, foco, dor | `patient_goals`, `patient_alerts`, `patient_focus_areas`, `patient_pain_logs` | `patients.service.ts` / `patientAi.service.ts` | Não. |
| Galeria | `patient_images` + bucket | `patientImages.service.ts` | Não. `FORCE` + `can_read_patient`. |
| PDF / resumo IA salvo | `patient_ai_reports` + bucket | `patientAiReports.service.ts` | Não. |
| Foto | `patients.photo_path` + bucket `patient-avatars` | `patientPhoto.service.ts` | Não. Storage chama `can_read_patient`. |
| Financeiro | `autonomo_prices`, `autonomo_session_charges` | `finance.service.ts` envia `owner_id` | Não. Política exige `owner_id = uid` e `account_type = autonomo`. Empresa e fisio recebem 0 linhas. RPC `autonomo_finance_totals` é `security invoker`. |
| Google Agenda | `google_calendar_connections`, `google_calendar_session_links` | `googleCalendar.service.ts` | Não. `user_id = uid`. `google_calendar_secrets` sem GRANT para `authenticated`. |
| Equipe | `organizations`, `organization_memberships` | trigger + RPC, sem insert do cliente | Não alargar. SELECT de org é `owner_id = uid`. |
| Perfis (nome na ficha) | `profiles` | `handle_new_user` | Não entre autônomos: `can_view_profile` é o próprio id ou colega da mesma org. |
| Laudo “físico” sem API | nenhum | `localStorage` + objeto fixo em `aiPhysicalEvaluation.service.ts` | Não cruza conta em outro browser. **Aparece como registro falso na mesma conta.** D-04. |
| Pedidos, tarefas `tasks`, cupons, estoque | tabelas da confeitaria via `modules.service.ts` | páginas não roteadas | Fora da UI. Não ligar rotas. Não reescrever o RLS da confeitaria nesta fase. |

Consultas clínicas sem predicado de dono no JS (`listPatients`, `listSessionsInRange`, `getPatientById`) estão corretas **desde que** o RLS segure. Não adicionar filtro em memória como correção. O quadro é a exceção: o RLS de hoje não segura.

`KanbanPage` e `CalendarPage` (`listDueCards`) são as telas do vazamento. Colar o UUID de um paciente de B em `/pacientes/:id` deve continuar caindo em “não encontrado” por causa de `can_read_patient`, depois que o OR de `created_by` nulo sair.

## Common Pitfalls

### Pitfall 1: Política nova ao lado de `USING (true)`

**What goes wrong:** Autônomo B continua vendo o card de A.
**Why it happens:** Políticas permissivas se combinam com OR. [CITED: postgresql.org/docs/current/sql-createpolicy.html]
**How to avoid:** `DROP POLICY` de toda linha de `pg_policies` em `board_columns` e `board_cards` antes dos `CREATE POLICY`.
**Warning signs:** `pg_policies.qual` ainda contém `true` depois do script.

### Pitfall 2: Autônomos compartilham o balde nulo

**What goes wrong:** O incidente volta no dia seguinte ao deploy.
**Why it happens:** `handle_new_user` não cria organização para `autonomo`. Dois `organization_id` nulos comparam iguais se o predicado for “org do viewer”.
**How to avoid:** Ramo explícito `organization_id is null AND owner_id = auth.uid()`.
**Warning signs:** Duas contas autônomo, ambas sem membership, veem a mesma lista.

### Pitfall 3: Prova no SQL Editor como superusuário

**What goes wrong:** O `SELECT` mostra todas as linhas e o operador conclui que a política falhou, ou o contrário: um `SELECT` sem `set local role` “passa”.
**Why it happens:** O editor não usa o JWT do usuário. `service_role` tem `bypassrls`. [CITED: supabase.com/docs/guides/database/postgres/row-level-security]
**How to avoid:** `set local role authenticated` e `set local request.jwt.claim.sub` dentro de `begin`/`rollback`.
**Warning signs:** `select auth.uid()` devolve null no meio do teste.

### Pitfall 4: `INSERT … RETURNING` em `patients` quebra de novo

**What goes wrong:** Criar paciente volta “new row violates row-level security”.
**Why it happens:** `can_read_patient` é `STABLE` e não vê a linha do comando atual. O fix `03-fix-patients-select-insert-returning.sql` existe por isso.
**How to avoid:** Ao recriar `patients_select`, manter o ramo `created_by = auth.uid()` (e o bloqueio de pending/rejected). Remover só o OR de nulo.
**Warning signs:** Conta que já cria paciente passa a falhar no insert depois desta fase.

### Pitfall 5: Estado vazio que aponta para seed

**What goes wrong:** `KanbanPage` diz “execute o script supabase/board.sql”. Esse arquivo não está no disco. Alguém cola um seed global e reabre o vazamento.
**Why it happens:** Texto de erro antigo, anterior ao isolamento.
**How to avoid:** Estado vazio: “Nenhuma lista ainda.” Sem script de seed compartilhado.
**Warning signs:** `rg board.sql src/pages/KanbanPage.tsx` ainda acha a frase.

### Pitfall 6: Simulação do Gemini tratada como “fallback de UX”

**What goes wrong:** Sem chave, a aba Avaliações mostra queixa lombar, Lasègue e metas inventadas, e o `localStorage` as reapresenta na próxima visita.
**Why it happens:** `analyzePhysicalEvaluationPdf` devolve um objeto fixo depois do `if` da chave. `PatientPhysicalEvaluationPanel` está montado em `PatientEvaluationPanel` na aba Avaliações de `PatientPage`.
**How to avoid:** Sem chave, lançar erro em português. Não gravar o resultado. Ao montar, descartar entradas já salvas que tenham o `id` com prefixo `eval_` da simulação, ou limpar `fisio.evaluations.*`.
**Warning signs:** A string `Disfunção cinesiológica funcional da coluna lombossacra` ainda está em `src/`.

### Pitfall 7: Alargar a ficha para “a empresa inteira lê tudo de todos”

**What goes wrong:** Fisioterapeuta passa a ler paciente do colega. A fase 3 não faz isso: só o dono da empresa lê a ficha do terapeuta ativo; escrita continua só do `created_by`.
**Why it happens:** Leitura apressada de D-06 como “um tenant só”.
**How to avoid:** Quadro da empresa pode ser compartilhado (é tarefa da clínica, não ficha). Ficha continua em `can_read_patient` / `can_write_patient` sem edição.
**Warning signs:** Diff em `private.can_read_patient` ou em `join_code`.

## Code Examples

### Insert do quadro hoje (sem dono)

```typescript
// src/services/board.service.ts — verificado neste repositório
const { error } = await supabase.from('board_cards').insert({
  column_id: input.columnId,
  title: input.title,
  description: input.description || null,
  patient_id: input.patientId || null,
  due_on: input.dueOn || null,
  sort_order: (last?.sort_order ?? -1) + 1,
})
```

O plano acrescenta o carimbo, mas o trigger é a autoridade (o cliente pode omitir ou mentir).

### Leitura que depende do RLS (manter)

```typescript
// src/services/patients.service.ts — sem .eq('created_by')
const { data, error } = await supabase
  .from('patients')
  .select(LIST_COLUMNS)
  .order('full_name', { ascending: true })
```

### Laudo que precisa sair

```typescript
// src/services/aiPhysicalEvaluation.service.ts
// Sem chave, após o loop dos modelos, o código espera 1,8s e devolve
// mainComplaint / cinesiologicDiagnosis / suggestedGoals fixos.
// Substituir por throw new Error('…') em português. Não devolver esse objeto.
```

### Pacientes — trecho a remover

```sql
-- .planning/phases/03-tipos-de-conta-e-equipe/sql/03-fix-patients-select-insert-returning.sql
or (created_by is null and (select auth.uid()) is not null)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `USING (true)` em tabelas `patient_*` | `can_read_patient` / `can_write_patient` | Fase 3, SQL aplicado | Ficha isolada, com o furo do `created_by` nulo ainda escrito na política |
| Quadro fora do REQ-15 | Esta fase coloca dono | Fase 3, comentário no topo do SQL | Vazamento autônomo→autônomo |
| `auth.uid()` chamado por linha | `(select auth.uid())` | Guia atual de RLS do Supabase | Mesmo resultado, InitPlan. O SQL desta fase já deve nascer assim. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |

**Deprecated/outdated:**

- Seed compartilhado `supabase/board.sql`: referenciado na UI, ausente no repo. Não recriar como dados globais.
- Simulação “para teste da UI” no serviço de PDF: é dado de exemplo no produto.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | As políticas ao vivo de `board_*` ainda são permissivas (ou inexistentes com GRANT amplo). O `CREATE TABLE` não está no git; a conclusão vem do incidente, do comentário da fase 3 e do select sem dono. | Mapa / Pitfall 1 | Se alguém já tiver fechado o quadro à mão, o script idempotente (drop + create) ainda é o estado desejado. Conferir `pg_policies` antes, para não atribuir o backfill ao profile errado. |
| A2 | Linhas atuais do quadro devem ser atribuídas ao profile do operador (quem criou a tarefa que vazou), não apagadas. | Runtime State Inventory | Se o uuid colado no `UPDATE` for o da cliente, a tarefa passa a ser dela. O SQL deve deixar o uuid num comentário que o operador substitui, nunca hardcoded. |
| A3 | Quadro da mesma empresa é uma lista compartilhada (`organization_id`), enquanto a ficha continua por `created_by`. | Pattern 1 / Pitfall 7 | Se a intenção fosse quadro pessoal também dentro da empresa, fisioterapeutas passariam a ver títulos de tarefa uns dos outros. D-06 pede que a empresa continue vendo os dados daquela organização; a ficha não muda. |

## Open Questions

1. **Quantas linhas de `board_*` e de `patients.created_by is null` existem hoje?**
   - What we know: o app não tem essas colunas de escopo no quadro; o OR de nulo está no SQL aplicado.
   - What's unclear: contagem no banco hospedado. Não há `psql` local nem service role no repositório.
   - Recommendation: o script começa com dois `SELECT count(*)` comentados para o operador ler antes do `UPDATE` de backfill. Não bloquear o plano nesse número.

2. **Nomes exatos das políticas atuais do quadro**
   - What we know: não estão em nenhum `.sql` rastreado.
   - What's unclear: `policyname` ao vivo.
   - Recommendation: drop via `pg_policies`, não via lista fixa de nomes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `npm run typecheck` | ✓ | v26.4.0 | — |
| npm | scripts do `package.json` | ✓ | 12.0.2 | — |
| SQL Editor do Supabase (operador) | Aplicar e provar RLS | ✓ (fluxo do projeto; não é CLI local) | — | — |
| Supabase CLI | `db push` / `supabase test db` | ✗ | — | Não usar. SQL Editor. |
| psql | Prova local | ✗ | — | Bloco `set local role` no Editor. |

**Missing dependencies with no fallback:**

- Nenhuma para o desenho desta fase. A prova de RLS é manual no Editor de propósito.

**Missing dependencies with fallback:**

- Supabase CLI e psql: o fallback é o SQL Editor, que já é o caminho obrigatório do projeto.

## Validation Architecture

Não há Vitest, Jest, Playwright nem `npm test`. `workflow.nyquist_validation` não está `false` em `.planning/config.json` (a chave não existe; tratar como ligado). Não instalar framework nesta fase. A prova que distingue “passou” de “falhou” é SQL no Editor mais buscas no código.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Nenhum. Typecheck do TypeScript + asserções SQL manuais no Editor |
| Config file | `tsconfig` já usado por `npm run typecheck`. Sem arquivo de teste. |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` e o bloco SQL de prova (humano, SQL Editor) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-28 | Autônomo B não lê card/coluna de A | manual SQL (RLS). `USING` → 0 linhas; insert na coluna de A → `42501` | Bloco em `17-account-isolation.sql` com `set local role authenticated` e `request.jwt.claim.sub`. Não há comando local < 30s que fale com o Postgres hospedado. | ❌ Wave 0 (o arquivo SQL ainda não existe; a prova vai dentro dele) |
| REQ-28 | Autônomo B não lê paciente, sessão ou nota de A | manual SQL + tela | Mesmo bloco: `select` em `patients`, `patient_sessions` (notas), `patient_session_evolutions` com o sub de B e o id de A → 0 linhas. Tela: `/pacientes`, `/painel`, `/agenda`, URL `/pacientes/<id-de-A>`. | ❌ mesmo SQL |
| REQ-28 | Empresa continua vendo a ficha do fisioterapeuta ativo; outro autônomo não | manual SQL | `set local` com o sub do dono da empresa → o paciente do terapeuta ativo aparece. Sub de outro autônomo → 0. Não mudar `can_read_patient`. | ❌ mesmo SQL |
| REQ-28 | Conta nova em `/quadro` não mostra a tarefa do operador | manual UI | Login da conta nova. Lista vazia ou só listas que ela criou. Agenda não mostra o prazo da tarefa do outro. | ❌ roteiro no plano (UAT) |
| REQ-28 | Nenhum texto de exemplo no lugar de registro | unit por busca (rápida) | `rg -n "Disfunção cinesiológica" src` deve sair vazio; `rg -n "board.sql" src/pages/KanbanPage.tsx` deve sair vazio | ✅ comandos existem; o código ainda falha neles até a implementação |
| REQ-28 | Insert de paciente não regride | manual SQL | Como autônomo A, insert com `created_by = uid` e `RETURNING` sucede. | ❌ mesmo SQL |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` e os `rg` do mock
- **Phase gate:** SQL de prova executado pelo operador (resultado colado ou marcado no UAT) e telas `/quadro`, `/agenda`, `/pacientes`, aba Avaliações sem laudo inventado, antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` — políticas, backfill comentado, e o bloco `begin`/`rollback` de prova (REQ-28)
- [ ] Nenhum `tests/` novo — não há Postgres local. Não adicionar Vitest só para afirmar strings.
- [ ] Framework install: não

### Roteiro mínimo de tela (REQ-28)

1. Autônomo A cria uma lista e um card com título reconhecível e, se quiser, uma data. Confere em `/quadro` e em `/agenda`.
2. Autônomo B (conta nova, sem código de empresa) abre `/quadro` e `/agenda`. O título de A não aparece. Criar um card em B não aparece em A.
3. Autônomo B abre `/pacientes` e cola `/pacientes/<id de um paciente de A>`. Lista vazia / ficha inexistente. Sessões e notas não aparecem.
4. Dono da empresa abre a ficha de um paciente criado por fisioterapeuta ativo da mesma empresa. A ficha continua visível. Um autônomo de fora não a vê.
5. Aba Avaliações, ambiente sem chave Gemini: upload de PDF mostra erro, não queixa lombar nem metas inventadas. Recarregar a página não traz o laudo de volta do `localStorage`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Sessão Supabase já existe. Esta fase não mexe em login. |
| V3 Session Management | no | Não mudar persistência do JWT. |
| V4 Access Control | yes | RLS `TO authenticated`. Helpers `private.*` `SECURITY DEFINER` com `search_path` vazio, já revogados de `anon`. Quadro segue o mesmo desenho. |
| V5 Input Validation | yes | Zod nos formulários que já existem. Não é a parede entre contas. Trigger sobrescreve `owner_id` mentido. |
| V6 Cryptography | no | Sem cripto nova. |

### Known Threat Patterns for Supabase SPA + RLS

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR no quadro (`select` sem dono) | Information disclosure | Políticas por `owner_id` / `organization_id`. Drop das políticas OR-permissivas. |
| `patients.created_by is null` | Information disclosure | Remover o OR. Backfill ou fail closed. |
| Insert com `owner_id` de outra pessoa | Tampering | `WITH CHECK` + trigger que grava `auth.uid()`. |
| Card apontando para `patient_id` de outra conta | Information disclosure | `WITH CHECK` com `can_read_patient`. O embed `patients(...)` já respeita o RLS de `patients`, mas o título do card não pode depender disso. |
| Filtro só na UI | Elevation of privilege | Proibido como correção (D-03). |
| `user_metadata` / `account_type` dentro do JWT como autorização | Tampering | Ler `profiles.account_type` na política, como o financeiro já faz. Não usar `auth.jwt() -> user_metadata`. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| Laudo clínico inventado | Repudiation / integridade do prontuário | Não persistir texto que não veio do modelo nem do usuário. |
| `localStorage` da simulação em computador compartilhado | Information disclosure | Apagar `fisio.evaluations.*` ao descartar a simulação. |
| `service_role` no browser | Elevation of privilege | Continua fora do cliente. `bypassrls` não é mitigado por `FORCE`. [CITED: a mesma página do Supabase] |

## Sources

### Primary (HIGH confidence)

- [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security) — `(select auth.uid())`, `TO authenticated`, `set local role` + `request.jwt.claim.sub`, `USING` devolve 0 linhas, `WITH CHECK` devolve `42501`, `service_role` ignora RLS, não usar `user_metadata` para autorizar
- [postgresql.org/docs/current/sql-createpolicy.html](https://www.postgresql.org/docs/current/sql-createpolicy.html) — políticas permissivas combinadas com OR
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` e `03-fix-patients-select-insert-returning.sql` — helpers, quadro explicitamente fora, OR de `created_by` nulo
- `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` — `owner_id` + `FORCE` + RPC `security invoker`
- `.planning/phases/08-integracao-google-agenda/sql/08-google-calendar.sql` — `user_id = auth.uid()`
- SQL das fases 7, 11, 13 e 16 — imagens, relatórios e avatar via `can_read_patient`
- `src/services/board.service.ts`, `src/pages/KanbanPage.tsx`, `src/services/aiPhysicalEvaluation.service.ts`, `src/routes/index.tsx`, `src/lib/accountAccess.ts`

### Secondary (MEDIUM confidence)

- `.planning/codebase/CONCERNS.md` — quadro fora do RLS e `created_by` nulo, alinhado ao SQL e ao incidente
- `.planning/phases/03-tipos-de-conta-e-equipe/03-REVIEW.md` — mesmo furo de `patients_select`, descrito antes do fix de RETURNING (o OR de nulo permanece no fix)

### Tertiary (LOW confidence)

- Nomes das políticas ao vivo de `board_*` — não inspecionados no banco hospedado nesta sessão. Tratados como “apagar o que `pg_policies` listar”.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — nenhum pacote novo; RLS já é o padrão do repositório e da doc atual do Supabase
- Architecture: HIGH — o buraco do quadro e o OR de `created_by` estão no código e no SQL rastreado; o compartilhamento do quadro na empresa segue D-06 sem editar `can_read_patient`
- Pitfalls: HIGH — OR de políticas e o balde `NULL` são comportamento documentado, não palpite

**Research date:** 2026-09-23
**Valid until:** 2026-10-23 (RLS do Postgres estável; revalidar só se o SQL ao vivo do quadro for colado no repositório antes do plano)

## RESEARCH COMPLETE

Planner pode criar os PLAN.md. O primeiro artefato de implementação é o SQL no Editor, não um filtro no React.
