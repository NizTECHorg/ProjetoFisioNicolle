import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function optionsResponse(): Response {
  return new Response('ok', { headers: corsHeaders })
}

function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function createUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function requireUser(
  req: Request,
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  const userClient = createUserClient(authHeader)
  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  return { user: data.user, authHeader }
}

interface ResolvedGoogleToken {
  accessToken: string
  expiresIn?: number
  fromRefresh: boolean
}

type TokenResolveError = { error: 'needs_reconnect' | 'misconfigured' }

interface SecretRow {
  refresh_token: string
  access_token: string | null
  access_token_expires_at: string | null
  updated_at: string | null
}

function accessTokenStillValid(row: SecretRow): string | null {
  const token = row.access_token?.trim()
  if (!token) return null

  const expiresAt = row.access_token_expires_at
    ? Date.parse(row.access_token_expires_at)
    : NaN
  if (Number.isFinite(expiresAt)) {
    // 60s skew — prefer refresh near expiry
    return expiresAt > Date.now() + 60_000 ? token : null
  }

  // Vault often stores access_token without expires_at; treat recent vault as fresh (~50 min).
  const updatedAt = row.updated_at ? Date.parse(row.updated_at) : NaN
  if (Number.isFinite(updatedAt) && Date.now() - updatedAt < 50 * 60 * 1000) {
    return token
  }

  return null
}

async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<ResolvedGoogleToken | TokenResolveError> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return { error: 'misconfigured' }
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  let json: {
    access_token?: string
    expires_in?: number
    error?: string
  } = {}
  try {
    json = (await res.json()) as typeof json
  } catch {
    json = {}
  }

  if (!res.ok) {
    const googleError = (json.error ?? '').toLowerCase()
    if (
      googleError === 'invalid_client' ||
      googleError === 'unauthorized_client' ||
      res.status === 401
    ) {
      // Wrong Function secrets vs Auth Web client — not "user reconnect"
      return { error: 'misconfigured' }
    }
    return { error: 'needs_reconnect' }
  }

  if (!json.access_token) {
    return { error: 'needs_reconnect' }
  }

  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
    fromRefresh: true,
  }
}

async function resolveGoogleAccessToken(
  row: SecretRow,
): Promise<ResolvedGoogleToken | TokenResolveError> {
  const cached = accessTokenStillValid(row)
  if (cached) {
    return { accessToken: cached, fromRefresh: false }
  }

  return refreshGoogleAccessToken(row.refresh_token)
}

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000
const TIME_ZONE = 'America/Sao_Paulo'

interface CalendarSessionLike {
  id: string
  patientName: string
  patientCode: string
  scheduledAt: string
  type: string
  place: string
  status: string
}

interface GoogleCalendarEventBody {
  summary: string
  location?: string
  description: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

function mapSessionToGoogleEvent(session: CalendarSessionLike): GoogleCalendarEventBody {
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
    .select('refresh_token, access_token, access_token_expires_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (secretError || !secretRow?.refresh_token) {
    return jsonResponse({ error: 'needs_reconnect', code: 'needs_reconnect' }, 401)
  }

  const resolved = await resolveGoogleAccessToken(secretRow as SecretRow)
  if ('error' in resolved) {
    const status = resolved.error === 'misconfigured' ? 500 : 401
    const code = resolved.error === 'misconfigured' ? 'misconfigured' : 'needs_reconnect'
    return jsonResponse({ error: code, code }, status)
  }

  const accessToken = resolved.accessToken

  // Persist refreshed access token for subsequent exports within the hour.
  if (resolved.fromRefresh) {
    const expiresAt = new Date(
      Date.now() + (resolved.expiresIn ?? 3600) * 1000,
    ).toISOString()
    await admin
      .from('google_calendar_secrets')
      .update({
        access_token: accessToken,
        access_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  }

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
  let calendarMisconfigured = false
  let insufficientScope = false

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

      async function classifyGoogleFail(res: Response): Promise<'auth' | 'config' | 'scope' | 'other'> {
        if (res.status === 401) return 'auth'
        if (res.status !== 403) return 'other'
        try {
          const body = (await res.clone().json()) as {
            error?: { status?: string; message?: string; errors?: Array<{ reason?: string }> }
          }
          const reason = body.error?.errors?.[0]?.reason?.toLowerCase() ?? ''
          const msg = (body.error?.message ?? '').toLowerCase()
          const status = (body.error?.status ?? '').toLowerCase()
          if (
            reason === 'insufficientpermissions' ||
            msg.includes('insufficient permission') ||
            msg.includes('authentication scopes') ||
            msg.includes('request had insufficient')
          ) {
            return 'scope'
          }
          if (
            reason === 'accessnotconfigured' ||
            reason === 'access_not_configured' ||
            msg.includes('has not been used') ||
            msg.includes('disabled') ||
            (status === 'permission_denied' && msg.includes('api'))
          ) {
            return 'config'
          }
        } catch {
          // ignore parse errors
        }
        return 'auth'
      }

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
          const kind = await classifyGoogleFail(patchRes)
          if (kind === 'config') calendarMisconfigured = true
          else if (kind === 'scope') insufficientScope = true
          else hardAuthFail = true
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
          const kind = await classifyGoogleFail(insertRes)
          if (kind === 'config') calendarMisconfigured = true
          else if (kind === 'scope') insufficientScope = true
          else hardAuthFail = true
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

  if (calendarMisconfigured) {
    return jsonResponse({ error: 'misconfigured', code: 'misconfigured' }, 500)
  }

  if (insufficientScope) {
    return jsonResponse({ error: 'insufficient_scope', code: 'insufficient_scope' }, 403)
  }

  if (hardAuthFail) {
    return jsonResponse({ error: 'needs_reconnect', code: 'needs_reconnect' }, 401)
  }

  return new Response(JSON.stringify({ exportedCount, failedCount }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
