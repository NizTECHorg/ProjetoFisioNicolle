---
status: partial
phase: 05-financeiro-autonomo
source: [05-VERIFICATION.md]
started: 2026-09-14T19:10:00Z
updated: 2026-09-14T19:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. SQL Editor 10-check matrix (apply already confirmed)
expected: Autônomo A: own catalog/charge allow; cannot steal owner_id; trigger overwrites client amount from catalog; catalog edit does not change existing snapshot. Empresa and fisio: SELECT autonomo_prices / autonomo_session_charges → 0 rows; INSERT denied. Empresa still SELECTs colleague patient_sessions with no money columns. autonomo_finance_totals returns only A's paid snapshots; paid agendada in the current America/Sao_Paulo month increments month_total; unpaid realizada does not
result: [pending]

### 2. As autonomo — drawer Financeiro, catalog CRUD, totals, empty states, session XOR
expected: Drawer shows Financeiro with Wallet; /financeiro is AutonomoFinancePage (not bakery FinancePage). Novo preço stays in the header when the catalog is empty. Archive uses ConfirmDialog and leaves the price out of new-session Select. Three total cards come from the RPC (R$ 0,00 when nothing is paid), not from the realizadas list. Empty realizadas shows Nenhuma sessão realizada with no fake rows. Session editor (ficha and dashboard shortcut) shows Valor da consulta on Agendar and Realizada: catalog XOR avulso + Pago; empty catalog hides Select and still shows avulso; Local stays clinical text. Saving a paid session whose catalog price was archived still saves without rewriting the snapshot as Avulso
result: [pending]

### 3. As empresa and fisio — no Financeiro, silent redirect, no money on the session form
expected: Drawer has no Financeiro; mobile bar still has 4 items and no Wallet. Opening /financeiro Navigates to /pacientes with no toast. Nova sessão / dashboard shortcut has no Valor da consulta, no Pago, no catalog Select
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
