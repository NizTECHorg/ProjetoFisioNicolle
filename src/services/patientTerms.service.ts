import { supabase } from '@/lib/supabase/client'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'
import { createPatientTermSchema } from '@/schemas/patientTerm.schema'
import type { TermKey } from '@/lib/consentTerms'
import type { CreatePatientTermInput, PatientTerm } from '@/types/patientTerm'

const BUCKET = 'patient-images'
const SIGNED_URL_SECONDS = 3600
const MAX_PDF_BYTES = 8388608
// Colunas explícitas, sem o texto integral e sem o CPF do responsável (minimização).
const TERM_COLUMNS =
  'id, patient_id, term_type, title, patient_name, therapist_name, therapist_crefito, guardian_name, signed_at, storage_path, byte_size, created_by, created_by_name'
const SAVE_FAILED = 'Não foi possível salvar o termo. Confira a conexão e tente de novo.'

interface TermRow {
  id: string
  patient_id: string
  term_type: TermKey
  title: string
  patient_name: string
  therapist_name: string
  therapist_crefito: string
  guardian_name: string | null
  signed_at: string
  storage_path: string
  byte_size: number
  created_by: string | null
  created_by_name: string | null
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

// sanitizeText remove quebras de linha; o texto do termo precisa preservá-las.
function sanitizeBody(text: string, max: number) {
  return text
    .replace(/[\p{Cc}]/gu, (ch) => (ch === '\n' ? '\n' : ch === '\r' || ch === '\t' ? ' ' : ''))
    .trim()
    .slice(0, max)
}

function mapTermRow(row: TermRow, signedUrl: string | null): PatientTerm {
  return {
    id: row.id,
    patientId: row.patient_id,
    termType: row.term_type,
    title: row.title,
    patientName: row.patient_name,
    therapistName: row.therapist_name,
    therapistCrefito: row.therapist_crefito,
    guardianName: row.guardian_name,
    signedAt: row.signed_at,
    storagePath: row.storage_path,
    byteSize: Number(row.byte_size),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    signedUrl,
  }
}

export async function listPatientTerms(patientId?: string): Promise<PatientTerm[]> {
  let query = supabase.from('patient_terms').select(TERM_COLUMNS).order('signed_at', { ascending: false })
  query = patientId ? query.eq('patient_id', patientId) : query.limit(20)
  const { data, error } = await query
  throwIfDbError(error)
  const rows = (data ?? []) as unknown as TermRow[]
  if (rows.length === 0) return []

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      SIGNED_URL_SECONDS,
    )
  const urls = signedUrlByPath(signed)
  return rows.map((row) => mapTermRow(row, urls.get(row.storage_path) ?? null))
}

export async function createPatientTerm(
  patientId: string,
  input: CreatePatientTermInput,
  pdf: Blob,
): Promise<PatientTerm> {
  const parsed = createPatientTermSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? SAVE_FAILED)
  if (pdf.type !== 'application/pdf' || pdf.size === 0 || pdf.size > MAX_PDF_BYTES) {
    throw new Error(SAVE_FAILED)
  }
  const term = parsed.data

  const id = crypto.randomUUID()
  const path = `${patientId}/${id}.pdf`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: false,
  })
  throwIfStorageError(uploadError)

  const { data, error } = await supabase
    .from('patient_terms')
    .insert({
      id,
      patient_id: patientId,
      term_type: term.termType,
      title: sanitizeText(term.title, 200),
      body_text: sanitizeBody(term.bodyText, 6000),
      patient_name: sanitizeText(term.patientName, 200),
      therapist_name: sanitizeText(term.therapistName, 120),
      therapist_crefito: sanitizeText(term.therapistCrefito, 40),
      guardian_name: term.guardianName ? sanitizeText(term.guardianName, 120) : null,
      guardian_cpf: term.guardianCpf,
      signed_at: term.signedAt.toISOString(),
      storage_path: path,
      byte_size: pdf.size,
      created_by_name: term.createdByName ? sanitizeText(term.createdByName, 120) : null,
    })
    .select(TERM_COLUMNS)
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw new Error(mapDbError(error))
  }
  return mapTermRow(data as unknown as TermRow, null)
}

export async function deletePatientTerm(
  term: Pick<PatientTerm, 'id' | 'patientId' | 'storagePath'>,
): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([term.storagePath])
  throwIfStorageError(storageError)

  const { error } = await supabase
    .from('patient_terms')
    .delete()
    .eq('id', term.id)
    .eq('patient_id', term.patientId)
  throwIfDbError(error)
}

export async function getPatientTermDownloadUrl(storagePath: string, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS, { download: fileName })
  throwIfStorageError(error)
  if (!data?.signedUrl) throw new Error(SAVE_FAILED)
  return data.signedUrl
}
