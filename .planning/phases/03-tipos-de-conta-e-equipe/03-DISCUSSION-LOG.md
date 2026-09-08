# Phase 3: Tipos de conta e equipe - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-08
**Phase:** 3-tipos-de-conta-e-equipe
**Areas discussed:** Pacientes de quem, Como o fisio entra na empresa

---

## Pacientes de quem

| Option | Description | Selected |
|--------|-------------|----------|
| Clínica toda | Todos os fisios da empresa veem todas as fichas | |
| Só quem cadastrou | Cada profissional vê só os pacientes que registrou | ✓ |

**User's choice:** Só do profissional que registrou
**Notes:** Compartilhar caso entre profissionais fica para outra fase.

---

## Empresa vê os pacientes dos fisios?

| Option | Description | Selected |
|--------|-------------|----------|
| Não | Cada um só vê o que cadastrou, inclusive a empresa | |
| Sim, só a empresa | Fisios não veem uns aos outros; o dono vê todos | ✓ |
| Você decide | | |

**User's choice:** Sim, só a empresa
**Notes:** Isolamento entre fisios mantido; dono tem visão da equipe.

---

## Acesso da empresa na ficha

| Option | Description | Selected |
|--------|-------------|----------|
| Consulta e edita | Mesma ficha que o fisio | |
| Só consulta | Vê lista e ficha, sem alterar | ✓ |
| Você decide | | |

**User's choice:** Só consulta

---

## Como o fisio entra na empresa

| Option | Description | Selected |
|--------|-------------|----------|
| Código no cadastro | Fisio informa um código ao criar a conta | ✓ |
| Convite por e-mail | Empresa envia e-mail; fisio aceita e cria senha | |
| Os dois | Convite e também código | |
| Você decide | | |

**User's choice:** Código da empresa no cadastro
**Notes:** Encaixa no `/cadastro` atual; sem e-mail/convite no Supabase nesta fase.

---

## Vínculo imediato ou aprovação

| Option | Description | Selected |
|--------|-------------|----------|
| Entra na hora | Código certo = já faz parte da equipe | |
| Empresa aceita | Fisio fica pendente até o dono aprovar | ✓ |
| Você decide | | |

**User's choice:** Empresa aceita

---

## O que a conta pendente pode fazer

| Option | Description | Selected |
|--------|-------------|----------|
| Espera só | Entra no app, mas sem pacientes/agenda até ser aceito | |
| Usa como autônomo | Trabalha sozinho até a empresa aceitar | |
| Nem entra | Cadastro ok, login bloqueado até aceitar | ✓ |
| Você decide | | |

**User's choice:** Nem entra (login bloqueado)

---

## Se a empresa recusar

| Option | Description | Selected |
|--------|-------------|----------|
| Tenta de novo | Pode informar outro código e ficar pendente de novo | |
| Vira autônomo | Recusa libera o login como autônomo | |
| Conta cancelada | Precisa se cadastrar de novo | ✓ |
| Você decide | | |

**User's choice:** Conta cancelada

---

## Claude's Discretion

- Conta Empresa = pessoa dono/admin (não discutido; áreas 2 e 3 não selecionadas)
- Equipe em tela própria, só para empresa
- Alocar = código + aceitar/recusar pendentes
- Código gerado automaticamente
- Contas existentes = autônomo

## Deferred Ideas

- Convite por e-mail
- Compartilhar ou editar fichas entre equipe
- Uso como autônomo enquanto pendente
- Trocar de empresa sem recadastro
- Migração de contas existentes
