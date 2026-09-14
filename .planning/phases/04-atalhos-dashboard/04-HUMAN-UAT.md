---
status: partial
phase: 04-atalhos-dashboard
source: [04-VERIFICATION.md]
started: 2026-09-14T15:01:06Z
updated: 2026-09-14T15:01:06Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Header shortcuts visible during dashboard load
expected: On /painel as a write-capable clinic user, Nova evolução (primary) and Nova avaliação (secondary) stay visible and clickable while metrics load, on error, and when the writable list is empty
result: [pending]

### 2. Picker → existing form → stay on /painel (D-01–D-04)
expected: URL stays /painel until Ver ficha or Ir para pacientes; save closes overlay with one Ver ficha toast to ?aba=evolucoes or ?aba=avaliacao; Voltar ao dashboard / X / Escape closes everything with no leftover picker and no success toast; next record starts from the header shortcut; save error keeps the form open with Não foi possível salvar. Verifique os campos e tente de novo
result: [pending]

### 3. Empresa colleague fichas omitted from the picker (REQ-16.3)
expected: Empresa user with a colleague ficha (consulta) does not see colleague rows in the picker (absent, not disabled); own patients appear; creating from the shortcut only binds to a writable patientId
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
