---
phase: 24
slug: atividades-avaliacao-capacidade-e-unidade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-04
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript 5.8 (`tsc --noEmit`) + `node:test` (Node 26). Sem Vitest. Sem pacote novo. |
| **Config file** | `tsconfig.json`; nenhum para `node:test` |
| **Quick run command** | `node --test src/lib/atividadeCapacidade.test.ts && npm run typecheck` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** `node --test src/lib/atividadeCapacidade.test.ts && npm run typecheck`
- **After every plan wave:** `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build`
- **Before `/gsd-verify-work`:** suíte completa verde + UAT hospedado (duas atividades, unidades, reabrir, detalhe, PDF)
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | REQ-35.1–35.4, legado | T-24-key, T-24-unit, T-24-legacy | Helper puro: mapa por chave, enum de unidade, preprocess do objeto plano sem copiar um número para várias atividades | unit | `node --test src/lib/atividadeCapacidade.test.ts` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 2 | REQ-35.1–35.3 | T-24-write, T-24-input | Form bloco B: uma linha por atividade marcada; sem Atividade e sem Consigo por; `disabled={readOnly}` | typecheck | `npm run typecheck && npm run lint` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 3 | REQ-35.4 | T-24-xss | Detalhe, catálogo `03.B` e draw do PDF usam `formatLinha` | typecheck + unit | `node --test src/lib/atividadeCapacidade.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 24-04-01 | 04 | 4 | REQ-35 | T-24-legacy | Suíte completa verde | full suite | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` | ❌ W0 | ⬜ pending |
| 24-04-02 | 04 | 4 | REQ-35 | T-24-write | UAT: correr + agachar, unidades, reabrir, detalhe, PDF | manual | — | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Os IDs acima são o alvo de planejamento. O planner pode unir ou fatiar planos; cada task precisa de `<automated>` apontando para um comando desta tabela.

---

## Wave 0 Requirements

- [ ] `src/lib/atividadeCapacidade.ts` — catálogo, normalize, format
- [ ] `src/lib/atividadeCapacidade.test.ts` — cobre REQ-35 e o legado
- [ ] Framework: nenhum install. `node --test` já roda os arquivos `.ts` deste repo

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Marcar Correr, preencher atual/antes, depois Agachar, e as duas ficam | REQ-35.1 | Persistência real do jsonb | Criar ou editar avaliação, salvar, reabrir |
| Sem campo Atividade e sem Consigo por no bloco B | REQ-35.2 | Layout | Conferir o formulário e o detalhe |
| Valor + unidade juntos (minutos, km, repetições) | REQ-35.3 | Layout | Preencher os dois lados com unidades diferentes |
| PDF e leitura mostram as mesmas linhas | REQ-35.4 | Export hospedado | Exportar a avaliação e abrir o detalhe |
| Ficha antiga com um único capacidadeAtual não inventa unidade nem copia para todas as marcadas | REQ-35 legado | Dados reais | Abrir avaliação salva antes desta fase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
