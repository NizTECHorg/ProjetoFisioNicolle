---
phase: 25
slug: mobilidade-palpacao-e-testes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-05
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript (`tsc --noEmit`) + `node:test`. Sem Vitest. Sem pacote novo. |
| **Config file** | `tsconfig.json`; nenhum para `node:test` |
| **Quick run command** | `node --test src/lib/mobilidadePalpacao.test.ts` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` |
| **Estimated runtime** | ~45 seconds |

`npm run typecheck` só entra depois que a página 04, o catálogo e o PDF deixam de ler as chaves velhas de mobilidade e de palpação. Antes disso o typecheck quebra de propósito, como na fase 24.

---

## Sampling Rate

- **After every task commit:** `node --test src/lib/mobilidadePalpacao.test.ts` (typecheck só no task que fecha os leitores velhos)
- **After every plan wave:** `node --test src/lib/*.test.ts && npm run lint` enquanto o typecheck ainda estiver proibido; suíte completa quando os leitores velhos tiverem saído
- **Before `/gsd-verify-work`:** suíte completa verde + UAT (duas regiões, dor por lado, achado, busca de teste, detalhe, PDF)
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | REQ-36.1–36.5, legado, catálogo | T-25-key, T-25-legacy | Helper puro: catálogos fechados, match único, formatadores, preprocess que não copia valor | unit | `node --test src/lib/mobilidadePalpacao.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 2 | REQ-36.1–36.4 | T-25-input, T-25-write | Schema e blocos B e E; `disabled={readOnly}`; busca nativa sem regex do usuário | unit + lint | `node --test src/lib/mobilidadePalpacao.test.ts && npm run lint` | ❌ W0 | ⬜ pending |
| 25-03-01 | 03 | 3 | REQ-36.5 | T-25-xss | Detalhe, catálogo e PDF usam o mesmo formatador; sem HTML injetado | unit + typecheck | `node --test src/lib/mobilidadePalpacao.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 25-04-01 | 04 | 4 | REQ-36 | T-25-legacy | Suíte completa verde | full suite | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` | ❌ W0 | ⬜ pending |
| 25-04-02 | 04 | 4 | REQ-36 | T-25-write | UAT: duas regiões, D/E com dor, achado, busca com Outro, reabrir, detalhe, PDF | manual | — | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Os IDs acima são o alvo de planejamento. O planner pode unir ou fatiar planos; cada task precisa de `<automated>` apontando para um comando desta tabela. Não rodar `npm run typecheck` num task em que a página, o catálogo ou o PDF ainda leem as chaves velhas.

---

## Wave 0 Requirements

- [ ] `src/lib/mobilidadePalpacao.ts` — catálogos, normalize, format
- [ ] `src/lib/mobilidadePalpacao.test.ts` — cobre REQ-36, legado e contagem
- [ ] Framework: nenhum install. `node --test` já roda os arquivos `.ts` deste repo

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Escolher uma região, marcar um movimento, acrescentar outra região, cada uma com tipo e comparação | REQ-36.1 | Layout e persistência do jsonb | Salvar e reabrir uma avaliação |
| D e E no mesmo campo; grau ou Completo / Limitado / Não avaliado; dor do lado abre início, máxima e observação | REQ-36.2 | Painel e layout | Preencher os dois lados com dor só num deles |
| Palpação: local filtrado pela região, lado, achado, dor, observação, editar o achado | REQ-36.3 | Formulário e tabela | Registrar dois achados de regiões diferentes e editar um |
| Testes: busca, vários marcados, Outro por último | REQ-36.4 | Lista nativa | Filtrar um teste, marcar dois e Outro |
| Leitura e PDF mostram a mesma frase; blocos A, C–G e páginas 01–03 intactos | REQ-36.5 | Export | Abrir o detalhe e exportar o PDF |
| Ficha antiga não copia um valor para todos os movimentos nem inventa dor lateral | REQ-36 legado | Dados reais | Abrir avaliação salva antes desta fase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
