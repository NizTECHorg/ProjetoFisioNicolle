import type { CalendarSession } from '@/services/calendar.service'

export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000

const TIME_ZONE = 'America/Sao_Paulo'

export interface GoogleCalendarEventBody {
  summary: string
  location?: string
  description: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

/**
 * D-08 allow-list only: patient name, type, place, and status.
 * Clinical note fields are never included in the Google event body.
 * Patient code is not shown in product UI and is omitted from export.
 */
export function mapSessionToGoogleEvent(session: CalendarSession): GoogleCalendarEventBody {
  const start = new Date(session.scheduledAt)
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS)

  const place = session.place.trim()
  const location = place === '' || place === '—' ? undefined : place

  const description = [`Status: ${session.status}`, 'Origem: agenda Fisio (exportação)'].join('\n')

  return {
    summary: `${session.patientName} · ${session.type}`,
    ...(location !== undefined ? { location } : {}),
    description,
    start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
  }
}
