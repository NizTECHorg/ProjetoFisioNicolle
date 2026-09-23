# Phase 16: Foto do paciente - Context

**Gathered:** 2026-09-23
**Status:** Ready for planning
**Source:** Pedido em `/gsd-plan-phase` (decisões já fechadas pelo operador)

<domain>
## Phase Boundary

A foto do paciente substitui as iniciais no avatar. Com o ponteiro em cima da foto, aparece um ícone de câmera. O clique escolhe um arquivo **PNG ou JPEG** e essa imagem passa a ser a foto do paciente.

Esta fase não muda a aba Imagens (galeria clínica da fase 7), não aceita WebP, HEIC, PDF nem câmera ao vivo, e não altera o código da empresa.

</domain>

<decisions>
## Implementation Decisions

### Foto no avatar
- **D-01:** O alvo é a foto do paciente, hoje as iniciais em `PatientAvatar`. Sem arquivo, as iniciais e a cor (`photo_tone`) continuam.
- **D-02:** Hover na foto mostra um ícone de câmera.
- **D-03:** Clique na foto (ou no ícone) abre a escolha de arquivo.
- **D-04:** Só **PNG** e **JPEG**. Outro tipo não é gravado.

### Claude's Discretion
- Em quais telas o avatar editável aparece (ficha, lista, quadro), desde que a mesma foto persistida apareça onde o avatar do paciente já é desenhado.
- Tamanho máximo, recorte quadrado e caminho no Storage, reusando o padrão de upload da galeria só onde couber.
- Quem pode trocar a foto segue quem já pode editar o paciente.
- Remover a foto e voltar às iniciais, se o fluxo ficar simples.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Avatar
- `src/components/ui/PatientAvatar.tsx` — círculo com iniciais e `photo_tone`; ainda não recebe imagem
- `src/lib/avatar.ts` — cor e iniciais

### Upload já existente (galeria, não é esta foto)
- `src/services/patientImages.service.ts` — envio de imagem do paciente, MIME e tamanho
- `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-CONTEXT.md` — galeria clínica; não reaproveitar WebP nem o modal de lote

</canonical_refs>

<specifics>
## Specific Ideas

Hover mostra câmera. Clique coloca a foto. Arquivos: png ou jpeg.

</specifics>

<deferred>
## Deferred Ideas

- WebP, HEIC, PDF e captura pela câmera do aparelho
- Foto na aba Imagens no lugar do avatar
- Editor de recorte avançado

</deferred>

---

*Phase: 16-foto-do-paciente*
*Context gathered: 2026-09-23*
