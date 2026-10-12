# Phase 31: Excluir a própria conta - Research

**Researched:** 2026-10-12
**Domain:** Exclusão definitiva da própria conta: Edge Function (service role) + função SQL atômica (security definer) + limpeza de storage + `auth.admin.deleteUser` + diálogo de perigo com `EXCLUIR` e senha
**Confidence:** MEDIUM (FKs reais para `auth.users`/`profiles` e as colunas de autoria das tabelas criadas só no banco vivo são desconhecidas até a descoberta 31-00; o padrão de Edge Function, storage e a lógica por tipo de conta são HIGH)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Por tipo de conta**
- **Autônomo:** apaga o login, o perfil e TUDO que é dele: todos os pacientes que criou e todos os filhos deles (mesma cobertura da fase 28: sessões, evoluções, avaliações, metas, alertas, áreas de foco, dor, imagens, relatórios IA, cobranças, vínculos Google, cards), preços (`autonomo_prices`), quadro (`board_columns`/`board_cards`), conexões e segredos do Google Agenda, e os arquivos no storage (pastas dos pacientes nos 3 buckets + `account-avatars/{userId}/`).
- **Empresa (dono):** apaga tudo do dono como acima **e também os pacientes criados pelos fisios da equipe** (com filhos e arquivos), a organização e todos os vínculos (`organization_memberships`). As contas de login dos fisios **continuam**, ficam sem empresa.
- **Fisio de empresa (membership active/pending):** apaga só a conta dele (login, perfil, avatar, quadro/Google próprios se houver). Os pacientes que ele criou **passam para o dono da empresa** (`patients.created_by` = owner), sem perder nada. Sessões anexadas a ele (`patient_sessions.therapist_id`) ficam sem fisio (null). O vínculo dele é removido.
- Fisio sem empresa ativa (pending/rejected) que criou pacientes: tratar como autônomo para os próprios dados (pesquisa confirma o caso).

**Confirmação (disclaimer)**
- Área sensível no fim de Minha conta, botão `Excluir minha conta` (estilo de perigo, igual à Área sensível da ficha).
- Diálogo com aviso específico do tipo de conta (o que some, que é definitivo, que não dá para desfazer; para empresa, quantos pacientes e que os fisios perdem o vínculo; para fisio, que os pacientes ficam com a empresa).
- Exige digitar `EXCLUIR` **e** a senha atual. A senha é reverificada (signInWithPassword ou na Edge Function) antes de excluir.
- Durante a exclusão o diálogo não fecha. Sucesso: sai da sessão e vai para a tela de login com `Sua conta foi excluída.` Erro: copy fixa, nada muda.

**Segurança / execução**
- Excluir de `auth.users` exige service role -> **Edge Function** (`supabase/functions/delete-account`), que valida o JWT do chamador e só age sobre o próprio `user.id`. Nunca expor service role no cliente.
- Dados no banco: função SQL `security definer` (ou a própria Edge Function com service role) em ordem segura, tudo-ou-nada no banco. Storage removido pela Edge Function com service role (sem depender de RLS).
- Ordem deve evitar conta pela metade: decidir na pesquisa (transferir/apagar dados + storage -> apagar auth.users por último; se auth falhar, retry seguro/idempotente).
- Reaproveitar a lógica de `public.delete_patient_full` (fase 28) quando fizer sentido.

**Regras do projeto**
- SQL só pelo SQL Editor (arquivo em `.planning/phases/31-excluir-a-pr-pria-conta/sql/`); sem `supabase/migrations`, sem `supabase db push`.
- Edge Function: seguir o padrão das existentes em `supabase/functions/*`; o deploy é ação humana (checkpoint).
- Sem pacote npm novo.

### Claude's Discretion
- Divisão SQL vs Edge Function; nomes; layout exato do diálogo.

### Deferred Ideas (OUT OF SCOPE)
- Exportar dados antes de excluir (LGPD portabilidade).
- Período de carência / desfazer.
- Dono transferir a empresa para outro usuário.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-42 | Excluir a própria conta — aviso + EXCLUIR + senha; apaga Auth, dados e arquivos; fisio de empresa entrega pacientes à empresa | Seções Inventário de FKs, Matriz por tipo de conta, Padrão A (Edge Function + RPC + tombstone), Storage, UI, Validation Architecture, Security |
</phase_requirements>

## Summary

A exclusão precisa de três camadas, nesta ordem: (1) uma função SQL `security definer`, atômica, que apaga/transfere TODAS as linhas de banco e grava um tombstone com os ids de paciente cujos arquivos precisam sair do storage; (2) remoção dos arquivos no storage com service role (Edge Function), usando o tombstone para ser retomável; (3) `auth.admin.deleteUser` por último. O perfil (`public.profiles`) fica de pé até o `deleteUser` (se a FK `profiles.id -> auth.users` for `cascade`, some junto; senão a Edge Function apaga o perfil logo antes). Assim, se qualquer passo após o banco falhar, o usuário ainda consegue entrar e repetir (tudo idempotente), em vez de ficar com conta sem perfil.

Dois achados que não estavam em CONTEXT e mudam o plano. (a) **Storage ownership:** a documentação do Supabase diz que não se pode apagar um usuário que é dono de qualquer objeto do Storage `[CITED: supabase.com/docs/guides/auth/managing-user-data]`. Um fisio que enviou imagem/PDF em pacientes que serão transferidos ao dono continua dono desses objetos; é preciso **reatribuir `storage.objects.owner` para o dono da empresa** (a função SQL faz isso) ou o `deleteUser` falha. (b) **Fisio sem membership fica preso:** no app, `fisioterapeuta` sem `organization_memberships` cai em `/aguardando` (fail-closed em `AuthProvider`/`ProtectedRoute`). Depois que o dono excluir a empresa, os fisios "continuam com login" mas não conseguem usar o app. Precisa de decisão do usuário (ver Open Questions, Q1).

Além disso, a atualização de `owner_id` em `board_columns`/`board_cards` é **ignorada** pelos gatilhos de carimbo (`stamp_board_*_scope` preservam OLD no UPDATE), então a transferência do quadro compartilhado da empresa exige desligar o gatilho dentro da transação (padrão do bloco 8 da fase 17).

**Primary recommendation:** Edge Function `delete-account` (self-contained, deploy humano) = JWT -> reverifica `EXCLUIR` e senha no servidor (cliente anon efêmero, `signInWithPassword`) -> `rpc('delete_account_data')` (só `service_role`, uma transação, retorna/grava tombstone) -> limpa storage por tombstone -> `auth.admin.deleteUser(id)` -> remove tombstone. Cliente: serviço `accountDeletion.service.ts` + `DeleteAccountDialog` + seção "Área sensível" em `AccountPage`; sucesso = `signOut({ scope: 'local' })`, `queryClient.clear()`, `navigate('/')`, toast `Sua conta foi excluída.`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Reverificar senha e `EXCLUIR` | API / Backend (Edge Function) | Browser (UX) | Checagem no cliente é contornável chamando a função direto com o JWT; só a do servidor vale |
| Descobrir o que apagar/transferir | Database (função SQL) | — | Fonte da verdade são as linhas e membership; evita contrato duplicado no cliente |
| Apagar/transferir linhas | Database (função SQL atômica) | — | Tudo-ou-nada numa transação; bypassrls do dono `postgres` ignora FORCE RLS (confirmado fase 28) |
| Remover arquivos | API / Backend (service role) | — | Sem service role o RLS de storage depende de `patients`, que já foi apagado |
| Apagar `auth.users` | API / Backend (`auth.admin.deleteUser`) | — | Exige service role; nunca no cliente |
| Aviso por tipo de conta, `EXCLUIR`, senha | Browser / Client | — | UI/UX; contagem de pacientes só informativa |
| Encerrar sessão e limpar cache | Browser / Client | — | `signOut({ scope: 'local' })` + `queryClient.clear()` |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | já instalado no app; `npm:@supabase/supabase-js@2` na Edge Function | `auth.admin.deleteUser`, `storage.list/remove`, `rpc` | Padrão das 4 funções existentes `[VERIFIED: supabase/functions/google-calendar-disconnect/index.ts]` |
| Supabase Edge Functions (Deno) | — | Único lugar com service role | Padrão do projeto; deploy pelo Dashboard (funções "self-contained", sem imports compartilhados) `[VERIFIED: supabase/functions/patient-ai-summary/index.ts]` |
| Postgres `security definer` + `set search_path = ''` | — | Exclusão atômica | Mesmo padrão de `delete_patient_full` `[VERIFIED: fase 28 sql]` |
| react-hook-form + zod, `Modal`, `Input`, `Button`, `toast` | já instalados | Diálogo com confirmação | Padrão de `DeletePatientDialog` e `AccountPage` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Node v26.4.0 local | Testes de contrato (leitura de fonte + SQL) | Padrão `phase28*.contract.test.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dados via função SQL | Dezenas de `.from().delete()` na Edge Function | Sem transação (cada chamada commita); descartado |
| Reverificar senha no cliente (`signInWithPassword`) | Reverificar na Edge Function | Cliente troca a sessão/dispara `onAuthStateChange` e é contornável. Servidor ganha. |
| `shouldSoftDelete: true` | — | Não é exclusão definitiva e a doc não explica o efeito; não usar |

**Installation:** nenhuma. Sem pacote npm novo. `deno`/`supabase` CLI não estão no PATH da máquina (`command -v` vazio): validar a Edge Function por testes de contrato de fonte; deploy é checkpoint humano no Dashboard.

## Package Legitimacy Audit

Nenhum pacote externo novo é instalado nesta fase (`npm:@supabase/supabase-js@2` já é usado pelas funções existentes). slopcheck não aplicável.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Inventário de referências a `auth.users` / `profiles` / `organizations`

### Conhecidas pelos SQL do repositório
| Tabela.coluna | Referencia | ON DELETE | Fonte | Tratamento |
|---|---|---|---|---|
| `profiles.id` | `auth.users` (provável) | **desconhecido** | só no banco vivo (trigger `handle_new_user`) | Descoberta 31-00 (a). Se não for cascade: Edge Function apaga o perfil logo antes do `deleteUser` |
| `patients.created_by` | `auth.users` | no action | 03 `[VERIFIED]` | Autônomo/empresa: pacientes apagados. Fisio ativo: `update ... set created_by = <owner>` |
| `organizations.owner_id` | `profiles` (unique) | no action | 03 | Empresa: apagar a organização antes do perfil |
| `organization_memberships.organization_id` / `.profile_id` | `organizations` / `profiles` | cascade / cascade | 03 | Apagados por cascade ao apagar org / perfil; deletar explícito mesmo assim |
| `patient_images.created_by` | `profiles` | no action | 07 | **Bloqueia** apagar o perfil do fisio: reatribuir (owner) ou null |
| `patient_ai_reports.created_by` | `auth.users` | no action | 11 | **Bloqueia** `deleteUser` do fisio: reatribuir ou null |
| `patient_evaluations.therapist_id` / `.created_by` | `profiles` / `auth.users` | set null / set null | req05 | Ok. `created_by_name`/`therapist_name` (texto) permanecem no registro clínico |
| `autonomo_prices.owner_id` | `profiles` | no action | 05 | Apagar por `owner_id = user` |
| `autonomo_session_charges.owner_id` | `profiles` | no action | 05 | Apagar por `owner_id = user` (ANTES de `autonomo_prices`: `price_id` é FK sem cascade) |
| `google_calendar_connections.user_id`, `google_calendar_secrets.user_id`, `google_calendar_session_links.user_id` | `auth.users` | cascade | 08 | Apagar explícito; Edge Function revoga o token Google antes (como `google-calendar-disconnect`) |
| `board_columns.owner_id` / `board_cards.owner_id` | `profiles` | no action | 17 | Ver "Quadro" abaixo |
| `board_columns.organization_id` / `board_cards.organization_id` | `organizations` | no action | 17 | Apagar linhas da org antes da org |
| `board_cards.patient_id` | `patients` | **set null** | fase 28 DB-DISCOVERY | `delete` explícito dos cards dos pacientes apagados |

### Desconhecidas (só no banco vivo) — rodar `31-00-discovery.sql`
- `patient_sessions`: `created_by` e `therapist_id` (fase 29 usa `therapist_id`; o serviço grava `created_by` `[VERIFIED: src/services/sessions.service.ts]`) — FK e nulabilidade desconhecidas.
- `patient_session_evolutions`, `patient_goals`, `patient_alerts`, `patient_focus_areas`, `patient_pain_logs`: possíveis `created_by`/`author`.
- `storage.objects.owner`/`owner_id` e possível FK `objects_owner_fkey` para `auth.users`.
- Triggers em `auth.users` além de `on_auth_user_created`.

O arquivo `.planning/phases/31-excluir-a-pr-pria-conta/sql/31-00-discovery.sql` já está escrito (somente `select`): (a) todas as FKs para `auth.users`/`profiles`/`organizations` em qualquer schema, com coluna, nulabilidade e `on delete`; (b) colunas de autoria/dono sem FK; (c) colunas e contagem de `storage.objects` por dono; (d) triggers das tabelas tocadas; (e) triggers em `auth.users`; (f) papel/`bypassrls`. **Checkpoint humano:** usuário roda no SQL Editor e cola a saída; o plano de SQL só é fechado depois (como 28-00). A função SQL deve ser escrita para **zerar toda FK no action/restrict que apareça no resultado (a)**: ou apagando a linha (dado do usuário) ou `set null`/reatribuindo (dado que sobrevive).

## Matriz por tipo de conta

Papéis detectados dentro da função (não confiar no `account_type` do perfil sozinho):
- `v_org_owned` = org onde `owner_id = user` (empresa dono).
- `v_active_org` = `organization_id` de `organization_memberships` com `profile_id = user`, `role = 'therapist'`, `status = 'active'` (fisio ativo) e `v_org_owner` = `organizations.owner_id` dessa org.
- Demais (autônomo, fisio pending/rejected/sem vínculo) = "dono dos próprios dados".

| Dado | Autônomo / fisio sem vínculo ativo | Empresa (dono) | Fisio ativo |
|---|---|---|---|
| Pacientes `created_by = user` | apagar (com filhos) | apagar | **transferir** `created_by = v_org_owner` |
| Pacientes `created_by` em fisios **ativos** da org | — | apagar (com filhos) | — |
| Filhos dos pacientes apagados | apagar (lista da fase 28, mais cards) | idem | — |
| Autoria nos filhos mantidos (`images/ai_reports/sessions.created_by`, etc.) | — | — | `= v_org_owner` se NOT NULL, senão `null` (decidir após descoberta) |
| `patient_sessions.therapist_id = user` | irrelevante (paciente apagado) | irrelevante (paciente apagado) | `null` |
| `autonomo_session_charges` (owner) e `autonomo_prices` | apagar (charges antes de prices) | idem | apagar |
| Quadro pessoal (`organization_id is null`, `owner_id = user`) | apagar cards e colunas | idem | apagar |
| Quadro da empresa (`organization_id = org`) | — | apagar tudo da org (cards e colunas) | **reatribuir `owner_id` ao dono** com gatilho de carimbo desligado na transação |
| Google (connections, secrets, session_links) | apagar + revogar token | idem | idem (se houver) |
| `organization_memberships` | apagar o do user (se houver) | apagar todos da org, depois a org | apagar o do user |
| Perfil | cascade/explícito no fim | idem | idem |
| Outras contas (fisios) | — | **continuam** (ver Q1) | — |
| `storage.objects.owner = user` em arquivos que ficam | — | — | **reatribuir** para `v_org_owner` |
| Storage | pastas dos pacientes apagados nos 3 buckets + `account-avatars/{user}/` | idem (todos os pacientes apagados, incluindo dos fisios) | só `account-avatars/{user}/` |

Notas:
- Fisio **pending/rejected** deleta a própria conta: não passa pelo caminho "transferir"; apaga o próprio e o membership. (Hoje pending/rejected não alcançam `/conta`; ver Q4.)
- Dono: pacientes de fisios `pending`/`rejected` não entram na exclusão (pertencem a eles; `can_read_patient_base` já bloqueia esses papéis). Eles ficam em contas que continuam.
- RLS do paciente usa `patients.created_by` (03/29); `board_cards`/arquivos usam `patient_id`/`patientId` e não são afetados pela troca de `created_by`. Após a transferência, `can_read_patient_base` do dono cobre o paciente por `p.created_by = auth.uid()`.
- `patient_ai_reports`/`patient_images` mantêm `storage_path` por `patientId`: paths não mudam.

## Architecture Patterns

### System Architecture Diagram

```
AccountPage (Área sensível) -> DeleteAccountDialog [EXCLUIR + senha]
        |  supabase.functions.invoke('delete-account', { password, confirm })
        v
Edge Function delete-account (service role, Deno)
  1. OPTIONS/POST only; Authorization Bearer -> userClient.auth.getUser(token)  -> user.id, user.email
  2. confirm === 'EXCLUIR' ? password re-check: anon client (no session) signInWithPassword(user.email, password)
        | fail -> 401 { code: 'invalid_password' }
  3. admin.from('private tombstone') via rpc('get_pending_account_deletion') (retry path) 
  4. rpc('delete_account_data', { p_user_id })  -- ONE TRANSACTION, service_role only
        |  inside: delete/transfer rows, reassign storage.objects.owner, write tombstone(user_id, patient_ids[])
        |  returns { patient_ids[], role }
  5. revoke Google token (best effort; read refresh_token BEFORE step 4)
  6. storage: for each bucket x patient_id and account-avatars/{user}: list(page 100) + remove(batch 100), verify empty
  7. (profile delete here only if profiles.id FK is NOT cascade)
  8. admin.auth.admin.deleteUser(user.id)  -> cascades sessions/refresh tokens
  9. rpc('finish_account_deletion') -> delete tombstone ;  200 { ok: true }
        v
Client: signOut({scope:'local'}) -> queryClient.clear() -> navigate('/') -> toast('Sua conta foi excluída.')
```

Falha em 4: transação desfaz, nada muda. Falha em 5-8: banco já apagado, tombstone existe, perfil/login ainda existem: usuário entra e repete (passos 4 e 6 idempotentes; passo 4 acha "nada a apagar" e reaproveita o tombstone).

### Recommended Project Structure
```
supabase/functions/delete-account/index.ts     # self-contained (sem imports compartilhados)
.planning/phases/31-.../sql/31-00-discovery.sql  # leitura (pronto)
.planning/phases/31-.../sql/31-delete-account.sql # função + tombstone + grants (depois da descoberta)
src/services/accountDeletion.service.ts        # invoke + mapeamento de erro (sem toast)
src/lib/accountDeletion.ts                     # EXCLUIR match, copy por tipo de conta (puro, testável)
src/components/ui/ ou components/account/DeleteAccountDialog.tsx
src/pages/AccountPage.tsx                      # seção "Área sensível"
src/lib/phase31*.contract.test.ts              # testes de contrato
```

### Pattern A: Edge Function (copiar os helpers de `google-calendar-disconnect`)
`corsHeaders`, `jsonResponse`, `optionsResponse`, `createServiceClient` (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, `persistSession:false`), `createUserClient`/`requireUser` (`getUser(token)` com o header do chamador). `user.id` vem SEMPRE do JWT; o corpo da requisição não carrega id nenhum.
```ts
// Source: supabase/functions/google-calendar-disconnect/index.ts (padrão do projeto) + supabase-js docs
const auth = await requireUser(req)            // 401 se inválido
if (auth instanceof Response) return auth
const { user } = auth
const body = await req.json().catch(() => ({}))
if (body.confirm !== 'EXCLUIR' || typeof body.password !== 'string' || !user.email) {
  return jsonResponse({ error: 'invalid_request', code: 'invalid_request' }, 400)
}
// Reverificação: cliente anon efêmero, sem persistir sessão; e-mail vem do JWT, nunca do corpo
const probe = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
const { error: pwError } = await probe.auth.signInWithPassword({ email: user.email, password: body.password })
if (pwError) return jsonResponse({ error: 'invalid_password', code: 'invalid_password' }, 401)
await probe.auth.signOut({ scope: 'local' })   // não deixa sessão paralela
```
Tratamento de erro do GoTrue: `over_request_rate_limit`/429 -> `code: 'rate_limited'`. Não devolver detalhes internos.

### Pattern B: função SQL atômica
- `public.delete_account_data(p_user_id uuid) returns jsonb`, `language plpgsql security definer set search_path = ''`.
- `revoke all ... from public, anon, authenticated; grant execute ... to service_role;` O `user.id` vem da Edge Function (já autenticada); a função não usa `auth.uid()` (service role não tem uid). Nenhum usuário comum pode chamá-la mesmo para si (evita apagar dados sem passar pela senha).
- Tombstone `private.account_deletion_pending (user_id uuid primary key, patient_ids uuid[] not null, created_at timestamptz default now())` sem FK, RLS ligado, `revoke all ... from public, anon, authenticated` (padrão do tombstone da fase 28). Inserido na mesma transação; `upsert` com união de ids no retry.
- Lock: `perform 1 from public.profiles where id = p_user_id for update;` no início (serializa duas tentativas).
- Esqueleto de ordem (filhos primeiro, raiz por último; usar a lista da fase 28 em cima de um conjunto de ids):
```sql
-- Source: .planning/phases/28-excluir-paciente-por-completo/sql/28-delete-patient.sql (adaptado, set-based)
create temp table _pids on commit drop as
  select p.id from public.patients p where p.created_by = p_user_id and <caminho "apagar">
  union select p.id from public.patients p where v_org_owned is not null
        and p.created_by in (select m.profile_id from public.organization_memberships m
                             where m.organization_id = v_org_owned and m.role='therapist' and m.status='active');
-- netos
delete from public.google_calendar_session_links where session_id in (select s.id from public.patient_sessions s where s.patient_id in (select id from _pids));
delete from public.autonomo_session_charges      where session_id in (select s.id from public.patient_sessions s where s.patient_id in (select id from _pids));
-- filhos (evolutions, images, ai_reports, pain_logs, focus_areas, alerts, goals, evaluations, board_cards, sessions) por patient_id in (select id from _pids)
-- tombstone (antes de apagar patients)
-- fisio ativo: update patients set created_by = v_org_owner where created_by = p_user_id;  + autoria + therapist_id null + storage owner
-- cobranças/preços do user, quadro, google, memberships, organização
delete from public.patients where id in (select id from _pids);
```
Para o quadro da empresa transferido no caminho "fisio ativo": `alter table public.board_columns disable trigger board_columns_stamp_scope; alter table public.board_cards disable trigger board_cards_stamp_scope; update ...; alter table ... enable trigger ...` dentro da função (transacional; mesmo padrão do bloco 8 da fase 17 `[VERIFIED: 17-account-isolation.sql]`). Risco: `ALTER TABLE` pega lock forte por instantes; aceitável para operação rara.
- Dono: ordem `board_cards` (org) -> `board_columns` (org) -> `organization_memberships` (org) -> `organizations` -> demais. Cards com `patient_id` de pacientes apagados caem na regra dos pacientes.
- Retorno: `jsonb_build_object('role', ..., 'patient_ids', array)` e idempotência: se nada resta, devolve o tombstone existente.

### Pattern C: Storage com service role
`storage.from(bucket).list(folder, { limit: 100, offset })` pagina; entradas com `id === null` são subpastas (os caminhos aqui são planos: `{patientId}/{arquivo}` e `{userId}/{uuid}.{ext}`, ver `patientImages.service.ts` e `accountPhoto.service.ts`). `remove(batch)` em lotes de 100 e relistar até zerar (mesmo laço de `patientDeletion.service.ts`). Com service role não há RLS, então `data.length < batch.length` indica de fato falha. Buckets: `patient-avatars`, `patient-images`, `patient-ai-reports` (por `patientId`) e `account-avatars` (por `userId`) `[VERIFIED: grep storage.buckets nos sql 07, 11, 16, 18]`. Não apagar por SQL em `storage.objects` (remove só metadado; mantido o aprendizado da fase 28).
Dono: `profiles.avatar_url` e a pasta `account-avatars/{userId}/` cobrem todos os avatares de conta.

### Pattern D: Cliente
- `accountDeletion.service.ts`: `supabase.functions.invoke('delete-account', { body: { password, confirm: 'EXCLUIR' } })`; em erro, lê o corpo com o mesmo padrão `readFunctionsErrorPayload` de `googleCalendar.service.ts` (copiar a lógica pequena; a função não é exportada) e lança `Error` com copy fixa: `invalid_password` -> `Senha incorreta.`; `rate_limited` -> `Muitas tentativas. Aguarde e tente novamente mais tarde.`; resto -> `Não foi possível excluir a conta. Tente de novo em instantes.`. O serviço não chama `toast`.
- Rate limit local: `checkRateLimit('account:delete:' + userId)` de `@/lib/security` (como `assertRateLimit` em `auth.service.ts`).
- Sucesso: `supabase.auth.signOut({ scope: 'local' })` (o usuário já não existe no servidor; `scope: local` evita chamada que falharia no refresh/401) dentro de um `try/catch` tolerante, `queryClient.clear()`, `navigate('/', { replace: true })`, `toast('Sua conta foi excluída.', 'success')`. O `toast.store` é global, então a mensagem aparece na tela de login sem passar state. `AuthProvider.onAuthStateChange` zera session/profile; `useEffect` de `seenUserId` também limpa o cache ao mudar de usuário.
- Diálogo: base em `DeletePatientDialog` (`Modal` + `Input`s + `Button`s). Dois `Input`: `Digite EXCLUIR para confirmar` (comparar `typed.trim() === 'EXCLUIR'`, caixa exata) e `Senha atual` (`type="password"`, `autoComplete="current-password"`). Botão `Excluir minha conta` habilita só com os dois. `handleClose = isPending ? () => {} : onClose`. Em `invalid_password`: limpar senha, erro inline `Senha incorreta.` no campo, diálogo continua aberto.
- Copy por tipo (função pura em `src/lib/accountDeletion.ts`, testável): autônomo, empresa (inclui contagem de pacientes e "os fisios mantêm o login, mas perdem o vínculo"), fisio (os pacientes ficam com a empresa). A contagem de pacientes da empresa pode vir de `select count` com RLS (já enxerga os pacientes dos fisios ativos); é informativa, a autoridade é a função SQL.
- Estrutura: `AccountPage` tem artigos `rounded-2xl border border-line bg-surface p-4` em `space-y-6`. Acrescentar um terceiro `<article>` "Área sensível" no fim com texto de aviso e botão de perigo (`!bg-error !text-white`, ou link `text-error` como em Remover foto). Atualizar `description` do `PageHeader` ("Foto, nome e senha desta conta.") se necessário.

### Anti-Patterns to Avoid
- **Apagar `auth.users` primeiro:** a cascata/falha deixa dados sem dono e arquivos órfãos sem como retomar.
- **Aceitar `userId` do corpo:** IDOR; usar só `user.id` do JWT.
- **Reverificar senha só no cliente:** contornável; a função tem que checar.
- **Chamar `signInWithPassword` no cliente com o client principal:** troca a sessão e dispara `onAuthStateChange`.
- **Atualizar `owner_id` do quadro sem desligar o gatilho:** o UPDATE é silenciosamente revertido e a FK `no action` bloqueia a exclusão do perfil.
- **Apagar o perfil antes do `deleteUser` no caminho feliz:** abre janela de conta sem perfil que o app não consegue mais usar.
- **Expor `delete_account_data` a `authenticated`:** qualquer usuário apagaria os dados sem senha.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Remoção de usuário e sessões | DELETE em `auth.users` por SQL | `admin.auth.admin.deleteUser(id)` | Cascata em `auth.sessions`/identities é do GoTrue `[CITED: supabase.com/docs/guides/auth/managing-user-data]` |
| Apagar arquivos | DELETE em `storage.objects` | `storage.remove` com service role | Remover só metadado deixa o blob (fase 28) |
| Atomicidade de banco | N chamadas `.delete()` | Uma função plpgsql | Cada chamada commita |
| Reautenticação | Comparar hash | `signInWithPassword` | Rate limit e política do GoTrue |
| Lógica de exclusão de paciente | Reescrever outra lista de tabelas | Reaproveitar a ordem da `delete_patient_full`, set-based | Inventário já provado na fase 28 |
| Revogação Google | Chamada nova | Mesma `revokeGoogleToken` de `google-calendar-disconnect` | Já testada |

**Key insight:** o risco real não está em "apagar", está em FKs `no action` desconhecidas (bloqueiam `deleteUser`) e em objetos de storage cujo `owner` é o usuário; os dois se resolvem por descoberta antes do SQL.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Tabelas listadas no inventário; tombstone novo `private.account_deletion_pending` | Função SQL (data migration por exclusão/transferência) |
| Live service config | Eventos já exportados ao Google Agenda continuam no Google; tokens: revogar | Revogar refresh token best-effort; avisar no diálogo que eventos exportados continuam lá |
| OS-registered state | None — verified: projeto não registra tarefas de SO | none |
| Secrets/env vars | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (injetados na Edge Function) | Nenhum novo; não colocar nada `VITE_*` |
| Build artifacts | Nenhum | none |

## Common Pitfalls

### Pitfall 1: `deleteUser` falha por objeto de storage do usuário
**What goes wrong:** "Database error deleting user" ao excluir um fisio que enviou imagens para pacientes transferidos.
**Why:** o usuário continua dono (`storage.objects.owner`) `[CITED: supabase.com/docs/guides/auth/managing-user-data]`.
**How to avoid:** a função SQL reatribui `owner` (e `owner_id`, se existir) para o dono da empresa; o resultado (c) da descoberta mostra as colunas; sweep final de objetos com `owner = user` nos demais casos.
**Warning signs:** mensagem do `deleteUser` com `objects_owner_fkey`/SQLSTATE 23503 nos logs do Postgres.

### Pitfall 2: FK `no action` desconhecida
**What goes wrong:** `deleteUser` ou `delete from profiles` retorna 23503.
**How to avoid:** a descoberta (a) lista todas; a função cobre cada uma; contrato de teste confere que cada tabela da saída aparece no SQL.
**Warning signs:** 23503 na primeira exclusão real.

### Pitfall 3: Gatilhos de carimbo do quadro
**What goes wrong:** `update board_* set owner_id = ...` não muda nada.
**How to avoid:** `disable trigger`/`enable trigger` dentro da função (ou apagar em vez de transferir).

### Pitfall 4: Paciente sem filhos mapeados / `board_cards` `set null`
**How to avoid:** `delete from board_cards where patient_id in (...)` explícito (fase 28, decisão A2).

### Pitfall 5: Fisio órfão após exclusão da empresa
**What goes wrong:** login existe, `/aguardando` para sempre (`membership === null`).
**How to avoid:** decidir Q1.

### Pitfall 6: `signOut()` global depois do usuário excluído
**What goes wrong:** `supabase.auth.signOut()` tenta revogar no servidor e pode devolver erro; o `signOut` de `auth.service.ts` lança nesse caso.
**How to avoid:** `signOut({ scope: 'local' })` direto, dentro de `try/catch`.

### Pitfall 7: Timeout da Edge Function com muitos arquivos
**What goes wrong:** corte no meio da limpeza de storage.
**How to avoid:** tombstone permite retomar; lotes de 100; contagem de arquivos tipicamente baixa `[ASSUMED]` (limite de tempo exato de execução não verificado nesta sessão).

### Pitfall 8: Duplo clique / duas abas
**How to avoid:** `for update` no perfil; botão em loading; diálogo não fecha; função idempotente.

## Code Examples

### Limpeza de storage por prefixo (Deno)
```ts
// Source: supabase-js storage API; mesmo laço de src/services/patientDeletion.service.ts
async function purgeFolder(admin: SupabaseClient, bucket: string, folder: string): Promise<void> {
  for (let guard = 0; guard < 200; guard += 1) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset: 0 })
    if (error) throw new Error('storage_list_failed')
    const files = (data ?? []).filter((e) => e.id !== null).map((e) => `${folder}/${e.name}`)
    if (files.length === 0) return
    const { error: rmError } = await admin.storage.from(bucket).remove(files)
    if (rmError) throw new Error('storage_remove_failed')
  }
  throw new Error('storage_purge_incomplete')
}
```
(Sempre `offset: 0` depois de remover o lote evita pular itens; o limite `guard` evita laço infinito.)

### deleteUser
```ts
const { error } = await admin.auth.admin.deleteUser(user.id)   // shouldSoftDelete padrão false
if (error) return jsonResponse({ error: 'delete_failed', code: 'delete_failed' }, 500)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cliente apaga os próprios dados | Edge Function com service role + RPC só `service_role` | — | Única forma de remover `auth.users` com segurança |

**Deprecated/outdated:** Nada relevante para esta fase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `profiles.id` tem FK `on delete cascade` para `auth.users` | Inventário | Se não houver, Edge Function apaga o perfil logo antes do `deleteUser` (plano cobre os dois casos) |
| A2 | UPDATE em `storage.objects.owner` por função do `postgres` é permitido | Pitfall 1 | Se negado, apagar os arquivos enviados pelo fisio ou trocar o dono pela API; descoberta (c) e primeiro teste mostram |
| A3 | `patient_sessions.created_by`/`therapist_id` e filhos podem ter FK `no action` | Inventário | Coberto pela descoberta (a) |
| A4 | Edge Function não estoura o tempo com os volumes esperados | Pitfall 7 | Tombstone + retry mitigam |
| A5 | `signOut({scope:'local'})` não exige o usuário existir no servidor | Padrão D | Se falhar, limpar o storage local manualmente; try/catch já tolera |
| A6 | `invoke` entrega o corpo JSON em `error.context` para 401/500 (mesmo que para as funções do Google) | Padrão D | Cliente mapeia por status como fallback |

## Open Questions (RESOLVED / pendentes)

1. **Fisios da empresa excluída ficam presos em `/aguardando`?**
   - What we know: `AuthProvider.isAuthenticated` exige membership para `fisioterapeuta`; `ProtectedRoute` manda para `/aguardando`. CONTEXT diz "login continua, sem empresa".
   - What's unclear: se o usuário quer que esses logins sejam utilizáveis.
   - **Needs user decision.** Recomendação: a função SQL converte `profiles.account_type` dos membros ativos para `autonomo` (viram contas autônomas vazias, utilizáveis). Alternativa literal ao CONTEXT: deixar como está (login existe, app inutilizável até nova adesão). Não implementar a conversão sem confirmação.

2. **Autoria nos filhos mantidos do fisio transferido: `null` ou dono?** (RESOLVED por regra) `null` se a coluna for anulável, dono se for NOT NULL; fechar com a saída (a)/(b).

3. **`created_by_name`/`therapist_name` (texto) em evoluções/avaliações do fisio excluído.** Mantém o nome no registro clínico (informação do paciente, autoria histórica). Para LGPD estrita poderia ser apagado. (RESOLVED: manter; "sem perder nada" em CONTEXT.) Sinalizar ao usuário se quiser anonimizar.

4. **Fisio `pending` consegue excluir a conta?** `/conta` fica dentro de `ProtectedRoute`; pending vai para `/aguardando`. CONTEXT cita pending/rejected só para os dados. (RESOLVED: sem UI para pending nesta fase; a função SQL já trata o caso; botão em `/aguardando` fica fora de escopo, mencionar ao usuário.)

5. **Perfil: cascade ou explícito?** (pendente da descoberta (a)). Não bloqueia o desenho.

6. **Pacientes de fisios `pending`/`rejected` na exclusão da empresa.** (RESOLVED: preservados, pertencem a eles.)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `node --test`, typecheck | ✓ | v26.4.0 | — |
| `deno` / `supabase` CLI | Rodar/deploy local da função | ✗ | — | Deploy pelo Dashboard (ação humana); validação por teste de contrato de fonte |
| SQL Editor do Supabase | Aplicar SQL e descoberta | ✓ (humano) | — | — |
| Edge Function secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) | `delete-account` | ✓ (injetados automaticamente pelo runtime, já usados por funções existentes) | — | — |

**Missing dependencies with no fallback:** nenhuma.
**Missing dependencies with fallback:** CLI do Supabase/Deno (deploy manual).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (Node v26.4.0), testes TS lidos direto com `node --test` |
| Config file | nenhum (sem script `test` em package.json; comandos explícitos como nas fases 26/28) |
| Quick run command | `node --test src/lib/phase31Sql.contract.test.ts src/lib/phase31Edge.contract.test.ts src/lib/accountDeletion.test.ts` |
| Full suite command | `node --test src/lib/*.test.ts && npm run typecheck && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-42 | `EXCLUIR` exato + senha habilitam o botão; copy por tipo de conta | unit | `node --test src/lib/accountDeletion.test.ts` | ❌ Wave 0 |
| REQ-42 | SQL: `security definer`, `search_path = ''`, revoke de `public/anon/authenticated`, grant só `service_role`, sem `auth.uid()`, tombstone, charges antes de prices, org depois de memberships, patients por último, `disable trigger` do quadro, sem `supabase/migrations` | contrato SQL | `node --test src/lib/phase31Sql.contract.test.ts` | ❌ Wave 0 |
| REQ-42 | Edge: `getUser`, `user.id` só do JWT, sem `userId` no corpo, `confirm === 'EXCLUIR'`, `signInWithPassword` antes de `rpc`, ordem rpc -> storage -> `deleteUser`, `deleteUser` por último, service role só `Deno.env`, CORS | contrato de fonte | `node --test src/lib/phase31Edge.contract.test.ts` | ❌ Wave 0 |
| REQ-42 | Cliente: serviço sem toast, copy fixa, `signOut({scope:'local'})`, `queryClient.clear`, navigate `/`, toast `Sua conta foi excluída.`; diálogo não fecha em pending; sem `service_role`/`SERVICE_ROLE` em `src/` | contrato UI | `node --test src/lib/phase31Ui.contract.test.ts` | ❌ Wave 0 |
| REQ-42 | Cada tabela com FK do resultado (a) aparece no SQL final | contrato SQL | idem Sql | ❌ Wave 0 |
| REQ-42 | Fluxo real por tipo de conta | manual | checklist abaixo | — |

### Sampling Rate
- **Per task commit:** o comando rápido da tarefa + `npm run typecheck`
- **Per wave merge:** suíte completa de `src/lib/*.test.ts`
- **Phase gate:** suíte completa + `npm run build` verdes antes de `/gsd:verify-work`

### Checklist manual (Supabase, contas descartáveis)
1. **Autônomo** com paciente, sessão, imagem, relatório IA, cobrança, preço, card, avatar, Google: excluir -> conferir 0 linhas (queries por `created_by`/`owner_id`), 0 objetos nos 4 buckets, `auth.users` sem a linha, login com a senha antiga falha.
2. **Empresa** com 2 fisios ativos e pacientes de cada um: excluir -> pacientes de todos somem, org e memberships somem, fisios continuam em `auth.users`/`profiles`, pacientes próprios de fisio pending intactos.
3. **Fisio ativo** com paciente, imagem enviada por ele, sessão com `therapist_id`: excluir -> paciente existe com `created_by` = dono, dono vê a ficha e a imagem (arquivo ainda abre), `therapist_id` null, `storage.objects` sem `owner` do fisio, card do quadro da empresa continua.
4. **Fisio pending** (via SQL/Service role, sem UI): função apaga só o dele.
5. Senha errada: nada muda, erro `Senha incorreta.`. `EXCLUIR` errado: botão desabilitado.
6. Falha simulada após o banco (renomear bucket/forçar erro): retry conclui; tombstone some no fim.
7. Chamada direta à Edge Function com JWT de A e `userId` de B no corpo: age só em A.
8. `rpc('delete_account_data')` com token de `authenticated`: 403/permission denied.

### Wave 0 Gaps
- [ ] `src/lib/accountDeletion.ts` + `accountDeletion.test.ts`
- [ ] `src/lib/phase31Sql.contract.test.ts`, `phase31Edge.contract.test.ts`, `phase31Ui.contract.test.ts` (modelo: `phase28*.contract.test.ts`; helpers `stripSqlComments`, `sliceFunction`)
- [ ] Saída da descoberta 31-00 colada em `31-DB-DISCOVERY.md`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Reverificação de senha no servidor (`signInWithPassword` com cliente efêmero); rate limit do GoTrue + `checkRateLimit` no cliente |
| V3 Session Management | yes | `deleteUser` invalida sessões; `signOut({scope:'local'})` no cliente |
| V4 Access Control | yes | `user.id` do JWT; RPC só `service_role`; nenhuma RPC de usuário aceita `user_id` |
| V5 Input Validation | yes | `confirm === 'EXCLUIR'` e `password` string não vazia validados no servidor; zod no formulário |
| V6 Cryptography | no | Nada de cripto própria |
| V7/V8 Error handling & data protection | yes | Copy fixa; sem detalhes internos; tombstone sem PII (só UUIDs) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR (apagar conta de terceiro) | Elevation | Nunca ler id do corpo; `getUser(token)`; contrato de teste |
| Sessão roubada apaga conta | Elevation/Tampering | Senha obrigatória reverificada no servidor; e-mail vem do JWT |
| Vazamento da service role | Information disclosure | Só `Deno.env` na Edge Function; teste de contrato proíbe `SERVICE_ROLE` em `src/`; nada `VITE_*` |
| Chamar a RPC diretamente | Elevation | `revoke` de `public/anon/authenticated`, `grant` só `service_role`; `search_path = ''` |
| Conta pela metade | Denial of service/Integrity | Ordem banco -> storage -> auth, tombstone, idempotência |
| Brute force de senha via o endpoint | Spoofing | Limites do GoTrue; resposta genérica; rate limit no cliente |
| CORS aberto (`*`) | — | Mantido como nas funções existentes (a autorização é o JWT + senha); `verify_jwt` do gateway permanece ligado |

## Sources

### Primary (HIGH confidence)
- Código do repositório: `supabase/functions/google-calendar-disconnect/index.ts`, `src/pages/AccountPage.tsx`, `src/services/auth.service.ts`, `src/services/accountPhoto.service.ts`, `src/services/patientDeletion.service.ts`, `src/providers/AuthProvider.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/components/patients/DeletePatientDialog.tsx`, `src/routes`.
- SQL: `supabase/03, 05, 07, 08, 11, patients-req05-evaluations`, fases 17, 18, 28, 29 (`.planning/phases/*/sql/`), `28-DB-DISCOVERY.md`.
- Supabase Docs, User Management: https://supabase.com/docs/guides/auth/managing-user-data (dono de objetos de Storage bloqueia exclusão; `deleteUser` com `shouldSoftDelete: false` cascateia sessões).

### Secondary (MEDIUM confidence)
- WebSearch: FKs sem cascade para `auth.users` causam "Database error deleting user" (blog de terceiros, GuardLayer) — consistente com a doc oficial; a descoberta 31-00 confirma no banco real.

### Tertiary (LOW confidence)
- Limites de tempo de execução de Edge Function (não verificados).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — mesmo stack das funções e da fase 28.
- Architecture: HIGH — padrão provado (tombstone + RPC + service role); ordem justificada.
- Inventário de FKs: MEDIUM — tabelas criadas só no banco vivo, descoberta pendente.
- Pitfalls: MEDIUM-HIGH — storage ownership documentado; gatilho do quadro verificado no SQL.

**Research date:** 2026-10-12
**Valid until:** 2026-11-12
