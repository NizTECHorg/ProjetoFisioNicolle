---
phase: 26-pdf-botao-gerando-envio-cliente
verified: 2026-10-07T00:55:40Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Depois de colar send-patient-document no Dashboard e gravar os cinco FLUXO_SMTP_*, exportar uma avaliação de um paciente com e-mail no cadastro e tocar Enviar por e-mail."
    expected: "O PDF chega na caixa do paciente. A tela só diz E-mail enviado para o paciente depois que a função responde sem erro."
    why_human: "A função está só no fonte da fase. Ela não foi publicada e esta verificação não abre uma caixa de entrada."
  - test: "No mesmo paciente, com telefone no cadastro, tocar Enviar por WhatsApp na exportação e de novo num PDF salvo de avaliação ou evolução."
    expected: "Abre a conversa no número do cadastro, com a frase do link de 7 dias. A tela só diz Conversa aberta com o link do PDF se a janela abrir."
    why_human: "wa.me depende do navegador e do WhatsApp. Não foi exercitado aqui."
  - test: "Repetir o e-mail sem endereço no cadastro e o WhatsApp sem telefone utilizável. Bloquear a janela do navegador numa tentativa com telefone válido."
    expected: "A frase em português explica o que falta ou que o WhatsApp não abriu. Não aparece aviso de sucesso."
    why_human: "O texto está no código; o toast na tela precisa de um clique real."
  - test: "Gerar o resumo e, no escopo Evolução, esperar a síntese. No escopo Avaliação, exportar o PDF."
    expected: "Gerar resumo, Substituir e gerar e a síntese mostram Gerando, estrela e brilho azul. Exportar PDF de avaliação e o confirmar do seletor ficam em Aguarde... com o spinner."
    why_human: "A animação do brilho e a troca de rótulo só aparecem com o modelo respondendo no browser."
  - test: "Exportar uma avaliação e uma evolução com campos vazios e com conta sem escrita."
    expected: "O PDF mostra só o que foi preenchido, em página clara. A conta sem escrita não vê Enviar por WhatsApp nem Enviar por e-mail."
    why_human: "O desenho e a regra canWrite estão no fonte; a página impressa e a sessão de consulta precisam de olho humano."
---

# Phase 26: PDF, botão Gerando e envio ao cliente Verification Report

**Phase Goal:** O PDF de avaliação e o de evolução ficam simples e mostram só o que foi preenchido. Todo botão que chama a IA, enquanto gera, mostra Gerando com uma estrela e um brilho azul. Dá para mandar essa avaliação ou evolução direto ao cliente por e-mail ou WhatsApp, com o logo de cada um.
**Verified:** 2026-10-07T00:55:40Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | O PDF de avaliação e o de evolução mostram só informações preenchidas, com uma formatação simples e limpa. | ✓ VERIFIED | `drawAvaliacao` e `drawEvolucao` usam `drawClearSectionTitle` / `drawOptionalField` e não chamam `drawPageBanner` nem `drawFichaBlockFrame`. `drawDataTable` pula linha vazia e não desenha `—` em célula vazia. O ramo `footerKind === 'ficha'` desenha logo, título Avaliação ou Evolução, traço `#2f7dff` e rodapé `Fluxo` com número da página. Catálogo vazio no compositor não chama `buildPatientAiReportPdf`. |
| 2 | A seta da mobilidade vira `->` só na string desenhada, e `toWinAnsiSafe` permanece como está. | ✓ VERIFIED | `toWinAnsiSafe` não contém `replaceAll('→'`. O replace fica em `formatCabecalhoRegiao(...).replaceAll('→', '->')` e nos campos de 04.B / 04.E. `mobilidadePalpacao.test.ts` passou. |
| 3 | Os PDFs geral e sessão continuam com o desenho atual. | ✓ VERIFIED | `drawGeral` e `drawSessao` permanecem. O ramo que não é ficha ainda grava `FLUXO · Documento clínico` e `Pág.`. |
| 4 | Enquanto a IA gera, o botão diz Gerando, mostra uma estrela e o fundo tem um brilho azul animado. | ✓ VERIFIED | `AiGeneratingButton` mostra `Star` e `Gerando` com a classe `ai-generating` só enquanto `generating` é verdadeiro. `index.css` anima `ai-glow` em `#2f7dff` por 1.6s e, com movimento reduzido, zera a animação e mantém a sombra azul. O compositor usa esse controle em Gerar resumo e na síntese. O diálogo de substituir passa `generatingConfirm`. |
| 5 | Salvar, excluir, exportar avaliação e gravar o arquivo continuam com Aguarde... e o spinner. | ✓ VERIFIED | `Button.tsx` ainda tem o spinner e `Aguarde...` e não contém `Gerando`. Avaliação, `createReport.isPending` e o seletor usam `Button`. O excluir da lista não passa `generatingConfirm`. O envio também usa `Button` `isLoading`. |
| 6 | Se não há campo preenchido, o PDF não é criado e a tela mostra o estado vazio. | ✓ VERIFIED | Nos dois ramos `items.length === 0`, o compositor faz `setCatalogEmpty(true)` e retorna antes de `buildPatientAiReportPdf` e de `createReport`. A tela mostra `pdfEmptyHeading` e `pdfEmptyBody`. |
| 7 | Na exportação, e-mail e WhatsApp aparecem com os logos e o código envia a avaliação ou a evolução para o contato do cadastro. | ✓ VERIFIED | Abaixo de Exportar PDF há SVG `#25D366` e `Mail`. O e-mail chama `sendPatientDocument` só com `patientId` e `reportId`. O WhatsApp assina por 604800 segundos e abre `https://wa.me/`. A chegada na caixa e a conversa aberta não foram exercitadas. |
| 8 | Sem contato, sem arquivo alcançável ou com popup bloqueado, a tela explica em português e não diz que enviou. | ✓ VERIFIED | `resolvePatientEmail` e `resolveWhatsAppDigits` recusam vazio, `—` e telefone fora do formato. O compositor e a lista usam `sendNeedEmail`, `sendNeedPhone`, `sendPhoneInvalid`, `sendNeedExport`, `sendFileUnavailable` e `sendWhatsAppBlocked`, e só então a cópia de sucesso. `openPatientDocumentWhatsApp` faz `window.open(href, '_blank')` e trata `null` como falha; `popup.opener = null` só depois de um handle. |
| 9 | O e-mail parte de uma função nova que lê `patients.email`, só envia se `created_by` for o usuário do JWT, e o cliente manda só `patientId` e `reportId`. A senha SMTP não entra no repositório. | ✓ VERIFIED | `functions/send-patient-document/index.ts` seleciona `email, created_by`, responde 403 se `created_by !== user.id`, baixa o PDF com o cliente do JWT e recusa kind diferente de `avaliacao` ou `evolucao`. O schema Zod tem só os dois uuids. `FLUXO_SMTP_PASS` é lido de `Deno.env`. `26-USER-SETUP.md` nomeia o segredo e não grava valor. |
| 10 | Conta sem escrita não vê o par. Geral e sessão também não. Quem escreve reenvia cada PDF salvo de avaliação ou evolução. | ✓ VERIFIED | O compositor faz `if (!canWrite) return null`. A lista monta o par só com `canWrite` e kind `avaliacao` ou `evolucao`. `PatientResumoIaPanel` passa `phone={detail?.phone}` e `email={detail?.email}` do `usePatient` já existente. |

**Score:** 10/10 truths verified

CR-01, WR-01 e WR-02 de `26-REVIEW.md` não continuam no fonte atual. O WhatsApp não usa a feature `noopener`. `savedReport` zera quando `patientId` muda, e o `onSuccess` da exportação ignora um paciente que já não é o da montagem. A função e `signPatientDocumentUrl` exigem que a primeira pasta de `storage_path` seja o id do paciente.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/services/patientAiPdf.service.ts` | Desenho claro de avaliação e evolução | ✓ VERIFIED | Substantivo e chamado por `buildPatientAiReportPdf` a partir do compositor. |
| `src/lib/phase26Contract.test.ts` | Contratos REQ-37.1, 37.2, 37.3 e 37.5 | ✓ VERIFIED | Seis testes lendo fonte; todos passaram. |
| `src/components/ui/AiGeneratingButton.tsx` | Palavra Gerando e estrela | ✓ VERIFIED | Importado pelo compositor e pelo `ConfirmDialog`. |
| `src/index.css` | Classe `ai-generating` e `ai-glow` | ✓ VERIFIED | Só essa classe recebe o brilho. |
| `src/components/ui/Button.tsx` | Carregamento global intocado | ✓ VERIFIED | Spinner e `Aguarde...`. |
| `src/lib/patientContact.ts` | E-mail utilizável e dígitos `wa.me` | ✓ VERIFIED | Doze testes de contato passaram, inclusive o contrato da função. |
| `src/services/patientDocumentSend.service.ts` | Invoke e `wa.me` de 7 dias | ✓ VERIFIED | `functions.invoke('send-patient-document')`, `604800`, sem `86400`. |
| `.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts` | Fonte para colar no Dashboard | ✓ VERIFIED | Não está publicado. O arquivo existe e faz o envio SMTP. |
| `src/components/patients/PatientAiReportsList.tsx` | Reenvio só com `canWrite` | ✓ VERIFIED | Par entre Baixar e Excluir. |
| `.planning/phases/26-pdf-botao-gerando-envio-cliente/26-USER-SETUP.md` | Passos do Dashboard sem senha | ✓ VERIFIED | Nomes `FLUXO_SMTP_*` e UAT, sem host nem senha. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `patientAiPdf.service.ts` | `drawAvaliacao` / `drawEvolucao` | `footerKind === 'ficha'` | WIRED | Os dois kinds entram no ramo claro. |
| `phase26Contract.test.ts` | `patientAiPdf.service.ts` | `readFileSync` | WIRED | O teste lê `toWinAnsiSafe` e os draws. |
| `PatientAiComposer.tsx` | `AiGeneratingButton.tsx` | geração de resumo e síntese | WIRED | `generatingTarget` separa resumo e síntese. |
| `ConfirmDialog.tsx` | `AiGeneratingButton.tsx` | `generatingConfirm` | WIRED | Só o confirmar de substituir. |
| `patientDocumentSend.service.ts` | `send-patient-document` | `supabase.functions.invoke` | WIRED | Body só com `patientId` e `reportId`. |
| `send-patient-document/index.ts` | `patients.email` | select com o JWT | WIRED | Compara `created_by` antes do SMTP. |
| `PatientAiComposer.tsx` | `patientDocumentSend.service.ts` | último PDF desta montagem | WIRED | `sendPatientDocument` e `openPatientDocumentWhatsApp`. |
| `PatientAiReportsList.tsx` | `wa.me` | `createSignedUrl` no clique | WIRED | `604800` e recusa de pasta que não é o paciente. |
| `PatientResumoIaPanel.tsx` | `PatientAiReportsList.tsx` | `detail.phone` e `detail.email` | WIRED | Um único `usePatient`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `drawAvaliacao` / `drawEvolucao` | `ficha` / sessões e síntese | Avaliação e sessões já carregadas, passadas a `buildPatientAiReportPdf` | Sim, campos preenchidos da ficha | ✓ FLOWING |
| `AiGeneratingButton` | `generating` | `generatingTarget` em volta de `generatePatientAiSummary` e `generateEvolucaoSynthesis` | Sim, o estado acompanha a chamada | ✓ FLOWING |
| Botões de envio no compositor | `detail.email`, `detail.phone`, `savedReport` | `usePatient` e `createReport.onSuccess` | Sim | ✓ FLOWING |
| Botões de envio na lista | `phone`, `email`, linha do relatório | Props do `usePatient` e `usePatientAiReports` | Sim | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Contratos REQ-37.1, 37.2, 37.3 e 37.5 | `node --test --test-name-pattern "REQ-37" src/lib/phase26Contract.test.ts` | 6 passed, 0 failed | ✓ PASS |
| Contato, schema e leitura do e-mail no fonte da função | `node --test src/lib/patientContact.test.ts` | 12 passed, 0 failed | ✓ PASS |
| Seta `->` e `toWinAnsiSafe` intactos | `node --test src/lib/mobilidadePalpacao.test.ts` | 16 passed, 0 failed | ✓ PASS |

### Probe Execution

Nenhuma sonda declarada no plano nem em `scripts/*/tests/probe-*.sh` para esta fase.

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | Nenhuma sonda da fase | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-37 | 26-01, 26-02, 26-03, 26-04 | PDF só com o preenchido, botão Gerando com estrela e brilho azul, envio da avaliação ou evolução por e-mail e WhatsApp | ? NEEDS HUMAN | Aceites 1, 2, 4 e 5 estão no fonte e nos testes. O aceite 3 está ligado no código, mas a caixa real e o `wa.me` não foram conferidos. A função não está publicada. |

Nenhum outro ID de `REQUIREMENTS.md` está mapeado só para a fase 26. Os quatro planos declaram somente REQ-37. Não há requisito órfão.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/services/patientAiPdf.service.ts` | 2095 | `timesBold` é embutido e nenhum draw usa a face | ℹ️ Info | IN-01. Não muda o PDF visível. |
| `src/services/patientAiPdf.service.ts` | 1373, 1389 | Comentários `// drawFichaBlockFrame` | ℹ️ Info | IN-02. Não desenham. `mobilidadePalpacao.test.ts` usa essas strings como âncora. |
| `src/services/patientAiPdf.service.ts` | 1935, 2075 | Frase se o draw for chamado sem conteúdo | ℹ️ Info | O compositor não chega nesse ramo: catálogo vazio não cria o arquivo. |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | 175 | Drop de PDF mostra "Analisando..." com spinner | ℹ️ Info | Não é botão. O contrato da fase limita Gerando a Gerar resumo, Substituir e gerar e à síntese de evolução. |

Nenhum `TBD`, `FIXME` ou `XXX` nos arquivos desta fase.

### Human Verification Required

### 1. E-mail com o PDF na caixa

**Test:** Colar `functions/send-patient-document/index.ts` no Dashboard com o nome `send-patient-document`, gravar `FLUXO_SMTP_HOST`, `FLUXO_SMTP_PORT`, `FLUXO_SMTP_USER`, `FLUXO_SMTP_PASS` e `FLUXO_SMTP_FROM`, exportar uma avaliação de um paciente com e-mail e tocar Enviar por e-mail.
**Expected:** O PDF chega na caixa. A tela diz que enviou só depois da resposta sem erro.
**Why human:** A função não está publicada. Esta verificação não entrega mensagem.

### 2. WhatsApp com o link de 7 dias

**Test:** Com telefone no cadastro, tocar Enviar por WhatsApp na exportação e num PDF salvo de avaliação ou evolução.
**Expected:** A conversa abre no número do cadastro com o link. Sem telefone, ou com a janela bloqueada, a tela explica e não diz que enviou.
**Why human:** `wa.me` e o bloqueio de popup dependem do navegador.

### 3. Gerando, estrela e brilho azul

**Test:** Gerar o resumo, confirmar Substituir e gerar, e exportar uma evolução enquanto a síntese corre. Depois exportar uma avaliação.
**Expected:** Os três controles de modelo mostram Gerando, estrela e brilho azul. Exportar avaliação, o seletor e o envio ficam em Aguarde...
**Why human:** A animação não aparece num teste de fonte.

### 4. PDF claro e conta sem escrita

**Test:** Exportar avaliação e evolução com campos em branco. Abrir a ficha com uma conta que não escreve.
**Expected:** O PDF mostra só o preenchido, sem selo de bloco e sem traço no lugar de célula vazia. A conta sem escrita não vê os dois botões de envio. Geral e sessão também não.
**Why human:** O layout impresso e a sessão de consulta não saem do teste de contrato.

### Gaps Summary

Não há lacuna de código nos must-haves. O que falta é conferência humana: a função de e-mail ainda é fonte para colar no Dashboard, e a conversa do WhatsApp não foi aberta. Enquanto isso não acontecer, a fase não está encerrada.

---

_Verified: 2026-10-07T00:55:40Z_
_Verifier: Claude (gsd-verifier)_
