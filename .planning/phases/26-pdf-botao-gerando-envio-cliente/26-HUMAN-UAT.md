---
status: partial
phase: 26-pdf-botao-gerando-envio-cliente
source: [26-VERIFICATION.md]
started: 2026-10-07T00:55:40Z
updated: 2026-10-07T00:55:40Z
---

## Current Test

Colar a função no Dashboard e conferir e-mail, WhatsApp, Gerando e o PDF.

## Tests

### 1. E-mail com o PDF na caixa
expected: Colar `functions/send-patient-document/index.ts` no Dashboard com o nome `send-patient-document`, gravar os cinco `FLUXO_SMTP_*` e enviar uma avaliação. O PDF chega na caixa. A tela diz que enviou só depois da resposta sem erro.
result: pending

### 2. WhatsApp com o link de 7 dias
expected: Com telefone no cadastro, Enviar por WhatsApp abre a conversa com o link. Sem telefone, ou com a janela bloqueada, a tela explica e não diz que enviou.
result: pending

### 3. Gerando, estrela e brilho azul
expected: Gerar resumo, Substituir e gerar, e a espera da síntese mostram Gerando, estrela e brilho azul. Exportar avaliação, o seletor e o envio ficam em Aguarde...
result: pending

### 4. PDF claro e conta sem escrita
expected: O PDF de avaliação e o de evolução mostram só o preenchido, sem selo de bloco e sem traço no lugar de célula vazia. Conta sem escrita não vê os botões de envio. Geral e sessão também não.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
