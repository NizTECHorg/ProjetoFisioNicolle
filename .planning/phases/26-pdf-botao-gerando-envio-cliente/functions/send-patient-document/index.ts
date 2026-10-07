/**
 * send-patient-document — self-contained for Supabase Dashboard paste.
 * Destination is patients.email for the JWT user. Extra JSON fields are ignored.
 * Secrets: FLUXO_SMTP_HOST, FLUXO_SMTP_PORT, FLUXO_SMTP_USER, FLUXO_SMTP_PASS, FLUXO_SMTP_FROM.
 * Do not configure the Send Email Hook. Do not deploy from this repo.
 */
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const REPORT_BUCKET = 'patient-ai-reports'
const NEED_EMAIL =
  'Este paciente não tem e-mail no cadastro. Inclua o e-mail na ficha e tente de novo.'
const FILE_UNAVAILABLE = 'O arquivo não ficou disponível. Exporte de novo e tente outra vez.'
const SEND_FAILED = 'Não foi possível enviar o e-mail. Tente de novo em instantes.'
const SUBJECT_AVALIACAO = 'Sua avaliação'
const SUBJECT_EVOLUCAO = 'Sua evolução'
const EMAIL_BODY = 'Segue o documento da sua fisioterapia, em anexo.'
const USABLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function optionsResponse(): Response {
  return new Response('ok', { headers: corsHeaders })
}

function portugueseError(message: string, status: number): Response {
  return jsonResponse({ error: message, message }, status)
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

function usablePatientEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed === '—') return null
  if (!USABLE_EMAIL.test(trimmed)) return null
  return trimmed
}

type SmtpConfig = {
  hostname: string
  port: number
  username: string
  password: string
  from: string
}

function readSmtpConfig(): SmtpConfig | null {
  const hostname = Deno.env.get('FLUXO_SMTP_HOST')?.trim() ?? ''
  const portRaw = Deno.env.get('FLUXO_SMTP_PORT')?.trim() ?? ''
  const username = Deno.env.get('FLUXO_SMTP_USER')?.trim() ?? ''
  const password = Deno.env.get('FLUXO_SMTP_PASS')?.trim() ?? ''
  const from = Deno.env.get('FLUXO_SMTP_FROM')?.trim() ?? ''
  const port = Number(portRaw)
  if (
    !hostname ||
    !portRaw ||
    !Number.isInteger(port) ||
    port <= 0 ||
    !username ||
    !password ||
    !from
  ) {
    return null
  }
  return { hostname, port, username, password, from }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', code: 'method_not_allowed' }, 405)
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, authHeader } = auth

  let body: { patientId?: unknown; reportId?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }

  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : ''
  const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : ''
  if (!UUID_RE.test(patientId) || !UUID_RE.test(reportId)) {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }

  const userClient = createUserClient(authHeader)
  const { data: patientData, error: patientError } = await userClient
    .from('patients')
    .select('email, created_by')
    .eq('id', patientId)
    .maybeSingle()

  const patient = patientData as { email: string | null; created_by: string | null } | null
  if (patientError || !patient || patient.created_by !== user.id) {
    return jsonResponse({ error: 'forbidden', code: 'forbidden' }, 403)
  }

  const to = usablePatientEmail(patient.email)
  if (!to) {
    return portugueseError(NEED_EMAIL, 400)
  }

  const { data: reportData, error: reportError } = await userClient
    .from('patient_ai_reports')
    .select('id, patient_id, kind, storage_path')
    .eq('id', reportId)
    .eq('patient_id', patientId)
    .maybeSingle()

  const report = reportData as {
    id: string
    patient_id: string
    kind: string
    storage_path: string
  } | null
  if (reportError || !report) {
    return jsonResponse({ error: 'forbidden', code: 'forbidden' }, 403)
  }
  if (report.kind !== 'avaliacao' && report.kind !== 'evolucao') {
    return jsonResponse({ error: 'invalid_kind', code: 'invalid_kind' }, 400)
  }
  if (!report.storage_path) {
    return portugueseError(FILE_UNAVAILABLE, 404)
  }
  const folder = report.storage_path.split('/')[0]?.toLowerCase() ?? ''
  if (folder !== patientId.toLowerCase()) {
    return portugueseError(FILE_UNAVAILABLE, 404)
  }

  const { data: file, error: downloadError } = await userClient.storage
    .from(REPORT_BUCKET)
    .download(report.storage_path)

  if (downloadError || !file) {
    return portugueseError(FILE_UNAVAILABLE, 404)
  }

  const pdfBytes = new Uint8Array(await file.arrayBuffer())
  if (pdfBytes.byteLength === 0) {
    return portugueseError(FILE_UNAVAILABLE, 404)
  }

  const smtpConfig = readSmtpConfig()
  if (!smtpConfig) {
    return portugueseError(SEND_FAILED, 500)
  }

  const filename = report.kind === 'evolucao' ? 'evolucao.pdf' : 'avaliacao.pdf'
  const subject = report.kind === 'evolucao' ? SUBJECT_EVOLUCAO : SUBJECT_AVALIACAO
  let smtp: SMTPClient | undefined
  try {
    smtp = new SMTPClient({
      connection: {
        hostname: smtpConfig.hostname,
        port: smtpConfig.port,
        tls: smtpConfig.port === 465,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    })
    await smtp.send({
      from: smtpConfig.from,
      to,
      subject,
      content: EMAIL_BODY,
      attachments: [
        {
          filename,
          contentType: 'application/pdf',
          encoding: 'binary',
          content: pdfBytes,
        },
      ],
    })
    return jsonResponse({ ok: true })
  } catch {
    return portugueseError(SEND_FAILED, 502)
  } finally {
    if (smtp) {
      try {
        await smtp.close()
      } catch {
        // A failed close must not replace the send result or print the message.
      }
    }
  }
})
