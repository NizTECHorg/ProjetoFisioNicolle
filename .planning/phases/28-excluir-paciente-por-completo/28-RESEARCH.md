# Phase 28: Excluir paciente por completo - Research

**Researched:** 2026-10-10
**Domain:** Exclusão definitiva de paciente: função SQL atômica (security definer) + limpeza de storage + diálogo de perigo com confirmação por nome
**Confidence:** MEDIUM (tabelas `patient_sessions`, `patient_session_evolutions`, `patient_alerts`, `patient_focus_areas`, `patient_pain_logs` existem só no banco vivo; FKs reais precisam ser conferidas no SQL Editor antes de aplicar)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Quem pode excluir: quem pode editar o paciente hoje (`canWritePatient` em `src/lib/accountAccess.ts`). Regra vale também no banco: a exclusão no servidor rejeita paciente de outra conta ou de quem não pode escrever.
- Só na ficha do paciente (cabeçalho ou menu de ações). Não entra na lista. Ação destrutiva: texto em `error`, nunca CTA principal.
- Diálogo de perigo, título `Excluir paciente?`; corpo diz que é definitivo e lista: sessões, avaliações, evoluções, metas, imagens, PDFs, relatórios da IA e cobranças. Campo para digitar o nome; botão `Excluir paciente` só habilita quando bate (trim, ignora maiúsculas/minúsculas). Saída: `Voltar sem excluir`. Durante a exclusão, botão em loading e diálogo não fecha.
- Apaga 100%: linha em `patients` e toda linha de qualquer tabela que aponte para o paciente (direta ou indireta), incl. `autonomo_session_charges` e `google_calendar_session_links`. Arquivos de todos os buckets por paciente.
- Banco: tudo-ou-nada (uma transação/função). Banco e storage terminam consistentes; sem arquivo órfão sem caminho de limpeza.
- Depois: toast `Paciente excluído.`, navega para `/pacientes`, invalida lista/ficha, dashboard, agenda, quadro, financeiro. Erro: toast `Não foi possível excluir o paciente. Tente de novo em instantes.` e nada muda na tela.
- Regras: SQL só pelo SQL Editor (arquivo em `.planning/phases/28-excluir-paciente-por-completo/sql/`), sem `supabase/migrations`, sem `supabase db push`, sem pacote npm novo.

### Claude's Discretion
- security definer + checagem de dono vs. `on delete cascade`, ou combinação.
- Storage no cliente (RLS) ou Edge Function.
- Evento já exportado ao Google Agenda: preferir apagar só o vínculo local.

### Deferred Ideas (OUT OF SCOPE)
- Lixeira/restaurar; excluir pela lista ou em lote; excluir conta do profissional/membros; exportar dados antes de excluir (LGPD).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-39 | Excluir paciente por completo (banco + storage), só para `canWritePatient`, atômico, sem excluir paciente de outra conta, volta para lista e caches atualizados | Seções Inventário, Padrão A (RPC + tombstone), UI, Query keys, Validation Architecture |
</phase_requirements>

## Summary

Hoje não existe `deletePatient` em `src/services/patients.service.ts`. A policy `patients_delete` já existe (`using private.can_write_patient(id)`, `supabase/03-account-types-team.sql` ~linha 567) e as FKs de `patient_goals`, `patient_evaluations`, `patient_images`, `patient_ai_reports` apontam para `patients` com `on delete cascade`. Porém `patient_sessions`, `patient_session_evolutions`, `patient_alerts`, `patient_focus_areas`, `patient_pain_logs` e `board_cards` não têm `create table` em nenhum SQL do repositório (foram criados direto no banco), então o `ON DELETE` real deles é desconhecido. Um `delete from patients` puro seria frágil e ainda deixaria o storage órfão.

Ponto crítico de storage: todas as policies de `storage.objects` (select/insert/delete) dos 3 buckets por paciente dependem de `private.can_write_patient(<pasta uuid>)`/`can_read_patient`, que lêem a linha em `patients`. Depois que o paciente some do banco, o cliente **não consegue mais** apagar os arquivos pela API de Storage. Apagar linhas de `storage.objects` por SQL não serve: remove só metadado e deixa o blob (documentação Supabase de troubleshooting; e há relatos de bloqueio recente de DELETE direto) [CITED: supabase.com/docs/guides/troubleshooting/storage-unexpectedly-high-usage-or-exceed_storage_size_quota-errors-ae21a5].

Importante: CONTEXT diz "autônomo e dono da empresa". O código real diz outra coisa: `canWritePatient(viewerId, createdBy)` é `viewerId === createdBy`; `private.can_write_patient` é "só o criador" e bloqueia membership `pending/rejected` (D-05/D-07). Dono da empresa vê "Somente consulta" em ficha de colega (`PatientPage.tsx` `showConsultBanner`). Seguir o código ("quem pode editar hoje"): criador, e o dono da empresa só nos pacientes que ele mesmo criou.

**Primary recommendation:** Uma função `public.delete_patient_full(p_patient_id uuid)` security definer que (1) exige `private.can_write_patient`, (2) apaga explicitamente, em ordem, todas as tabelas filhas e por fim `patients`, (3) grava uma linha em tombstone `private.patient_deletion_tombstones(patient_id, deleted_by)`. Novas policies de storage (select + delete nos 3 buckets) liberam a pasta de um paciente que tem tombstone do próprio usuário. O cliente lista os arquivos antes (RLS ainda ok), chama a RPC, remove os arquivos depois (policy do tombstone), e então apaga o tombstone via RPC de finalização. Sem Edge Function, sem pacote novo.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Autorização da exclusão | Database (security definer + `private.can_write_patient`) | Browser (`canWritePatient` só UX) | RLS/função é a autoridade (accountAccess.ts comenta isso) |
| Cascata de linhas | Database (uma função, uma transação) | — | Atomicidade exigida (REQ-39.5) |
| Remoção de blobs | API Storage chamada pelo browser | Database (tombstone libera policy) | Blob só sai pela API; RLS precisa de autorização pós-delete |
| Confirmação por nome | Browser | — | Só UX; servidor não precisa do nome |
| Invalidação de cache | Browser (TanStack Query) | — | — |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` (já instalado) | do package.json | `rpc()` e `storage.from().list()/remove()` | Já usado em todos os services [VERIFIED: codebase grep] |
| `@tanstack/react-query` (já instalado) | do package.json | `useMutation` + invalidação | Padrão de `usePatients.ts` [VERIFIED: codebase] |
| PostgreSQL plpgsql security definer | — | Função atômica | Mesmo padrão de `private.can_write_patient`, `revoke_membership`, `decide_membership` [VERIFIED: supabase/03, 20 sql] |
| `node:test` | Node do projeto | Testes de contrato | `node --test src/lib/*.test.ts` [VERIFIED: codebase] |

Nenhum pacote novo. Package Legitimacy Audit: não se aplica (nenhuma instalação).

## Inventário de tabelas (REQ-39.3)

Fontes: `supabase/*.sql`, `.planning/phases/*/sql/*.sql`, e `grep .from('...')` em `src` e `supabase/functions`.

| Tabela | Liga a | FK / ON DELETE conhecido | Evidência | RLS delete |
|---|---|---|---|---|
| `patients` | raiz (`created_by` -> auth.users) | n/a | 03 sql | `patients_delete`: `can_write_patient(id)` |
| `patient_goals` | `patient_id` | `references patients on delete cascade` | `patients-req14-goals.sql` | `patient_goals_delete` (03) |
| `patient_evaluations` | `patient_id` | cascade; `therapist_id` set null | `patients-req05-evaluations.sql` | `patient_evaluations_delete` |
| `patient_images` | `patient_id`; `session_id` | patient cascade; session set null | `07-patient-images.sql` | `patient_images_delete` |
| `patient_ai_reports` | `patient_id`; `session_id` | patient cascade; session set null | `11-patient-ai-reports.sql` | `patient_ai_reports_delete` |
| `patient_sessions` | `patient_id` | **DESCONHECIDO** (sem create table no repo) | usada em `sessions.service.ts`, `calendar.service.ts`, FKs de 05/08 apontam para ela | `patient_sessions_delete` (03) |
| `patient_session_evolutions` | `session_id` + `patient_id` | **DESCONHECIDO** | `sessions.service.ts` insere ambos | `..._delete` (03) |
| `patient_alerts` | `patient_id` | **DESCONHECIDO** | `patients.service.ts` | `..._delete` (03) |
| `patient_focus_areas` | `patient_id` (+`region_key`) | **DESCONHECIDO** (06 só cria índice único) | `06-patient-focus-region-key.sql` | `..._delete` (03) |
| `patient_pain_logs` | `patient_id` | **DESCONHECIDO** | policies em 03; 1 uso em `src` | `..._delete` (03) |
| `autonomo_session_charges` | `session_id` | `unique ... references patient_sessions on delete cascade`; `owner_id` -> profiles | `05-autonomo-finance.sql` | **Sem policy de DELETE** (só select/insert/update); apaga só via cascata/definer |
| `google_calendar_session_links` | `session_id`, `user_id` | session cascade; user cascade | `08-google-calendar.sql` | delete próprio `user_id` |
| `board_cards` | `patient_id` (nullable) | **DESCONHECIDO** (coluna só em código: `board.service.ts`, join `patients(...)`) | 17 sql, `board.service.ts` | `board_cards_delete` (17); card pode ser de outro usuário da org |

Não ligadas a paciente (confirmado por grep): `notifications`, `notification_dismissals`, `orders`, `clients`, `tasks` etc. são da confeitaria legada; nenhuma referência a `patient_id`. `autonomo_prices` é da conta, não do paciente (não apagar). `dashboard_metrics` e `autonomo_finance_totals` são leitura.

Efeitos colaterais a conhecer:
- Trigger `private.patient_images_on_session_delete` (07) faz UPDATE em `patient_images` quando uma sessão é apagada; apagar `patient_images` e `patient_ai_reports` ANTES de `patient_sessions` evita trabalho inútil.
- `snapshot_autonomo_session_charge` (05) é trigger de escrita em charges; apagar charges explicitamente antes das sessões evita reaparecimento.

**Decisão sobre `board_cards`:** apagar os cards com `patient_id = paciente` (REQ-39.3: "qualquer outra tabela que aponte para ele"). Um card "Retorno com Fulano" sem o paciente fica sem sentido e `ON DELETE` desconhecido pode bloquear ou anular. Cards são de quem criou; a função (definer) apaga todos os do paciente. [ASSUMED A2]

**Passo 0 obrigatório (SQL Editor, somente leitura) antes de escrever o `.sql` final.** Descobrir toda FK que aponta para `patients`, `patient_sessions` e `patient_evaluations`, e toda coluna `patient_id`/`session_id`/`evaluation_id` em `public`:

```sql
select c.conrelid::regclass as tabela, c.conname, c.confrelid::regclass as referencia,
       case c.confdeltype when 'a' then 'no action' when 'r' then 'restrict'
            when 'c' then 'cascade' when 'n' then 'set null' when 'd' then 'set default' end as on_delete
from pg_constraint c
where c.contype = 'f'
  and c.confrelid in ('public.patients'::regclass, 'public.patient_sessions'::regclass,
                      'public.patient_evaluations'::regclass)
order by 2, 1;

select table_name, column_name from information_schema.columns
where table_schema = 'public' and column_name in ('patient_id','session_id','evaluation_id','patient')
order by 1, 2;
```

O planner deve registrar a saída num comentário do `.sql` ou em nota da fase. Como a função apaga cada tabela explicitamente, o resultado só altera o plano se aparecer tabela fora da lista acima (acrescentar `delete` na função). Qualquer FK `restrict/no action` de tabela ausente da lista vira erro 23503 e a transação inteira reverte (comportamento seguro: nada some).

## Buckets e caminhos de storage (REQ-39.4)

| Bucket | Path | Origem | Guardado no DB? | Policies storage |
|---|---|---|---|---|
| `patient-avatars` | `{patientId}/{uuid}.{jpg\|png\|webp}` | `patientPhoto.service.ts` linha ~86 | `patients.photo_path` (só o atual; fotos anteriores são removidas no replace, mas falhas podem deixar sobras) | select/insert/delete via `can_*_patient(pasta)` (16 sql) |
| `patient-images` | `{patientId}/{imageId}.{ext}` e miniatura `{patientId}/{imageId}.thumb.jpg` (`thumbStoragePath` em `compressImage.ts`); inclui PDFs anexados (fase 15) | `patientImages.service.ts` | `patient_images.storage_path` (thumb é derivado, não guardado) | idem (07 sql) |
| `patient-ai-reports` | `{patientId}/{reportId}.pdf` | `patientAiReports.service.ts` ~linha 160 | `patient_ai_reports.storage_path` (unique) | idem (11 sql) |
| `account-avatars` | `{userId}/...` | por usuário, NÃO por paciente | — | Fora do escopo |

- Documentos enviados ao cliente (`patientDocumentSend.service.ts`) usam signed URL do bucket `patient-ai-reports`; não há bucket extra.
- Regra de ouro: **listar a pasta `{patientId}/` de cada bucket** em vez de confiar nas colunas do DB. Cobre miniaturas, fotos antigas e sobras. `supabase.storage.from(b).list(patientId, { limit: 1000, offset })` com paginação (padrão do list é 100) [ASSUMED A3: limites de list conforme API do supabase-js; conferir tipos em node_modules].
- Listar exige a policy `select` (`can_read_patient`), que só funciona com o paciente ainda existindo. Portanto listar ANTES da RPC.
- Edge Functions não gravam arquivos de paciente (`patient-ai-summary` só lê tabelas). Confirmado por grep.

## Modelo de conta e propriedade (REQ-39.5)

- `patients.created_by uuid references auth.users` (03 sql). `patients` não tem `owner_id`/`organization_id` (a fase 17 só adicionou isso ao quadro).
- `private.can_write_patient(p_patient_id)`: `exists(patients where id=p and created_by = auth.uid())` e `not exists(membership do usuário com status pending/rejected)`; `security definer`, `search_path = ''`, `stable`. Dentro de outra função `security definer` ainda funciona, pois `auth.uid()` vem do JWT da requisição (não do role dono da função).
- `canWritePatient` no cliente é só UX; ver divergência com CONTEXT acima.
- `board_cards.owner_id/organization_id` carimbados por trigger (17 sql). A função definer apaga por `patient_id`, sem depender da RLS do quadro.

## Abordagem recomendada

### Padrão A (recomendado): RPC atômica + tombstone para liberar o storage

Alternativas rejeitadas:
- **Só `ON DELETE CASCADE`:** exige `alter table` em tabelas cujo schema não está no repo (risco de errar nome de constraint) e não resolve storage. Rejeitado.
- **Edge Function com service role:** funciona (padrão existe em `google-calendar-export`: `createServiceClient`/`requireUser`), mas exige deploy de função e secrets; `supabase functions deploy` é um passo manual a mais e aumenta superfície. Só vale se a RPC+tombstone se provar inviável.
- **Storage primeiro, DB depois:** simples, porém falha de DB deixa ficha sem arquivos (perda de dados), contra "tudo-ou-nada".
- **DELETE direto em `storage.objects` por SQL:** deixa blobs e pode ser bloqueado. Rejeitado.

Fluxo:

```
Clique "Excluir paciente" (ficha, canWrite)
  -> DeletePatientDialog: digita nome -> confirma
  -> service deletePatientCompletely(patientId):
       1. paths = list(patient-avatars/ | patient-images/ | patient-ai-reports/ , pasta patientId)   [RLS select ok]
       2. supabase.rpc('delete_patient_full', { p_patient_id })        [1 transação; grava tombstone]
            falhou? -> lança erro, NADA mudou (arquivos intactos)
       3. storage.from(b).remove(paths) por bucket                     [policy tombstone]
            falhou? -> re-tenta 2x; se ainda falhar mantém tombstone (retry futuro) e NÃO bloqueia o sucesso
       4. rpc('finish_patient_deletion', { p_patient_id })             [apaga tombstone se pasta vazia/ok]
  -> onSuccess: navigate('/pacientes'); toast('Paciente excluído.'); invalida caches
  -> onError: toast('Não foi possível excluir o paciente. Tente de novo em instantes.')
```

SQL (esboço para o planner; arquivo final `sql/28-delete-patient.sql`, idempotente, colado no SQL Editor):

```sql
-- Source: padrão de private.can_write_patient (supabase/03-account-types-team.sql)
create table if not exists private.patient_deletion_tombstones (
  patient_id uuid primary key,
  deleted_by uuid not null,
  deleted_at timestamptz not null default now()
);
revoke all on table private.patient_deletion_tombstones from anon, authenticated, public;

create or replace function private.can_cleanup_deleted_patient_files(p_patient_id uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from private.patient_deletion_tombstones t
                 where t.patient_id = p_patient_id and t.deleted_by = (select auth.uid()));
$$;

create or replace function public.delete_patient_full(p_patient_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not (select private.can_write_patient(p_patient_id)) then
    raise exception 'operation_not_permitted' using errcode = '42501';
  end if;
  -- ordem: netos -> filhos -> raiz; explícito, sem depender de ON DELETE
  delete from public.google_calendar_session_links where session_id in (select id from public.patient_sessions where patient_id = p_patient_id);
  delete from public.autonomo_session_charges      where session_id in (select id from public.patient_sessions where patient_id = p_patient_id);
  delete from public.patient_session_evolutions    where patient_id = p_patient_id;
  delete from public.patient_images                where patient_id = p_patient_id;
  delete from public.patient_ai_reports            where patient_id = p_patient_id;
  delete from public.patient_pain_logs             where patient_id = p_patient_id;
  delete from public.patient_focus_areas           where patient_id = p_patient_id;
  delete from public.patient_alerts                where patient_id = p_patient_id;
  delete from public.patient_goals                 where patient_id = p_patient_id;
  delete from public.patient_evaluations           where patient_id = p_patient_id;
  delete from public.board_cards                   where patient_id = p_patient_id;
  delete from public.patient_sessions              where patient_id = p_patient_id;
  insert into private.patient_deletion_tombstones (patient_id, deleted_by)
    values (p_patient_id, (select auth.uid())) on conflict (patient_id) do nothing;
  delete from public.patients where id = p_patient_id;
end $$;
revoke all on function public.delete_patient_full(uuid) from public, anon;
grant execute on function public.delete_patient_full(uuid) to authenticated;
```

Pontos de atenção:
- `patient_pain_logs` pode usar outra coluna de ligação; confirmar com o passo 0 (se não tiver `patient_id`, apagar por `session_id`).
- Se `patient_session_evolutions` não tiver `patient_id` em algum ambiente, usar `session_id in (select ...)`. O código insere ambos, então `patient_id` existe [VERIFIED: sessions.service.ts].
- Tabelas com `FORCE ROW LEVEL SECURITY` (05, 08): o dono da função precisa de `BYPASSRLS`. No Supabase o role `postgres` tem bypassrls, mas o planner deve incluir no arquivo um teste manual: executar a função como usuário real e checar `autonomo_session_charges` vazio [ASSUMED A4].
- Storage policies adicionais (permissivas, somam-se às existentes), por bucket, `select` e `delete`:

```sql
create policy patient_images_storage_cleanup_select on storage.objects for select to authenticated
using (bucket_id = 'patient-images'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (select private.can_cleanup_deleted_patient_files(((storage.foldername(name))[1])::uuid)));
-- idem for delete; repetir para patient-avatars e patient-ai-reports. Regex de UUID antes do cast (padrão do repo).
```
- `public.finish_patient_deletion(p_patient_id)`: security definer; `delete from tombstones where patient_id = p and deleted_by = auth.uid()`. Só o próprio autor remove.
- Orphans em falha de storage: tombstone persiste; o autor mantém acesso por policy. Retry mínimo: 2 tentativas no service. Recomendado, mas opcional: função `list_pending_patient_file_cleanups()` (retorna `patient_id`s do `auth.uid()`) e um sweep silencioso ao abrir `/pacientes`. Planner decide se entra nesta fase; sem sweep, a falha fica registrada mas sem automação. [ASSUMED A5: sweep opcional]
- Segurança: `search_path = ''` com nomes qualificados; `revoke ... from public, anon`; tombstone só contém UUID e autor, sem PII. A permissão extra de storage só vale para o autor da exclusão e para uma pasta de paciente que não existe mais.
- O UUID do paciente é aleatório (gen_random_uuid); reusar o mesmo UUID não ocorre.

### Google Calendar (REQ-39 nota)

`google_calendar_session_links` guarda `(user_id, session_id, google_event_id, calendar_id)` — PK `(user_id, session_id)`. Existem 4 Edge Functions: connect, disconnect, export, patient-ai-summary. `google-calendar-export` só chama `POST/PATCH` em `https://www.googleapis.com/calendar/v3/calendars/primary/events`; **não há DELETE de evento remoto** em nenhuma função [VERIFIED: grep em supabase/functions]. Apagar no Google exigiria fluxo novo (token por `user_id`, e o vínculo pode ser de usuário diferente do autor). **Decisão recomendada:** apagar só o vínculo local (via cascata explícita na função) e registrar que o evento remoto permanece no Google Agenda do profissional; mencionar no corpo do diálogo? CONTEXT lista o que some; sugerir uma frase curta opcional "Eventos já enviados ao Google Agenda não são apagados lá." [ASSUMED A6: confirmar com o usuário].

## UI e integração

### Onde colocar
- `src/components/patients/PatientProfileHeader.tsx` recebe `canWrite` e hoje renderiza `topRightAction ?? identityAction` (só em abas resumo/cadastro). Não existe menu de ações. Opção prescrita: nova prop opcional `onDeletePatient?: () => void` no header e um botão discreto `Excluir paciente` (ícone `Trash2` do lucide-react, `text-error`, variante ghost) renderizado só quando `canWrite && onDeletePatient`, visível em **todas as abas** (ficar na linha de meta, ao lado do `PatientStatusToggle`, evita colidir com `topRightAction`/`identityAction`). `PatientPage.tsx` (linha ~761) liga `onDeletePatient` a `setDeleteOpen(true)` e monta o diálogo; `useNavigate` já existe (linha 655).
- Diálogo: `ConfirmDialog` **não aceita children nem input** (props: open, title, description, confirmLabel, cancelLabel, tone, isLoading, autoFocusCancel, onConfirm, onClose; `description` é string). Também `Modal` fecha por Esc, clique no fundo e botão X sem checar loading. Prescrito: componente novo `DeletePatientDialog` usando `Modal` (aceita `children`) com `Input` de `src/components/ui/Input.tsx` e `Button`, e duplicando o estilo danger do ConfirmDialog (`!bg-error !text-white hover:!bg-error/90`). Para "diálogo não fecha durante a exclusão", passar `onClose={isPending ? () => {} : close}` e desabilitar `Voltar sem excluir`; o X do Modal chama o mesmo `onClose`, então o no-op cobre Esc, fundo e X. Não alterar `ConfirmDialog` (outros chamadores).
- Comparação do nome: função pura em `src/lib/` (ex.: `patientDeleteConfirm.ts`) `isDeleteNameMatch(typed, name) => typed.trim().toLowerCase() === name.trim().toLowerCase()`; testável com node:test. Considerar normalizar Unicode (`localeCompare`/`normalize('NFC')`) para acentos; manter apenas trim + case conforme CONTEXT, com `toLocaleLowerCase('pt-BR')`.
- Toast: `import { toast } from '@/stores/toast.store'`; `toast('Paciente excluído.', 'success')`, `toast(msg, 'error')`. O `onError` genérico de `usePatients.ts` mostra `error.message`; o hook novo deve usar a copy fixa do CONTEXT em vez disso (nunca vazar mensagem do banco).

### Hook e service
- `src/services/patients.service.ts`: `deletePatientCompletely(patientId)` com os 4 passos; `mapDbError` já mapeia 42501 para "Você não tem permissão..." (mas a UI usa a copy fixa). Buckets como constantes locais (os services atuais já repetem constantes; ver `patientPhoto`, `patientImages`, `patientAiReports`).
- `src/hooks/usePatients.ts`: `useDeletePatient()` (padrão `useMutation` + `qc`).

### Query keys a invalidar (ordem importa)
Dashboard clínico usa `usePatients` (`['patients','list',userId]`), `useCalendarSessions` (`['calendar-sessions',...]`) e financeiro (`['finance', ...]`) [VERIFIED: DashboardPage.tsx, hooks]. Chaves existentes: `['patients']` (cobre list, ficha `['patients', id, userId]`, `dashboard`, `sessions`, `evaluations`, `images`, `ai-reports`), `['calendar-sessions']`, `['board']`, `['board-dues']`, `['finance']` (prices/totals/analytics/sessions/charge/charges), `['dashboard']` (legado confeitaria, inofensivo), `['search']`.

Sequência em `onSuccess`: **primeiro** `navigate('/pacientes', { replace: true })`, **depois** `qc.removeQueries({ queryKey: ['patients', patientId] })` e `qc.invalidateQueries` para `['patients']`, `['calendar-sessions']`, `['board']`, `['board-dues']`, `['finance']`, `['search']`. Se invalidar antes de navegar, o refetch da ficha retorna `null` e `PatientPage` faz `<Navigate to="/pacientes">` (funciona, mas dispara requests e flash de erro). `removeQueries` evita refetch de uma ficha que não existe mais. `invalidatePatient()` existente não serve (refetcha a ficha apagada).

## Architecture Patterns

### Estrutura sugerida
```
.planning/phases/28-excluir-paciente-por-completo/sql/28-delete-patient.sql   # passo 0 (comentado) + tombstone + função + policies storage
src/lib/patientDeleteConfirm.ts (+ .test.ts)          # isDeleteNameMatch
src/services/patients.service.ts                      # deletePatientCompletely
src/hooks/usePatients.ts                              # useDeletePatient
src/components/patients/DeletePatientDialog.tsx       # Modal + Input + botões
src/components/patients/PatientProfileHeader.tsx      # prop onDeletePatient
src/pages/PatientPage.tsx                             # estado do diálogo + hook
src/lib/phase28Contract.test.ts                       # contratos (como phase26Contract.test.ts)
```

### Anti-padrões
- Chamar `supabase.from('patients').delete()` (policy deixaria passar o paciente mas cascata e storage incompletos).
- Apagar storage depois da RPC sem policy de tombstone (RLS nega silenciosamente: `remove` devolve lista vazia sem erro, parece sucesso). Verificar `data.length` retornado de `remove`.
- Fechar o diálogo ou navegar antes de a mutation terminar.
- Confiar no nome digitado como autorização (é só UX).
- Usar `ON DELETE CASCADE` como única proteção em tabelas sem DDL no repo.

## Don't Hand-Roll

| Problema | Não construir | Usar | Por quê |
|---|---|---|---|
| Atomicidade | Várias chamadas `.delete()` do cliente | 1 função plpgsql | Falha parcial deixa ficha corrompida |
| Autorização no servidor | Checagem de dono duplicada | `private.can_write_patient` | Já inclui pending/rejected e criador |
| Listar arquivos | Ler só colunas do DB | `storage.list(patientId)` por bucket | Pega thumbs e sobras |
| Remoção de blobs | `delete from storage.objects` | `storage.remove()` | SQL deixa blobs |
| Modal | Overlay novo | `Modal` + `Input` + `Button` existentes | Consistência/acessibilidade |

## Common Pitfalls

1. **Storage negado após apagar o paciente.** As policies dependem de `patients`. Mitigação: tombstone + policy `can_cleanup_deleted_patient_files`. Sinal: `remove()` retorna `[]` sem erro.
2. **FK desconhecida bloqueia ou anula.** Rodar o passo 0; a função apaga explicitamente. Se aparecer tabela nova, falha 23503 reverte tudo.
3. **`FORCE RLS` em charges/links.** Testar como usuário real que as linhas sumiram (A4).
4. **Pasta com mais de 100 arquivos.** Paginar `list`.
5. **`list` do bucket devolve pseudo-itens de pasta** (`id: null`) — filtrar para arquivos antes de montar paths `${patientId}/${name}`.
6. **Refetch da ficha apagada** — navegar antes de invalidar, usar `removeQueries`.
7. **Dono da empresa:** o botão não aparece em ficha de colega (consistente com RLS). Não prometer isso na UI do dono.
8. **Cache PostgREST:** terminar o `.sql` com `notify pgrst, 'reload schema';` (padrão do repo).
9. **Double submit:** `isPending` desabilita botão; função é idempotente-segura (segundo chamado dá 42501 pois o paciente não existe, e o service deve tratar como erro).

## Runtime State Inventory (exclusão, não rename)

| Categoria | Itens | Ação |
|---|---|---|
| Dados armazenados | Todas as tabelas do inventário; `private.patient_deletion_tombstones` (novo) | função SQL |
| Config em serviço externo | Eventos no Google Agenda do profissional permanecem | Aceito; só vínculo local sai |
| Estado do SO | Nenhum — verificado: não há jobs/cron por paciente | — |
| Segredos/env | Nenhum | — |
| Artefatos | URLs assinadas já emitidas (1h; envio de PDF por link 7 dias em `patientDocumentSend`) podem continuar válidas até expirar? Com blob removido, a URL passa a falhar | Aceito |

## Environment Availability

| Dependência | Requerida por | Disponível | Fallback |
|---|---|---|---|
| Supabase SQL Editor (manual pelo usuário) | aplicar `.sql` | externo ao ambiente do agente | — (regra do projeto) |
| Node + `npm run typecheck` | validação | ✓ (scripts em package.json) | — |
| Supabase CLI / `db push` | proibido | n/a | — |

Ambiente do agente não acessa o banco vivo: passo 0 e testes de policy são manuais.

## Validation Architecture

### Test Framework
| Propriedade | Valor |
|---|---|
| Framework | `node:test` (sem runner extra), TypeScript por type-stripping como nos `*.test.ts` atuais |
| Config | nenhuma |
| Comando rápido | `node --test src/lib/patientDeleteConfirm.test.ts src/lib/phase28Contract.test.ts` |
| Suite completa | `node --test src/lib/*.test.ts` e `npm run typecheck` |

### Requirements -> Tests
| Req | Comportamento | Tipo | Comando | Existe? |
|---|---|---|---|---|
| REQ-39.2 | `isDeleteNameMatch`: trim, caixa, vazio, nome parcial, acentos | unit | `node --test src/lib/patientDeleteConfirm.test.ts` | Wave 0 |
| REQ-39.1 | Header só mostra ação com `canWrite`; texto `Excluir paciente`; `text-error`; ausente em `PatientsPage` | contrato (lê fonte, estilo `phase26Contract.test.ts`) | `node --test src/lib/phase28Contract.test.ts` | Wave 0 |
| REQ-39.2 | Diálogo: título `Excluir paciente?`, `Voltar sem excluir`, botão desabilitado sem match, `onClose` no-op quando pending | contrato (fonte) | idem | Wave 0 |
| REQ-39.3/5 | `.sql` cita toda tabela que `src` consulta com `patient_id` (`patient_sessions`, `..._evolutions`, `patient_alerts`, `patient_goals`, `patient_focus_areas`, `patient_pain_logs`, `patient_evaluations`, `patient_images`, `patient_ai_reports`, `autonomo_session_charges`, `google_calendar_session_links`, `board_cards`), tem `security definer`, `set search_path = ''`, `can_write_patient`, `revoke ... from public, anon`, `grant execute ... authenticated`, ordem `patients` por último, `notify pgrst` | contrato (fonte do .sql) | idem | Wave 0 |
| REQ-39.4 | Service lista os 3 buckets, chama `delete_patient_full` ANTES do `remove`, usa os 3 nomes de bucket | contrato (fonte) | idem | Wave 0 |
| REQ-39.6 | Hook invalida `['patients']`, `['calendar-sessions']`, `['board']`, `['finance']` e navega para `/pacientes`; copy de sucesso/erro exatas | contrato (fonte) | idem | Wave 0 |
| Todos | Tipos | typecheck | `npm run typecheck` | ✅ |

### Sampling
- Por commit: testes rápidos acima + `npm run typecheck`.
- Por wave: `node --test src/lib/*.test.ts`.
- Gate: suite verde antes de `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/lib/patientDeleteConfirm.ts` e `.test.ts`
- [ ] `src/lib/phase28Contract.test.ts` (inclui leitura do `.sql` da fase)
- [ ] Sem novo framework

### Verificação manual obrigatória no Supabase (não automatizável aqui)
1. Rodar o passo 0 e anexar a saída (FKs e ON DELETE reais).
2. Aplicar o `.sql` no SQL Editor; conferir que `delete_patient_full` existe e `anon` não executa.
3. Com paciente de teste com sessão, cobrança, vínculo Google, avaliação, meta, alerta, área de foco, imagem, PDF IA, foto, card no quadro: excluir pela UI; conferir `select count(*)` zero em cada tabela por `patient_id`/`session_id` e Storage vazio nos 3 buckets (pasta do uuid).
4. Como outro usuário (ou dono da empresa em ficha de colega) chamar `rpc('delete_patient_full')` direto: deve dar 42501 e nada mudar.
5. Forçar falha no meio (ex.: inserir temporariamente FK restrict de tabela de teste) e conferir rollback total e arquivos intactos.
6. Simular falha de storage (bloquear temporariamente) e conferir tombstone persistente; reexecutar limpeza.
7. Conferir dashboard, agenda, quadro e financeiro sem o paciente.

## Security Domain

| ASVS | Aplica | Controle |
|---|---|---|
| V4 Access Control | sim | `private.can_write_patient` dentro da função; grants só `authenticated`; testar IDOR com UUID de outra conta |
| V5 Input Validation | sim | parâmetro `uuid` tipado; sem SQL dinâmico; regex de UUID antes de cast nas policies de storage |
| V2/V3 | não | sem mudança |
| V6 | não | — |

| Ameaça | STRIDE | Mitigação |
|---|---|---|
| Excluir paciente de outra conta chamando a RPC direto | Tampering/EoP | Checagem de dono no servidor + teste manual |
| Search path hijack em security definer | EoP | `set search_path = ''` + nomes qualificados |
| Abuso da policy de limpeza de storage | EoP | Só tombstone do mesmo `deleted_by` e só pasta de paciente inexistente; tombstone fora do alcance de `authenticated` |
| Vazar mensagem de erro do banco | Info disclosure | Copy fixa na UI |
| Exclusão acidental | — | Digitar nome; sem lixeira (decisão registrada) |

## Assumptions Log

| # | Claim | Seção | Risco se errado |
|---|---|---|---|
| A1 | Divergência CONTEXT x código: "dono da empresa" não pode excluir ficha de colega (só criador) | Summary | Se o usuário quer que o dono exclua fichas da equipe, precisa mudar `can_write_patient` (fora do escopo) |
| A2 | `board_cards` ligados ao paciente devem ser apagados, não desvinculados | Inventário | Usuário pode preferir manter card sem paciente |
| A3 | `storage.list` aceita `limit`/`offset` e devolve pseudo-pastas; conferir tipos | Storage | Paginação errada deixa órfãos |
| A4 | Role dono da função tem BYPASSRLS apesar de `FORCE RLS` | Esboço SQL | Linhas de charges/links sobrariam |
| A5 | Sweep de tombstones pendentes é opcional | Esboço SQL | Órfãos permanecem após falha de rede |
| A6 | Apagar só vínculo local do Google Agenda é aceitável | Google | Evento fantasma no calendário externo |
| A7 | Tabelas listadas como "DESCONHECIDO" têm coluna `patient_id` | Inventário | Função falha ao criar (erro cedo, seguro) |

## Open Questions (RESOLVED)

1. **FKs reais do banco vivo.**
   - Sabemos: 5 tabelas sem DDL no repo.
   - Falta: ON DELETE e possíveis tabelas extras.
   - Recomendação: passo 0 antes de fechar o `.sql`; a função explícita é robusta de qualquer forma.
   - RESOLVED: checkpoint de descoberta no plano 28-04 (Tasks 1–2).
2. **Aviso sobre Google Agenda no diálogo?** Recomendação: frase curta opcional; aguardar aprovação (A6). RESOLVED: CONTEXT › Padrões fechados — o diálogo mostra `Eventos já enviados ao Google Agenda continuam lá.`
3. **Sweep de limpeza pendente nesta fase?** Recomendação: incluir só se couber em uma task pequena; senão registrar como dívida. RESOLVED: adiado (CONTEXT › Deferred); retry via tombstone na próxima exclusão.

## Sources

### Primary (HIGH)
- Código do repositório: `supabase/*.sql`, `.planning/phases/*/sql/*.sql`, `src/services/*`, `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/useFinance.ts`, `src/pages/PatientPage.tsx`, `src/components/patients/PatientProfileHeader.tsx`, `src/components/ui/{ConfirmDialog,Modal}.tsx`, `src/stores/toast.store.ts`, `supabase/functions/*`.

### Secondary (MEDIUM)
- Supabase troubleshooting sobre DELETE direto em `storage.objects` deixar blobs: https://supabase.com/docs/guides/troubleshooting/storage-unexpectedly-high-usage-or-exceed_storage_size_quota-errors-ae21a5

### Tertiary (LOW)
- Relato (blog terceiro) de bloqueio de DELETE direto em 2026: https://www.adwaitx.com/supabase-storage-performance-security-updates/ (não confirmado em fonte oficial)

## Metadata

**Confidence:**
- Stack: HIGH (nada novo)
- Inventário de tabelas: MEDIUM (5 tabelas sem DDL no repo)
- Storage/tombstone: MEDIUM (padrão consistente com as policies lidas; precisa de teste manual)
- UI/keys: HIGH

**Research date:** 2026-10-10
**Valid until:** 30 dias
