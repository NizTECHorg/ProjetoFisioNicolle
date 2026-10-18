# Relatório Detalhado de Alterações — 17/10/2026 a 18/10/2026

Este documento detalha todas as alterações de código, banco de dados (Supabase) e Edge Functions realizadas nesta sessão de trabalho no projeto **ProjetoFisioNicolle**.

---

## Resumo de Commits e Deploys

| Commit | Data/Hora | Descrição Resumida |
| :--- | :--- | :--- |
| `0c9050a` | 17/10/2026 23:18 | Campos obrigatórios na Sessão + limpeza Markdown/auto-resize na IA de áudio + Peso e Altura na Avaliação + correção 400 Bad Request em `patient-ai-summary` |
| `65f2553` | 17/10/2026 23:25 | Botão `"X"` na Agenda para excluir sessão do dia com modal de confirmação |
| `36e8b89` | 17/10/2026 23:43 | Sincronização automática de todos os dados da Avaliação para Dados Cadastrais do paciente |
| `4e4e3d0` | 17/10/2026 23:57 | Campos Contato e Data lado a lado no Bloco A, unidade `"horas"` em Atividades Afetadas e divisão de Atividade Física em 3 campos |
| `e5b4a3c` | 18/10/2026 00:11 | Seletor de Ficha de Avaliação no Resumo por IA, resumo clínico detalhado e preenchimento automático de Dor e Limitações, Plano, Evolução e Condutas |

**Deploys e Banco de Dados em Produção (`xxwbtcqgohayekbhcwwl`):**
- **Edge Function `patient-ai-summary`:** Deploy realizado no projeto Supabase de produção (`xxwbtcqgohayekbhcwwl`).
- **Tabela `public.patients`:** Adicionadas as colunas `naturalidade`, `estado_civil`, `peso`, `altura`, `endereco_residencial` e `endereco_profissional`, com backfill automático das avaliações já existentes.

---

## 1. Evolução da Sessão por Áudio (IA), Campos Obrigatórios e Correção do Erro 400 (`0c9050a`)

### 1.1. Limpeza de Markdown e Auto-expansão dos Campos de Evolução
- **Problema:** Quando a evolução da sessão era preenchida por voz com IA, o texto podia conter marcações Markdown (`**`, `*`, `#`, `` ` ``) e os campos de texto tinham altura fixa.
- **Solução:**
  - Adicionada função `stripMarkdown()` com expressões regulares para remover formatação Markdown antes de distribuir o texto nos campos (`Estado do paciente`, `Condutas realizadas`, `Mudanças desde a última sessão`, `Resposta ao tratamento`, `Intercorrências`, `Plano para próxima sessão`).
  - Implementado ajuste automático de altura (`scrollHeight`) em todos os `<Textarea>` do formulário de sessão conforme o texto é digitado ou inserido pela IA.

### 1.2. Flexibilização de Campos Obrigatórios na Sessão e Avisos Visuais
- **Problema:** Ao gravar evolução com IA ou salvar uma sessão rapidamente, o formulário exigia `Estado do paciente` e `Condutas realizadas` como obrigatórios, bloqueando o salvamento caso a IA não preenchesse 100% dos campos.
- **Solução:**
  - Mantidos como **únicos campos obrigatórios** da sessão:
    1. **Data** (`scheduledDate`)
    2. **Horário** (`scheduledTime`)
    3. **Tipo da sessão** (`type`)
    4. **Profissional responsável** (`therapistId`)
  - Adicionado aviso visual no topo do formulário indicando claramente os campos obrigatórios (`*`) e que todos os demais campos (local, evolução e dor) são opcionais.
  - Ajustada a validação em `patientSessionWithEvolutionSchema` para aceitar evolução parcial e salvar normalmente mesmo quando apenas alguns campos da evolução forem preenchidos.

### 1.3. Correção do `400 Bad Request` em Produção na Edge Function `patient-ai-summary`
- **Causa:** A Edge Function em produção no projeto `xxwbtcqgohayekbhcwwl` estava em uma versão anterior que não reconhecia `mode: 'audio-evolucao'` e exigia `patientId` obrigatório sem aceitá-lo quando vazio.
- **Solução:**
  - Passado `patientId` em `generateSessionEvolutionFromAudio` (`src/services/ai.service.ts`).
  - Atualizada e publicada a Edge Function `patient-ai-summary` no projeto `xxwbtcqgohayekbhcwwl` com suporte a `mode: 'audio-evolucao'`.

### 1.4. Inclusão de Peso e Altura na Avaliação
- Adicionados os campos **Peso (kg)** (`ficha.anamnese.identificacao.peso`) e **Altura (m ou cm)** (`ficha.anamnese.identificacao.altura`) no Bloco A de Identificação da Avaliação, no detalhe da ficha, no catálogo de campos PDF e na geração do PDF.

**Arquivos alterados:**
- `src/components/patients/PatientSessionEditorForm.tsx`
- `src/schemas/patient.schema.ts`
- `src/services/ai.service.ts`
- `src/schemas/evaluationFicha.schema.ts`
- `src/components/patients/evaluation/EvaluationPage01.tsx`
- `src/components/patients/evaluation/EvaluationFichaDetail.tsx`
- `src/lib/pdfFieldCatalog.ts`
- `src/services/patientAiPdf.service.ts`

---

## 2. Exclusão de Sessão na Agenda com Confirmação (`65f2553`)

- **Objetivo:** Permitir excluir diretamente uma sessão da lista do dia na página **Agenda** (`/agenda`) clicando em um botão `"X"`, exibindo uma tela de confirmação antes de excluir.
- **Implementação:**
  - Criado o hook `useDeleteSession()` em `src/hooks/useClinic.ts` utilizando `deletePatientSession`, invalidando automaticamente os caches da agenda (`clinicKeys.all`) e do paciente (`patientKeys.all`).
  - Adicionado botão `"X"` no canto superior direito de cada card de sessão do dia em `src/pages/CalendarPage.tsx`.
  - Ao clicar no `"X"`, abre o modal `ConfirmDialog` com a mensagem **"Tem certeza que deseja excluir essa agenda?"** e os botões **"Cancelar"** e **"Sim, excluir"**.

**Arquivos alterados:**
- `src/hooks/useClinic.ts`
- `src/pages/CalendarPage.tsx`

---

## 3. Sincronização Automática da Avaliação para Dados Cadastrais (`36e8b89`)

- **Objetivo:** Ao finalizar/salvar uma Avaliação, transferir automaticamente todos os dados preenchidos do paciente na Avaliação para a aba **Dados Cadastrais**.
- **Implementação:**
  - **Banco de Dados (`public.patients`):** Criadas as colunas `naturalidade`, `estado_civil`, `peso`, `altura`, `endereco_residencial` e `endereco_profissional` no Supabase e executado backfill das avaliações já salvas.
  - **Sincronização no Salvamento (`src/services/evaluations.service.ts`):** Criada a função `syncEvaluationToPatientCadastro(patientId, ficha, therapistName)` executada automaticamente em `createPatientEvaluation` e `updatePatientEvaluation`.
  - **Campos sincronizados da Avaliação para Dados Cadastrais:**
    - Nome completo (`full_name`)
    - Data de nascimento (`birth_date` — aceita `AAAA-MM-DD` e `DD/MM/AAAA`)
    - Naturalidade (`naturalidade`)
    - Gênero (`gender` — mapeia masculino/feminino/outro)
    - Estado civil (`estado_civil`)
    - Profissão / ocupação (`profession`)
    - Peso (`peso`) e Altura (`altura`)
    - Endereço residencial (`endereco_residencial`) e Endereço profissional (`endereco_profissional`)
    - Telefone e E-mail extraídos de `Contato` (`phone`, `email`)
    - Data de início (`treatment_started_on` a partir da data da avaliação, caso vazio)
    - Queixa principal (`complaint`), Diagnóstico fisioterapêutico (`diagnosis`), Frequência (`frequency`) e Fisioterapeuta responsável (`therapist_name`)
  - **Pré-preenchimento reverso (`PatientEvaluationEditorForm.tsx` e `PatientEvaluationPanel.tsx`):** Ao abrir uma nova avaliação, todos os campos do Bloco A já vêm preenchidos com os Dados Cadastrais atuais do paciente.
  - **Exibição e Edição (`PatientCadastroPanel.tsx`):** Todos os novos campos foram adicionados tanto na visualização quanto no formulário de edição de Dados Cadastrais.

**Arquivos alterados:**
- `src/services/evaluations.service.ts`
- `src/services/patients.service.ts`
- `src/types/patient.ts`
- `src/schemas/patient.schema.ts`
- `src/components/patients/PatientCadastroPanel.tsx`
- `src/components/patients/PatientEvaluationEditorForm.tsx`
- `src/components/patients/PatientEvaluationPanel.tsx`

---

## 4. Ajustes de Layout e Campos na Avaliação (`4e4e3d0`)

### 4.1. Bloco A (Identificação) — Contato e Data Lado a Lado
- Em `src/components/patients/evaluation/EvaluationPage01.tsx`, os campos **Contato / Número** e **Data da avaliação (na ficha)** foram transformados em `LineField` compactos e movidos para dentro da grade de 2 colunas (`grid gap-4 sm:grid-cols-2`), ocupando metade da linha cada um, igual aos demais campos pequenos.

### 4.2. Bloco B (Função → Atividades Afetadas) — Unidade `"horas"`
- Adicionada a unidade **`horas`** ao catálogo `UNIDADES` (`['minutos', 'horas', 'km', 'repeticoes']`) em `src/lib/atividadeCapacidade.ts`, ao schema `medidaLadoSchema` em `src/schemas/evaluationFicha.schema.ts` e aos seletores de unidade de **Capacidade atual** e **Quanto conseguia antes** em `src/components/patients/evaluation/EvaluationPage03.tsx`.

### 4.3. Bloco C (Função → Rotina e Demanda) — Atividade Física em 3 Campos
- Substituído o campo único `"Qual / frequência"` por 3 campos independentes lado a lado (`grid gap-4 sm:grid-cols-3`) quando `"Pratica atividade física?"` está marcado como `"Sim"`:
  1. **Qual atividade** (`ficha.funcao.rotina.atividadeQual`)
  2. **Frequência** (`ficha.funcao.rotina.atividadeFrequencia`) — `<Select>` com opções: `1x na semana`, `2x na semana`, `3x na semana`, `4x na semana`, `5x na semana`, `6x na semana`, `Todos os dias da semana`
  3. **Quantas horas por dia** (`ficha.funcao.rotina.atividadeHorasDia`)
- Criada a função `formatAtividadeFisica()` em `src/lib/atividadeCapacidade.ts` que monta automaticamente a frase final (ex.: *"Faz tênis todos os dias 2 horas por dia"*), sincronizando com `ficha.funcao.rotina.atividadeQualFreq` e exibindo na tela de avaliação, nos detalhes da ficha e no PDF.

**Arquivos alterados:**
- `src/components/patients/evaluation/EvaluationPage01.tsx`
- `src/components/patients/evaluation/EvaluationPage03.tsx`
- `src/components/patients/evaluation/EvaluationFichaDetail.tsx`
- `src/lib/atividadeCapacidade.ts`
- `src/lib/pdfFieldCatalog.ts`
- `src/schemas/evaluationFicha.schema.ts`
- `src/services/patientAiPdf.service.ts`

---

## 5. Resumo por IA: Seleção de Ficha, Detalhamento e Preenchimento de Todos os Campos (`e5b4a3c`)

### 5.1. Escolha de Qual Ficha de Avaliação Resumir
- Na aba **Resumo IA → Escrever resumo (IA)** (`src/components/patients/PatientAiComposer.tsx`), foi adicionado o seletor **"Ficha de avaliação para resumir"**, permitindo escolher:
  - `Todas as fichas de avaliação (contexto completo)`
  - `Mais recente`
  - Qualquer ficha de avaliação específica salva do paciente
- O `evaluationId` selecionado é enviado para a Edge Function `patient-ai-summary`, que filtra/prioriza os dados da ficha escolhida.

### 5.2. Resumo Mais Detalhado e Leitura Completa da `ficha` JSONB
- Ampliados os limites de caracteres em `src/lib/patientSummary.ts`:
  - `summary`: de `1500` para **`3000` caracteres**
  - `painLimitations`, `treatmentPlan`, `evolution`, `conducts`: de `500` para **`1000` caracteres**
  - `nextSessionPlan`: de `400` para **`800` caracteres**
- Na Edge Function `supabase/functions/patient-ai-summary/index.ts`, foi implementada a função `extractFichaClinicalFields(ficha)` que extrai todos os blocos estruturados da avaliação (`anamnese`, `sintomas`, `funcao`, `avaliacaoPlano`, `mapaSintomas`) e envia ao modelo Gemini com instruções para produzir um resumo clínico detalhado em múltiplos parágrafos sem formatação Markdown.

### 5.3. Preenchimento de Dor e Limitações, Plano de Tratamento, Evolução, Condutas e Próxima Sessão
- **Causa raiz corrigida:** A Edge Function `patient-ai-summary` estava retornando apenas `{ summary, focusRegionKeys }` e não extraía o JSONB `ficha` de `patient_evaluations`.
- **Correção:**
  - `parseGeminiJson` e `buildPrompt` agora solicitam e extraem as 7 chaves (`summary`, `painLimitations`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, `focusRegionKeys`).
  - Adicionado fallback determinístico `buildSummaryFallbacks(pack)` na Edge Function para garantir que, mesmo que a IA omita algum campo secundário, os cartões **Dor e limitações**, **Plano de tratamento**, **Evolução geral**, **Condutas** e **Plano próxima sessão** sejam preenchidos a partir dos dados da ficha de avaliação e das sessões.
  - Em `src/services/evaluations.service.ts` (`toRow`), os dados estruturados da `ficha` também passaram a ser espelhados nas colunas texto de `patient_evaluations` ao salvar.

**Arquivos alterados:**
- `src/components/patients/PatientAiComposer.tsx`
- `src/lib/patientSummary.ts`
- `src/lib/patientSummary.test.ts`
- `src/schemas/patientAi.schema.ts`
- `src/services/evaluations.service.ts`
- `src/services/patientAi.service.ts`
- `supabase/functions/patient-ai-summary/index.ts`
