---
phase: 30-assinatura-desenhada-na-avalia-o
plan: 01
subsystem: ui
tags: [svg, pointer-events, zod, evaluation-form]
requires: []
provides:
  - src/lib/signaturePath.ts helpers (contrato usado pelo plano 30-02)
  - campo ficha.avaliacaoPlano.profissional.assinaturaTraco
  - SignaturePad no bloco ID da página 04
affects: [30-02 PDF da assinatura]
tech-stack:
  added: []
  patterns: [SVG path único em viewBox 600x160 com coordenadas inteiras, validação por regex antes de renderizar]
key-files:
  created:
    - src/lib/signaturePath.ts
    - src/lib/signaturePath.test.ts
    - src/components/patients/evaluation/SignaturePad.tsx
  modified:
    - src/schemas/evaluationFicha.schema.ts
    - src/components/patients/evaluation/EvaluationPage04.tsx
key-decisions:
  - "Sem pacote, sem SQL: traço viaja no JSON da ficha pelo save existente"
  - "assinatura (texto) mantida no schema para avaliações antigas; limpa ao desenhar"
requirements-completed: []
duration: 15min
completed: 2026-10-10
---

# Phase 30 Plan 01: Assinatura desenhada no formulário Summary

Quadro de assinatura em SVG + Pointer Events no bloco ID, salvando um único path em `assinaturaTraco` (máx. 20000 chars, só `[ML0-9 .-]`).

## Tasks

1. Helpers puros + schema + testes (8 testes node:test verdes): `5f07567`
2. SignaturePad e wiring em EvaluationPage04: `0ada558`

## Deviations from Plan

Minor: ajuste de tipo em `strokeToPath` (`first` possivelmente undefined) para passar no typecheck. Nenhuma outra.

## Verification

- `node --test src/lib/signaturePath.test.ts`: 8/8
- `npm run typecheck` e eslint nos arquivos tocados: limpos
- Sem mudança em package.json ou supabase/

## Known Stubs

None.

## Notes

REQ-41 não marcado como completo: depende do plano 30-02 (PDF) e verificação humana.

## Self-Check: PASSED
