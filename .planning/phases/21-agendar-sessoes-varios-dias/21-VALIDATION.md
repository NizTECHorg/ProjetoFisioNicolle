---
phase: 21
slug: agendar-sessoes-varios-dias
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-03
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript (`tsc --noEmit`) + `node:test` (Node 26) para o helper puro. Sem Vitest. |
| **Config file** | `tsconfig.json`; `eslint.config.js` |
| **Quick run command** | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts && npm run typecheck` |
| **Full suite command** | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts && npm run typecheck && npm run lint && npm run build` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** `npm run typecheck` (e `node --test` do helper quando o arquivo existir)
- **After every plan wave:** full suite acima
- **Before `/gsd-verify-work`:** full suite verde + UAT manual na agenda
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-T1 | 01 | 1 | REQ-32 | T-21-01 | `buildWeeklySeries` + `clampWeeks` 1–24; dias 0–6; vazio → `[]` | unit | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts` | ❌ W0 | ⬜ pending |
| 21-01-T2 | 01 | 1 | REQ-32 | T-21-02 | Preview/CTA pt-BR e teto 24 semanas | unit | idem | ❌ W0 | ⬜ pending |
| 21-02-T1 | 02 | 2 | REQ-32 | T-21-01 | Submit usa `buildWeeklySeries`; horário vazio = 09:00; `openComposer` nos dois caminhos | typecheck + lint | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 21-02-T2 | 02 | 2 | REQ-32 | T-21-02 | Chips, preview, CTA; sem "Horário fixo" | typecheck + lint + node --test | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 21-03-T1 | 03 | 3 | REQ-32 | — | Suite completa | full suite | `node --test` + typecheck + lint + build | ✅ | ⬜ pending |
| 21-03-T2 | 03 | 3 | REQ-32 | T-21-03 | UAT manual segunda/quarta/sábado e um dia só | manual | checkpoint | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

O planner detalha as tasks de UI (chips, preview, reset do modal) com `npm run typecheck` + grep. O mapa acima cobre o helper, que é a prova automatizada do REQ-32.

---

## Wave 0 Requirements

- [ ] `src/lib/sessionSeries.ts` — `buildWeeklySeries`, `clampWeeks`, `MAX_SERIES_WEEKS = 24`
- [ ] `src/lib/sessionSeries.test.ts` — 1 dia = weeklyAt; seg/qua/sáb × N; ordem cronológica; vazio; duplicatas; virada de mês; mesmo horário; clamp
- [ ] Framework install: nenhum (`node --test`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chips, preview e sessões na agenda | REQ-32 | UI + insert hospedado | Abrir agendar, marcar segunda/quarta/sábado × 2, conferir 6 sessões agendadas no mesmo horário. Repetir 1 dia × 3 e conferir só aquele dia. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-03
