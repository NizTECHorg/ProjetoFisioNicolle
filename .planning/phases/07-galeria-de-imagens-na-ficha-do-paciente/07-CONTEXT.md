# Phase 7: Galeria de imagens na ficha do paciente - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Na ficha do paciente (`PatientPage`), uma quinta aba **Imagens** (`?aba=imagens`) mostra uma **galeria persistida** (sem mock). Cada foto é **avulsa** ou ligada a **uma sessão**, com **descrição** opcional. Upload pelo modal: no viewport estreito também **câmera traseira**; várias fotos no mesmo envio, com a mesma descrição/sessão. Quem não pode escrever a ficha vê a galeria e o lightbox (incluindo empresa em consulta); Adicionar / Editar / Excluir ficam ocultos.

This phase does **not** add PDF/documentos, vídeo, conversão HEIC, antes/depois, IA sobre a foto, atalho no Resumo, nem baixar arquivo. O card **Documentos · Em breve** permanece como está.

**UI-SPEC override:** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-UI-SPEC.md` is approved for tokens, copy base, grid, filtros e hide-write. CONTEXT **wins** where it conflicts: lote (várias), **Tirar foto** no estreito, **Compartilhar**, aviso **Sessão removida.** no lightbox, e o extra no confirm de Evoluções.

</domain>

<decisions>
## Implementation Decisions

### Câmera no consultório
- **D-01:** Viewport estreito (&lt; ~768px, inclui tablet em pé): no modal de envio, dois botões — **Tirar foto** (câmera **traseira**) e **Escolher arquivos** (galeria/PC, várias). Viewport largo: **só Escolher arquivos** — sem botão de câmera.
- **D-02:** Foto da câmera **entra no lote** do mesmo modal. Dá para tirar outra ou escolher mais arquivos. Persistência só ao confirmar **Adicionar imagem**.

### Várias por envio
- **D-03:** Um Adicionar envia **várias** fotos. **Descrição** e **Sessão** são **iguais para o lote** (todas avulsas ou todas da mesma sessão).
- **D-04:** Arquivo inválido (HEIC, MIME, &gt; 8 MB, etc.): **toast específico** (copy já no UI-SPEC) e **essa** foto não sobe. As **válidas do mesmo lote sobem**.
- **D-05:** Cada miniatura do lote no modal tem **X** para remover do envio (ainda não está na ficha). **Voltar** descarta o lote inteiro.

### Sessão apagada
- **D-06:** Excluir a sessão **não apaga** a foto. `session_id` vira null (avulsa). FK `ON DELETE SET NULL`.
- **D-07:** No **lightbox**, alocação mostra **Sessão removida.** até o profissional **salvar Editar imagem** (mesmo se continuar avulsa). No **tile**, só **Avulsa** — sem o aviso.
- **D-08:** Confirm de excluir sessão em **Evoluções** ganha texto extra: **As fotos dessa sessão ficam na ficha como avulsas.**

### Aviso da foto
- **D-09:** **Fluxo direto** — sem checkbox, sem segundo modal, sem linha extra de LGPD. Copy do modal permanece a do UI-SPEC (JPEG/PNG/WebP).
- **D-10:** **Sem Baixar imagem** nesta fase.
- **D-11:** Empresa em consulta **vê** aba Imagens, grid e lightbox. Sem Adicionar / Editar / Excluir / Compartilhar de escrita. RLS `can_read_patient` / `can_write_patient` é a parede.
- **D-12:** Lightbox tem **Compartilhar** (quem pode escrever). Sem link público permanente.

### Claude's Discretion
- Como **Compartilhar** funciona: preferir `navigator.share` com o arquivo da foto quando existir; se a API não existir, esconder o botão. Não copiar signed URL (expira e vaza). Não usar isso como substituto de download (D-10).
- Como persistir D-07 (flag `session_removed` / equivalente) — planner/SQL; precisa distinguir avulsa de nascença vs órfã de sessão.
- Tamanho máximo do lote (número de arquivos); rejeitar o excedente com toast em português.
- Ajustar copy do UI-SPEC ao lote: **Escolher arquivos**, toast de sucesso no plural quando N&gt;1 (ex. **Imagens adicionadas**).
- Bucket privado, `patient_images`, signed URLs, path, MIME 8 MB, HEIC recusado — seguir `07-RESEARCH.md`.
- Camadas page → hook → service → Supabase. Named exports, single quotes, no semicolons. SQL Editor only (não `supabase db push`). `mapDbError` / erro de Storage mapeado. Hide write, não disable.
- Tablist `overflow-x-auto` (quinto tab). Não restyle de `Button` / `Modal` / AppShell. Sem pacote novo (lightbox, Uppy, HEIC).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Produto e contrato visual
- `.planning/ROADMAP.md` — Phase 7: galeria na ficha, avulsa ou por sessão, com descrição
- `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-CONTEXT.md` — this file; wins over UI-SPEC on D-01–D-12
- `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-UI-SPEC.md` — tokens, grid, filtros, hide-write, copy base (override lote/câmera/compartilhar/aviso)
- `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-RESEARCH.md` — Storage privado, `patient_images`, signed URLs, RLS, sem npm novo
- `.planning/REQUIREMENTS.md` — ainda sem REQ-19 travado; RESEARCH propõe REQ-19.*

### Ficha e sessão
- `src/pages/PatientPage.tsx` — `?aba=`; montar `PatientImagesPanel`; `canWrite`
- `src/components/patients/PatientProfileHeader.tsx` — `PatientTab`; tablist hoje `overflow-hidden`
- `src/components/patients/PatientEvolutionsPanel.tsx` — D-08 (copy extra no ConfirmDialog de excluir sessão)
- `src/components/patients/PatientGoalsPanel.tsx` — analog hide-write + Modal + ConfirmDialog
- `src/lib/accountAccess.ts` — `canWritePatient` (UX); RLS é autoridade
- `src/hooks/usePatients.ts` — `usePatientSessions`; `invalidatePatient` precisa incluir images

### Padrões
- `.planning/phases/03-tipos-de-conta-e-equipe/03-CONTEXT.md` — D-05/D-07 consulta; hide-don't-disable
- `.planning/codebase/ARCHITECTURE.md` — page → hook → service → RLS; SQL Editor
- `.planning/codebase/CONVENTIONS.md` — named exports, português, sem `clsx`
- `.planning/codebase/STACK.md` — Zod + RHF + TanStack Query; supabase-js Storage já no client
- `src/lib/security/index.ts` — `sanitizeText`, `mapDbError`
- `src/components/ui/Modal.tsx` / `ConfirmDialog.tsx` / `Button.tsx` / `Select.tsx` / `Textarea.tsx` — reutilizar; portal do Modal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientEvolutionsPanel` / `PatientGoalsPanel`: header + `canWrite` unmount + Modal + ConfirmDialog
- `usePatientSessions`: chips e Select de sessão (`dateLabel · timeLabel`)
- `Modal` (`wide` no lightbox), `ConfirmDialog` `tone="danger"`, `toast()`
- Phase 3 `private.can_read_patient` / `private.can_write_patient` — políticas novas **chamam** esses helpers; não reescrever

### Established Patterns
- Abas da ficha via `?aba=`; painel novo em `src/components/patients/`
- Sem `supabase` no componente; serviço mapeia snake_case → camelCase
- Empty sem placeholder fake; UI pt-BR
- `/supabase/` gitignored; script commitado em `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/`

### Integration Points
- `PatientTab` + `PatientPage` setTab: adicionar `'imagens'`
- Invalidar `['patients', id, 'images']` quando sessão some (D-06/D-07)
- Confirm de delete de sessão em Evoluções (D-08) — único toque fora da aba Imagens
- CSP / `connect-src` já inclui `https://*.supabase.co` (Storage signed URLs)

### Creative options
- Input `capture="environment"` só no botão Tirar foto; o de arquivos usa `multiple` sem capture
- Aviso D-07 exige estado persistido; `session_id` null sozinho não distingue avulsa original

</code_context>

<specifics>
## Specific Ideas

- Dois botões só &lt; ~768px; câmera traseira; lote no modal; X nas miniaturas
- Copy Evoluções: **As fotos dessa sessão ficam na ficha como avulsas.**
- Lightbox: **Sessão removida.**; tile: **Avulsa**
- **Compartilhar** no lightbox; sem baixar; sem texto extra de privacidade

</specifics>

<deferred>
## Deferred Ideas

- Baixar imagem (D-10)
- Checkbox / modal de consentimento LGPD
- PDF, documentos (card **Documentos · Em breve**), vídeo, conversão HEIC, Uppy/TUS
- Antes/depois, slider, análise por IA
- Link público permanente / bucket público
- Fotos no Resumo ou no card da sessão em Evoluções
- Substituir o arquivo de uma foto já salva (só metadados nesta fase, per UI-SPEC)

</deferred>

---

*Phase: 7-galeria-de-imagens-na-ficha-do-paciente*
*Context gathered: 2026-09-14*
