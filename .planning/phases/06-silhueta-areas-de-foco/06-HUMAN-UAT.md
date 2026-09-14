---
status: partial
phase: 06-silhueta-areas-de-foco
source: [06-VERIFICATION.md]
started: 2026-09-14T21:16:00Z
updated: 2026-09-14T21:16:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Desktop hover, chip, leave, path-only click
expected: Abinha Marcar {label} after ~0.5s; chip click marks/unmarks; leave closes; path-only click does not write
result: [pending]

### 2. Keyboard Tab and Escape
expected: Chip opens on path focus; Escape closes and returns focus to that path
result: [pending]

### 3. Touch / coarse pointer
expected: Chip opens immediately (no 500ms wait); second tap on the chip toggles
result: [pending]

### 4. Empresa colleague ficha
expected: Highlights show; no chip, no pointer preview, cursor default; Somente consulta banner still present
result: [pending]

### 5. Empty states
expected: Silhouettes remain. Writable empty: Sem áreas registradas. plus the 0,5 s / toque sentence. Consult empty: heading only
result: [pending]

### 6. Hosted schema / RLS matrix
expected: region_key nullable; unique index present; Phase 3 policies still listed. Optional 8-check including colleague INSERT 42501
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
