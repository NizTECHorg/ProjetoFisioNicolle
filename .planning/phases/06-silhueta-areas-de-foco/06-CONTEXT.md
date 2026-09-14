# Phase 6: Silhueta de áreas de foco - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning
**Source:** /gsd-plan-phase (decisões do Artur + screenshots do card atual e da referência frente/costas)

<domain>
## Phase Boundary

No Resumo da ficha (`PatientPage`), o card **Áreas de foco** hoje é um SVG de boneco palito **não clicável**, com bolinhas azuis hardcoded, e uma lista que só **lê** `patient_focus_areas`. Esta fase substitui isso por uma **silhueta humana simples** (frente e costas). Hover **0,5s** numa região abre uma **abinha** com o nome; **clicar a abinha** marca ou desmarca aquela parte como machucada / a trabalhar. Persistência na tabela já existente. Sem mock.

This phase does **not** change metas, avaliação, financeiro, agenda ou cadastro.

</domain>

<decisions>
## Implementation Decisions

### O que substitui
- **D-01:** Remover o stick figure atual (`BodyFocus` em `PatientPage.tsx`) e a lista morta ao lado. O card continua com o título **Áreas de foco**.
- **D-02:** A interação vive **neste card do Resumo**. Sem aba nova, sem rota nova, sem widget de terceiro (Jotform / Body Part Selector).

### Forma e referência
- **D-03:** Silhueta **humana** vista de **frente e de costas**, lado a lado — layout da segunda imagem (referência). Não copiar musculatura, cores navy `#0A1651` / laranja `#FF7D16`, nem o chrome do widget (Build/Settings, Submit, Male, etc.).
- **D-04:** Visual **simples e minimalista**: contorno + preenchimento suave nas cores da clínica (`forest`, `accent` `#2f7dff` para hover/seleção). Sem textura 3D, sem gênero configurável nesta fase (uma silhueta só).

### Interação
- **D-05:** Hover numa região por **500ms** abre uma **abinha** (chip/tab pequeno) com o nome da parte em português. Sair da região+abinha fecha a abinha. Não abrir no hover imediato (evita flicker).
- **D-06:** **Clicar a abinha** marca ou desmarca aquela parte como área de foco. Clique na silhueta sozinho **não** marca — só a abinha. Várias partes ao mesmo tempo.
- **D-07:** Região marcada fica destacada na silhueta (fill accent suave + stroke). Desmarcada volta ao estado default. Empty: silhueta sem destaques + copy **Sem áreas registradas.** (já existente).

### Dados
- **D-08:** Catálogo **fixo** de regiões (paths SVG nomeados). Não é texto livre digitado no hover. Labels em português.
- **D-09:** Persistência em `public.patient_focus_areas` (já tem RLS `can_read_patient` / `can_write_patient`). Sem tabela nova se um `region_key` (ou equivalente) couber na existente. Sem mock.
- **D-10:** Só `canWrite` marca/desmarca (esconder a abinha / pointer). Empresa em consulta de colega **vê** as áreas salvas, não edita. RLS continua autoridade.

### Claude's Discretion
- Lista exata de regiões (cabeça, pescoço, ombro E/D, etc.) — cobrir tronco e membros de forma clínica útil, sem granularidade de cada músculo da referência.
- Se a tabela atual só tem `label` texto, adicionar `region_key` estável via SQL Editor (não `supabase db push`) e mapear labels a partir do catálogo.
- Extrair o SVG para um componente em `src/components/patients/` (não deixar o mapa inline gigante em `PatientPage.tsx`).
- Touch: no mobile, tap na região pode abrir a abinha (hover não existe); segundo tap na abinha marca. Detalhe no UI-SPEC.
- Lista textual ao lado: só se caber sem apertar o card; a fonte da verdade visual é a silhueta.
- Camadas: types → schema → service → hook → componente. Named exports, single quotes, no semicolons.
- Hide write controls; não desabilitar botões que parecem clicáveis.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisito e ficha
- `.planning/REQUIREMENTS.md` — REQ-18
- `.planning/ROADMAP.md` — Phase 6 goal e success criteria
- `src/pages/PatientPage.tsx` — card Áreas de foco + `function BodyFocus()` (stick figure a remover)
- `src/types/patient.ts` — `PatientFocusArea`
- `src/services/patients.service.ts` — `getPatientById` já SELECT `patient_focus_areas`; **não há write hoje**
- `src/lib/accountAccess.ts` — `canWritePatient` (UX); RLS em `patient_focus_areas_*`

### Visual
- `.planning/phases/06-silhueta-areas-de-foco/refs/atual-stick-figure.png` — estado atual (feio / não funcional)
- `.planning/phases/06-silhueta-areas-de-foco/refs/referencia-silhueta-frente-costas.png` — referência de layout frente+costas + regiões clicáveis (não copiar o tema navy/laranja)
- `.planning/phases/03-tipos-de-conta-e-equipe/03-UI-SPEC.md` — tokens `forest` / `accent` `#2f7dff`
- `.planning/codebase/CONVENTIONS.md` — named exports, português, hide-don't-disable
- `.planning/codebase/ARCHITECTURE.md` — page → hook → service → RLS; SQL Editor apply path

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Card do Resumo: `rounded-2xl border border-line p-4` + título `text-[11px] font-semibold uppercase tracking-[0.14em] text-accent`
- `canWrite` já desce até o bloco do Resumo; o card de foco **não usa** `canWrite` hoje
- RLS Phase 3 já cobre SELECT/INSERT/UPDATE/DELETE em `patient_focus_areas`

### Established Patterns
- CRUD clínico no Resumo: `PatientAlertsPanel` / `PatientGoalsPanel` (modal + TanStack Query + hide when !canWrite)
- SQL: script em `.planning/phases/06-silhueta-areas-de-foco/sql/` + paste no SQL Editor; cópia `supabase/` gitignored

### Integration Points
- `getPatientById` monta `focusAreas` a partir de `patient_focus_areas`
- `invalidatePatient` em `src/hooks/usePatients.ts` após writes

</code_context>

<specifics>
## Specific Ideas

- Frente e costas lado a lado, como a referência, em SVG inline (acessível: cada path com nome).
- Delay de hover **500ms** explícito; abinha ancorada na região, não um tooltip nativo do browser.
- Múltipla seleção; estado visual = estado persistido após o clique (otimismo ok se invalidar o patient).

</specifics>

<deferred>
## Deferred Ideas

- Seletor de sexo/tipo de corpo (Male/Female da referência)
- Granularidade muscular da referência (peitoral, deltoide, etc. como músculos isolados)
- Mapa 3D, zoom, ou marcação de ponto livre (x,y) fora do catálogo
- Áreas de foco fora do Resumo (avaliação, evolução, PDF)
- Temas de cor configuráveis pelo usuário (Body Color / Hover Color / Selection Color da referência)

</deferred>
