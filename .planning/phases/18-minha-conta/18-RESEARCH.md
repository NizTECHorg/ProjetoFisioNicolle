# Phase 18: Minha conta - Research

**Researched:** 2026-09-24
**Domain:** Conta da sessão (navegação, `profiles`, Storage privado, Supabase Auth password change)
**Confidence:** MEDIUM

## Summary

A página é uma rota clínica nova dentro de `AppShell`, aberta por um `NavLink` só com ícone ao lado de Sair. Nome e foto persistem em `public.profiles` (`full_name`, `avatar_url`). A foto é um objeto privado num bucket novo `account-avatars`. O código de hoje não grava foto de usuário em `patient-avatars`; não reutilizar esse bucket.

A senha não mora em `profiles`. Quem grava é `supabase.auth.updateUser` com `password` e `current_password` juntos. No GoTrue atual isso só é conferido quando `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` está ligado. O padrão do servidor é desligado: sem o toggle, o campo é ignorado e a senha nova grava mesmo se a atual estiver errada. O cliente instalado (`@supabase/supabase-js` 2.110.7) ainda não declara `current_password` no tipo; 2.117.1 declara.

A prova de que a senha mudou ou não mudou é `supabase.auth.signInWithPassword`, num client separado com `persistSession: false`. `updateUser` retornar sucesso não prova o login. Conferir a senha atual só com um `signInWithPassword` antes de `updateUser({ password })` não basta: um cliente modificado pula essa chamada, e com o flag desligado o Auth grava a senha nova.

**Primary recommendation:** Rota `/conta`, update de `profiles.full_name` e path em `profiles.avatar_url` no bucket `account-avatars`, `REVOKE UPDATE` amplo em `profiles` com `GRANT UPDATE (full_name, avatar_url)`, bump do supabase-js para 2.117.1, toggle Auth de senha atual obrigatória, e um único `updateUser({ password, current_password })`. A verificação da fase afirma o oráculo `signInWithPassword` descrito em Password Reset Verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: O botão fica em `AppShell`, na faixa do rodapé que já tem as iniciais, o nome e o botão Sair. Fica ao lado de Sair.
- D-02: O botão mostra só um ícone. Sem texto visível. O nome acessível é Minha conta.
- D-03: A página permite trocar a foto da conta, o nome exibido e a senha.
- D-04: As três mudanças valem só para a conta logada e continuam depois de recarregar.
- D-05: Resetar a senha exige verificação antes de gravar a senha nova. A senha atual é conferida; se não bater, a senha não muda. O plano precisa de uma regra de verificação que prove o reset: a senha antiga deixa de entrar e a nova entra.

### Claude's Discretion
- Campos extras além de foto, nome e senha (e-mail só leitura, tipo de conta só leitura).
- Onde a foto da conta é guardada e como a senha é trocada no Supabase Auth.
- Rota e rótulo interno da página, desde que o botão continue só com ícone.

### Deferred Ideas (OUT OF SCOPE)
None — o pedido cobre a entrada e a edição de foto, nome e senha.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-29 | Ícone ao lado de Sair abre a página da própria conta; trocar foto, nome e senha; persistência só dessa conta; senha atual conferida antes de gravar; senha atual errada não altera nada; depois do reset a antiga deixa de entrar e a nova entra | Footer `NavLink` em `AppShell` (D-01/D-02). Nome e path da foto em `profiles` com GRANT de coluna e bucket `account-avatars`. Senha via `updateUser({ password, current_password })` com o flag Auth ligado. Prova em Password Reset Verification via `signInWithPassword`. |
</phase_requirements>

## Project Constraints

`.cursor/rules/` não existe neste repositório. Estas regras vêm do histórico do projeto (STATE, fases 16 e 17) e do brief desta fase. O planner trata com a mesma força das decisões travadas.

- SQL novo vai em `.planning/phases/18-minha-conta/sql/` e é aplicado no SQL Editor do Supabase. Nunca `supabase db push`.
- Não criar um segundo trigger `on_auth_user_created`. Não reescrever `handle_new_user` nesta fase.
- Não reutilizar o bucket `patient-avatars` nem `patients.photo_path` para a foto da conta.
- `profiles.role` continua leftover da confeitaria. Gating e rótulo usam `accountType`.
- Cliente de Auth já está com `flowType: 'implicit'` em `src/lib/supabase/client.ts`. Não voltar para PKCE.
- Não fazer `await` de Postgres dentro de `onAuthStateChange` (deadlock do lock do supabase-js, comentado em `AuthProvider.tsx`).
- Predicados no browser são UX. A parede de nome/foto é RLS + GRANT. A parede da senha é o flag do Auth, não um `if` antes do `updateUser`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Botão Minha conta | Browser / Client | — | `NavLink` na faixa do rodapé de `AppShell`. Não entra em `clinicNavigationItems` nem na bottom nav. |
| Formulário foto / nome / senha | Browser / Client | — | Coleta, zod, toast. Não persiste sozinho. |
| Nome exibido | Database / Storage | API / Backend | `profiles.full_name` é o que `fetchProfile` lê. `updateUser({ data: { full_name } })` só alinha `user_metadata` de fallback. |
| Bytes da foto | Database / Storage | Browser / Client | Bucket privado `account-avatars`. O browser só recorta e envia. |
| Ponteiro da foto | Database / Storage | — | `profiles.avatar_url` guarda o path do objeto, nunca a signed URL. |
| Troca de senha | API / Backend (Supabase Auth) | Browser / Client | GoTrue faz o hash. O browser manda `password` + `current_password`. |
| Conferência da senha atual | API / Backend (Supabase Auth) | — | Só ocorre se `update_password_require_current_password` estiver true. Sem isso o JSON é ignorado. |
| Prova de que a senha antiga/nova entra | API / Backend (Supabase Auth) | — | `signInWithPassword` num client que não grava a sessão do app. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.117.1 (instalado hoje: 2.110.7) | `updateUser`, `signInWithPassword`, Storage, PostgREST | Já é o client do app. 2.117.1 declara `UserAttributes.current_password`. [VERIFIED: npm registry 2026-09-24] [CITED: https://cdn.jsdelivr.net/npm/@supabase/auth-js@2.117.1/dist/module/lib/types.d.ts] |
| `zod` | 3.25.x (já em package.json `^3.25.28`) | Nome e senha nova | `passwordSchema` em `src/schemas/auth.schema.ts` já é a regra do cadastro. |
| `react-router-dom` | 7.6.x (já instalado) | Rota `/conta` | `AppRoutes` já protege o shell com `ProtectedRoute`. |
| `lucide-react` | 1.25.x (já instalado) | Ícone do botão | O Sair já usa `LogOut`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.76.x (já instalado) | Não é obrigatório | Nome e foto podem chamar o service e `reloadProfile()`. Não criar cache paralelo de perfil. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `updateUser({ password, current_password })` com o flag Auth ligado | `signInWithPassword(atual)` e, se ok, `updateUser({ password })` | O sign-in prévio funciona para um usuário honesto mesmo com o flag desligado, mas não impede outro client de chamar `updateUser` só com a senha nova. Também gira a sessão e divide rate limit com o login. Não usar como parede. |
| Flag de senha atual | `reauthenticate()` + `nonce` (Secure password change) | Isso manda OTP por e-mail. Não confere a senha digitada. Sessão com mais de 24 h pode falhar com `reauthentication_needed` antes da senha atual ser lida. Deixar esse toggle desligado. |
| Bucket `account-avatars` + path em `avatar_url` | Reusar `patient-avatars` ou gravar URL pública | O bucket de paciente é autorizado por `can_read_patient` / `can_write_patient`. A conta não é um paciente. URL assinada expira em 3600 s e não pode ser persistida (lição da fase 16). |
| `GRANT UPDATE (full_name, avatar_url)` | Trigger `BEFORE UPDATE` que bloqueia `is_active` | O trigger também dispara dentro de `decide_membership` (security definer ainda vê `auth.uid()`). GRANT de coluna não tira o UPDATE do owner da função. |
| Página nova `AccountPage` | Reativar `SettingsPage` | `SettingsPage` não tem rota, usa tema da confeitaria (`dark-border`, `Badge` de `profile.role`) e não edita nada. |

**Installation:**

```bash
npm install @supabase/supabase-js@2.117.1
```

Não instalar outra lib de auth, crop ou upload. `preparePatientPhoto` em `src/lib/cropPatientPhoto.ts` já faz sniff de magic bytes e crop 512 px.

**Version verification:** `npm view @supabase/supabase-js version` → `2.117.1`, `time.modified` `2026-09-24T11:05:34.687Z`. Instalado no repo: `2.110.7` (sem `current_password` no tipo). `npm view @supabase/supabase-js scripts.postinstall` não retornou script.

## Package Legitimacy Audit

slopcheck não estava instalado e o `pip install slopcheck` não deixou o binário disponível. Pelo protocolo, o bump fica `[ASSUMED]` até o planner passar um `checkpoint:human-verify` antes do `npm install`. Não é pacote novo: é o client que o app já importa.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@supabase/supabase-js@2.117.1` | npm | linha 2.x já usada no repo; este patch publicado 2026-09-24 | não medido nesta sessão | github.com/supabase/supabase-js | indisponível | `[ASSUMED]` — checkpoint antes do bump |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
[AppShell footer]
    initials + nome + NavLink ícone "Minha conta" + botão Sair
                |
                v
        rota /conta  (ProtectedRoute → AppShell)
                |
     +----------+----------+
     |          |          |
     v          v          v
  arquivo    nome       senha atual + senha nova
     |          |          |
     v          v          v
 preparePatientPhoto    zod passwordSchema
     |          |          |
     v          v          v
 Storage.upload          profiles.update          auth.updateUser
 bucket account-avatars  full_name (+ avatar path) password + current_password
 path {uid}/{uuid}.ext   RLS id = auth.uid()      GoTrue (flag obrigatório)
     |          |          |
     v          v          v
 profiles.avatar_url    reloadProfile()         erro: nada gravado
 (path, não URL)        footer relê full_name   sucesso: hash novo
     |
     v
 createSignedUrl 3600s só na leitura (AppShell + página)
     |
     v
[Oráculo separado, persistSession false]
 signInWithPassword(email, senha antiga) → tem de falhar depois do sucesso
 signInWithPassword(email, senha nova)   → tem de criar sessão
```

### Recommended Project Structure

```text
src/
├── components/layout/AppShell.tsx          # ícone ao lado de Sair; círculo com foto ou iniciais
├── pages/AccountPage.tsx                   # Minha conta (não reusar SettingsPage)
├── routes/index.tsx                        # /conta dentro do shell
├── services/auth.service.ts                # updateOwnName, changePassword
├── services/accountPhoto.service.ts        # bucket account-avatars
├── schemas/auth.schema.ts                  # changePasswordSchema
├── providers/AuthProvider.tsx              # reloadProfile(), sem fetch no onAuthStateChange
└── hooks/useAuth.ts                        # expõe reloadProfile

.planning/phases/18-minha-conta/sql/
└── 18-account.sql                          # bucket, check do path, GRANT de coluna
```

### Pattern 1: Botão só ícone ao lado de Sair

**What:** `NavLink` para `/conta` na mesma `div` do botão `LogOut`, antes dele. Sem texto visível. `aria-label="Minha conta"`.
**When to use:** D-01 e D-02. O drawer mobile já abre essa faixa pelo menu; não colocar o item na bottom nav (`mobileNavItems` permanece com 4 itens).
**Example:**

```tsx
<NavLink
  to="/conta"
  aria-label="Minha conta"
  title="Minha conta"
  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
>
  <CircleUser size={17} />
</NavLink>
```

Ícone: `CircleUser` de `lucide-react` (já dependência). O Sair continua `type="button"` com `signOut`.

### Pattern 2: Nome e ponteiro da foto

**What:** `UPDATE profiles SET full_name = $1 WHERE id = auth.uid()` e, na foto, gravar só o path. Depois `reloadProfile()` para o rodapé. Também `updateUser({ data: { full_name } })` para o fallback `user.user_metadata.full_name` de `AppShell`, em chamada separada, sem campo `password`.
**When to use:** Salvar nome. Salvar foto depois do upload. Não mandar `is_active`, `account_type`, `role` nem `email`.
**Example:**

```ts
const { error } = await supabase
  .from('profiles')
  .update({ full_name: fullName })
  .eq('id', userId)
```

`fetchProfile` já seleciona `full_name` e `avatar_url`. `ClinicProfile.avatarUrl` passa a ser a signed URL de leitura, ou o service assina na hora de pintar. Não escrever a signed URL de volta no Postgres. [código vivo: `src/services/auth.service.ts`, `src/services/patientPhoto.service.ts`]

### Pattern 3: Senha com senha atual no mesmo request

**What:** Uma chamada. Sem `signInWithPassword` no caminho de gravação. Sem `reauthenticate`.
**When to use:** Submit do formulário de senha, depois do zod.
**Example:**

```js
// Source: https://supabase.com/docs/guides/auth/passwords
await supabase.auth.updateUser({
  password: 'new_password',
  current_password: 'old_password',
})
```

O tipo em auth-js 2.117.1:

```ts
// Source: https://cdn.jsdelivr.net/npm/@supabase/auth-js@2.117.1/dist/module/lib/types.d.ts
export interface UserAttributes {
  current_password?: string
  password?: string
  nonce?: string
  data?: object
}
```

Comentário desse tipo: o campo só é exigido quando `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` é true. [CITED: types.d.ts 2.117.1]

### Pattern 4: Foto da conta, bucket próprio

**What:** Copiar o desenho de `16-patient-photo.sql` com outro bucket e outra política. Pasta = `auth.uid()`, não `patients.id`. Sem `can_read_patient` / `can_write_patient`. Sem política UPDATE (sem upsert). Sem política para `anon`.
**When to use:** Upload, replace, remove.
**Example:** path `{userId lowercase}/{uuid}.jpg|png|webp`. Bucket privado, `file_size_limit` 2097152, MIME `image/jpeg`, `image/png`, `image/webp`. Leitura com `createSignedUrls(..., 3600)`.

### Anti-Patterns to Avoid

- **`updateUser({ password })` sem `current_password`:** com o flag desligado grava direto; com o flag ligado falha. O código de produção não pode ter esse formato.
- **`signInWithEmail` para “testar” a senha atual:** essa função aplica rate limit de login, pode dar `signOut` em conta recusada e não é a parede do servidor.
- **`auth.admin.updateUserById`:** exige service role. Não entra no browser.
- **`reauthenticate()` + nonce:** OTP de e-mail, fora do D-05.
- **Gravar signed URL em `avatar_url`.**
- **Upload em `patient-avatars`.**
- **Rotear `SettingsPage`.**
- **`await fetchProfile` dentro de `onAuthStateChange`.**
- **Tratar qualquer erro com a palavra “password” como senha fraca.** `mapAuthError` hoje faz isso (`src/lib/security/index.ts`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hash / conferência de senha | Comparar string, RPC que lê `auth.users`, ou sign-in como parede | `updateUser({ password, current_password })` com o flag do Auth | O hash fica no GoTrue. Conferência no client é pulável. |
| Sessão e refresh token | Guardar JWT à mão | Client supabase já persistido | `updateUser` devolve `USER_UPDATED` e mantém a sessão atual. |
| Crop / sniff | Segundo decodificador | `preparePatientPhoto` | Já rejeita o que não é JPEG, PNG ou WebP e limita a 2 MiB de saída. |
| URL pública da foto | Bucket `public: true` | Bucket privado + signed URL na leitura | Mesma regra da fase 16. |
| Colunas sensíveis de `profiles` | Confiar que o form não manda `is_active` | `REVOKE UPDATE` + `GRANT UPDATE (full_name, avatar_url)` | `profiles_update_own` hoje é `id = auth.uid()` sem restrição de coluna (CR-02 da fase 3, ainda sem fix no SQL). |

**Key insight:** Senha e perfil são paredes diferentes. Postgres não vê o hash. Auth não vê `full_name`. Cada um precisa da sua trava, e a prova da senha é um login novo, não o retorno do `updateUser`.

## Password Reset Verification (D-05 / REQ-29.4)

Esta seção é a regra de verificação do plano. O checker e o executor usam estes asserts, não um grep no lugar deles.

### APIs

| Papel | API | O que prova |
|-------|-----|-------------|
| Gravação | `supabase.auth.updateUser({ password, current_password })` | Único write. Envia a senha atual no mesmo `PUT /auth/v1/user`. [CITED: https://supabase.com/docs/guides/auth/passwords] [CITED: https://github.com/supabase/auth/blob/master/internal/api/user.go `UserUpdateParams.CurrentPassword`] |
| Oráculo | `supabase.auth.signInWithPassword({ email, password })` | Credencial aceita ou recusada. Sucesso: `error === null` e `data.session` definido. Falha de senha: `error` com código `invalid_credentials` / mensagem `Invalid login credentials`. [CITED: https://supabase.com/docs/reference/javascript/auth-signinwithpassword] [código vivo: `signInWithEmail` já chama esta API] |

`updateUser` sem erro não prova que a senha antiga deixou de entrar. Quem prova é o oráculo.

### Pré-condição do projeto (bloqueia a fase se falhar)

No dashboard: Authentication → Email → ligar a opção que persiste `security_update_password_require_current_password` (`GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD`). Deixar **desligado** “Secure password change” / reauthentication (`update_password_require_reauthentication`). O default do bool no GoTrue é false (tag sem `default:"true"`). [CITED: https://github.com/supabase/auth/blob/master/internal/conf/configuration.go]

Prova de que o flag está ligado, antes de testar a senha errada:

1. Conta entra com senha `OLD` via oráculo.
2. App chama `updateUser({ password: NEW })` **sem** `current_password`.
3. Assert: `error.code` é `current_password_required` (mensagem GoTrue: `Current password required when setting new password.`).
4. Oráculo: `signInWithPassword(OLD)` ainda cria sessão. `signInWithPassword(NEW)` retorna `invalid_credentials`.

Se o passo 2 gravar `NEW`, o Auth hospedado está antigo ou o toggle está off. Parar. Não entregar D-05 com checagem só no browser.

### Oráculo

Usar um segundo `createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })`. Não usar o client do app: `signInWithPassword` com sucesso substitui a sessão persistida. Não usar `signInWithEmail`.

Senhas do teste têm de passar `passwordSchema` (8–128, minúscula, maiúscula, número, caractere especial, sem o local-part do e-mail). O GoTrue roda `checkPasswordStrength` **antes** da senha atual; senha nova fraca falha sem chegar na conferência e não serve de prova. [CITED: `validateUserUpdateParams` em user.go]

### Asserts que o plano exige

**A. Senha atual errada não grava**

1. Oráculo: `signInWithPassword({ email, password: OLD })` → sessão, `error === null`.
2. App: `updateUser({ password: NEW, current_password: 'errada-nao-e-a-atual' })` → `error.code === 'current_password_invalid'`. Não há segundo request.
3. Oráculo: `signInWithPassword(OLD)` → sessão. `signInWithPassword(NEW)` → `invalid_credentials`.
4. A sessão do app continua a do usuário (o erro não chama `signOut`).

Código GoTrue para senha atual incorreta: `ErrorCodeCurrentPasswordMismatch` = `"current_password_invalid"`. A mensagem humana é a mesma da ausência (`Current password required when setting new password.`). Distinguir pelo `error.code`, não pelo texto. [CITED: https://github.com/supabase/auth/blob/master/internal/api/apierrors/errorcode.go]

**B. Sucesso: antiga deixa de entrar, nova entra**

1. App: `updateUser({ password: NEW, current_password: OLD })` → `error === null`.
2. Oráculo: `signInWithPassword(OLD)` → `invalid_credentials`, sem sessão.
3. Oráculo: `signInWithPassword(NEW)` → sessão, `data.user.id` igual ao usuário que alterou.
4. Recarregar o app ainda mostra a conta (a sessão corrente é preservada no `UpdatePassword` com o id da sessão atual). Sair e entrar com `OLD` falha; entrar com `NEW` funciona.

**C. Código de produção**

- A única chamada que manda `password` é `updateUser` com `current_password` preenchido.
- Campo vazio não chama `updateUser`.
- Não há `signInWithPassword` / `signInWithEmail` no fluxo de gravar senha.
- Não há `reauthenticate`, `nonce`, nem `auth.admin`.
- `mapAuthError` (ou o mapper deste fluxo) trata `current_password_invalid` e `current_password_required` como “Senha atual incorreta.” **antes** do ramo `message.includes('password')`, que hoje devolve “A senha não atende aos requisitos de segurança.”
- `same_password` → “A nova senha deve ser diferente da atual.” (GoTrue também recusa senha igual, depois da conferência.)

## Common Pitfalls

### Pitfall 1: Flag de senha atual desligado

**What goes wrong:** `current_password` vai no JSON e o GoTrue grava a senha nova mesmo assim.
**Why it happens:** O `if config.Security.UpdatePasswordRequireCurrentPassword` envolve a conferência. Fora dele o código segue para `SetPassword`. [CITED: user.go]
**How to avoid:** Toggle no dashboard antes do UAT. O assert de omissão (update sem `current_password` não grava) é a prova.
**Warning signs:** `updateUser({ password })` retorna usuário em vez de `current_password_required`.

### Pitfall 2: Secure password change ligado junto

**What goes wrong:** Sessão com mais de 24 horas recebe `reauthentication_needed` (“Password update requires reauthentication”) mesmo com a senha atual certa. O check do nonce acontece antes do check da senha atual.
**Why it happens:** São dois flags. A doc do CLI chama `auth.email.secure_password_change` de “requires the user's current password”, mas o fonte separa reauthentication (nonce) de `update_password_require_current_password`. [CITED: https://supabase.com/docs/guides/local-development/cli/config] [CITED: configuration.go]
**How to avoid:** Ligar só o de senha atual. Não chamar `reauthenticate()`.
**Warning signs:** Erro `reauthentication_needed` no submit.

### Pitfall 3: `mapAuthError` esconde senha atual errada

**What goes wrong:** A pessoa vê “senha não atende aos requisitos” quando a senha atual está errada.
**Why it happens:** Qualquer `message` que contém `password` cai no ramo genérico.
**How to avoid:** Ramificar por `error.code` primeiro.
**Warning signs:** UAT da senha errada mostra o texto de senha fraca.

### Pitfall 4: `profiles_update_own` sem coluna

**What goes wrong:** O form de nome vira o caminho que também permite `update({ is_active: true, account_type: 'autonomo' })` e desfaz recusa/pendência no client. CR-02 da fase 3 não foi aplicado em SQL.
**Why it happens:** A policy é `id = auth.uid()` para todas as colunas. [código: `03-account-types-team.sql` comentário “profiles_update_own permanece”]
**How to avoid:** No `18-account.sql`, `revoke update on public.profiles from public, anon, authenticated` e `grant update (full_name, avatar_url) on public.profiles to authenticated`. Não revogar de `service_role` nem do owner. `decide_membership` é `security definer` e continua podendo setar `is_active`.
**Warning signs:** PostgREST aceita `is_active` no payload do `authenticated`.

### Pitfall 5: CHECK de `avatar_url` em URL legada

**What goes wrong:** `ADD CONSTRAINT` falha se alguma linha já tem `avatar_url` http.
**Why it happens:** A coluna existe desde a confeitaria e o app nunca gravou path.
**How to avoid:** No script, antes do CHECK, `raise exception` se existir `avatar_url` não nulo que não bata no regex do path. O humano inspeciona. Não fazer `UPDATE` cego para null.
**Warning signs:** SQL Editor para no DO block.

### Pitfall 6: Foto da conta no bucket de paciente

**What goes wrong:** RLS de paciente (`can_write_patient`) ou vazamento entre ficha e conta.
**Why it happens:** Reusar `uploadPatientPhoto` / `patient-avatars`.
**How to avoid:** Service e bucket novos. `preparePatientPhoto` pode ser chamado; o upload não.
**Warning signs:** Objeto com prefixo de `patients.id` ou policy `patient_avatars_storage_*`.

### Pitfall 7: Perfil do rodapé não atualiza

**What goes wrong:** Nome e foto só aparecem depois de um login novo.
**Why it happens:** `AuthProvider` carrega o perfil quando `userId` muda, não quando a linha muda. `USER_UPDATED` não pode disparar fetch dentro do callback (deadlock).
**How to avoid:** `reloadProfile()` chamado pela página depois do save, fora do `onAuthStateChange`.
**Warning signs:** Rodapé velho com a página já mostrando o valor novo.

### Pitfall 8: Senha igual ou fraca usada como prova

**What goes wrong:** O UAT conclui “senha atual falhou” quando o GoTrue recusou força ou igualdade.
**Why it happens:** Força roda antes; `same_password` roda depois da conferência, só se a atual estiver certa.
**How to avoid:** `NEW` diferente de `OLD` e válido no `passwordSchema`.
**Warning signs:** `error.code` é `weak_password` ou `same_password`.

## Code Examples

### updateUser com senha atual

```js
// Source: https://supabase.com/docs/guides/auth/passwords
await supabase.auth.updateUser({
  password: 'new_password',
  current_password: 'old_password',
})
```

### signInWithPassword como oráculo

```js
// Source: https://supabase.com/docs/guides/auth/passwords
const { data, error } = await oracle.auth.signInWithPassword({
  email: 'valid.email@supabase.io',
  password: 'old_password',
})
// data.session definido e error === null → essa senha ainda entra
// error.code === 'invalid_credentials' → essa senha não entra
```

### O que o servidor faz com senha atual errada

```go
// Source: https://github.com/supabase/auth/blob/master/internal/api/user.go
if config.Security.UpdatePasswordRequireCurrentPassword {
  if !session.IsRecovery() {
    if params.CurrentPassword == nil || *params.CurrentPassword == "" {
      return apierrors.NewBadRequestError(
        apierrors.ErrorCodeCurrentPasswordRequired,
        "Current password required when setting new password.",
      )
    }
    isCurrentPasswordCorrect, _, err := user.Authenticate(ctx, db, *params.CurrentPassword, ...)
    if !isCurrentPasswordCorrect {
      return apierrors.NewBadRequestError(
        apierrors.ErrorCodeCurrentPasswordMismatch, // string: current_password_invalid
        "Current password required when setting new password.",
      )
    }
  }
}
```

`SetPassword` só roda depois desse retorno. Senha atual errada não escreve hash.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `updateUser({ password })` com sessão válida | O mesmo, mais `current_password` opcional no tipo | auth-js: documentado a partir de 2.102.0; tipo presente em 2.117.1; ausente em 2.110.7 instalado | Sem bump, o call site precisa de cast. Com bump, o campo é tipado. O servidor só confere se o flag estiver on. |
| Reauthentication por nonce (Secure password change) | Flag separado `update_password_require_current_password` | Commit GoTrue `33b87ae` (2026-02-11), “feat: check current password on change” | D-05 usa o flag novo, não o nonce. |
| `SettingsPage` read-only, sem rota | Página `/conta` no shell clínico | Esta fase | Não reativar a página da confeitaria. |

**Deprecated/outdated:**

- Tratar `auth.email.secure_password_change` da doc do CLI como se fosse a senha atual. No fonte isso é reauthentication. [CITED: CLI config vs configuration.go]
- `supabase.auth.update({ password })` da API v1. O client atual é `updateUser`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | O projeto hospedado ainda tem `profiles_update_own` sem restrição de coluna, como no dump de 2026-09-08 e no SQL da fase 3 | Pitfall 4 | O GRANT pode ser redundante, ou uma policy posterior já restringiu. O script deve ser idempotente (`revoke` + `grant`). |
| A2 | Nenhuma linha de `profiles.avatar_url` tem URL http | Pitfall 5 | O CHECK aborta até o humano limpar ou alargar o regex. O DO block existe para isso. |
| A3 | O Auth hospedado já inclui o código de fevereiro/2026 que lê `current_password` | Password Reset Verification | O assert de omissão falha (a senha grava sem o campo). A fase não fecha D-05 até o projeto atualizar o Auth ou o toggle existir. |
| A4 | O rótulo exato no dashboard é o campo `security_update_password_require_current_password` | Password Reset Verification | O humano procura o toggle de “current password” na página do provider Email. O nome da env é o contrato. |
| A5 | Bump 2.110.7 → 2.117.1 não quebra `flowType: 'implicit'` nem o confirm de e-mail | Standard Stack | Checkpoint do bump. Se o bump for recusado, cast de `current_password` no 2.110.7 ainda serializa o campo porque `_updateUser` espalha `attributes` no body. |

**If this table is empty:** não se aplica.

## Open Questions (RESOLVED)

1. **O Auth hospedado já exige senha atual?** RESOLVED: o plano 18-06 prova com o assert de omissão. `updateUser({ password })` sem `current_password` tem de falhar com `current_password_required`. O operador liga `security_update_password_require_current_password` no Dashboard e deixa reauthentication desligada. Se o update sem current_password gravar, D-05 não fecha.

2. **Há `avatar_url` legado não nulo?** RESOLVED: o plano 18-01 aborta com DO/RAISE EXCEPTION se achar avatar_url não nulo que não seja path do bucket novo. Não faz UPDATE em massa para apagar.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | typecheck / bump | ✓ | v26.4.0 | — |
| npm | bump supabase-js | ✓ | 12.0.2 | — |
| `@supabase/supabase-js` | Auth e Storage | ✓ | 2.110.7 instalado; 2.117.1 no registry | Cast de `current_password` no 2.110.7 se o bump for recusado |
| Supabase SQL Editor | Bucket e GRANT | humano | — | Sem fallback. Não usar CLI `db push`. |
| Dashboard Auth (toggle senha atual) | D-05 no servidor | não verificável daqui | — | Sem fallback seguro. Fase bloqueia se o assert de omissão gravar a senha. |
| Vitest / Playwright | Teste automatizado | ✗ | — | Oráculo manual com `signInWithPassword` |

**Missing dependencies with no fallback:**

- Toggle Auth `security_update_password_require_current_password` ligado no projeto hospedado. Sem isso D-05 não é verdade para um client modificado.

**Missing dependencies with fallback:**

- slopcheck (auditoria de pacote). O bump usa checkpoint humano.
- Runner de teste. Verificação de senha é o oráculo documentado; o resto da fase usa `npm run typecheck`.

## Validation Architecture

Não há `workflow.nyquist_validation: false` em `.planning/config.json`. Não há Vitest, Jest nem Playwright. `package.json` tem `typecheck` e `lint`, sem script `test`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none — não introduzir runner nesta fase |
| Config file | none |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-29.1 | Ícone ao lado de Sair, `aria-label` Minha conta, rota `/conta` | manual-only | — | ❌ sem runner. Justificativa: não há teste de DOM; o plano confere `AppShell` + `routes/index.tsx` na review. |
| REQ-29.2 | Página troca foto, nome e senha da conta logada | manual-only | — | ❌ |
| REQ-29.3 | Foto e nome continuam após reload e não alteram outra conta | manual-only | — | ❌ Storage/RLS só fecham no projeto hospedado. |
| REQ-29.4 | Senha atual errada não grava; depois do sucesso a antiga não entra e a nova entra | manual-only | Oráculo `signInWithPassword` da seção Password Reset Verification | ❌ Justificativa: a prova é credencial no Auth hospedado. Grep não substitui o oráculo. |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck`
- **Phase gate:** typecheck verde e os asserts A, B e o pré-condição (omissão) executados contra o projeto hospedado antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Nenhum arquivo de teste novo — a infra não existe e o gate de senha é o oráculo Auth
- [ ] Checkpoint humano: ligar `security_update_password_require_current_password` e deixar reauthentication desligada
- [ ] Checkpoint humano: colar `18-account.sql` no SQL Editor
- [ ] Checkpoint humano: bump `@supabase/supabase-js@2.117.1` (slopcheck indisponível)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | GoTrue `updateUser` + flag `update_password_require_current_password`. Zod `passwordSchema` no client. Não hashear no browser. |
| V3 Session Management | yes | Sessão supabase-js já persistida. Não rotacionar sessão com `signInWithPassword` no fluxo de troca. Oráculo usa `persistSession: false`. |
| V4 Access Control | yes | RLS `profiles` `id = auth.uid()` mais `GRANT UPDATE` só em `full_name` e `avatar_url`. Storage: pasta = `auth.uid()`. `decide_membership` continua security definer. |
| V5 Input Validation | yes | Zod para nome (2–100, mesmo regex do cadastro) e senha. Magic bytes via `preparePatientPhoto`. Bucket limita MIME e 2 MiB. |
| V6 Cryptography | yes | Hash só no GoTrue. Não implementar bcrypt/argon no app. Signed URL de 3600 s, não persistida. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Troca de senha com sessão roubada, sem saber a senha atual | Elevation of privilege | Flag Auth + `current_password`. Client `if` não conta. |
| `update({ is_active, account_type, role, email })` na própria linha | Elevation of privilege | GRANT de coluna. CR-02. |
| Objeto de foto lido por outra conta | Information disclosure | Policy `bucket_id = 'account-avatars'` e primeiro folder = `auth.uid()::text`. Sem policy de colega. |
| Signed URL gravada e reusada depois de expirar ou vazar | Information disclosure | Coluna guarda path. Assinar na leitura. |
| Senha atual errada mascarada como senha fraca | Repudiation / UX | Mapear `error.code` antes do texto genérico. |
| Força bruta da senha atual | Denial / credential stuffing | Rate limit do Auth (`over_request_rate_limit`). Não reutilizar a chave `auth:login` do `signInWithEmail`, porque isso trava o login da mesma aba. |
| Upload de não-imagem | Tampering | Sniff em `preparePatientPhoto` + `allowed_mime_types` do bucket. |
| Service role no browser | Elevation of privilege | Só anon key. Sem `auth.admin`. |

## Sources

### Primary (HIGH confidence)

- https://supabase.com/docs/guides/auth/passwords — `updateUser({ password, current_password })` documentado para supabase-js v2.102.0+
- https://supabase.com/docs/reference/javascript/auth-signinwithpassword — oráculo de credencial
- https://github.com/supabase/auth/blob/master/internal/api/user.go — conferência só dentro de `UpdatePasswordRequireCurrentPassword`; `SetPassword` depois; força da senha antes
- https://github.com/supabase/auth/blob/master/internal/api/apierrors/errorcode.go — `current_password_invalid`, `current_password_required`, `same_password`, `invalid_credentials`, `reauthentication_needed`
- https://github.com/supabase/auth/blob/master/internal/conf/configuration.go — bool da senha atual sem default true; flag de reauthentication separado
- https://cdn.jsdelivr.net/npm/@supabase/auth-js@2.117.1/dist/module/lib/types.d.ts — `current_password?: string`
- npm registry — `@supabase/supabase-js` 2.117.1 em 2026-09-24; instalado 2.110.7 sem o campo
- Código do repo: `AppShell.tsx`, `auth.service.ts`, `AuthProvider.tsx`, `SettingsPage.tsx`, `routes/index.tsx`, `patientPhoto.service.ts`, `16-patient-photo.sql`, `03-account-types-team.sql`, `mapAuthError`

### Secondary (MEDIUM confidence)

- https://github.com/supabase/auth/commit/33b87ae0671aba2e9b4df0ef1d5d1e7906c32129 — feature de senha atual (2026-02-11)
- https://github.com/supabase/supabase/pull/43324 — toggle de dashboard `security_update_password_require_current_password`
- https://supabase.com/docs/guides/local-development/cli/config — descrição de `secure_password_change` conflita com o fonte; não usar essa frase como spec

### Tertiary (LOW confidence)

- Disponibilidade do toggle no projeto hospedado deste app — não dá para ver daqui. O assert de omissão resolve.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — libs já estão no repo; a versão 2.117.1 foi lida no registry e no tipo publicado
- Architecture: HIGH — rotas, perfil, storage e o buraco do `profiles_update_own` estão no código e no SQL da fase 3
- Pitfalls: MEDIUM — o comportamento do GoTrue está no fonte; o flag do projeto hospedado não foi lido

**Research date:** 2026-09-24
**Valid until:** 2026-10-24 (Auth flag e tipo `current_password` são a parte que muda rápido; o resto do app é estável)
