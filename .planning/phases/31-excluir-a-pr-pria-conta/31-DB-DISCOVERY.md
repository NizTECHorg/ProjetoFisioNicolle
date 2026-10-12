# Phase 31 — Descoberta no banco vivo

Coladas pelo usuário em 2026-10-12.

## (a) FKs para auth.users / profiles / organizations (colada em 2026-10-12)

Schema `auth.*` (identities, sessions, mfa, one_time_tokens, oauth, webauthn) → `auth.users` cascade (scim_users set null). Nada a fazer.

| tabela.coluna | referência | ON DELETE | Efeito ao apagar o usuário |
|---|---|---|---|
| profiles.id | auth.users | cascade | some junto com o login |
| google_calendar_connections.user_id | auth.users | cascade | some junto |
| google_calendar_secrets.user_id | auth.users | cascade | some junto |
| google_calendar_session_links.user_id | auth.users | cascade | some junto |
| organization_memberships.profile_id | profiles | cascade | some junto |
| organization_memberships.organization_id | organizations | cascade | some com a organização |
| **patients.created_by** | auth.users | **no action** | **BLOQUEIA** — apagar ou transferir antes |
| **patient_ai_reports.created_by** | auth.users | **no action** | **BLOQUEIA** — apagar ou reatribuir antes |
| **patient_images.created_by** | profiles | **no action** | **BLOQUEIA** — apagar ou reatribuir antes |
| **autonomo_prices.owner_id** | profiles | **no action** | **BLOQUEIA** — apagar antes (charges primeiro) |
| **autonomo_session_charges.owner_id** | profiles | **no action** | **BLOQUEIA** — apagar antes |
| **board_cards.owner_id** / **board_columns.owner_id** | profiles | **no action** | **BLOQUEIA** — apagar ou reatribuir antes |
| **board_cards.organization_id** / **board_columns.organization_id** | organizations | **no action** | **BLOQUEIA** apagar organização — tratar antes |
| **organizations.owner_id** | profiles | **no action** | **BLOQUEIA** — apagar organização antes |
| patient_alerts.created_by | auth.users | set null | ok |
| patient_evaluations.created_by | auth.users | set null | ok |
| patient_evaluations.therapist_id | profiles | set null | ok (nome em texto fica) |
| patient_session_evolutions.created_by | profiles | set null | ok (created_by_name fica) |
| patient_sessions.created_by | profiles | set null | ok |
| patient_sessions.therapist_id | profiles | set null | ok (therapist_name fica) |

Conclusão: profiles some em cascata com `auth.admin.deleteUser`. Antes disso, a função SQL precisa eliminar todas as linhas **no action** que apontam para o usuário (apagar no caso autônomo/empresa; reatribuir ao dono no caso fisio de empresa: patients.created_by, patient_ai_reports.created_by, patient_images.created_by, board_* owner_id) e apagar a organização (com board_* daquela organização tratados antes).

## (b) Colunas de autoria/dono em public

| tabela | coluna | nulável |
|---|---|---|
| autonomo_prices | owner_id | NO |
| autonomo_session_charges | owner_id | NO |
| board_cards | organization_id, owner_id | YES, YES |
| board_columns | organization_id, owner_id | YES, YES |
| google_calendar_connections | user_id | NO |
| google_calendar_secrets | user_id | NO |
| google_calendar_session_links | user_id | NO |
| organization_memberships | organization_id, profile_id | NO, NO |
| organizations | owner_id | NO |
| patient_ai_reports | created_by | YES |
| patient_alerts | created_by | YES |
| patient_evaluations | created_by, therapist_id | YES, YES |
| patient_images | created_by | YES |
| patient_session_evolutions | created_by | YES |
| patient_sessions | created_by, therapist_id | YES, YES |
| patients | created_by | YES |

## (c) storage.objects por bucket

| bucket | objetos | com dono |
|---|---|---|
| patient-ai-reports | 5 | 5 |
| patient-avatars | 1 | 1 |
| patient-images | 5 | 5 |

(`account-avatars` sem objetos no momento.) Todos os objetos têm `owner` → reatribuir/remover antes de `auth.admin.deleteUser`.

## (d) Triggers nas tabelas tocadas

- autonomo_prices: autonomo_prices_set_updated_at → set_autonomo_prices_updated_at
- autonomo_session_charges: autonomo_session_charges_snapshot → snapshot_autonomo_session_charge
- board_cards: board_cards_stamp_scope → stamp_board_card_scope
- board_columns: board_columns_stamp_scope → stamp_board_column_scope
- patient_sessions: patient_images_on_session_delete, patient_sessions_check_therapist (fase 29), patient_sessions_guard_assigned_update (fase 29), patient_sessions_set_updated_at
- patients: patients_set_created_by → set_patient_created_by; patients_set_updated_at
- **profiles: profiles_protect_fields → protect_profile_fields (NÃO está no repo — pode bloquear update de account_type)**; profiles_set_updated_at

## (e) Triggers em auth.users

- on_auth_user_created → handle_new_user

## Observações para o plano

- Os gatilhos da fase 29 (`check_session_therapist`, `guard_assigned_session_update`) pulam quando `auth.uid()` é null; numa função security definer chamada pela Edge Function com service role, `auth.uid()` é null → não bloqueiam. Confirmar.
- `protect_profile_fields` (colada em 2026-10-12): só age em UPDATE quando `current_user = 'authenticated'` e trava id, email, role, is_active, created_at. **Não trava `account_type`.** Numa função security definer (current_user = postgres) não faz nada → a troca dos fisios para `autonomo` funciona.
  - ⚠ Achado de segurança fora do escopo: `account_type` não é protegido para `authenticated`. Se a policy de UPDATE em `profiles` deixar o usuário editar a própria linha, ele pode trocar o próprio tipo de conta via API. Registrar para uma fase futura.
- `handle_new_user`: cria profile; empresa → organização + membership owner/active; fisioterapeuta → membership therapist/pending. **Empresa tem membership `role = 'owner'`** — a função de exclusão deve tratar o dono também em `organization_memberships` (cascade pela organização).
- `set_patient_created_by` e `snapshot_autonomo_session_charge`: só preenchem `created_by`/`owner_id` quando nulos (auth.uid()); não interferem em update/delete feitos pela função.
- `patient_images_on_session_delete` não apareceu na consulta (não está em `public` com esse nome); na fase 28 a exclusão de sessões funcionou, então segue sem impacto conhecido.
