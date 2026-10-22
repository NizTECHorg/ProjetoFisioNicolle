import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PATIENT_BUCKETS = ['patient-avatars', 'patient-images', 'patient-ai-reports'] as const
const ACCOUNT_BUCKET = 'account-avatars'

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

// Cliente anon efêmero, sem Authorization, só para conferir a senha.
function createProbeClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(url, anon, {
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

async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    })
  } catch {
    /* best effort */
  }
}

function isRateLimited(error: { status?: number; code?: string } | null): boolean {
  return error?.status === 429 || error?.code === 'over_request_rate_limit'
}

async function purgeFolder(admin: SupabaseClient, bucket: string, folder: string): Promise<void> {
  for (let guard = 0; guard < 200; guard++) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset: 0 })
    if (error) throw new Error('storage_list_failed')
    const paths = (data ?? [])
      .filter((entry) => entry.id !== null)
      .map((entry) => `${folder}/${entry.name}`)
    if (paths.length === 0) return
    const { error: removeError } = await admin.storage.from(bucket).remove(paths)
    if (removeError) throw new Error('storage_remove_failed')
  }
  throw new Error('storage_purge_incomplete')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user } = auth

  const body = await req.json().catch(() => null)
  const confirm = body?.confirm
  const password = body?.password
  if (
    confirm !== 'EXCLUIR' ||
    typeof password !== 'string' ||
    password.length === 0 ||
    !user.email
  ) {
    return jsonResponse({ error: 'invalid_request', code: 'invalid_request' }, 400)
  }

  const probe = createProbeClient()
  const { error: pwError } = await probe.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (isRateLimited(pwError)) {
    return jsonResponse({ error: 'rate_limited', code: 'rate_limited' }, 429)
  }
  if (pwError) {
    return jsonResponse({ error: 'invalid_password', code: 'invalid_password' }, 401)
  }
  await probe.auth.signOut({ scope: 'local' }).catch(() => {})

  const admin = createServiceClient()

  // Ler antes da RPC: ela apaga a linha.
  let refreshToken: string | null = null
  try {
    const { data: secretRow } = await admin
      .from('google_calendar_secrets')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle()
    refreshToken = secretRow?.refresh_token ?? null
  } catch {
    /* ignorado */
  }

  const { data: result, error: rpcError } = await admin.rpc('delete_account_data', {
    p_user_id: user.id,
  })
  if (rpcError) {
    console.error('delete-account rpc failed', user.id)
    return jsonResponse({ error: 'delete_failed', code: 'delete_failed' }, 500)
  }
  const rawIds = (result as { patient_ids?: unknown } | null)?.patient_ids
  const patientIds: string[] = Array.isArray(rawIds)
    ? rawIds.filter((id): id is string => typeof id === 'string')
    : []

  if (refreshToken) {
    await revokeGoogleToken(refreshToken)
  }

  try {
    for (const id of patientIds) {
      for (const bucket of PATIENT_BUCKETS) {
        await purgeFolder(admin, bucket, id)
      }
    }
    await purgeFolder(admin, ACCOUNT_BUCKET, user.id)
  } catch {
    return jsonResponse({ error: 'storage_failed', code: 'storage_failed' }, 500)
  }

  const { error: delError } = await admin.auth.admin.deleteUser(user.id)
  if (delError) {
    console.error('delete-account deleteUser failed', user.id)
    return jsonResponse({ error: 'delete_failed', code: 'delete_failed' }, 500)
  }

  try {
    await admin.rpc('finish_account_deletion', { p_user_id: user.id })
  } catch {
    /* tombstone só tem UUIDs */
  }

  return jsonResponse({ ok: true }, 200)
})
