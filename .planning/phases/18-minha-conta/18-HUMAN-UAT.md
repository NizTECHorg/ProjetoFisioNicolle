---
status: partial
phase: 18-minha-conta
source: [18-VERIFICATION.md]
started: 2026-09-24T11:58:51-03:00
updated: 2026-09-24T11:58:51-03:00
---

## Current Test

Aguardando a flag de senha atual e o oráculo no Auth hospedado. O operador já informou que colou o SQL.

## Tests

### 1. SQL do bucket e do GRANT
expected: Bucket account-avatars privado, CHECK do path, políticas só da pasta auth.uid(), e UPDATE de authenticated limitado a full_name e avatar_url.
result: passed — em 2026-09-24 o operador informou que executou o script no SQL Editor. O bucket não foi reconsultado daqui.

### 2. Flag de senha atual no Auth
expected: Troca de senha sem a senha atual é recusada. O app não chama reauthenticate.
result: [pending]

### 3. Oráculo de senha no Auth hospedado
expected: Senha atual errada devolve current_password_invalid e a antiga ainda entra. Sem current_password, o código é current_password_required e a senha não muda. Depois do acerto, a antiga devolve invalid_credentials e a nova cria sessão. A UI mostra exatamente Senha atual incorreta.
result: [pending]

## Summary

total: 3
passed: 1
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
