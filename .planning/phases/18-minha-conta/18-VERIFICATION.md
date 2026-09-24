---
phase: 18-minha-conta
verified: 2026-09-24T14:57:55Z
status: human_needed
score: 7/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Colar .planning/phases/18-minha-conta/sql/18-account.sql no SQL Editor do Supabase e executar uma vez. Não usar supabase db push."
    expected: "O bucket account-avatars fica privado (2 MB, jpeg/png/webp). profiles.avatar_url aceita só path UUID/extensão da própria conta. authenticated só atualiza full_name e avatar_url. Não há política anon nem UPDATE nesse bucket."
    why_human: "O app não aplica SQL. 18-USER-SETUP.md ainda marca esse passo como incompleto. O arquivo no repositório não prova o Postgres hospedado."
  - test: "Em Authentication → Email, ligar a opção que persiste security_update_password_require_current_password. Deixar desligada a reauthentication (update_password_require_reauthentication)."
    expected: "updateUser de senha sem a senha atual é recusado pelo GoTrue. O app não chama reauthenticate."
    why_human: "O default do flag é desligado. Sem ele, a senha nova grava mesmo com a atual errada. O repositório não lê a configuração do projeto hospedado."
  - test: "Oráculo de senha num segundo createClient com persistSession false e autoRefreshToken false. Não reutilizar o client do app e não chamar signInWithEmail. OLD e NEW passam em passwordSchema e são diferentes. 1) signInWithPassword(OLD) cria sessão. 2) updateUser({ password: NEW }) sem current_password. 3) updateUser({ password: NEW, current_password: 'errada-nao-e-a-atual' }). 4) Só se os passos anteriores não gravaram NEW, updateUser({ password: NEW, current_password: OLD }). Em cada passo, repetir signInWithPassword(OLD) e signInWithPassword(NEW). Na UI de /conta, enviar a senha atual errada."
    expected: "Sem current_password, error.code é current_password_required e OLD ainda cria sessão. Com a atual errada, error.code é current_password_invalid, OLD ainda cria sessão e NEW retorna invalid_credentials. A UI mostra exatamente Senha atual incorreta. e a senha não muda. Depois do updateUser com a atual certa, OLD retorna invalid_credentials sem sessão e NEW cria sessão. A sessão do app continua em /conta."
    why_human: "Essa prova é credencial no Auth hospedado. Foi documentada em 18-USER-SETUP.md e não foi executada. typecheck e o schema local não veem o flag nem se a senha antiga ainda entra."
---

# Phase 18: Minha conta Verification Report

**Phase Goal:** No rodapé da barra lateral, ao lado de Sair, um botão só com ícone abre a página da própria conta. Lá a pessoa troca a foto, o nome e a senha.
**Verified:** 2026-09-24T14:57:55Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | O rodapé da navegação tem um botão só com ícone, ao lado de Sair, que abre Minha conta | ✓ VERIFIED | `AppShell` coloca um `NavLink` para `/conta` imediatamente antes do botão Sair. O link só renderiza `CircleUser`, com `aria-label` e `title` "Minha conta". A rota `/conta` está dentro de `ProtectedRoute` e `AppShell` e monta `AccountPage`. |
| 2 | Na página, a pessoa troca a própria foto, o próprio nome e a própria senha | ✓ VERIFIED | `AccountPage` envia a foto por `preparePatientPhoto` + `uploadAccountPhoto`, o nome por `updateOwnName` e a senha por `changePassword`. E-mail e tipo de conta são texto somente leitura. |
| 3 | A foto da conta mora no bucket privado account-avatars, na pasta da própria conta, e profiles.avatar_url guarda só o path. O authenticated só atualiza full_name e avatar_url | ✓ VERIFIED | `sql/18-account.sql` cria o bucket privado, políticas select/insert/delete com pasta `auth.uid()`, sem política UPDATE e sem política anon, o CHECK `profiles_avatar_url_shape` e `grant update (full_name, avatar_url)`. `uploadAccountPhoto` grava `{userId}/{uuid}.ext` e atualiza `avatar_url` com esse path. A signed URL fica só no estado de exibição. |
| 4 | A troca de senha envia a senha atual na mesma chamada updateUser. Senha vazia, fraca ou diferente da confirmação não chama updateUser | ✓ VERIFIED | `changePassword` faz `updateUser({ password, current_password })` depois de `changePasswordSchema`. Não há `signInWithPassword` nesse caminho. Spot-check do schema rejeitou vazio, fraca, divergente e igual à atual, e aceitou um par válido. `@supabase/auth-js@2.117.1` declara `current_password` em `UserAttributes`. A sessão do app permanece `flowType: 'implicit'`. |
| 5 | current_password_invalid e current_password_required viram Senha atual incorreta. same_password vira A nova senha deve ser diferente da atual. Esses ramos ficam antes do texto genérico de password | ✓ VERIFIED | `mapAuthError` trata os três `error.code` antes de `message.includes('password')`. Spot-check com message contendo "password" devolveu as duas cópias do UI-SPEC. `AccountPage` coloca "Senha atual incorreta." no campo Senha atual e não chama `signOut`. |
| 6 | reloadProfile busca o perfil fora de onAuthStateChange, então o rodapé atualiza sem login novo | ✓ VERIFIED | O callback de `onAuthStateChange` só grava a sessão. `reloadProfile` chama `fetchProfile` e `setProfile`. Foto e nome da página chamam `reloadProfile` depois de salvar. O rodapé lê `profile.fullName` e `profile.avatarUrl`. |
| 7 | mobileNavItems permanece com 4 itens. SettingsPage não ganha rota. O app não ganha biblioteca nova de recorte, upload ou teste | ✓ VERIFIED | `mobileNavItems` tem Início, Pacientes, Agenda e Quadro. `routes/index.tsx` não importa `SettingsPage`. `package.json` fixa `@supabase/supabase-js` em 2.117.1 e não adiciona cropper nem runner de teste. |
| 8 | Depois de salvar e recarregar, foto, nome e senha novos valem só para essa conta | ? UNCERTAIN | O cliente recarrega o próprio perfil e o SQL limita path e colunas à conta logada, mas o script não foi aplicado por este repositório. `18-USER-SETUP.md` ainda está Incomplete. Sem o Postgres hospedado, a foto e o nome novos não estão provados depois do reload. |
| 9 | Resetar a senha confere a senha atual antes de gravar a nova; senha atual errada não altera nada, e depois do reset a senha antiga deixa de entrar | ? UNCERTAIN | O client envia `current_password`, e a cópia de erro está no código. O oráculo hospedado (segundo client, `persistSession: false`) está documentado em `18-USER-SETUP.md` e não foi executado. Isso não é prova de que a senha antiga deixou de entrar. |

**Score:** 7/9 truths verified

Truths 8 and 9 are not failed code. The client and the SQL/docs exist. The hosted effect still needs a person, so they stay uncertain and do not count as automated proof.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `.planning/phases/18-minha-conta/sql/18-account.sql` | Bucket, políticas, CHECK e GRANT | ✓ VERIFIED | 117 linhas. Contém `account-avatars`, `account_avatars_storage_select`, `profiles_avatar_url_shape` e `grant update (full_name, avatar_url)`. Não dropa `profiles_update_own`. |
| `package.json` | `@supabase/supabase-js` 2.117.1 | ✓ VERIFIED | Dependência pinada. `node_modules` resolve supabase-js e auth-js 2.117.1, com `current_password?: string`. |
| `src/schemas/auth.schema.ts` | `changePasswordSchema` e `accountNameSchema` | ✓ VERIFIED | Exportados e usados por `AccountPage` e `auth.service`. |
| `src/lib/security/index.ts` | `mapAuthError` por `error.code` | ✓ VERIFIED | Códigos de senha atual antes do ramo genérico. |
| `src/services/auth.service.ts` | `updateOwnName` e `changePassword` | ✓ VERIFIED | Nome grava só `full_name` e depois `user_metadata.full_name`, sem campo password. Senha manda os dois campos juntos. |
| `src/services/accountPhoto.service.ts` | upload, signed URL e remoção | ✓ VERIFIED | Bucket `account-avatars`, `upsert: false`, coluna recebe o path. |
| `src/hooks/useAuth.ts` | `reloadProfile` no contexto | ✓ VERIFIED | Interface e provider expõem a função. |
| `src/providers/AuthProvider.tsx` | reload fora do callback de auth | ✓ VERIFIED | `fetchProfile` só em `reloadProfile` e no efeito de `userId`. |
| `src/pages/AccountPage.tsx` | Cards Foto e nome e Senha | ✓ VERIFIED | 376 linhas. Botões Salvar nome e Salvar senha chamam os services. |
| `src/components/layout/AppShell.tsx` | NavLink Minha conta e círculo com foto ou iniciais | ✓ VERIFIED | Ícone ao lado de Sair. Foto vem de `signAccountAvatarUrl`. |
| `src/routes/index.tsx` | rota `/conta` protegida | ✓ VERIFIED | Filha de `ProtectedRoute` e `AppShell`. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `sql/18-account.sql` | `storage.objects` | políticas select, insert e delete com pasta `auth.uid()` | WIRED | Três policies `account_avatars_storage_*`. Sem policy UPDATE e sem `anon`. |
| `sql/18-account.sql` | `public.profiles` | `grant update (full_name, avatar_url)` | WIRED | `revoke update` de public, anon e authenticated, depois o GRANT das duas colunas. |
| `package.json` | `node_modules/@supabase/auth-js` | versão 2.117.1 | WIRED | `UserAttributes.current_password` presente em `dist/module/lib/types.d.ts`. |
| `src/lib/security/index.ts` | `AccountPage` | `changePassword` lança `Error(mapAuthError(error))` | WIRED | A página compara a string e faz `setError` em Senha atual. |
| `src/schemas/auth.schema.ts` | `supabase.auth.updateUser` | parse falha e o service não é chamado | WIRED | `zodResolver(changePasswordSchema)` no form; `changePassword` faz parse de novo antes do `updateUser`. |
| `auth.service.ts` | `supabase.auth.updateUser` | `password` e `current_password` no mesmo objeto | WIRED | Única chamada que envia `password` é `changePassword`. `updateOwnName` manda só `data.full_name`. |
| `accountPhoto.service.ts` | `profiles.avatar_url` | upload no bucket e depois update do path | WIRED | Falha no update apaga o objeto novo. |
| `AuthProvider.tsx` | `fetchProfile` | `reloadProfile` fora de `onAuthStateChange` | WIRED | Callback de auth não consulta o banco. |
| `AppShell.tsx` | `/conta` | `NavLink to="/conta"` antes de Sair | WIRED | Sem rótulo visível; nome acessível Minha conta. |
| `AccountPage.tsx` | `accountPhoto.service.ts` | `uploadAccountPhoto` e depois `reloadProfile` | WIRED | Remoção usa `removeAccountPhoto` e também recarrega o perfil. |
| `AccountPage.tsx` | `auth.service.ts` | `updateOwnName` em Salvar nome e `changePassword` em Salvar senha | WIRED | Os dois submits tratam erro e toast. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `AppShell.tsx` | `displayName`, `avatarSrc` | `profile` via `fetchProfile` / `reloadProfile`; signed URL de `account-avatars` | Sim, quando o perfil e o storage respondem | ✓ FLOWING |
| `AccountPage.tsx` | `savedName`, `signedUrl`, `email` | Mesmo perfil e `user.email`; senha não é lida de volta | Sim para nome, e-mail e foto | ✓ FLOWING |
| `auth.service.ts` `changePassword` | `parsed.currentPassword`, `parsed.newPassword` | Form validado por zod, enviado a `updateUser` | O efeito no GoTrue hospedado não foi executado | ⚠️ STATIC no sentido de prova: o payload é real, o oráculo não rodou |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Schema rejeita senha vazia, fraca, diferente e igual à atual; aceita par válido. Nome com espaços vira "Ana" | `node --experimental-strip-types` importando `changePasswordSchema` e `accountNameSchema` | PASS nas cinco checagens | ✓ PASS |
| `mapAuthError` com message contendo "password" ainda devolve a cópia dos códigos | mesmo processo, códigos `current_password_invalid`, `current_password_required`, `same_password` | "Senha atual incorreta." e "A nova senha deve ser diferente da atual." | ✓ PASS |
| Pacote instalado declara `current_password` | `node` em `package.json` de supabase-js/auth-js e `rg` em `types.d.ts` | supabase-js 2.117.1, auth-js 2.117.1, campo na linha 438 | ✓ PASS |
| Oráculo hospedado: senha errada não grava; senha antiga deixa de entrar | segundo client contra o Auth hospedado | Não executado. Documentado em `18-USER-SETUP.md` | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| Nenhum | A fase não declara `scripts/*/tests/probe-*.sh` | A prova de senha é o oráculo manual, não um probe | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-29 | 18-01 a 18-06 | Minha conta — ícone ao lado de Sair; trocar foto, nome e senha | ? NEEDS HUMAN | Aceites 1 e 2 estão no código (ícone, rota, três formulários). Aceites 3 e 4 dependem do SQL colado e do oráculo de senha, que não foram executados. |

REQ-05 a REQ-28 aparecem em `REQUIREMENTS.md` e no mapa de fases, ligados a outras fases. Nenhum plano da fase 18 declara esses IDs. Eles não são lacunas desta fase. O único ID da fase 18 é REQ-29, e ele está nos seis planos.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | Nenhum `TBD`, `FIXME` ou `XXX` nos arquivos da fase | — | — |

Notas de desconfirmação, sem bloquear o código:

- O requisito de senha está só em parte cumprido: o client manda `current_password`, e o flag hospedado continua por confirmar.
- `npm run typecheck` e o spot-check do schema não exercitam o GoTrue. Uma suíte verde não prova que a senha antiga deixou de entrar.
- O caminho `updateUser({ password })` sem `current_password` não tem chamada no app, de propósito. A falha `current_password_required` só existe se o flag hospedado estiver ligado, e essa chamada não foi feita.

### Human Verification Required

### 1. SQL do bucket e do GRANT

**Test:** Colar `.planning/phases/18-minha-conta/sql/18-account.sql` no SQL Editor e executar uma vez. Não usar `supabase db push`.
**Expected:** Bucket `account-avatars` privado, CHECK do path, políticas só da pasta `auth.uid()`, e UPDATE de `authenticated` limitado a `full_name` e `avatar_url`.
**Why human:** O plano entrega o script. O app não aplica SQL, e o setup da fase ainda está incompleto.

### 2. Flag de senha atual no Auth

**Test:** Ligar `security_update_password_require_current_password`. Deixar a reauthentication desligada.
**Expected:** Troca de senha sem a senha atual é recusada. O app não chama `reauthenticate`.
**Why human:** O default do GoTrue é o flag desligado. O repositório não consulta o dashboard.

### 3. Oráculo de senha no Auth hospedado

**Test:** Segundo client com `persistSession: false` e `autoRefreshToken: false`, nos quatro passos de `18-USER-SETUP.md` e no human-check do plano 18-06. Na UI, senha atual errada.
**Expected:** Senha atual errada devolve `current_password_invalid` e a antiga ainda entra. Sem `current_password`, o código é `current_password_required` e a senha não muda. Depois do acerto, a antiga devolve `invalid_credentials` e a nova cria sessão. A UI mostra exatamente `Senha atual incorreta.`
**Why human:** Credencial no projeto hospedado. Esta verificação não executou o oráculo e não trata documentação nem typecheck como essa prova.

### Gaps Summary

Não há lacuna de código que impeça o objetivo. O ícone, a rota `/conta` e os três writes estão ligados. O que falta é prova humana no projeto hospedado: o SQL ainda não está confirmado como aplicado, o flag de senha atual não foi conferido, e o oráculo de sign-in da senha antiga e da nova não rodou. Por isso o status é `human_needed`, não `passed`.

---

_Verified: 2026-09-24T14:57:55Z_
_Verifier: Claude (gsd-verifier)_
