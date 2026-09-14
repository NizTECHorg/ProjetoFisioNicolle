/**
 * Predicados de UX para tipo de conta e ficha (REQ-15).
 * Não são autorização: RLS (plano 03-02) é a autoridade (ASVS 4.1.1 / T-03-01).
 * Não importar permissions.ts da confeitaria.
 */

import {
  accountTypeLabels,
  type AccountType,
  type MembershipStatus,
} from '@/types/account'

/** Trim, remove espaços internos e uppercase — Zod e RPC de código (D-01). */
export function normalizeJoinCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase()
}

/** Equipe só para conta Empresa. Autônomo e fisioterapeuta não gerenciam time. */
export function canManageTeam(accountType: AccountType | null | undefined): boolean {
  return accountType === 'empresa'
}

/** Financeiro só para conta Autônomo. Empresa e fisio não veem (D-01). UX only. */
export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}

/**
 * Escrita na ficha só de quem cadastrou (D-05, D-07).
 * Empresa pode consultar, mas não altera ficha de colega.
 */
export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}

/** Fisio com pedido pendente: cadastro ok, clínica bloqueada (D-03). */
export function isPendingTherapist(
  accountType: AccountType | null | undefined,
  membershipStatus: MembershipStatus | null | undefined,
): boolean {
  return accountType === 'fisioterapeuta' && membershipStatus === 'pending'
}

/** Recusa cancela a conta (D-04). Pendente sem decisão não é recusado. */
export function isRejectedAccount(
  isActive: boolean | null | undefined,
  membershipStatus: MembershipStatus | null | undefined,
): boolean {
  return isActive === false && membershipStatus === 'rejected'
}

export function accountTypeLabel(type: AccountType | null | undefined): string {
  if (!type) return ''
  return accountTypeLabels[type]
}
