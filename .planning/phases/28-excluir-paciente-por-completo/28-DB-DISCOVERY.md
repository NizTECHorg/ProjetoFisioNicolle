# Phase 28 — Descoberta no banco vivo (passo 0)

## Consulta 3 — papel e FORCE RLS (colada em 2026-10-10)

- `current_user`: `postgres`
- `rolbypassrls`: **true** → a função `security definer` criada pelo SQL Editor (dono `postgres`) ignora RLS, inclusive com FORCE RLS. A4 confirmada; o ramo (d) do 28-04 não dispara.
- Tabelas com FORCE RLS: autonomo_prices, autonomo_session_charges, patient_ai_reports, patient_images, profiles, board_columns, board_cards, patients, patient_goals, patient_alerts, patient_sessions, patient_session_evolutions, google_calendar_connections, patient_focus_areas, patient_pain_logs, google_calendar_session_links, google_calendar_secrets

## Consulta 1 — FKs para patients / patient_sessions / patient_evaluations

_pendente_

## Consulta 2 — colunas patient_id / session_id / evaluation_id

_pendente_
