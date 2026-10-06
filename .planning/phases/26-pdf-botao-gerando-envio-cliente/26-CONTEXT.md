# Phase 26: PDF, botão Gerando e envio ao cliente - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase` (discuss-phase pulado — intenção explícita)

<domain>
## Phase Boundary

Três entregas na exportação clínica e nos botões de IA:

1. O PDF de extração da avaliação e o da evolução ficam simples e bonitos, e mostram só o que foi preenchido.
2. Todo botão que chama a IA, enquanto gera, mostra **Gerando**, uma estrela e um brilho azul no fundo.
3. Dá para mandar essa avaliação ou evolução direto ao cliente por e-mail ou WhatsApp, com o logo de cada um.

Não reabre catálogos, blocos da ficha nem o UAT da fase 25. Não muda o SMTP de confirmação de conta. Não edita `patient-ai-summary`. Sem SQL e sem `supabase db push`. Sem pacote npm novo.

</domain>

<decisions>
## Implementation Decisions

### PDF só com o preenchido
- O PDF de avaliação e o de evolução passam a ter uma formatação linda, simples e limpa. Hierarquia clara, respiro, identidade Fluxo. Não é um formulário denso e não copia tema escuro.
- Entra no PDF somente informação preenchida. Campo vazio, bloco vazio e linha vazia não aparecem.
- O seletor de campos continua: só o que está preenchido entra na lista, tudo marcado por padrão, e o profissional pode desmarcar o que o cliente não deve ver.
- Não inventar texto clínico para preencher buraco.
- A seta `→` no desenho do PDF continua virando `->` só na string desenhada, porque o WinAnsi troca U+2192 por `?`. Não mudar `toWinAnsiSafe`.

### Botão que usa IA
- Vale para todo controle cuja ação chama o modelo. Hoje isso é **Gerar resumo** e a confirmação **Substituir e gerar**, mais a espera da síntese de evolução enquanto o modelo responde.
- No lugar do spinner e do texto **Aguarde...**, o botão mostra a palavra **Gerando**, uma estrela e o fundo com uma animação de glow azul.
- O brilho azul existe só nesse estado. O resto do Fluxo continua com as cores atuais.
- **Exportar PDF** e o envio do arquivo, quando não há chamada de modelo, não usam Gerando nem a estrela.
- Salvar, excluir e os outros botões do sistema continuam com o carregamento que já têm. Não trocar o `isLoading` global do `Button` para Gerando.
- Com `prefers-reduced-motion`, a palavra e a estrela permanecem e o brilho não fica em loop.

### E-mail e WhatsApp
- Na exportação da avaliação e da evolução há dois botões, um com o logo do WhatsApp e outro com um símbolo de e-mail. O mesmo par aparece em cada PDF já salvo, para reenviar.
- O destino é o e-mail e o telefone que já estão no cadastro do paciente. O profissional não escolhe o contato de novo.
- Sem e-mail, o botão de e-mail não finge que enviou: explica em português que falta o e-mail. Sem telefone, o mesmo para o WhatsApp.
- O e-mail leva o PDF ao endereço do paciente pelo SMTP que o Fluxo já usa. Segredo só no Dashboard. Não criar provedor novo e não gravar senha no repositório.
- O WhatsApp abre a conversa no telefone do paciente e entrega o documento. Se a plataforma não anexar arquivo, a mensagem leva o link do PDF já salvo. Não marcar como enviado se o cliente não tiver como abrir o arquivo.
- Conta sem escrita não vê esses botões.

### Claude's Discretion
- O azul exato do glow, a duração e a curva da animação, desde que o brilho seja azul e fique só no botão que está gerando.
- Se o símbolo de e-mail é um envelope ou outra marca de correio, desde que seja reconhecível ao lado do logo do WhatsApp e não exija pacote novo.
- O texto curto que acompanha o PDF no e-mail e no WhatsApp, em português, sem dado clínico além do que já está no PDF.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Exportação e PDF
- `src/services/patientAiPdf.service.ts` — desenho do PDF de avaliação e evolução
- `src/lib/pdfFieldCatalog.ts` — catálogo do que está preenchido
- `src/components/patients/PatientAiComposer.tsx` — Gerar resumo, exportar PDF e síntese de evolução
- `src/components/patients/PatientAiFieldPicker.tsx` — seletor de campos do PDF
- `.planning/phases/13-pdf-export-avaliacao-evolucao/13-CONTEXT.md` — exportação com seletor e só campos preenchidos
- `.planning/phases/14-pdf-ficha-visual-polish/14-CONTEXT.md` — polish visual anterior do PDF

### Botão
- `src/components/ui/Button.tsx` — `isLoading` hoje troca o rótulo por spinner e Aguarde...
- `src/schemas/patientAi.schema.ts` — `ctaGenerate` e `ctaExport`

### Contato e e-mail
- `src/services/patients.service.ts` — `email` e `phone` do paciente
- `.planning/phases/15-email-fluxo-confirmacao-conta/15-CONTEXT.md` — SMTP próprio do Fluxo; segredos no Dashboard

### Fora desta fase
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` — não editar

</canonical_refs>

<specifics>
## Specific Ideas

- A palavra no botão, durante a geração, é exatamente `Gerando`.
- A estrela fica junto dessa palavra.
- O fundo do botão, nesse estado, tem animação de glow azul.
- Os dois logos ficam na exportação: WhatsApp e e-mail.
- SQL só pelo SQL Editor. Não criar `supabase/migrations`. Não rodar `supabase db push`.
- Sem pacote npm novo. Não editar `patient-ai-summary`. Não fazer push do git, salvo pedido explícito.

</specifics>

<deferred>
## Deferred Ideas

- Fechar o UAT da fase 25.
- Reabrir a formatação dos blocos da ficha na tela.
- Trocar o e-mail de confirmação de conta ou o de redefinição de senha.
- Enviar por outros canais (SMS, Instagram).

</deferred>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button` com `isLoading`: spinner e `Aguarde...`. Os botões que não chamam IA continuam assim.
- `buildEvaluationFilledCatalog` e o desenho em `patientAiPdf.service.ts` já omitem parte do que está vazio. Esta fase deixa o que sobra simples e bonito.
- O PDF exportado já é salvo e ganha URL assinada na lista do Resumo IA. O reenvio usa esse arquivo.

### Integration Points
- `PatientAiComposer`: Gerar resumo, confirmação Substituir e gerar, e a síntese de evolução antes do seletor.
- Cadastro do paciente: `email` e `phone`.

</code_context>

---

*Phase: 26-pdf-botao-gerando-envio-cliente*
*Context gathered: 2026-10-06*
