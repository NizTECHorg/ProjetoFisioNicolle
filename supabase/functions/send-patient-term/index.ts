/**
 * send-patient-term — envia por e-mail ao paciente um termo assinado salvo na nuvem (Phase 37).
 * Self-contained para colar no Supabase Dashboard (Edge Functions), como o send-patient-document.
 * O destino vem de patients.email lido com o JWT de quem envia; o body só traz patientId e termId.
 * Segredos: FLUXO_SMTP_HOST, FLUXO_SMTP_PORT, FLUXO_SMTP_USER, FLUXO_SMTP_PASS, FLUXO_SMTP_FROM
 * (os mesmos do send-patient-document). Sem service role: tudo passa pelo RLS do usuário.
 */
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mesmas frases do cliente (PATIENT_AI_COPY): o app só mostra mensagens conhecidas.
const COPY = {
  needEmail: 'Este paciente não tem e-mail no cadastro. Inclua o e-mail na ficha e tente de novo.',
  fileUnavailable: 'O arquivo não ficou disponível. Exporte de novo e tente outra vez.',
  emailError: 'Não foi possível enviar o e-mail. Tente de novo em instantes.',
  emailBody: 'Segue o termo assinado da sua fisioterapia, em anexo.',
} as const

const FILE_NAMES: Record<string, string> = {
  consentimento: 'termo-consentimento.pdf',
  liberacao: 'termo-liberacao.pdf',
  uso_imagem: 'termo-uso-de-imagem.pdf',
  uso_imagem_redes: 'termo-uso-de-imagem-redes-sociais.pdf',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BYTES = 8 * 1024 * 1024

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code, message }, status)
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
): Promise<{ user: User; client: SupabaseClient } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  const client = createUserClient(authHeader)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  return { user: data.user, client }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', code: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { client } = auth

  let body: { patientId?: unknown; termId?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }
  const patientId = typeof body.patientId === 'string' ? body.patientId : ''
  const termId = typeof body.termId === 'string' ? body.termId : ''
  if (!UUID_RE.test(patientId) || !UUID_RE.test(termId)) {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }

  // RLS: só lê termo e paciente que o usuário pode ver (can_read_patient).
  const { data: term, error: termError } = await client
    .from('patient_terms')
    .select('id, patient_id, term_type, title, storage_path')
    .eq('id', termId)
    .eq('patient_id', patientId)
    .maybeSingle()
  if (termError || !term) return fail(COPY.fileUnavailable, 'term_not_found', 404)

  const { data: patient, error: patientError } = await client
    .from('patients')
    .select('id, email')
    .eq('id', patientId)
    .maybeSingle()
  if (patientError || !patient) return fail(COPY.fileUnavailable, 'patient_not_found', 404)

  const to = typeof patient.email === 'string' ? patient.email.trim() : ''
  if (!to || !EMAIL_RE.test(to)) return fail(COPY.needEmail, 'missing_email', 422)

  const storagePath = String(term.storage_path)
  const folder = storagePath.split('/')[0]?.toLowerCase() ?? ''
  if (folder !== patientId.toLowerCase()) return fail(COPY.fileUnavailable, 'bad_path', 422)

  const { data: file, error: downloadError } = await client.storage
    .from('patient-images')
    .download(storagePath)
  if (downloadError || !file) return fail(COPY.fileUnavailable, 'download_failed', 422)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    return fail(COPY.fileUnavailable, 'bad_file', 422)
  }

  const host = Deno.env.get('FLUXO_SMTP_HOST') ?? ''
  const port = Number(Deno.env.get('FLUXO_SMTP_PORT') ?? '465')
  const username = Deno.env.get('FLUXO_SMTP_USER') ?? ''
  const password = Deno.env.get('FLUXO_SMTP_PASS') ?? ''
  const from = Deno.env.get('FLUXO_SMTP_FROM') ?? ''
  if (!host || !username || !password || !from) return fail(COPY.emailError, 'smtp_not_configured', 500)

  const subject = typeof term.title === 'string' && term.title.trim() ? term.title.trim() : 'Seu termo assinado'
  const filename = FILE_NAMES[String(term.term_type)] ?? 'termo.pdf'

  // Constrói, envia e fecha no mesmo try: um erro do SMTP nunca é logado (pode conter a senha).
  let smtp: SMTPClient | null = null
  try {
    smtp = new SMTPClient({
      connection: { hostname: host, port, tls: port === 465, auth: { username, password } },
    })
    await smtp.send({
      from,
      to,
      subject,
      content: COPY.emailBody,
      attachments: [{ filename, contentType: 'application/pdf', encoding: 'binary', content: bytes }],
    })
  } catch {
    return fail(COPY.emailError, 'send_failed', 502)
  } finally {
    try {
      await smtp?.close()
    } catch {
      // ignora: o envio já terminou ou falhou
    }
  }

  return jsonResponse({ ok: true })
})
