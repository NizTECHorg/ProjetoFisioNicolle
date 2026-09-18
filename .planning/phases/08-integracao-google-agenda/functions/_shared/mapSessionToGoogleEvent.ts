/** D-08 allow-list mapper — mirrors src/services/googleCalendar.mapper.ts */

export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000

const TIME_ZONE = 'America/Sao_Paulo'

export interface CalendarSessionLike {
  id: string
  patientName: string
  patientCode: string
  scheduledAt: string
  type: string
  place: string
  status: string
}

export interface GoogleCalendarEventBody {
  summary: string
  location?: string
  description: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

/**
 * D-08 allow-list only: patient name, code, type, place, and status.
 * Clinical note fields are never included in the Google event body.
 */
export function mapSessionToGoogleEvent(session: CalendarSessionLike): GoogleCalendarEventBody {
  const start = new Date(session.scheduledAt)
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS)

  const place = session.place.trim()
  const location = place === '' || place === '—' ? undefined : place

  const description = [
    session.patientCode.trim() ? `Código: ${session.patientCode.trim()}` : null,
    `Status: ${session.status}`,
    'Origem: agenda Fisio (exportação)',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    summary: `${session.patientName} · ${session.type}`,
    ...(location !== undefined ? { location } : {}),
    description,
    start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
  }
}
