import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { refreshGoogleAccessToken } from '../_shared/googleToken.ts'
import { mapSessionToGoogleEvent } from '../_shared/mapSessionToGoogleEvent.ts'
import {
  createServiceClient,
  createUserClient,
  requireUser,
} from '../_shared/supabaseClients.ts'

const CALENDAR_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

interface ExportBody {
  fromIso?: string
  toIso?: string
}

type SessionRow = {
  id: string
  scheduled_at: string | null
  session_type: string | null
  place: string | null
  status: string
  patients:
    | { full_name: string; code: string }
    | { full_name: string; code: string }[]
    | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, authHeader } = auth

  let body: ExportBody
  try {
    body = (await req.json()) as ExportBody
  } catch {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }

  const fromIso = typeof body.fromIso === 'string' ? body.fromIso.trim() : ''
  const toIso = typeof body.toIso === 'string' ? body.toIso.trim() : ''
  if (!fromIso || !toIso) {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }

  const admin = createServiceClient()
  const { data: secretRow, error: secretError } = await admin
    .from('google_calendar_secrets')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (secretError || !secretRow?.refresh_token) {
    return jsonResponse({ error: 'needs_reconnect', code: 'needs_reconnect' }, 401)
  }

  const refreshed = await refreshGoogleAccessToken(secretRow.refresh_token)
  if ('error' in refreshed) {
    const status = refreshed.error === 'misconfigured' ? 500 : 401
    const code = refreshed.error === 'misconfigured' ? 'misconfigured' : 'needs_reconnect'
    return jsonResponse({ error: code, code }, status)
  }

  const accessToken = refreshed.accessToken

  // patient_sessions SELECT via caller JWT so RLS remains the authority (T-08-09 / D-07).
  const userClient = createUserClient(authHeader)
  const { data: sessionRows, error: sessionsError } = await userClient
    .from('patient_sessions')
    .select('id, scheduled_at, session_type, place, status, patients(full_name, code)')
    .gte('scheduled_at', fromIso)
    .lt('scheduled_at', toIso)
    .order('scheduled_at', { ascending: true })

  if (sessionsError) {
    return jsonResponse({ error: 'unknown', code: 'unknown' }, 500)
  }

  const rows = (sessionRows ?? []) as SessionRow[]
  const withTime = rows.filter((row) => row.scheduled_at)

  // Empty month: return counts without inventing Google calls.
  if (withTime.length === 0) {
    return new Response(JSON.stringify({ exportedCount: 0, failedCount: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: linkRows } = await userClient
    .from('google_calendar_session_links')
    .select('session_id, google_event_id')
    .eq('user_id', user.id)
    .in(
      'session_id',
      withTime.map((r) => r.id),
    )

  const linkBySession = new Map<string, string>(
    (linkRows ?? []).map((l: { session_id: string; google_event_id: string }) => [
      l.session_id,
      l.google_event_id,
    ]),
  )

  let exportedCount = 0
  let failedCount = 0
  let hardAuthFail = false

  for (const row of withTime) {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients
    const event = mapSessionToGoogleEvent({
      id: row.id,
      patientName: patient?.full_name ?? 'Paciente',
      patientCode: patient?.code ?? '',
      scheduledAt: row.scheduled_at as string,
      type: row.session_type ?? 'Sessão',
      place: row.place ?? '—',
      status: row.status,
    })

    const existingEventId = linkBySession.get(row.id)
    try {
      let googleEventId: string | null = null

      if (existingEventId) {
        const patchRes = await fetch(`${CALENDAR_EVENTS_URL}/${encodeURIComponent(existingEventId)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        })
        if (patchRes.status === 401 || patchRes.status === 403) {
          hardAuthFail = true
          break
        }
        if (!patchRes.ok) {
          failedCount += 1
          continue
        }
        const patched = (await patchRes.json()) as { id?: string }
        googleEventId = patched.id ?? existingEventId
      } else {
        const insertRes = await fetch(CALENDAR_EVENTS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        })
        if (insertRes.status === 401 || insertRes.status === 403) {
          hardAuthFail = true
          break
        }
        if (!insertRes.ok) {
          failedCount += 1
          continue
        }
        const created = (await insertRes.json()) as { id?: string }
        if (!created.id) {
          failedCount += 1
          continue
        }
        googleEventId = created.id
      }

      const { error: linkError } = await userClient.from('google_calendar_session_links').upsert(
        {
          user_id: user.id,
          session_id: row.id,
          google_event_id: googleEventId,
          calendar_id: 'primary',
        },
        { onConflict: 'user_id,session_id' },
      )

      if (linkError) {
        failedCount += 1
        continue
      }

      exportedCount += 1
    } catch {
      failedCount += 1
    }
  }

  if (hardAuthFail) {
    return jsonResponse({ error: 'needs_reconnect', code: 'needs_reconnect' }, 401)
  }

  // Never return tokens.
  return new Response(JSON.stringify({ exportedCount, failedCount }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
