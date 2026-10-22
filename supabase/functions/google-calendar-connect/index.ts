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
