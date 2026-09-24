# Phase 19: Boneco de área de foco - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Refatorar a silhueta de áreas de foco no card do Resumo. Os braços ganham divisões, a perna abaixo do joelho ganha nomes por vista, e selecionar uma área não cria scroll na página. Se o desenho atual não permitir eliminar esse scroll, o boneco é refeito. Frente e costas, esquerda e direita, hover de 500ms e clique na abinha continuam como na fase 6. Não entra dedo, músculo isolado nem região nova fora do que foi fechado aqui.

</domain>

<decisions>
## Implementation Decisions

### Divisões do braço
- **D-01:** Depois do ombro, cada lado se divide em Braço, Antebraço e mão. Vale na frente e nas costas, esquerda e direita. O ombro continua uma região própria.
- **D-02:** Na frente a mão se chama Palma da mão. Nas costas se chama Mão. Braço e Antebraço usam o mesmo nome nas duas vistas.
- **D-03:** A mão é uma região só. Os dedos não se separam. O cotovelo é só o limite entre Braço e Antebraço, não uma região.

### Perna, canela e pé
- **D-04:** Coxa e joelho continuam com o mesmo nome na frente e nas costas. Abaixo do joelho, a frente é Canela e depois Pé. As costas são Panturrilha e depois Tornozelo. Esquerda e direita.
- **D-05:** O pé é uma região só. Os dedos do pé não se separam. Não há faixa de tornozelo entre Canela e Pé na frente. Nas costas a ponta é Tornozelo, não Pé.

### Marcas já salvas
- **D-06:** Apagar só as marcas das regiões que deixam de existir: braço inteiro (frente e costas, esquerda e direita) e perna inteira que hoje inclui o pé (`front.arm_l`, `front.arm_r`, `back.arm_l`, `back.arm_r`, `front.leg_l`, `front.leg_r`, `back.leg_l`, `back.leg_r`). Marcas de regiões que não mudam permanecem. Não repartir a marca antiga nas partes novas.

### Scroll ao selecionar
- **D-07:** Selecionar uma área de foco não cria scroll na página. Se o boneco atual não puder ser corrigido sem esse scroll, ele é substituído por um desenho em que a seleção não cria scroll.

### O que permanece da fase 6
- **D-08:** O card continua Áreas de foco no Resumo, frente e costas lado a lado, visual minimalista da clínica. Hover de 500ms abre a abinha; o clique na abinha marca ou desmarca. Clique só na silhueta não marca. Catálogo fixo de regiões, persistido em `patient_focus_areas`. Quem não pode escrever só vê.

### Claude's Discretion
- Nomes estáveis das `region_key` novas e o desenho SVG de cada parte.
- Como aplicar a exclusão das marcas obsoletas no SQL Editor, sem `supabase db push` e sem apagar linhas de regiões que permanecem.
- O meio de tirar o scroll (ajuste do boneco atual ou boneco novo). O resultado é obrigatório: a página não rola ao selecionar.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisito e fase anterior
- `.planning/REQUIREMENTS.md` — REQ-30; REQ-18 é a silhueta já entregue
- `.planning/ROADMAP.md` — Phase 19 goal e success criteria
- `.planning/phases/06-silhueta-areas-de-foco/06-CONTEXT.md` — hover, abinha, frente e costas, catálogo fixo

### Código atual
- `src/lib/focusRegions.ts` — catálogo de 30 regiões; braço e perna ainda são uma peça só
- `src/components/patients/PatientFocusAreasPanel.tsx` — silhueta, abinha e o scroll ao focar o path
- `src/services/patients.service.ts` — `togglePatientFocusArea` e leitura de `patient_focus_areas`
- `src/types/patient.ts` — `PatientFocusArea`
- `src/hooks/usePatients.ts` — `useTogglePatientFocusArea`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientFocusAreasPanel` já desenha frente e costas e abre a abinha. As regiões novas entram nesse painel.
- `FOCUS_REGIONS` em `src/lib/focusRegions.ts` é o catálogo. As keys de braço inteiro e perna inteira saem; coxa, joelho, ombro e o resto ficam.
- `togglePatientFocusArea` grava por `region_key` em `patient_focus_areas`.

### Established Patterns
- Hover de 500ms e clique na abinha, não no path sozinho.
- SQL colado no SQL Editor. Não usar `supabase db push`.
- Quem não pode escrever não vê o controle de marcar.

### Integration Points
- O card está no Resumo de `src/pages/PatientPage.tsx`.
- O PDF clínico lê as mesmas keys em `src/services/patientAiPdf.service.ts`. Região removida não pode continuar como marca desenhada.

</code_context>

<specifics>
## Specific Ideas

- Frente, por lado, abaixo do joelho: Canela, Pé.
- Costas, por lado, abaixo do joelho: Panturrilha, Tornozelo.
- Frente, mão: Palma da mão. Costas, mão: Mão.
- Braço e Antebraço com o mesmo nome nas duas vistas.

</specifics>

<deferred>
## Deferred Ideas

- Separar os dedos da mão ou do pé.
- Cotovelo como região própria.
- Granularidade muscular (já adiada na fase 6).
- Seletor de sexo ou tipo de corpo.

</deferred>

---

*Phase: 19-boneco-de-rea-de-foco*
*Context gathered: 2026-09-24*
