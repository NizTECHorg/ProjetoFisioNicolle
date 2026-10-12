# Phase 28 — Descoberta no banco vivo (passo 0)

## Consulta 3 — papel e FORCE RLS (colada em 2026-10-10)

- `current_user`: `postgres`
- `rolbypassrls`: **true** → a função `security definer` criada pelo SQL Editor (dono `postgres`) ignora RLS, inclusive com FORCE RLS. A4 confirmada; o ramo (d) do 28-04 não dispara.
- Tabelas com FORCE RLS: autonomo_prices, autonomo_session_charges, patient_ai_reports, patient_images, profiles, board_columns, board_cards, patients, patient_goals, patient_alerts, patient_sessions, patient_session_evolutions, google_calendar_connections, patient_focus_areas, patient_pain_logs, google_calendar_session_links, google_calendar_secrets

## Consulta 1 — FKs para patients / patient_sessions / patient_evaluations (colada em 2026-10-10)

| Tabela | FK | Referência | ON DELETE |
|---|---|---|---|
| patient_sessions | patient_sessions_patient_id_fkey | patients | cascade |
| patient_session_evolutions | ..._patient_id_fkey | patients | cascade |
| patient_session_evolutions | ..._session_id_fkey | patient_sessions | cascade |
| patient_alerts | patient_alerts_patient_id_fkey | patients | cascade |
| patient_goals | patient_goals_patient_id_fkey | patients | cascade |
| patient_focus_areas | patient_focus_areas_patient_id_fkey | patients | cascade |
| patient_pain_logs | patient_pain_logs_patient_id_fkey | patients | cascade |
| patient_evaluations | patient_evaluations_patient_id_fkey | patients | cascade |
| patient_images | ..._patient_id_fkey | patients | cascade |
| patient_images | ..._session_id_fkey | patient_sessions | set null |
| patient_ai_reports | ..._patient_id_fkey | patients | cascade |
| patient_ai_reports | ..._session_id_fkey | patient_sessions | set null |
| autonomo_session_charges | ..._session_id_fkey | patient_sessions | cascade |
| google_calendar_session_links | ..._session_id_fkey | patient_sessions | cascade |
| board_cards | board_cards_patient_id_fkey | patients | **set null** |

Nenhuma FK aponta para `patient_evaluations`. Nenhuma FK `restrict`/`no action`.

## Consulta 2 — colunas patient_id / session_id / evaluation_id (colada em 2026-10-10)

Mesmas 12 tabelas da consulta 1, sem coluna órfã (sem FK) e sem `evaluation_id`:
autonomo_session_charges(session_id), board_cards(patient_id), google_calendar_session_links(session_id), patient_ai_reports(patient_id, session_id), patient_alerts, patient_evaluations, patient_focus_areas, patient_goals, patient_images(patient_id, session_id), patient_pain_logs(patient_id), patient_session_evolutions(patient_id, session_id), patient_sessions(patient_id).

## Conclusão para 28-04

- **Nenhuma tabela extra.** As 12 tabelas são exatamente as que `delete_patient_full` já apaga no plano 28-01; nenhum `delete` a acrescentar.
- `patient_pain_logs` tem `patient_id` (resolve a dúvida da pesquisa).
- **`board_cards` é `set null`**: sem o `delete` explícito, os cards ficariam no quadro sem paciente. O `delete from public.board_cards where patient_id = ...` do plano é obrigatório (decisão A2).
- Todo o resto já cascateia; os `delete` explícitos continuam por clareza e para não depender do schema vivo.
- Sem `restrict`: nenhum erro 23503 esperado na exclusão.
- `rolbypassrls = true`: a função como `postgres` apaga mesmo com FORCE RLS.
