// Checklist 7.2: situação da evolução de uma sessão (rascunho × finalizada).
import type { PatientSessionRecord } from '../types/patient.ts'

export type EvolucaoSituacao = 'finalizada' | 'rascunho' | 'pendente'

export const EVOLUCAO_SITUACAO_LABEL: Record<EvolucaoSituacao, string> = {
  finalizada: 'Evolução finalizada',
  rascunho: 'Rascunho',
  pendente: 'Evolução pendente',
}

/** Sessão agendada sem evolução não tem situação; realizada sem evolução fica pendente. */
export function situacaoEvolucao(
  session: Pick<PatientSessionRecord, 'status' | 'evolution'>,
): EvolucaoSituacao | null {
  if (session.evolution) return session.evolution.finalizedAt ? 'finalizada' : 'rascunho'
  return session.status === 'realizada' ? 'pendente' : null
}

export function contarEvolucoesPendentes(
  sessions: readonly Pick<PatientSessionRecord, 'status' | 'evolution'>[],
): number {
  return sessions.filter((session) => {
    const situacao = situacaoEvolucao(session)
    return situacao === 'rascunho' || situacao === 'pendente'
  }).length
}
