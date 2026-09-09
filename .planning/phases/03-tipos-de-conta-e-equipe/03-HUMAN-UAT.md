---
status: partial
phase: 03-tipos-de-conta-e-equipe
source: [03-VERIFICATION.md]
started: 2026-09-09T21:10:00Z
updated: 2026-09-09T21:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. SQL Editor — schema live e casos allow/deny
expected: profiles.account_type, organizations e organization_memberships existem; anon não SELECT organizations; JWT pending não SELECT patients; fisio B não lê paciente de A; empresa SELECT (não UPDATE) paciente de A com membership therapist/active
result: [pending]

### 2. Cadastro no browser — os três tipos
expected: Submit sem tipo falha; fisio exige código 8 chars e lookup RPC; empresa/autônomo criam conta; fisio válido fica pendente
result: [pending]

### 3. Empresa em /equipe — código, copiar, aceitar/recusar
expected: Código visível e copiável; Aceitar pedido ativa o fisio; Recusar pedido pede confirmação e cancela a conta
result: [pending]

### 4. Autônomo e fisio sem gestão de equipe
expected: Item Equipe ausente no drawer; /equipe redireciona para /pacientes
result: [pending]

### 5. Fisio pendente/recusado e consulta da empresa na ficha
expected: Pendente autentica mas cai em /aguardando, sem clínica. Recusado vê Pedido recusado. Empresa vê Ficha de {nome} e banner Somente consulta, sem editar; Novo paciente da empresa ainda escreve; autônomo sem linha Ficha de
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
