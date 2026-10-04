---
phase: 23
slug: ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-04
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript 5.8 (`tsc --noEmit`) + `node:test` (Node 26). Sem Vitest. Sem pacote novo. |
| **Config file** | `tsconfig.json`; nenhum para `node:test` |
| **Quick run command** | `node --test --test-name-pattern "REQ-34" src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts` |
| **Full suite command** | `node --test src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts src/lib/sessionSeries.test.ts && npm run typecheck && npm run lint && npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** `node --test --test-name-pattern "REQ-34" src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts` — exceto na janela em que o plano 23-01 deixa de propósito vermelhos os asserts de implementação (pack, prompt, UI). Nessa janela o verify da task usa só o `--test-name-pattern` do caso que ela criou.
- **After every plan wave:** suíte completa da tabela acima + `npm run typecheck`
- **Before `/gsd-verify-work`:** suíte completa verde + UAT hospedado (colar a função da fase 13, gerar, editar inline, rolar Queixa/Diagnóstico)
- **Max feedback latency:** 45 seconds

O caso `REQ-33.6: prompt com 7 chaves` fica vermelho até o plano que reescreve `buildPrompt` mover o assert de `NÃO CONFIÁVEL` para `hintBlockFor` / `buildEvolucaoPrompt`. Não comentar o teste. Não manter `NÃO CONFIÁVEL` dentro de `buildPrompt` para segurar o verde.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | REQ-34.3 | T-23-focus | Lib pura: `antebraço esquerdo` não inclui `front.upper_arm_l`; `joelho direito` inclui frente e costas; `joelho` sozinho não inclui lado; descrição soma chave; chave fora do rótulo não entra | unit | `node --test src/lib/focusRegionAllow.test.ts` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | REQ-34.1, REQ-34.2, REQ-34.4, REQ-34.5 | T-23-hint, T-23-count | Cria os casos `REQ-34.*` no contrato. O verify do 23-01 só precisa que os arquivos existam e os nomes estejam lá; os asserts de fonte ficam vermelhos até os planos 02–04 | contract | `node --test --test-name-pattern "REQ-34" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 2 | REQ-34.2 | T-23-count, T-23-rls | Recorte de `assembleContextPack` não atribui `sessionsDone: patient.sessions_done`; contém `count: 'exact'` e `realizada` | contract | `node --test --test-name-pattern "REQ-34.2" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 23-02-02 | 02 | 2 | REQ-34.3, REQ-34.4 | T-23-hint, T-23-focus | Recorte de `buildPrompt` contém `FONTE` e não contém `NÃO CONFIÁVEL`; `hintBlockFor` ainda contém `NÃO CONFIÁVEL`; `buildPrompt` não chama `hintBlockFor`; paridade dos 42 rótulos | contract | `node --test --test-name-pattern "REQ-34.4" src/lib/patientSummaryContract.test.ts && node --test --test-name-pattern "REQ-34.3" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 23-03-01 | 03 | 3 | REQ-34.1 | T-23-wipe, T-23-access | `ResumoDoPaciente` não importa o modal; editor por chave; `!canWrite` não desenha lápis | contract | `node --test --test-name-pattern "REQ-34.1" src/lib/patientSummaryContract.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 23-04-01 | 04 | 3 | REQ-34.5 | T-23-overflow | `EntendaOCaso` não tem `line-clamp-3` nos parágrafos de queixa/diagnóstico; tem `overflow-y-auto` e `case-scroll`; o `line-clamp-2` dos objetivos permanece | contract | `node --test --test-name-pattern "REQ-34.5" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 23-05-01 | 05 | 4 | REQ-34 | T-23-deploy | Suíte completa verde, incluindo os casos que o 23-01 deixou vermelhos e o assert antigo de `NÃO CONFIÁVEL` já movido | full suite | `node --test src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts src/lib/focusRegionAllow.test.ts src/lib/sessionSeries.test.ts && npm run typecheck && npm run lint && npm run build` | ❌ W0 | ⬜ pending |
| 23-05-02 | 05 | 4 | REQ-34.1–REQ-34.5 | T-23-hint, T-23-count, T-23-wipe, T-23-deploy | UAT: colar a função da fase 13, gerar, editar uma caixa, rolar queixa longa | manual | — | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Os IDs acima são o alvo de planejamento. O planner pode unir ou fatiar planos; cada task de implementação precisa de `<automated>` apontando para um comando desta tabela (ou o equivalente depois da união).

---

## Wave 0 Requirements

- [ ] `src/lib/focusRegionAllow.ts` + `src/lib/focusRegionAllow.test.ts` — REQ-34.3
- [ ] Casos `REQ-34.*` em `src/lib/patientSummaryContract.test.ts` — REQ-34.1, REQ-34.2, REQ-34.4, REQ-34.5
- [ ] Reescrever o assert `NÃO CONFIÁVEL` de `REQ-33.6` para o recorte de `hintBlockFor`, sem apagar as sete chaves nem a paridade das 42 chaves
- [ ] Framework: nenhum install. `node --test` já roda os arquivos `.ts` deste repo

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Função publicada com count `exact` de `realizada` e `FONTE` em `buildPrompt` | REQ-34.2, REQ-34.4 | A função hospedada não se lê do repositório | Colar `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` no Dashboard. Conferir no corpo: `count: 'exact'`, `realizada`, `FONTE` em `buildPrompt`, `NÃO CONFIÁVEL` só em `hintBlockFor`. Ausência de `sessionsDone: patient.sessions_done` |
| Geração usa o número de sessões `realizada`, não `patients.sessions_done` | REQ-34.2 | Gemini + coluna stale | Paciente em que a coluna difere do card Entenda o caso. O texto gerado cita o número do card |
| Descrição adicional entra no texto e marca só as regiões pedidas | REQ-34.3, REQ-34.4 | Gemini | Descrição `inclua o joelho direito` marca frente e costas do joelho. Um fato só da descrição aparece no resumo. Um número de sessões escrito na descrição não substitui `sessionsDone` |
| Salvar uma caixa não apaga as outras edições; aba Resumo IA fica no original | REQ-34.1 | Persistência real da coluna inteira | Editar só Condutas, recarregar. Outras caixas editadas continuam. Aba Resumo IA sem lápis |
| Conta sem escrita: sem lápis e sem textarea | REQ-34.1 | RLS + UX | Abrir a ficha como consulta |
| Queixa/diagnóstico longos rolam no parágrafo; a página não estica | REQ-34.5 | Layout | Texto longo; métricas e objetivos continuam visíveis; slider fino de baixa opacidade |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
