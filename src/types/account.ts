/**
 * Contratos de conta da clínica (REQ-15).
 * Única casa para AccountType / membership — não estender EmployeeRole
 * em database.types.ts nem importar permissions.ts da confeitaria.
 * Contas já existentes: tratar como autonomo até haver migração.
 */

/** Tipo escolhido no cadastro — não reutilizar `profiles.role` da confeitaria. */
export type AccountType = 'autonomo' | 'empresa' | 'fisioterapeuta'

/** Pedido de entrada na equipe (D-02 / D-03 / D-04). */
export type MembershipStatus = 'pending' | 'active' | 'rejected'

/** Papel na organização: dono da empresa ou fisioterapeuta alocado. */
export type MembershipRole = 'owner' | 'therapist'

export const accountTypeLabels: Record<AccountType, string> = {
  autonomo: 'Autônomo',
  empresa: 'Empresa',
  fisioterapeuta: 'Fisioterapeuta',
}

export const membershipStatusLabels: Record<MembershipStatus, string> = {
  pending: 'Pendente',
  active: 'Na equipe',
  rejected: 'Recusado',
}

/** Clínica representada por uma conta Empresa (uma pessoa + código copiável). */
export interface Organization {
  id: string
  ownerId: string
  name: string
  joinCode: string
}

/** Linha da tela Equipe: perfil + vínculo de membership. */
export interface TeamMember {
  id: string
  profileId: string
  fullName: string
  email: string
  status: MembershipStatus
  role: MembershipRole
}

/** Vínculo persistido em `organization_memberships`. */
export interface Membership {
  id: string
  organizationId: string
  profileId: string
  role: MembershipRole
  status: MembershipStatus
}

/**
 * Perfil da clínica no app. `role` é leftover da confeitaria e não serve
 * para gating — use `accountType` (D-01) e membership para Equipe / ficha.
 */
export interface ClinicProfile {
  id: string
  fullName: string
  email: string
  role: string
  avatarUrl: string | null
  isActive: boolean
  accountType: AccountType
  createdAt: string
  updatedAt: string
}
