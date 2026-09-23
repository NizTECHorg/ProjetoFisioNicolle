# Phase 15 — E-mail Fluxo de confirmação de conta

**Gathered:** 2026-09-21  
**Status:** Ready for planning  
**Source:** `/gsd-plan-phase` — user: refatorar e-mail de autorização de criação de conta para marca Fluxo; remetente = e-mail próprio por enquanto

<domain>
## Phase Boundary

Substituir o e-mail genérico de confirmação/autorização de cadastro (Supabase Auth default) por um **e-mail personalizado da Fluxo**, enviado via **SMTP com endereço próprio do operador** (provisório). O fluxo de conta no app (signUp → confirm → autônomo/empresa/fisioterapeuta) permanece; a fase cobre **identidade do e-mail + configuração operacional**, não redesign do cadastro.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Marca Fluxo no e-mail de confirmação
O e-mail disparado na criação de conta (confirm signup / “autorização”) deve ter copy e visual da **Fluxo** — não o template padrão “Supabase Auth” / remetente `@*.supabase.co`.

### D-02 — Remetente provisório = e-mail próprio do operador
Por enquanto o From/SMTP usa um **e-mail pessoal do Artur** (ou outro que ele indicar na execução). Troca futura para domínio `@fluxo…` é **adiada**. Credenciais SMTP ficam só no Supabase Dashboard / secrets — **nunca** no repo nem em `.env` commitado.

### D-03 — Preferir Custom SMTP + Auth Email Templates do Supabase
Não construir mailer próprio no app (SendGrid SDK, Edge Function de e-mail, etc.) nesta fase, salvo research provar bloqueio. Configurar:
1. Custom SMTP no projeto Supabase
2. Templates Auth (Confirm signup; Reset password se ativo) com HTML/texto Fluxo
3. Site URL / Redirect URLs já usados pelo `emailRedirectTo` do `signUpWithEmail`

### D-04 — App code mínimo
Alterar código da SPA só se necessário para: copy pós-cadastro alinhada ao novo e-mail, redirect URL, ou runbook. Não mudar RLS, `handle_new_user`, nem fluxo de tipos de conta.

### D-05 — Escopo de templates
- **In:** Confirm signup (obrigatório); Reset password (mesmo visual, se a feature estiver ligada)
- **Out:** Convite de equipe / invite mailer; e-mails de marketing; white-label por clínica

### D-06 — Documentação operacional entregue no repo
Runbook em `.planning/` ou `docs/` (escolha do planner): passos Dashboard (SMTP host/port/user/pass, From name “Fluxo”, From email), variáveis de template (`{{ .ConfirmationURL }}` etc.), checklist de teste de cadastro real.

### D-07 — Replanejamento 2026-09-23 (do zero): dois bugs bloqueiam o app
O fluxo que já confirmava a conta quebrou depois da personalização. Refazer o plano do zero. Não continuar o desenho que produz estes dois erros:

1. **O link do e-mail ainda abre localhost.** O destino obrigatório é `https://fluxofisio.vercel.app` (e `/auth/confirm` só se o clique confirmar a conta nesse host). Proibido `window.location.origin`, `localhost` e `127.0.0.1` em `emailRedirectTo`, Site URL documentada e href do template.
2. **O clique não autentica a conta nova.** Depois do botão, `email_confirmed_at` tem de ficar preenchido e o usuário tem de conseguir entrar com e-mail e senha. O plano anterior (PKCE + `ConfirmationURL`, ou `token_hash` que não confirma) não pode ser repetido se esse foi o motivo da falha. O comportamento que funcionava antes da customização é o critério: clicar no e-mail autoriza a conta.

E-mails já enviados no fluxo quebrado ficam inválidos. O plano deve exigir um cadastro novo depois da correção.

### Claude's Discretion
- Provedor SMTP concreto (Gmail App Password vs Resend vs outro) — research recomenda; execução usa o que o operador tiver
- Layout HTML do template (simples, tipografia clara, CTA único; sem overdesign)
- Se “magic link” vs token confirm precisa de nota no runbook
- Exact From display name (`Fluxo` vs `Fluxo <email>`)

</decisions>

<canonical_refs>
## Canonical References

### Auth / cadastro
- `src/services/auth.service.ts` — `signUpWithEmail`, `emailRedirectTo`
- `src/pages/auth/RegisterPage.tsx` — copy pós-cadastro / needsEmailConfirmation
- `.planning/codebase/INTEGRATIONS.md` — Auth e-mail hoje: hosted Supabase; templates no Dashboard
- `.planning/phases/03-tipos-de-conta-e-equipe/03-CONTEXT.md` / RESEARCH — confirm-email + identities vazias

### Docs externos (research deve citar URLs oficiais)
- Supabase Auth: Custom SMTP
- Supabase Auth: Email Templates

</canonical_refs>

<specifics>
## Specific Ideas

- User: “quero também que dê para anexar pdfs…” (fase anterior) → agora: “preciso refatorar o email que manda o email de autorização para criação de conta, quero que seja um email personalizado da fluxo, vou usar um email meu por enquanto”
- Produto: Fluxo (prontuário clínico)
- Sem domínio de e-mail próprio ainda → SMTP pessoal é aceitável nesta fase

</specifics>

<deferred>
## Deferred Ideas

- Domínio de e-mail profissional (`@fluxo…`) + SPF/DKIM/DMARC
- White-label / From por organização
- Convites de equipe por e-mail
- Mailer in-app / Edge Function transacional

</deferred>

---

*Phase: 15-email-fluxo-confirmacao-conta*  
*Context gathered: 2026-09-21*
