import { z } from 'zod'

/** Copy UI-SPEC / D-03 — exportação, nunca sync bidirecional como capacidade. */
export const GOOGLE_CALENDAR_COPY = {
  connectCta: 'Conectar Google',
  reconnectCta: 'Reconectar Google',
  exportCta: 'Exportar mês',
  disconnectCta: 'Desconectar Google',
  stripHeading: 'Google Calendar',
  noticeDisconnected:
    'Esta integração só exporta sessões da Agenda para o Google. Eventos do Google não entram na Agenda da clínica.',
  noticeConnected: 'Exportação para o Google — não é sincronização bidirecional.',
  connectedAs: 'Conectado como',
  monthScopePrefix: 'Exporta as sessões do mês visível:',
  connectSuccess: 'Google conectado',
  disconnectSuccess: 'Google desconectado',
  exportSuccess: 'Sessões exportadas para o Google',
  exportPartial: 'Algumas sessões foram exportadas. Verifique o Google Calendar.',
  exportEmpty: 'Nenhuma sessão neste mês para exportar.',
  exportEmptyBody: 'Agende uma sessão na Agenda ou mude o mês visível.',
  exportError: 'Não foi possível exportar para o Google. Tente de novo ou reconecte a conta.',
  tokenExpired: 'Sua conexão com o Google expirou. Reconecte para continuar exportando.',
  misconfigured:
    'A integração Google no servidor está incompleta. Confira GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas Edge Functions (mesmo cliente do Auth).',
  networkError: 'Não foi possível falar com o Google. Tente de novo em instantes.',
  vaultMissing: 'Não foi possível guardar a conexão. Reconecte o Google e autorize novamente.',
  loadConnectionFail:
    'Não foi possível verificar a conexão com o Google. Tente de novo em instantes.',
  disconnectTitle: 'Desconectar Google',
  disconnectDescription:
    'A exportação para o Google Calendar será desligada nesta conta. Sessões já enviadas permanecem no Google.',
  disconnectConfirm: 'Desconectar Google',
  disconnectCancel: 'Voltar',
} as const

export const exportMonthSchema = z.object({
  fromIso: z.string().min(1),
  toIso: z.string().min(1),
  sessionIds: z.array(z.string().uuid()).optional(),
})

export type ExportMonthInput = z.infer<typeof exportMonthSchema>
