# Phase 22: User Setup Required

**Generated:** 2026-10-03
**Phase:** 22-resumo-paciente-ia
**Status: Incomplete**

O app não publica Edge Function e não roda `supabase db push`. As colunas do resumo e o corpo da função `patient-ai-summary` só entram no projeto hospedado pelo Dashboard.

## Environment Variables

Nenhuma variável nova.

`GEMINI_API_KEY` já está nos secrets da função se a geração das fases 11 e 13 já funcionou. Nada desta fase vai para `VITE_*`.

## Dashboard Configuration

- [ ] **Aplicar o SQL das colunas do resumo**
  - Location: Supabase Dashboard → SQL Editor
  - Set to: o conteúdo de `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql`
  - Notes: Colar **antes de rodar o app depois do plano 22-03**. A partir desse plano a ficha seleciona `ai_summary_fields` e `summary_edits`; sem as colunas o PostgREST recusa a leitura e a ficha não abre. Não usar `supabase db push`. Depois do Success, rodar as 4 checagens do rodapé do script, uma por vez, e anotar o resultado. Cada checagem prova uma coisa: (1) 2 linhas `jsonb`; (2) `23514` no `jsonb` que não é objeto; (3) 0 linhas ou `42501` na ficha de um colega; (4) `has_column_privilege` devolve `true`.

- [ ] **Publicar `patient-ai-summary` somente depois do plano 22-04**
  - Location: Supabase Dashboard → Edge Functions → patient-ai-summary
  - Set to: o corpo de `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` **já editado pelo plano 22-04**
  - Notes: Este item **não** é executado ao terminar o plano 22-02. A fonte ainda não foi editada, e publicar agora publicaria a função antiga. Quem publica é o operador no UAT do plano 22-07. **Não publicar antes do plano 22-04. Não publicar `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`. Ignorar `supabase/functions/patient-ai-summary/index.ts`, que é gitignorado e está defasado com o catálogo antigo de 30 chaves. Não usar `supabase functions deploy`.**

- [ ] **Conferir a fonte publicada**
  - Location: Supabase Dashboard → Edge Functions → patient-ai-summary (editor do Dashboard, depois da publicação do plano 22-07)
  - Set to: o mesmo corpo publicado no item anterior
  - Notes: No editor do Dashboard, confirmar que o corpo publicado contém as 7 chaves de saída (`summary`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, `painLimitations`, `focusRegionKeys`), as 42 chaves de foco, e que **não** contém `priorAiSummary` nem `programProgress` no trecho do modo resumo. Se este passo for pulado, o resumo atualiza e os outros cinco cards ficam em `—`, porque a função antiga só devolve `summary`.

## Verification

1. Aplicar o SQL no SQL Editor e rodar as 4 checagens do rodapé do script.
2. Publicar a função (fonte da fase 13 já editada pelo plano 22-04) no UAT do plano 22-07 e conferir no Dashboard as 7 chaves de saída e as 42 chaves de foco.
3. Gerar em um paciente com avaliação e evoluções reais: os 6 textos aparecem, as regiões do boneco ficam marcadas, e não surge EVA nem meta que não esteja no prontuário.
4. Gerar em um paciente quase vazio: `summary` diz que o contexto é insuficiente, os demais cards ficam em `—` e nenhuma região fica marcada.
5. Editar na aba Resumo e confirmar que a aba Resumo IA segue com o original; recarregar a página mantém a edição.
6. Gerar de novo e confirmar a confirmação `Gerar de novo?`; depois disso as edições ficam zeradas e o original é o novo.
7. Abrir a ficha de um colega como conta empresa e confirmar a ausência de lápis e de composer; um `UPDATE` direto é recusado.
8. Conferir em viewport móvel que o modal rola e o lápis tem ao menos 44 px.

Conferência da pergunta 3 da pesquisa, já resolvida: `select count(*) from patient_pain_logs;`. O plano 22-05 só mostra o gráfico de EVA quando há série, e esta contagem no UAT diz se ele aparece.

---

**Quando todos os itens estiverem feitos:** marcar `Status: Complete` no topo deste arquivo.
