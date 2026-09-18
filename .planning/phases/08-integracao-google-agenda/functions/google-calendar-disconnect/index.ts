import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { revokeGoogleToken } from '../_shared/googleToken.ts'
import { createServiceClient, requireUser } from '../_shared/supabaseClients.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user } = auth

  const admin = createServiceClient()

  const { data: secretRow } = await admin
    .from('google_calendar_secrets')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (secretRow?.refresh_token) {
    await revokeGoogleToken(secretRow.refresh_token)
  }

  // Delete vault + metadata so refresh cannot be reused (T-08-12 / REQ-20.3).
  await admin.from('google_calendar_secrets').delete().eq('user_id', user.id)
  await admin.from('google_calendar_connections').delete().eq('user_id', user.id)
  await admin.from('google_calendar_session_links').delete().eq('user_id', user.id)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
