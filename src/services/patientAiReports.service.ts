import { supabase } from '@/lib/supabase/client'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'
import { PATIENT_AI_COPY, patientAiReportUploadSchema } from '@/schemas/patientAi.schema'
import type { PatientAiReport, PatientAiReportKind } from '@/types/patient'

const REPORT_BUCKET = 'patient-ai-reports'
const SIGNED_URL_SECONDS = 3600
const REPORT_COLUMNS =
  'id, patient_id, session_id, kind, storage_path, byte_size, mime_type, session_label, created_at'
const SAVE_FAILED = PATIENT_AI_COPY.exportError

interface ReportRow {
  id: string
  patient_id: string
  session_id: string | null
  kind: PatientAiReportKind
  storage_path: string
  byte_size: number
  mime_type: 'application/pdf'
  session_label: string | null
  created_at: string
}

export interface CreatePatientAiReportInput {
  kind: PatientAiReportKind
  sessionId: string | null
  /** Denormalized at create time for list after session delete (Pitfall 5). */
  sessionLabel?: string | null
  blob: Blob
}

function throwIfDbError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

function throwIfStorageError(
  error: {
    message?: string
    code?: string
    statusCode?: string | number
    error?: string
    status?: number
  } | null,
) {
  if (error) throw new Error(mapStorageError(error))
}

function mapReportRow(row: ReportRow, signedUrl: string | null): PatientAiReport {
  return {
    id: row.id,
    patientId: row.patient_id,
    sessionId: row.session_id,
    kind: row.kind,
    storagePath: row.storage_path,
    byteSize: Number(row.byte_size),
    mimeType: 'application/pdf',
    sessionLabel: row.session_label,
    createdAt: row.created_at,
    signedUrl,
  }
}

function signedUrlByPath(
  entries:
    | Array<{
        path?: string | null
        signedUrl?: string | null
        signedURL?: string | null
        error?: string | null
      }>
    | null
    | undefined,
) {
  const urls = new Map<string, string>()
  for (const entry of entries ?? []) {
    if (!entry.path || entry.error) continue
    const url = entry.signedUrl || entry.signedURL
    if (url) urls.set(entry.path, url)
  }
  return urls
}

function parseUploadMeta(input: CreatePatientAiReportInput) {
  const parsed = patientAiReportUploadSchema.safeParse({
    mimeType: 'application/pdf',
    byteSize: input.blob.size,
    kind: input.kind,
    sessionId: input.sessionId,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? SAVE_FAILED)
  }
  return parsed.data
}

async function insertReportRow(
  patientId: string,
  reportId: string,
  path: string,
  meta: {
    kind: PatientAiReportKind
    sessionId: string | null
    byteSize: number
  },
  sessionLabel: string | null,
): Promise<ReportRow> {
  const { data, error } = await supabase
    .from('patient_ai_reports')
    .insert({
      id: reportId,
      patient_id: patientId,
      session_id: meta.sessionId,
      kind: meta.kind,
      storage_path: path,
      byte_size: meta.byteSize,
      mime_type: 'application/pdf',
      session_label: sessionLabel,
    })
    .select(REPORT_COLUMNS)
    .single()

  if (error) {
    // Pitfall 4: rollback orphan Storage object on INSERT fail
    await supabase.storage.from(REPORT_BUCKET).remove([path])
    throw new Error(mapDbError(error))
  }

  return data as ReportRow
}

export async function listPatientAiReports(patientId: string): Promise<PatientAiReport[]> {
  const { data, error } = await supabase
    .from('patient_ai_reports')
    .select(REPORT_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  throwIfDbError(error)

  const rows = (data ?? []) as ReportRow[]
  if (rows.length === 0) return []

  const paths = rows.map((row) => row.storage_path)
  const { data: signed, error: signedError } = await supabase.storage
    .from(REPORT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)

  throwIfStorageError(signedError)

  const urls = signedUrlByPath(signed)
  return rows.map((row) => mapReportRow(row, urls.get(row.storage_path) ?? null))
}

export async function createPatientAiReport(
  patientId: string,
  input: CreatePatientAiReportInput,
): Promise<PatientAiReport> {
  const meta = parseUploadMeta(input)
  const reportId = crypto.randomUUID()
  const path = `${patientId}/${reportId}.pdf`

  const sessionLabel =
    meta.kind === 'sessao'
      ? sanitizeText(input.sessionLabel?.trim() || 'Sessão', 120)
      : null

  const { error: uploadError } = await supabase.storage.from(REPORT_BUCKET).upload(path, input.blob, {
    contentType: 'application/pdf',
    upsert: false,
  })
  throwIfStorageError(uploadError)

  const row = await insertReportRow(patientId, reportId, path, meta, sessionLabel)
  return mapReportRow(row, null)
}

export async function deletePatientAiReport(
  patientId: string,
  report: Pick<PatientAiReport, 'id' | 'storagePath'>,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(REPORT_BUCKET)
    .remove([report.storagePath])
  throwIfStorageError(storageError)

  const { error } = await supabase
    .from('patient_ai_reports')
    .delete()
    .eq('id', report.id)
    .eq('patient_id', patientId)

  throwIfDbError(error)
}
