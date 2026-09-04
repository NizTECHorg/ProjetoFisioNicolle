# Phase 2: Metas do tratamento - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

O profissional cria objetivos específicos na ficha do paciente (aba Resumo) e acompanha o status não iniciado / em andamento / atingido, com data de criação e data de atingimento — ambas editáveis. Persistência em Supabase (`patient_goals`). Sem dados mockados.

</domain>

<decisions>
## Implementation Decisions

### Onde fica na ficha
- **D-01:** Metas ficam no **Resumo**, evoluindo os blocos “Objetivos atuais” e “Todos os objetivos”. Sem aba nova.

### Como muda o status
- **D-02:** Select com os três estados: não iniciado, em andamento, atingido.

### Datas
- **D-03:** Data de criação e data de atingimento são **as duas editáveis**.

### REQ-05
- **D-04:** REQ-05 fica para depois (SQL + UAT ainda pendentes). O campo texto “Objetivos” da avaliação **não** se mistura com estas metas.

### Claude's Discretion
- Evoluir a tabela `patient_goals` existente (`title` + `is_done`) em vez de criar tabela nova.
- Manter `is_done` sincronizado com `status = atingido` para não quebrar leituras antigas.
- CRUD no bloco “Todos os objetivos”; o bloco “Objetivos atuais” mostra só metas não atingidas.

</decisions>

<canonical_refs>
## Canonical References

### Requisito
- `.planning/REQUIREMENTS.md` — REQ-14 acceptance
- `.planning/ROADMAP.md` — Phase 2 goal e success criteria

### Código existente
- `src/types/patient.ts` — `PatientGoal`
- `src/services/patients.service.ts` — leitura de `patient_goals`
- `src/pages/PatientPage.tsx` — blocos Objetivos no Resumo
- `src/components/patients/PatientAlertsPanel.tsx` — padrão de CRUD no resumo

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientAlertsPanel`: modal + confirm delete + hooks TanStack Query
- `Select`, `Input`, `Modal` em `src/components/ui/`
- `invalidatePatient` em `src/hooks/usePatients.ts`

### Established Patterns
- Camadas: types → schema → service → hooks → panel
- SQL manual no SQL Editor (`supabase/*.sql`)
- Datas de calendário como `YYYY-MM-DD`, formatar com `T00:00:00` local

### Integration Points
- `getPatientById` e `getPatientDashboard` já buscam `patient_goals`
- Dashboard filtra ativos com `is_done = false` — passar a `status != atingido`

</code_context>

<specifics>
## Specific Ideas

- Select de status (não atalho “marcar como atingida”)
- Duas datas editáveis no formulário
- Testar depois de implementar; REQ-05 não bloqueia

</specifics>

<deferred>
## Deferred Ideas

- REQ-05 SQL + UAT — usuário ainda precisa testar
- Metas no dashboard da clínica
- Comparar metas com evoluções

</deferred>

---

*Phase: 2-Metas do tratamento*
*Context gathered: 2026-09-04*
