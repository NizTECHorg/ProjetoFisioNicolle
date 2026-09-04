# Requirements: Fisio — Prontuário clínico

**Defined:** 2026-08-31
**Core Value:** Documentar cada atendimento e manter a base clínica do paciente.

## Milestone atual

### Prontuário clínico

- [x] **REQ-08**: Evolução individual de cada sessão (entregue; SQL no Supabase)
- [ ] **REQ-05**: Registro da avaliação inicial estruturada, vinculada à data em que foi realizada

## REQ-05 — Registro da avaliação inicial

**Indispensável · 10/09/2026 · Artur**

Dentro do paciente deve existir uma avaliação estruturada onde possam ser registrados:

- Anamnese
- Queixa principal
- História do quadro
- Dor
- Limitações
- Objetivos
- Exame físico
- Testes
- Medidas
- Diagnóstico fisioterapêutico
- Planejamento

A avaliação permanece vinculada à **data em que foi realizada**. É a base clínica para acompanhar o tratamento e comparar posteriormente a evolução.

### Acceptance

1. A aba Avaliação do paciente lista avaliações reais (Supabase), sem dados mockados.
2. O profissional consegue criar, editar e excluir uma avaliação.
3. Data da avaliação é obrigatória e visível na lista e no registro.
4. Os campos clínicos acima existem no formulário e são persistidos.
5. A primeira avaliação (data mais antiga) é marcada como inicial; as seguintes ficam disponíveis para comparação futura.
6. Upload de PDF com IA pode preencher um rascunho; o registro oficial é a ficha estruturada.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Reavaliações como módulo separado | REQ-05 cobre o registro datado; reavaliação usa o mesmo modelo |
| Relatórios comparativos de evolução | Depois; a data já permite comparar |
| Multi-clínica | Ainda não |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-05 | Phase 1 | In progress |
| REQ-08 | Prior | Delivered |
