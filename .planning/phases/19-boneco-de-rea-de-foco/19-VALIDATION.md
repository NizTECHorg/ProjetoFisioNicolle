---
phase: 19
slug: boneco-de-rea-de-foco
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-24
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript 5.8.3 (`tsc --noEmit`). Sem Vitest. |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck`
- **Before `/gsd-verify-work`:** `npm run typecheck` verde, mais a prova manual de scroll e a contagem no SQL Editor
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-req-30.1 | TBD | TBD | REQ-30 | — | Cada divisão do braço é uma key do catálogo e o painel a desenha | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 19-req-30.2 | TBD | TBD | REQ-30 | — | Pé, canela, panturrilha e tornozelo são keys distintas; sem `*.leg_*` | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 19-req-30.3 | TBD | TBD | REQ-30 | — | Clicar a abinha não muda `scrollTop` de `.panel-scroll` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 19-req-30.5 | TBD | TBD | REQ-30 | T-19-delete | As 8 keys obsoletas ficam com zero linhas; as que permanecem ficam intactas | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 19-req-30-pdf | TBD | TBD | REQ-30 | — | `BODY_MAP_CENTROIDS` cobre toda `FocusRegionKey` | typecheck | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Não instalar Vitest. O script SQL é tarefa da fase, não infra de teste.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Selecionar palma e pé não muda o `scrollTop` de `.panel-scroll` | REQ-30 | Não há harness de browser | No Resumo, marcar Palma da mão e Pé. A página não rola. |
| DELETE só das 8 keys obsoletas | REQ-30 | O app não aplica SQL | Colar o script no SQL Editor. Contar zero linhas nas 8 keys. As outras regiões permanecem. Não usar `supabase db push`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
