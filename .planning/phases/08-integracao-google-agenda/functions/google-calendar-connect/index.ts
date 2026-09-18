import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { createServiceClient, requireUser } from '../_shared/supabaseClients.ts'

interface ConnectBody {
  refreshToken?: string
  accessToken?: string
  googleEmail?: string
  expiresAt?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user } = auth

  let body: ConnectBody
  try {
    body = (await req.json()) as ConnectBody
  } catch {
    return jsonResponse({ error: 'vault_missing', code: 'vault_missing' }, 400)
  }

  const refreshToken =
    typeof body.refreshToken === 'string' ? body.refreshToken.trim() : ''
  if (!refreshToken) {
    return jsonResponse({ error: 'vault_missing', code: 'vault_missing' }, 400)
  }

  const accessToken =
    typeof body.accessToken === 'string' && body.accessToken.trim()
      ? body.accessToken.trim()
      : null
  const expiresAt =
    typeof body.expiresAt === 'string' && body.expiresAt.trim()
      ? body.expiresAt.trim()
      : null
  const googleEmail =
    typeof body.googleEmail === 'string' && body.googleEmail.trim()
      ? body.googleEmail.trim().toLowerCase()
      : null

  const admin = createServiceClient()
  const now = new Date().toISOString()

  const { error: secretsError } = await admin.from('google_calendar_secrets').upsert(
    {
      user_id: user.id,
      refresh_token: refreshToken,
      access_token: accessToken,
      access_token_expires_at: expiresAt,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )

  if (secretsError) {
    return jsonResponse({ error: 'vault_missing', code: 'vault_missing' }, 400)
  }

  const { error: connError } = await admin.from('google_calendar_connections').upsert(
    {
      user_id: user.id,
      google_email: googleEmail,
      connected_at: now,
    },
    { onConflict: 'user_id' },
  )

  if (connError) {
    return jsonResponse({ error: 'vault_missing', code: 'vault_missing' }, 400)
  }

  // Never include refreshToken / accessToken in the response body (REQ-20.3).
  return new Response(
    JSON.stringify({
      ok: true,
      connectedAt: now,
      googleEmail,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})
