# Phase 7: Galeria de imagens na ficha do paciente - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 7-galeria-de-imagens-na-ficha-do-paciente
**Areas discussed:** Câmera no consultório, Uma ou várias por envio, Sessão apagada, Aviso da foto

---

## Câmera no consultório

| Option | Description | Selected |
|--------|-------------|----------|
| Dois botões | Tirar foto (câmera) + Escolher arquivos (várias), só no celular | ✓ |
| Um botão só | O SO decide câmera vs arquivos | |
| Você decide | Câmera e várias fotos existem; detalhe livre | |

**User's choice:** Dois botões, **apenas no modo celular**.
**Notes:** Viewport estreito ~768px (tablet em pé incluso). Foto da câmera entra no lote. Câmera **traseira**.

---

## Uma ou várias por envio

| Option | Description | Selected |
|--------|-------------|----------|
| Iguais para o lote | Um Descrição + um Sessão | ✓ |
| Por foto | Cada miniatura com metadados próprios | |
| Não envia nada se houver inválido | Modal aberto para corrigir | |
| Envia só as válidas | Toast do que pulou | ✓ (após “você decide”: erro personalizado e não envia a inválida) |
| X na miniatura | Remove do lote antes de persistir | ✓ |

**User's choice:** Várias por envio; metadados do lote; inválida com toast específico não sobe; válidas sobem; X remove do lote.
**Notes:** Freeform no inválido: “manda mensagem de erro personalizada e nao envia a imagem”.

---

## Sessão apagada

| Option | Description | Selected |
|--------|-------------|----------|
| Só Avulsa | Sem histórico visual | |
| Avulsa com aviso | “Sessão removida.” até editar | ✓ |
| Aviso some ao salvar Editar | Mesmo se continuar avulsa | ✓ |
| Aviso até ligar outra sessão | | |
| Extra no confirm de Evoluções | Fotos ficam avulsas | ✓ |
| Aviso só no lightbox | Tile permanece Avulsa | ✓ |

**User's choice:** Vira avulsa; aviso no lightbox até salvar Editar; Evoluções avisa; tile sem o aviso.

---

## Aviso da foto

| Option | Description | Selected |
|--------|-------------|----------|
| Sem texto extra de privacidade | Copy UI-SPEC só | ✓ |
| Uma linha “só nesta ficha” | | |
| Sem baixar nesta fase | | ✓ |
| Baixar no lightbox | | |
| Empresa vê a galeria | Consulta read-only | ✓ |
| Esconder aba Imagens na consulta | | |
| Sem compartilhar | | |
| Compartilhar no lightbox | | ✓ |

**User's choice:** Fluxo direto; sem LGPD extra; sem download; consulta vê; **Compartilhar** sim. Recusou detalhar WhatsApp vs copiar link (Claude's discretion).

---

## Claude's Discretion

- Mecânica de **Compartilhar** (`navigator.share` vs esconder se indisponível; não copiar signed URL)
- Persistência do aviso **Sessão removida.** (flag vs coluna)
- Cap numérico do lote
- Copy plural do toast / **Escolher arquivos**
- Stack Storage/RLS conforme RESEARCH.md

## Deferred Ideas

- Baixar imagem
- Consentimento LGPD
- PDF/documentos, vídeo, HEIC lib, antes/depois, IA
- Link público permanente
- Galeria no Resumo / thumb na evolução
- Trocar o arquivo de uma foto já salva
