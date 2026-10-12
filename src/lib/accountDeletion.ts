export const ACCOUNT_DELETE_WORD = 'EXCLUIR'

export type AccountDeletionKind = 'autonomo' | 'empresa' | 'fisio_empresa'

export function isAccountDeleteWordMatch(typed: string): boolean {
  return typed.trim() === ACCOUNT_DELETE_WORD
}

export function canSubmitAccountDeletion(typed: string, password: string): boolean {
  return isAccountDeleteWordMatch(typed) && password.length > 0
}

export function accountDeletionKind(
  accountType: 'autonomo' | 'empresa' | 'fisioterapeuta' | null | undefined,
  membership:
    | { role: 'owner' | 'therapist'; status: 'pending' | 'active' | 'rejected' }
    | null
    | undefined,
): AccountDeletionKind {
  if (accountType === 'empresa') return 'empresa'
  if (
    accountType === 'fisioterapeuta' &&
    membership?.role === 'therapist' &&
    membership.status === 'active'
  ) {
    return 'fisio_empresa'
  }
  return 'autonomo'
}

const NOTE = 'Eventos já enviados ao Google Agenda continuam lá.'

export function accountDeletionCopy(
  kind: AccountDeletionKind,
  patientCount: number | null,
): { title: string; description: string; items: string[]; note: string } {
  const title = 'Excluir minha conta?'
  const description = 'Esta ação é definitiva e não pode ser desfeita.'

  if (kind === 'empresa') {
    const patients =
      patientCount === null
        ? 'Todos os pacientes da empresa, os seus e os dos fisios da equipe, com tudo deles.'
        : `${patientCount} ${patientCount === 1 ? 'paciente' : 'pacientes'} da empresa, os seus e os dos fisios da equipe, com tudo deles.`
    return {
      title,
      description,
      items: [
        'Seu login e seu perfil.',
        patients,
        'A empresa, o quadro da empresa e todos os vínculos da equipe.',
        'Os fisios mantêm o login, mas perdem o vínculo e passam a usar a conta como autônomos.',
        'A conexão com o Google Agenda.',
        'Sua foto e os arquivos guardados.',
      ],
      note: NOTE,
    }
  }

  if (kind === 'fisio_empresa') {
    return {
      title,
      description,
      items: [
        'Seu login, seu perfil e sua foto.',
        'Os pacientes que você cadastrou ficam com a empresa, com todo o histórico.',
        'Sessões anexadas a você ficam sem fisio. Seu nome continua nos registros clínicos.',
        'Seu quadro e a conexão com o Google Agenda.',
      ],
      note: NOTE,
    }
  }

  return {
    title,
    description,
    items: [
      'Seu login e seu perfil.',
      'Todos os seus pacientes e tudo deles: sessões, avaliações, evoluções, metas, imagens, PDFs e relatórios da IA.',
      'Preços, cobranças e financeiro.',
      'Seu quadro e a conexão com o Google Agenda.',
      'Sua foto e os arquivos guardados.',
    ],
    note: NOTE,
  }
}

export const ACCOUNT_DELETION_ERRORS = {
  invalidPassword: 'Senha incorreta.',
  rateLimited: 'Muitas tentativas. Aguarde e tente novamente mais tarde.',
  generic: 'Não foi possível excluir a conta. Tente de novo em instantes.',
} as const

export function accountDeletionErrorMessage(
  code: string | undefined,
  status: number | undefined,
): string {
  if (code === 'invalid_password') return ACCOUNT_DELETION_ERRORS.invalidPassword
  if (code === 'rate_limited' || status === 429) return ACCOUNT_DELETION_ERRORS.rateLimited
  return ACCOUNT_DELETION_ERRORS.generic
}
