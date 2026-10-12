# Phase 29: Fisio anexado na sessão da agenda - Context

**Gathered:** 2026-10-10
**Source:** pedido direto do profissional + respostas às perguntas.

## Decisões
- Só conta empresa anexa fisio na Nova sessão da agenda; opções = membros therapist ativos da equipe.
- Sessão com fisio anexado: visível só para o fisio anexado e para a empresa (o criador do paciente continua vendo; no fluxo da agenda ele é a própria empresa).
- Fisio anexado lê a ficha do paciente (somente leitura) enquanto tiver sessão anexada.
- Fisio anexado muda só o status da sessão (confirmada, realizada, faltou...).
- Banco recusa anexar quem não é fisio ativo da equipe (`therapist_not_in_team`).

## Implementação
- App: `CalendarPage` (campo Fisioterapeuta, nome na lista do dia), `calendar.service` (therapist_name), erros mapeados em `mapDbError`.
- SQL: `sql/29-session-therapist-access.sql` — `can_read_patient_base`, `is_assigned_therapist`, `can_read_patient` estendido, `can_read_session`, policy `patient_sessions_select` nova, policy `patient_sessions_update_assigned`, gatilhos `check_session_therapist` e `guard_assigned_session_update`.

## Limites conhecidos
- Na ficha, um fisio de equipe que tentar marcar um colega como profissional da sessão agora recebe "Escolha um fisioterapeuta ativo da sua equipe." (só a empresa anexa outro fisio).
- O fisio anexado vê na lista de pacientes os pacientes das sessões anexadas a ele, em modo leitura.
