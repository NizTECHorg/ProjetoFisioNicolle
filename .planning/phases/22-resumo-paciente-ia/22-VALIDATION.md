---
phase: 22
slug: resumo-paciente-ia
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-03
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript 5.8 (`tsc --noEmit`) + `node:test` (Node 26). Sem Vitest. |
| **Config file** | `tsconfig.json`; nenhum para `node:test` |
| **Quick run command** | `node --test src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts && npm run typecheck` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** `npm run typecheck` (e `node --test` do helper quando o arquivo existir)
- **After every plan wave:** full suite acima
- **Before `/gsd-verify-work`:** full suite verde + UAT hospedado (SQL aplicado, função publicada, geração real)
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | REQ-33.3 | — | Edição vence o original; string vazia apaga; diff só grava diferenças | unit | `node --test src/lib/patientSummary.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | REQ-33.4 | T-22-input | Zod aceita só as chaves do resumo; descarta vazio; foco fora do catálogo cai | unit | `node --test src/lib/patientSummary.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | REQ-33.2, REQ-33.5, REQ-33.6 | T-22-prompt | Resumo IA não lê edições; cards novos não leem colunas legadas; a função tem as 7 chaves e as 42 de foco | contract | `node --test src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 2 | REQ-33.1 | T-22-write | Um update substitui o último resumo e zera edições | typecheck | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 2 | REQ-33 UI | T-22-access | Sem `canWrite` não há lápis nem modal | typecheck + UAT | `npm run typecheck` | manual | ⬜ pending |
| 22-03-01 | 03 | 3 | REQ-33 IA | T-22-hallucination | Gemini não inventa EVA, percentual nem meta | UAT | — | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/patientSummary.ts` e `src/lib/patientSummary.test.ts` — REQ-33.3 / REQ-33.4 (imports relativos; `node --test` não resolve `@/`)
- [ ] `src/lib/patientSummaryContract.test.ts` — REQ-33.2 / REQ-33.5 / REQ-33.6
- Nenhuma instalação de framework

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQL das colunas `jsonb` aplicado e checagens do script passam | REQ-33.1 | O projeto não usa `supabase db push` | Colar o script no SQL Editor e rodar as checagens do plano |
| Função publicada com 7 chaves de saída e 42 chaves de foco | REQ-33.6 | A função hospedada não se lê do repositório | Publicar a fonte da fase 13 editada no Dashboard |
| Geração em paciente com prontuário preenche os textos e marca o boneco, sem EVA ou meta inventada | REQ-33.4 | Comportamento do Gemini | Gerar e conferir os cards e as regiões |
| Geração em paciente quase vazio deixa "—" e não marca região | REQ-33.4 | Comportamento do Gemini | Gerar e conferir o estado vazio |
| Editar na aba Resumo não muda o original da aba Resumo IA; recarregar mantém a edição | REQ-33.2, REQ-33.3 | Persistência real | Editar, trocar de aba, recarregar |
| Nova geração pede confirmação e zera as edições | REQ-33.1 | Fluxo hospedado | Gerar de novo e conferir |
| Conta empresa em ficha de colega não vê lápis e o UPDATE é recusado | REQ-33 | RLS | Abrir a ficha como consulta |
| Modal no celular rola e o lápis tem pelo menos 44 px | REQ-33 | Layout | Viewport móvel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
