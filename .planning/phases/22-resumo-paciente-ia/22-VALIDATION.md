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

- **After every task commit (waves 1 e 2):** só o `<automated>` da própria task. Não exigir a suíte completa. O plano 22-01 deixa de propósito vermelhos `REQ-33.6: pack sem campos legados`, `REQ-33.6: prompt com 7 chaves` e `REQ-33.5` até os planos 04–06. Um `node --test` do arquivo de contrato inteiro falha nessa janela, e isso não é regressão.
- **From wave 3 onward:** suíte completa `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build`. A wave 3 (planos 22-05 e 22-06) é a primeira em que o contrato pode ficar verde por inteiro.
- **Before `/gsd-verify-work`:** suíte completa verde + UAT hospedado (SQL aplicado, função publicada depois do plano 22-04, geração real)
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | REQ-33.3, REQ-33.4 | T-22-input, T-22-dos | Módulo puro: edição vence o original, Zod corta texto, `formatGeneratedAt` usa `hourCycle: 'h23'` | typecheck | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | REQ-33.2, REQ-33.3, REQ-33.4 | T-22-input, T-22-shape | Suíte do helper, incluindo meia-noite `00:00` e não `24:00` | unit | `node --test src/lib/patientSummary.test.ts` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | REQ-33.2, REQ-33.5, REQ-33.6 | T-22-prompt | Cria os casos nomeados. O verify só roda `REQ-33.2`. `REQ-33.6: pack sem campos legados`, `REQ-33.6: prompt com 7 chaves` (recorte só de `buildPrompt`, com `treatmentPlan` e `painLimitations`) e `REQ-33.5` ficam vermelhos de propósito | contract | `node --test --test-name-pattern "REQ-33.2" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 1 | REQ-33 | T-22-dos, T-22-shape, T-22-write, T-22-grant | Script SQL das duas colunas. `supabase db push` só pode aparecer em comentário; o grep de aceite ignora linhas `--` | file | `test -f ".planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql"` (o grep que ignora `--` está no `<automated>` do plano) | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 1 | REQ-33 | T-22-deploy | `22-USER-SETUP.md`: colar o SQL antes de rodar o app depois do 22-03; publicar a função só depois do 22-04 | file | `grep -c "13-pdf-export-avaliacao-evolucao" ".planning/phases/22-resumo-paciente-ia/22-USER-SETUP.md"` | ❌ W0 | ⬜ pending |
| 22-03-01 | 03 | 2 | REQ-33.1 | T-22-write, T-22-msg, T-22-shape | Falha de save lança `PATIENT_AI_COPY.editError`; 0 linhas lança `editForbidden`. Sem o SQL aplicado, a ficha não abre | typecheck | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 22-03-02 | 03 | 2 | REQ-33.1, REQ-33.4 | T-22-input | Geração validada por Zod e as 18 chaves de `PATIENT_AI_COPY` | typecheck + lint | `npm run typecheck && npm run lint` | ❌ W0 | ⬜ pending |
| 22-03-03 | 03 | 2 | REQ-33.3 | T-22-msg | Hook mostra `error.message` já travado nas duas strings da copy | typecheck + lint | `npm run typecheck && npm run lint` | ❌ W0 | ⬜ pending |
| 22-04-01 | 04 | 2 | REQ-33.6 | T-22-zero | Pack do modo resumo sem campos legados | contract | `node --test --test-name-pattern "REQ-33.6: pack sem campos legados" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 22-04-02 | 04 | 2 | REQ-33.6 | T-22-prompt, T-22-hallucination | Corpo de `buildPrompt` com as 7 chaves, mais paridade das 42 chaves de foco | contract | `node --test --test-name-pattern "REQ-33.6: prompt com 7 chaves" src/lib/patientSummaryContract.test.ts && node --test --test-name-pattern "REQ-33.6: paridade das 42 chaves de foco" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 22-05-01 | 05 | 3 | REQ-33.3 | T-22-input, T-22-access, T-22-wipe | Modal único Editar resumo | typecheck + lint | `npm run typecheck && npm run lint` | ❌ W0 | ⬜ pending |
| 22-05-02 | 05 | 3 | REQ-33.5 | T-22-fabricate, T-22-access | Sete cards resolvidos; fecha o caso `REQ-33.5`. Gráfico de EVA só com série real | contract | `npm run typecheck && node --test --test-name-pattern "REQ-33.5" src/lib/patientSummaryContract.test.ts` | ❌ W0 | ⬜ pending |
| 22-06-01 | 06 | 3 | REQ-33.1 | T-22-destructive, T-22-regress | Confirmação antes de substituir edições | typecheck + lint | `npm run typecheck && npm run lint` | ❌ W0 | ⬜ pending |
| 22-06-02 | 06 | 3 | REQ-33.2 | T-22-twotabs, T-22-access | Bloco somente leitura do original na aba Resumo IA | contract | `node --test --test-name-pattern "REQ-33.2" src/lib/patientSummaryContract.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 22-06-03 | 06 | 3 | REQ-33 | T-22-access | Tipografia do card de objetivos: zero ocorrências de `text-[10px]`, `text-[11px]` e `font-medium`, depois lint | lint | `npm run lint` (a contagem com `rg` está no `<automated>` do plano) | ❌ W0 | ⬜ pending |
| 22-07-01 | 07 | 4 | REQ-33 | T-22-prompt | Suíte completa verde, incluindo os casos que o 22-01 deixou vermelhos | full suite | `node --test src/lib/*.test.ts && npm run typecheck && npm run lint && npm run build` | ❌ W0 | ⬜ pending |
| 22-07-02 | 07 | 4 | REQ-33 | T-22-hallucination, T-22-write, T-22-deploy | UAT: SQL, publicar a fonte já editada pelo 22-04, fluxo real. O PDF de avaliação segue no `aiSummary` original | manual | — | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/patientSummary.ts` e `src/lib/patientSummary.test.ts` — REQ-33.3 / REQ-33.4 (imports relativos; `node --test` não resolve `@/`)
- [ ] `src/lib/patientSummaryContract.test.ts` — REQ-33.2 / REQ-33.5 / REQ-33.6. Criar o arquivo no plano 22-01 não deixa a suíte completa verde: `REQ-33.6: pack sem campos legados`, `REQ-33.6: prompt com 7 chaves` e `REQ-33.5` permanecem vermelhos até os planos 04–06. A suíte completa só é gate a partir da wave 3.
- Nenhuma instalação de framework

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQL das colunas `jsonb` aplicado e checagens do script passam | REQ-33.1 | O projeto não usa `supabase db push` | Colar o script no SQL Editor antes de rodar o app depois do plano 22-03, e rodar as checagens. Sem as colunas a ficha não abre |
| Função publicada com 7 chaves de saída e 42 chaves de foco | REQ-33.6 | A função hospedada não se lê do repositório | Publicar no UAT do plano 22-07, só a fonte da fase 13 já editada pelo plano 22-04 |
| PDF de avaliação continua no `aiSummary` original | REQ-33 | Decisão intencional, fora do escopo | Não tratar como falha e não alterar o export. Registrado no plano 22-07 |
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
