# Phase 3: Tipos de conta e equipe - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning

<domain>
## Phase Boundary

No cadastro, a pessoa escolhe autônomo, empresa ou fisioterapeuta (trabalha em empresa). Fisioterapeuta entra na empresa por **código** e fica **pendente** até o dono aceitar. Empresa aloca equipe (aprovar/recusar + ver código). Autônomo não vê gestão de equipe. Pacientes continuam do profissional que cadastrou; a empresa **consulta** os pacientes dos fisios, sem editar. Persistido no Supabase.

</domain>

<decisions>
## Implementation Decisions

### Como o fisio entra na empresa
- **D-01:** O fisio informa um **código da empresa** no cadastro. Sem convite por e-mail nesta fase.
- **D-02:** Código válido = pedido **pendente**. Só entra na equipe depois que o dono **aceita**.
- **D-03:** Cadastro conclui, mas **login fica bloqueado** até a empresa aceitar (sem pacientes, sem agenda, sem uso como autônomo).
- **D-04:** Se a empresa **recusar**, a conta é **cancelada**. A pessoa precisa se cadastrar de novo.

### Pacientes de quem
- **D-05:** A ficha fica **só de quem cadastrou**. Fisios da mesma empresa **não** veem pacientes uns dos outros.
- **D-06:** A conta **Empresa** (dono) **vê** os pacientes de todos os fisios da equipe.
- **D-07:** Esse acesso da empresa é **só consulta** — lista e ficha, sem alterar.

### Claude's Discretion
- Conta **Empresa** = uma pessoa (dono/admin) que representa a clínica, não uma org sem login.
- Equipe: tela própria (ex. `/equipe`), visível **só** para empresa. Autônomo e fisio não veem o item.
- “Alocar funcionários” nesta fase = mostrar o código + lista da equipe + aceitar/recusar pendentes. Sem convite por e-mail.
- Código da empresa gerado automaticamente e copiável na tela de equipe.
- Contas já existentes: tratar como **autônomo** até haver fluxo de migração.
- Recusa cancela a conta (ex. `is_active = false` / exclusão de perfil). Pendente sem decisão = login continua bloqueado.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisito
- `.planning/REQUIREMENTS.md` — REQ-15 (tipos, acceptance 1–5)
- `.planning/ROADMAP.md` — Phase 3 goal e success criteria
- `.planning/PROJECT.md` — Active REQ-15; out of scope: multi-clínica / isolamento por clínica

### Auth e cadastro atuais
- `src/pages/auth/RegisterPage.tsx` — cadastro hoje: nome, e-mail, senha
- `src/schemas/auth.schema.ts` — `registerSchema`
- `src/services/auth.service.ts` — `signUpWithEmail` (metadata só `full_name`); `fetchProfile` exige `is_active = true`
- `src/providers/AuthProvider.tsx` — sessão + profile ativo
- `src/components/auth/ProtectedRoute.tsx` — bloqueio sem profile

### App chrome
- `src/config/navigation.ts` — itens do menu (hoje sem Equipe)
- `src/components/layout/AppShell.tsx` — sidebar / nav móvel
- `src/routes/index.tsx` — `/cadastro` e rotas protegidas

### Pacientes (RLS / dono)
- `src/services/patients.service.ts` — listagem e ficha
- `src/hooks/usePatients.ts` — queries da clínica

### Mapas
- `.planning/codebase/ARCHITECTURE.md` — camadas page → hooks → services → Supabase; RLS é a autoridade
- `.planning/codebase/STACK.md` — Zod + RHF no cadastro; SQL manual no Editor

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RegisterPage` + `registerSchema` + `signUpWithEmail`: estender com tipo de conta e código (quando fisio)
- `AuthLayout`, `Input`, `Button`, `Select` em `src/components/ui/`
- `fetchProfile` / `is_active`: encaixa em recusa (conta cancelada) e login bloqueado
- `navigationItems`: filtrar item Equipe por tipo de conta

### Established Patterns
- Camadas: types → schema → service → hooks → page
- Sem backend próprio: browser + Supabase anon; segurança via RLS
- SQL manual no SQL Editor (`supabase/*.sql`); pasta `supabase/` pode estar gitignored
- `profiles.role` ainda é enum da confeitaria — não reutilizar esses valores para autônomo/empresa/fisio sem desenhar o modelo novo
- Toasts via `toast()`; formulários Zod + react-hook-form

### Integration Points
- Cadastro: `signUp` metadata hoje só `full_name` — tipo, código e pending precisam persistir (profile / tabela de org / membership)
- Login: `ProtectedRoute` + `AuthProvider` precisam recusar fisio pendente (além de profile inativo)
- Pacientes: listagem/ficha hoje não distinguem “dono vs empresa consulta” — RLS e queries precisam separar write (só quem cadastrou) e read (dono + empresa da equipe)
- Nav: `AppShell` lê lista estática — Equipe só para empresa

### Creative options
- Org + membership (pending/active) vs campos extras só em `profiles`. Planner escolhe; decisões de produto acima não mudam.
- Código curto e estável por empresa, não por convite individual.

</code_context>

<specifics>
## Specific Ideas

- Três tipos no cadastro: autônomo, empresa, fisioterapeuta
- Fisio: campo de código obrigatório para esse tipo
- Empresa: código visível para copiar; fila de pendentes para aceitar/recusar
- Recusa = conta cancelada (cadastrar de novo)
- Pacientes: isolamento por quem cadastrou; empresa só lê

</specifics>

<deferred>
## Deferred Ideas

- Convite por e-mail
- Compartilhar ficha entre fisios da mesma empresa
- Empresa editar pacientes dos fisios
- Fisio usar o app como autônomo enquanto espera aprovação
- Trocar de empresa / sair da equipe sem recadastro
- Contas já existentes escolher tipo (migração)
- Multi-clínica / isolamento por clínica (já out of scope do marco)
- Permissões finas por sala ou papel além dos três tipos

</deferred>

---

*Phase: 3-Tipos de conta e equipe*
*Context gathered: 2026-09-08*
