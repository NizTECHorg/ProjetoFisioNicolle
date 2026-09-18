/**
 * Contratos da integração Google Calendar (REQ-20).
 * Metadados de conexão apenas — sem refresh/access tokens (D-04, REQ-20.3).
 */

export interface GoogleCalendarConnection {
  googleEmail: string | null
  connectedAt: string
}

export type GoogleCalendarExportErrorCode =
  | 'needs_reconnect'
  | 'network'
  | 'empty_month'
  | 'partial'
  | 'permission'
  | 'unknown'

export interface GoogleCalendarExportResult {
  exportedCount: number
  failedCount: number
  code?: GoogleCalendarExportErrorCode
}
