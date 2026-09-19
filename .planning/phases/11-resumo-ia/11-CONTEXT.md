# Phase 11 — Resumo IA

**Source:** User request via `/gsd-plan-phase` (2026-09-19)  
**Status:** Locked for planning (discuss-phase skipped — intent explicit)

## Problem

A “avaliação com IA” hoje está espalhada / mal posicionada: import de PDF físico vive sob a aba **Avaliação**, enquanto **Resumo IA** no Resumo é só display de `ai_summary`. O profissional quer um hub claro: **Resumo IA** com **uma caixa** para (A) gerar o resumo clínico com contexto completo e (B) exportar PDFs (geral ou por sessão), com histórico salvo na própria aba.

## Locked Decisions

### D-01 — Aba = Resumo IA
O rótulo da aba da ficha que hoje é o hub de IA/avaliação passa a **Resumo IA**. Avaliação estruturada (REQ-05 / `patient_evaluations`) **não some**: fica como fluxo secundário acessível a partir desta aba ou mantida como subseção “Avaliação estruturada”, sem competir pelo nome da aba. Planner confirma UX mínima sem redesenhar a ficha inteira.

### D-02 — Uma caixa, dois modos
Um único input/composer na aba com seletor de modo:
1. **Escrever resumo (IA)** — gera/atualiza texto do Resumo do paciente  
2. **Exportar avaliação (PDF)** — gera PDF geral **ou** por sessão escolhida  

Sem dois formulários paralelos competindo.

### D-03 — Contexto máximo no modo resumo
Ao gerar resumo, o backend/serviço monta um pacote com tudo disponível do paciente: identidade (nome, idade/nascimento, código), cadastro/queixa/diagnóstico, programa, EVA, metas, **áreas de foco** (e pode **marcar/atualizar** áreas quando a IA retornar regiões), evoluções **por sessão** (estado, condutas, resposta, plano), avaliações estruturadas existentes, notas relevantes. Objetivo: máximo de contexto clínico seguro (sem inventar dados ausentes).

### D-04 — Destino do resumo
O texto gerado grava na área **Resumo do paciente** / campo `ai_summary` (e campos satélite só se o retorno estruturado da IA for explícito — ex. focus areas). Exibir o resultado também no Resumo (aba Resumo) após salvar.

### D-05 — PDFs salvos na aba
Modo export produz PDF:
- **Geral** — avaliação/estado atual do paciente  
- **Por sessão** — sessão escolhida na UI  

Lista **Avaliações salvas**: tipo (geral | sessão), data de geração, e se sessão → identificação da sessão (data/hora ou label). Download/reabrir a partir da lista. Persistência: Storage + tabela de metadados (não só `localStorage`).

### D-06 — Segurança e permissões
- Chave do modelo **não** no bundle Vite se evitável (preferir Edge Function / server); se brownfield `VITE_GEMINI_*` existir, RESEARCH recomenda migração.
- RLS: leitura alinhada a ficha; escrita/gerar/excluir só com `can_write_patient`.
- Copy de erro em português.

### D-07 — Fora de escopo
- Substituir REQ-05 avaliação estruturada completa  
- Google Agenda / Phase 8–10  
- Redesign de marca  
- Import PDF de avaliação física pode permanecer como caminho legado nesta fase ou ser encaixado como ação secundária — não bloquear D-02

## Success Criteria (from ROADMAP)

1. Aba **Resumo IA**  
2. Input unificado resumo | export  
3. Resumo com contexto completo → Resumo do paciente (+ focus areas quando aplicável)  
4. PDF geral/sessão + lista Avaliações salvas  
5. Consulta-only sem gerar/excluir  

## Requirements

- REQ-23

## Notes for researcher / planner

- Inventariar: `PatientEvaluationPanel`, `PatientPhysicalEvaluationPanel`, `aiPhysicalEvaluation.service.ts`, `ai_summary`, tabs em `PatientProfileHeader`.
- Decidir schema: `patient_ai_reports` (kind, session_id nullable, storage_path, created_at) + bucket.
- PDF: lib já no repo vs nova (preferir o que já existe / Deno EF).
- UI-SPEC: composer + lista salvos; português.
