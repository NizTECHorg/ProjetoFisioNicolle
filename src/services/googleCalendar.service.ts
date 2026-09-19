import { supabase } from '@/lib/supabase/client'
import { mapAuthError, mapDbError, mapGoogleCalendarError } from '@/lib/security'
import {
  exportMonthSchema,
  GOOGLE_CALENDAR_COPY,
  type ExportMonthInput,
} from '@/schemas/googleCalendar.schema'
import type {
  GoogleCalendarConnection,
  GoogleCalendarExportErrorCode,
  GoogleCalendarExportResult,
} from '@/types/googleCalendar'

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned'

interface ConnectionRow {
  google_email: string | null
  connected_at: string
}

interface FunctionsErrorBody {
  error?: string
  code?: string
  message?: string
}

interface ExportResponseBody {
  exportedCount?: number
  failedCount?: number
  error?: string
  code?: string
}

function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

function googleEmailFromUser(user: {
  email?: string | null
  identities?: Array<{
    provider?: string
    identity_data?: Record<string, unknown> | null
  }> | null
}): string | undefined {
  const googleIdentity = user.identities?.find((identity) => identity.provider === 'google')
  const fromIdentity = googleIdentity?.identity_data?.email
  if (typeof fromIdentity === 'string' && fromIdentity.trim()) {
    return fromIdentity.trim().toLowerCase()
  }
  if (typeof user.email === 'string' && user.email.trim()) {
    return user.email.trim().toLowerCase()
  }
  return undefined
}

async function readFunctionsErrorPayload(
  error: { context?: unknown; message?: string } | null,
  data: unknown,
): Promise<{ status?: number; code?: string; message?: string }> {
  if (data && typeof data === 'object') {
    const body = data as FunctionsErrorBody
    return {
      code: typeof body.code === 'string' ? body.code : undefined,
      message:
        typeof body.message === 'string'
          ? body.message
          : typeof body.error === 'string'
            ? body.error
            : undefined,
    }
  }

  const context = error?.context
  if (context && typeof context === 'object' && 'status' in context) {
    const response = context as Response
    const status = response.status
    try {
      const body = (await response.clone().json()) as FunctionsErrorBody
      return {
        status,
        code: typeof body.code === 'string' ? body.code : undefined,
        message:
          typeof body.message === 'string'
            ? body.message
            : typeof body.error === 'string'
              ? body.error
              : error?.message,
      }
    } catch {
      return { status, message: error?.message }
    }
  }

  return { message: error?.message }
}

function throwMappedFunctionsError(payload: {
  status?: number
  code?: string
  message?: string
}): never {
  const mapped = mapGoogleCalendarError(payload)
  const err = new Error(mapped) as Error & { code?: GoogleCalendarExportErrorCode }
  if (
    payload.status === 401 ||
    payload.status === 403 ||
    payload.code === 'needs_reconnect' ||
    mapped === GOOGLE_CALENDAR_COPY.tokenExpired
  ) {
    err.code = 'needs_reconnect'
  }
  throw err
}

export async function getGoogleCalendarConnection(): Promise<GoogleCalendarConnection | null> {
  const { data, error } = await supabase
    .from('google_calendar_connections')
    .select('google_email, connected_at')
    .maybeSingle()

  throwIfError(error)
  if (!data) return null

  const row = data as ConnectionRow
  return {
    googleEmail: row.google_email,
    connectedAt: row.connected_at,
  }
}

export async function linkGoogleCalendar(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/agenda`,
      scopes: GOOGLE_CALENDAR_SCOPE,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }
}

export async function vaultGoogleTokensIfPresent(): Promise<'vaulted' | 'skipped'> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    throw new Error(mapAuthError(sessionError))
  }

  const session = sessionData.session
  const refreshToken = session?.provider_refresh_token
  const accessToken = session?.provider_token

  if (!refreshToken) {
    if (accessToken) {
      throw new Error(GOOGLE_CALENDAR_COPY.vaultMissing)
    }
    return 'skipped'
  }

  const googleEmail = session.user ? googleEmailFromUser(session.user) : undefined

  const { data, error } = await supabase.functions.invoke('google-calendar-connect', {
    body: {
      refreshToken,
      accessToken: accessToken ?? undefined,
      googleEmail,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    if (payload.code === 'vault_missing' || payload.message === 'vault_missing') {
      throw new Error(GOOGLE_CALENDAR_COPY.vaultMissing)
    }
    throwMappedFunctionsError(payload)
  }

  const body = data as FunctionsErrorBody | null
  if (body && (body.code === 'vault_missing' || body.error === 'vault_missing')) {
    throw new Error(GOOGLE_CALENDAR_COPY.vaultMissing)
  }

  return 'vaulted'
}

export async function exportVisibleMonth(
  input: ExportMonthInput,
): Promise<GoogleCalendarExportResult> {
  const parsed = exportMonthSchema.parse(input)

  const { data, error } = await supabase.functions.invoke('google-calendar-export', {
    body: {
      fromIso: parsed.fromIso,
      toIso: parsed.toIso,
      sessionIds: parsed.sessionIds,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throwMappedFunctionsError(payload)
  }

  const body = (data ?? {}) as ExportResponseBody
  if (body.code === 'needs_reconnect' || body.error === 'needs_reconnect') {
    throwMappedFunctionsError({
      status: 401,
      code: 'needs_reconnect',
      message: 'needs_reconnect',
    })
  }

  const exportedCount = Number(body.exportedCount ?? 0)
  const failedCount = Number(body.failedCount ?? 0)

  let code: GoogleCalendarExportErrorCode | undefined
  if (exportedCount === 0 && failedCount === 0) {
    code = 'empty_month'
  } else if (failedCount > 0 && exportedCount > 0) {
    code = 'partial'
  } else if (failedCount > 0 && exportedCount === 0) {
    code = 'unknown'
  }

  return { exportedCount, failedCount, code }
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('google-calendar-disconnect', {
    body: {},
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throwMappedFunctionsError(payload)
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return
  }

  const googleIdentity = userData.user.identities?.find(
    (identity) => identity.provider === 'google',
  )
  if (!googleIdentity) {
    return
  }

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity)
  if (unlinkError) {
    // Pitfall 4: secrets already deleted — disconnect succeeds even if unlink fails
  }
}
