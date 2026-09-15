---
status: partial
phase: 07-galeria-de-imagens-na-ficha-do-paciente
source: [07-VERIFICATION.md]
started: 2026-09-15T03:20:00Z
updated: 2026-09-15T03:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. SQL Editor live matrix
expected: Bucket patient-images Private (8 MiB, jpeg/png/webp); session_id SET NULL e session_removed true nas órfãs; avulsa-original permanece false; colega INSERT 42501; empresa SELECT; Phase 3 can_* intactos. SQL já foi colado (applied).
result: [pending]

### 2. Narrow viewport camera + lote
expected: 375px: quinto tab visível (scroll). Adicionar mostra Tirar foto (traseira) + Escolher arquivos. Lote com X e Voltar. Viewport largo só Escolher arquivos. Um Adicionar envia o lote com a mesma descrição/sessão.
result: [pending]

### 3. Invalid file in a mixed lote
expected: HEIC/MIME inválido ou > 8 MB: toast em português; JPEG válido do mesmo lote sobe; o inválido não.
result: [pending]

### 4. Session delete → orphan copy
expected: Confirm de Evoluções inclui “As fotos dessa sessão ficam na ficha como avulsas.” Tile: Avulsa. Lightbox: Sessão removida. até Salvar alterações em Editar.
result: [pending]

### 5. Empresa consult hide-write
expected: Galeria e lightbox visíveis; Adicionar / Editar / Excluir / Compartilhar e inputs de arquivo ausentes (não disabled).
result: [pending]

### 6. Compartilhar
expected: Share sheet com o arquivo quando navigator.share existir; sem Baixar e sem copiar URL; AbortError silencioso.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
