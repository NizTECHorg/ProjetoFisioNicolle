# Phase 31: Excluir a própria conta - Context

**Gathered:** 2026-10-12
**Status:** Ready for research/planning
**Source:** Pedido do profissional + respostas às perguntas. discuss-phase pulado — intenção explícita.

<domain>
## Phase Boundary

Na página **Minha conta** (`src/pages/AccountPage.tsx`), o usuário logado exclui a PRÓPRIA conta, de vez, incluindo o usuário em `auth.users` do Supabase. Não há exclusão de conta de terceiros, lixeira nem exportação.

</domain>

<decisions>
## Implementation Decisions

### Por tipo de conta
- **Autônomo:** apaga o login, o perfil e TUDO que é dele: todos os pacientes que criou e todos os filhos deles (mesma cobertura da fase 28: sessões, evoluções, avaliações, metas, alertas, áreas de foco, dor, imagens, relatórios IA, cobranças, vínculos Google, cards), preços (`autonomo_prices`), quadro (`board_columns`/`board_cards`), conexões e segredos do Google Agenda, e os arquivos no storage (pastas dos pacientes nos 3 buckets + `account-avatars/{userId}/`).
- **Empresa (dono):** apaga tudo do dono como acima **e também os pacientes criados pelos fisios da equipe** (com filhos e arquivos), a organização e todos os vínculos (`organization_memberships`). As contas de login dos fisios **continuam**, ficam sem empresa.
- **Fisio de empresa (membership active/pending):** apaga só a conta dele (login, perfil, avatar, quadro/Google próprios se houver). Os pacientes que ele criou **passam para o dono da empresa** (`patients.created_by` = owner), sem perder nada. Sessões anexadas a ele (`patient_sessions.therapist_id`) ficam sem fisio (null). O vínculo dele é removido.
- Fisio sem empresa ativa (pending/rejected) que criou pacientes: tratar como autônomo para os próprios dados (pesquisa confirma o caso).

### Confirmação (disclaimer)
- Área sensível no fim de Minha conta, botão `Excluir minha conta` (estilo de perigo, igual à Área sensível da ficha).
- Diálogo com aviso específico do tipo de conta (o que some, que é definitivo, que não dá para desfazer; para empresa, quantos pacientes e que os fisios perdem o vínculo; para fisio, que os pacientes ficam com a empresa).
- Exige digitar `EXCLUIR` **e** a senha atual. A senha é reverificada (signInWithPassword ou na Edge Function) antes de excluir.
- Durante a exclusão o diálogo não fecha. Sucesso: sai da sessão e vai para a tela de login com `Sua conta foi excluída.` Erro: copy fixa, nada muda.

### Segurança / execução
- Excluir de `auth.users` exige service role → **Edge Function** (`supabase/functions/delete-account`), que valida o JWT do chamador e só age sobre o próprio `user.id`. Nunca expor service role no cliente.
- Dados no banco: função SQL `security definer` (ou a própria Edge Function com service role) em ordem segura, tudo-ou-nada no banco. Storage removido pela Edge Function com service role (sem depender de RLS).
- Ordem deve evitar conta pela metade: decidir na pesquisa (ex.: transferir/apagar dados + storage → apagar auth.users por último; se auth falhar, retry seguro/idempotente).
- Reaproveitar a lógica de `public.delete_patient_full` (fase 28) quando fizer sentido.

### Regras do projeto
- SQL só pelo SQL Editor (arquivo em `.planning/phases/31-excluir-a-pr-pria-conta/sql/`); sem `supabase/migrations`, sem `supabase db push`.
- Edge Function: seguir o padrão das existentes em `supabase/functions/*`; o deploy é ação humana (checkpoint).
- Sem pacote npm novo.

### Claude's Discretion
- Divisão SQL vs Edge Function; nomes; layout exato do diálogo.

</decisions>

<canonical_refs>
- `src/pages/AccountPage.tsx`, `src/services/auth.service.ts`, `src/services/accountPhoto.service.ts`
- `.planning/phases/28-excluir-paciente-por-completo/` (SQL, DB-DISCOVERY, serviço de exclusão de paciente)
- `.planning/phases/29-fisio-anexado-na-sess-o-da-agenda/sql/` (therapist_id, can_read_patient atual)
- `supabase/*.sql` (03 contas/equipe, 05 financeiro, 08 Google, 17 isolamento) e `supabase/functions/*`
- FKs para `auth.users` / `profiles` precisam de descoberta no banco vivo (checkpoint com query só de leitura).
</canonical_refs>

<deferred>
- Exportar dados antes de excluir (LGPD portabilidade).
- Período de carência / desfazer.
- Dono transferir a empresa para outro usuário.
</deferred>
