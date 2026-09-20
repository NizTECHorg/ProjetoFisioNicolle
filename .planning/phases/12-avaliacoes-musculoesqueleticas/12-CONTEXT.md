# Phase 12 — Avaliações musculoesqueléticas

**Gathered:** 2026-09-20  
**Status:** Ready for planning  
**Source:** User request via `/gsd-plan-phase` (discuss-phase skipped — intent explicit + 4 ficha reference images)

<domain>
## Phase Boundary

Restaurar **Avaliações** como **aba própria** da ficha do paciente, totalmente separada de **Resumo IA**. Formulário rico baseado na ficha de anamnese/evolução musculoesquelética (páginas 01–04). CRUD de N avaliações por paciente com salvamento parcial. Atalho do dashboard escolhe paciente e abre a aba com criar ativo. Atualizar o PDF de exportação de avaliação (fluxo Resumo IA / paciente) para usar esse documento como referência de layout e seções.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Aba própria Avaliações
Nova aba na ficha: **Avaliações** (slug preferido `avaliacoes`). **Não** fica embutida em Resumo IA. Remover / não remontar `PatientEvaluationPanel` (CRUD) como subseção da aba de IA.

### D-02 — Dashboard → picker → aba com criar aberto
O botão de avaliações no dashboard mantém escolha de pacientes (como hoje). Após escolher, **navega** para a ficha na aba Avaliações com o formulário de **criar** aberto (ex.: `?aba=avaliacoes&nova=1`). Não montar o editor completo no modal do painel como destino final.

### D-03 — Inúmeras avaliações + salvamento parcial
O profissional cria e salva **quantas avaliações quiser** por paciente. Criar é como criar paciente: **não exige preencher todos os campos**; pode deixar em branco, salvar, voltar e completar depois. Mínimo obrigatório: o que for indispensável para a linha existir (ex. data da avaliação) — researcher/planner confirma o mínimo sem bloquear o fluxo.

### D-04 — Campos e design das 4 fichas de referência
O formulário (e o PDF) se baseiam nas referências em `.planning/phases/12-avaliacoes-musculoesqueleticas/refs/`:

1. `01-anamnese-inicial.png` — BLOCOS A–E (identificação, queixa, história atual, tratamentos/exames, histórico pregresso)
2. `02-comportamento-sintomas.png` — BLOCOS A–G (mapa corporal, característica, intensidade EVA, 24h, piora/melhora, irritabilidade)
3. `03-funcao-contexto-seguranca.png` — BLOCOS A–F (limitação funcional, atividades, rotina, expectativas, triagem segurança, medicações)
4. `04-avaliacao-plano.png` — BLOCOS A–H + identificação profissional (inspeção, mobilidade, força, neurológico, paltação/testes, síntese, objetivos, planejamento)

Design de base: blocos com borda, headers A/B/C…, checkboxes, tabelas, tipografia clara — adaptar à marca FLUXO (cores accent/forest/canvas), não copiar serif genérico da referência se conflitar com o design system.

### D-05 — Persistência
Dados no Supabase (evoluir `patient_evaluations` ou schema JSON/colunas conforme research). RLS via `can_read_patient` / `can_write_patient`. Sem mock; sem depender de `localStorage` como fonte oficial.

### D-06 — Separação de Resumo IA
Resumo IA continua só: gerar resumo + export/lista de PDFs salvos. Não hospeda o CRUD de avaliação estruturada.

### D-07 — PDF export alinhado ao documento
A exportação de avaliação do paciente (modo PDF no Resumo IA / builder `patientAiPdf`) passa a usar **este documento** como referência de seções e layout (não o PDF minimalista atual). Preferência: exportar a partir de uma avaliação salva e/ou mapear estado clínico para as seções 01–04. Planner define se “geral” vs “sessão” mudam ou se o export principal vira “avaliação selecionada”.

### D-08 — Fora de escopo
- Phase 8 Google Agenda UAT, Phase 9–10 incompletos
- Diagnóstico médico sistêmico / substituir COFFITO legal text verbatim como produto
- Multi-clínica
- Comparativo automático entre avaliações (só base datada nesta fase)

### Claude's Discretion
- JSONB único vs colunas tipadas vs tabelas filhas por bloco
- Como reutilizar silhueta Phase 6 no Bloco mapa corporal (02-A)
- Se dashboard ainda mostra editor inline em algum passo intermediário ou só picker + navigate
- Migração dos registros antigos de `patient_evaluations` (campos texto simples) para o novo modelo

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ficha de referência (obrigatório)
- `.planning/phases/12-avaliacoes-musculoesqueleticas/refs/01-anamnese-inicial.png`
- `.planning/phases/12-avaliacoes-musculoesqueleticas/refs/02-comportamento-sintomas.png`
- `.planning/phases/12-avaliacoes-musculoesqueleticas/refs/03-funcao-contexto-seguranca.png`
- `.planning/phases/12-avaliacoes-musculoesqueleticas/refs/04-avaliacao-plano.png`

### Produto / requisitos
- `.planning/REQUIREMENTS.md` — REQ-24
- `.planning/ROADMAP.md` — Phase 12
- `.planning/phases/11-resumo-ia/11-CONTEXT.md` — D-01/D-06 Resumo IA (desacoplar)

### Código existente
- `src/types/evaluation.ts` — modelo atual simples
- `src/components/patients/PatientEvaluationPanel.tsx` / `PatientEvaluationEditorForm.tsx`
- `src/components/patients/DashboardClinicalShortcut.tsx` — picker atual
- `src/components/patients/PatientResumoIaPanel.tsx` — remover embed de avaliação
- `src/services/patientAiPdf.service.ts` — PDF a realinhar (D-07)
- `src/lib/dashboardShortcut.ts` — `patientFichaPath`
- Phase 6 silhueta — `src/lib/focusRegions.ts` / painéis de foco (mapa corporal)

</canonical_refs>

<specifics>
## Specific Ideas

- Criar parcial: espelhar UX de novo paciente (salvar com lacunas).
- Design dos blocos da referência (letra no quadrado, bordas, grids de checkbox) adaptado a FLUXO.
- Após criar pelo dashboard, usuário cai na aba com composer/form de nova avaliação já aberto.

</specifics>

<deferred>
## Deferred Ideas

- Relatórios comparativos entre avaliações
- Assinatura digital CREFITO obrigatória com certificado
- Sync com impressão física paginada idêntica ao PDF papel A4 da clínica impressa

</deferred>

---

*Phase: 12-avaliacoes-musculoesqueleticas*  
*Context gathered: 2026-09-20 via plan-phase user brief + refs*
