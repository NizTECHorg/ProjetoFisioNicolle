---
phase: 17
slug: isolamento-de-dados-por-conta
status: draft
threats_open: 1
asvs_level: 1
block_on: high
created: 2026-09-23
---

# Phase 17 — Security

> Contrato de segurança da fase: registro de ameaças, riscos aceitos e trilha de auditoria.
> O SQL está no arquivo do repositório. Este auditor não provou o script no banco hospedado. Ausência de `db push` não reabre uma mitigação que o arquivo contém.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser com anon key → PostgREST | JWT `authenticated` cruza para `board_columns`, `board_cards` e `patients` | Quadro e ficha clínica |
| Cliente → INSERT do quadro | `owner_id`, `organization_id`, `column_id` e `patient_id` são entrada não confiável | Escopo da linha e vínculo com paciente |
| React Query no mesmo separador | Cache sem uid sobrevive ao `signOut` e pinta a tela sem nova leitura no Postgres | Quadro, pacientes, sessões e prazos já carregados |
| SQL Editor → papel padrão | O papel do Editor ignora RLS até `set local role authenticated` | Prova comentada; não é política |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-17-01 | Information disclosure | board_columns / board_cards IDOR | mitigate | Drop de toda política nas duas tabelas, oito políticas, ramo pessoal e ramo empresa, `FORCE ROW LEVEL SECURITY` | closed |
| T-17-02 | Information disclosure | patients_select created_by nulo | mitigate | `patients_select` recriada sem o OR de dono nulo; `can_read_patient` não é reescrita | closed |
| T-17-03 | Tampering | owner_id forjado no insert | mitigate | Triggers carimbam o escopo; `WITH CHECK` repete o predicado; o cliente manda `user.id` e não manda `organization_id` | closed |
| T-17-04 | Information disclosure | board_cards.patient_id de outra conta | mitigate | `WITH CHECK` de insert e update exige `can_read_patient` e o mesmo escopo da coluna pai | closed |
| T-17-05 | Elevation of privilege | Filtro só na UI | mitigate | A parede declarada é `pg_policies`. A tela pinta o cache da conta anterior sem essa parede | open |
| T-17-06 | Tampering | user_metadata / auth.jwt() | mitigate | Políticas usam `auth.uid()`, `viewer_org_id()` e `organization_memberships`; o id do cliente vem de `getUser()` | closed |
| T-17-07 | Repudiation | Laudo clínico inventado | mitigate | Sem chave, throw em português; hidratação descarta o digest `d7513069ba374c9f`; a frase saiu de `src` | closed |
| T-17-SC | Tampering | npm/pip/cargo | accept | Nenhum pacote novo. Risco aceito no plano | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Evidência

| Threat ID | Onde | O que foi encontrado | Onde vive |
|-----------|------|----------------------|-----------|
| T-17-01 | `sql/17-account-isolation.sql` | Loop em `pg_policies` (linhas 61–74) derruba as políticas de `board_columns` e `board_cards`. `force row level security` nas linhas 77 e 79. Ramo pessoal `organization_id is null and owner_id = (select auth.uid())` e ramo empresa `organization_id is not null and organization_id = (select private.viewer_org_id())` nas oito políticas (`board_columns_select` na linha 157 até `board_cards_delete` na linha 362). | Só no arquivo. Banco hospedado não provado. |
| T-17-02 | `sql/17-account-isolation.sql` | `drop policy if exists patients_select` (linha 390) e `create policy patients_select` (linhas 392–407) com `created_by = (select auth.uid())` e `private.can_read_patient(id)`. Não há `created_by is null` nem `create or replace function private.can_read_patient`. Dono nulo não entra no `USING`. | Só no arquivo. Banco hospedado não provado. |
| T-17-03 | `sql/17-account-isolation.sql`, `src/services/board.service.ts` | `stamp_board_column_scope` grava `auth.uid()` no INSERT e restaura `OLD` no UPDATE (linhas 98–103). `stamp_board_card_scope` copia `owner_id` e `organization_id` da coluna pai (linhas 119–129). `WITH CHECK` de coluna e card repete o predicado de escopo. `createColumn` e `createCard` usam `requireUserId()` (`supabase.auth.getUser()`, linhas 54–58) e enviam `owner_id` (linhas 123–127 e 147–155). Os inserts não incluem `organization_id`. | SQL só no arquivo. Cliente está no código. |
| T-17-04 | `sql/17-account-isolation.sql` | `board_cards_insert` e `board_cards_update` (linhas 299–309 e 349–359): `patient_id is null or private.can_read_patient(patient_id)` e `exists` da coluna pai com `owner_id` e `organization_id` `is not distinct from`. | Só no arquivo. Banco hospedado não provado. |
| T-17-05 | `src/services/board.service.ts`, `src/services/patients.service.ts`, `src/hooks/useClinic.ts`, `src/hooks/usePatients.ts`, `src/providers/AuthProvider.tsx`, `src/main.tsx`, `src/pages/KanbanPage.tsx` | `listBoard`, `listDueCards` e `listPatients` não filtram por dono. A parede de banco não chega à tela: `useBoard` usa `queryKey: ['board']` (useClinic.ts:55) sem uid; `usePatients` usa `['patients']` com `staleTime: 60_000` (usePatients.ts:73–75); `useDueCards` usa `['board-dues', fromDate, toDate]` (useClinic.ts:103). `signOut` (AuthProvider.tsx:78–83) não chama `queryClient.clear()`. `main.tsx` fixa `staleTime: 60_000` e `refetchOnWindowFocus: false`. `KanbanPage` pinta `data` de `useBoard()`. No mesmo separador, a conta seguinte recebe o cache fresco por até 60s sem nova leitura no Postgres. | Gap no código do app. |
| T-17-06 | `sql/17-account-isolation.sql`, `src/services/board.service.ts` | O SQL não contém `user_metadata` nem `auth.jwt()`. As políticas citam `auth.uid()`, `private.viewer_org_id()` e `organization_memberships`. `requireUserId` lê `data.user.id` de `supabase.auth.getUser()`. `board.service.ts` não lê `user_metadata`. | SQL só no arquivo. Cliente está no código. |
| T-17-07 | `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `src/pages/KanbanPage.tsx` | Sem `VITE_GEMINI_API_KEY`, o serviço lança `A análise do PDF precisa da chave da IA. Sem ela, nenhum laudo é gerado.` (aiPhysicalEvaluation.service.ts:138–140) e não devolve texto inventado. `readStoredEvaluations` descarta o item cujo FNV-1a 64 de `cinesiologicDiagnosis` é `d7513069ba374c9f` (PatientPhysicalEvaluationPanel.tsx:22 e 43–48). A frase `Disfunção cinesiológica` não aparece em `src`. Quadro vazio mostra `Nenhuma lista ainda.` (KanbanPage.tsx:132–133) e não aponta para `supabase/board.sql`. | No código. |
| T-17-SC | Accepted Risks Log | Disposição `accept` no plano. Nenhum pacote novo foi exigido pelos planos 17-01, 17-02 e 17-03. | Documentado abaixo. |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-17-SC | T-17-SC | Cadeia de suprimentos npm/pip/cargo. A fase não adiciona pacote. O risco de dependências já presentes fica aceito, não como mitigação ausente. | Plano 17-01 / 17-02 / 17-03 (`disposition: accept`) | 2026-09-23 |

*Riscos aceitos não reaparecem como mitigação faltante em auditorias futuras desta fase.*

---

## Unregistered Flags

Nenhuma. `17-01-SUMMARY.md`, `17-02-SUMMARY.md` e `17-03-SUMMARY.md` não têm seção `## Threat Flags`.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-23 | 8 | 7 | 1 | gsd-security-auditor |

### Security Audit 2026-09-23

| Metric | Count |
|--------|-------|
| Threats found | 8 |
| Closed | 7 |
| Open | 1 |

T-17-05 permanece aberta: os selects não filtram dono no cliente, como o plano pediu, mas o cache do React Query mostra quadro, pacientes e prazos da conta anterior sem consultar o Postgres. ASVS nível 1. `block_on: high`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [ ] `threats_open: 0` confirmed
- [ ] `status: verified` set in frontmatter

**Approval:** pending
