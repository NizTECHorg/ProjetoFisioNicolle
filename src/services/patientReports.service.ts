import { supabase } from '@/lib/supabase/client'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'
import { normalizarTextoRelatorio } from '@/lib/relatorio'
import {
  patientReportCreateSchema,
  patientReportUpdateSchema,
  PATIENT_REPORT_COPY,
  type PatientReportCreateInput,
  type PatientReportUpdateInput,
} from '@/schemas/patientReport.schema'
import type { PatientReport } from '@/types/patient'

const REPORT_BUCKET = 'patient-ai-reports'
const REPORT_COLUMNS =
  'id, patient_id, content, place, session_ids, session_label, therapist_name, therapist_crefito, storage_path, created_at, updated_at'

interface ReportRow {
  id: string
  patient_id: string
  content: string
  place: string | null
  session_ids: string[] | null
  session_label: string | null
  therapist_name: string | null
  therapist_crefito: string | null
  storage_path: string | null
  created_at: string
  updated_at: string
}

/** Falha aqui não desfaz a operação; o arquivo que sobrar sai com a pasta ao excluir o paciente. */
async function removerPdfSemBloquear(path: string) {
  const { error } = await supabase.storage.from(REPORT_BUCKET).remove([path])
  if (error) console.warn('[Relatório] PDF antigo não foi removido do armazenamento.')
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

function mapReportRow(row: ReportRow): PatientReport {
  return {
    id: row.id,
    patientId: row.patient_id,
    content: row.content,
    place: row.place,
    sessionLabel: row.session_label,
    therapistName: row.therapist_name,
    therapistCrefito: row.therapist_crefito,
    storagePath: row.storage_path,
    sessionIds: row.session_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function cleanPlace(place: string | null): string | null {
  if (place === null) return null
  const clean = sanitizeText(place, 120)
  return clean.length > 0 ? clean : null
}

export async function listPatientReports(patientId: string): Promise<PatientReport[]> {
  const { data, error } = await supabase
    .from('patient_reports')
    .select(REPORT_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  throwIfDbError(error)
  return ((data ?? []) as ReportRow[]).map(mapReportRow)
}

export async function createPatientReport(input: PatientReportCreateInput): Promise<PatientReport> {
  const parsed = patientReportCreateSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? PATIENT_REPORT_COPY.saveError)
  }
  const value = parsed.data

  const { data, error } = await supabase
    .from('patient_reports')
    .insert({
      patient_id: value.patientId,
      content: normalizarTextoRelatorio(value.content),
      place: cleanPlace(value.place),
      session_ids: value.sessionIds,
      session_label: sanitizeText(value.sessionLabel, 120),
      therapist_name: value.therapistName,
      therapist_crefito: value.therapistCrefito,
    })
    .select(REPORT_COLUMNS)
    .single()

  throwIfDbError(error)
  return mapReportRow(data as ReportRow)
}

export async function updatePatientReport(
  patientId: string,
  report: PatientReport,
  input: PatientReportUpdateInput,
): Promise<PatientReport> {
  const parsed = patientReportUpdateSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? PATIENT_REPORT_COPY.saveError)
  }
  const content = normalizarTextoRelatorio(parsed.data.content)
  const place = cleanPlace(parsed.data.place)

  if (content === report.content && place === report.place) return report

  // Editar invalida o PDF: storage_path preenchido significa "PDF do texto atual".
  const { data, error } = await supabase
    .from('patient_reports')
    .update({
      content,
      place,
      updated_at: new Date().toISOString(),
      storage_path: null,
    })
    .eq('id', report.id)
    .eq('patient_id', patientId)
    .select(REPORT_COLUMNS)
    .single()

  throwIfDbError(error)

  if (report.storagePath) await removerPdfSemBloquear(report.storagePath)

  return mapReportRow(data as ReportRow)
}

export async function deletePatientReport(patientId: string, report: PatientReport): Promise<void> {
  // A linha sai primeiro: se falhar, o relatório continua inteiro, com o PDF no lugar.
  const { error } = await supabase
    .from('patient_reports')
    .delete()
    .eq('id', report.id)
    .eq('patient_id', patientId)

  throwIfDbError(error)

  if (report.storagePath) await removerPdfSemBloquear(report.storagePath)
}

/** Garante um PDF do texto atual. Reaproveita o arquivo existente para não quebrar links já enviados. */
export async function ensurePatientReportPdf(
  patientId: string,
  report: PatientReport,
  build: () => Promise<Blob>,
): Promise<PatientReport> {
  if (report.storagePath) return report

  const blob = await build()
  const path = `${patientId}/${crypto.randomUUID()}.pdf`

  const { error: uploadError } = await supabase.storage.from(REPORT_BUCKET).upload(path, blob, {
    contentType: 'application/pdf',
    upsert: false,
  })
  throwIfStorageError(uploadError)

  // Só grava se o relatório ainda é a versão usada no PDF: outra aba pode ter editado ou enviado.
  const { data, error } = await supabase
    .from('patient_reports')
    .update({ storage_path: path })
    .eq('id', report.id)
    .eq('patient_id', patientId)
    .eq('updated_at', report.updatedAt)
    .is('storage_path', null)
    .select(REPORT_COLUMNS)
    .maybeSingle()

  if (error) {
    await removerPdfSemBloquear(path)
    throw new Error(mapDbError(error))
  }
  if (data) return mapReportRow(data as ReportRow)

  await removerPdfSemBloquear(path)
  const { data: atual } = await supabase
    .from('patient_reports')
    .select(REPORT_COLUMNS)
    .eq('id', report.id)
    .eq('patient_id', patientId)
    .maybeSingle()
  const linha = atual as ReportRow | null
  // Mesma versão com PDF: outra aba acabou de gerar, serve o dela.
  if (linha?.storage_path && linha.updated_at === report.updatedAt) return mapReportRow(linha)
  throw new Error(PATIENT_REPORT_COPY.pdfStale)
}
