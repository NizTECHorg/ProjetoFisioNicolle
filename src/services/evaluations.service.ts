import { supabase } from '@/lib/supabase/client'
import type { PatientEvaluation, UpsertPatientEvaluationInput } from '@/types/evaluation'

type EvaluationRow = {
  id: string
  patient_id: string
  performed_on: string
  anamnesis: string | null
  main_complaint: string | null
  history: string | null
  pain: string | null
  limitations: string | null
  goals: string | null
  physical_exam: string | null
  tests: string | null
  measurements: string | null
  physio_diagnosis: string | null
  plan: string | null
  therapist_id: string | null
  therapist_name: string | null
  created_by_name: string | null
  created_at: string
}

const EVALUATION_COLUMNS =
  'id, patient_id, performed_on, anamnesis, main_complaint, history, pain, limitations, goals, physical_exam, tests, measurements, physio_diagnosis, plan, therapist_id, therapist_name, created_by_name, created_at'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

function formatDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

function mapEvaluation(row: EvaluationRow, isInitial: boolean): PatientEvaluation {
  return {
    id: row.id,
    patientId: row.patient_id,
    performedOn: row.performed_on,
    performedOnLabel: formatDateLabel(row.performed_on),
    isInitial,
    anamnesis: row.anamnesis ?? '',
    mainComplaint: row.main_complaint ?? '',
    history: row.history ?? '',
    pain: row.pain ?? '',
    limitations: row.limitations ?? '',
    goals: row.goals ?? '',
    physicalExam: row.physical_exam ?? '',
    tests: row.tests ?? '',
    measurements: row.measurements ?? '',
    physioDiagnosis: row.physio_diagnosis ?? '',
    plan: row.plan ?? '',
    therapistId: row.therapist_id,
    therapistName: row.therapist_name,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }
}

async function resolveAuthor() {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Sessão expirada. Entre novamente.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  return {
    userId,
    name: (profile as { full_name?: string } | null)?.full_name?.trim() || 'Profissional',
  }
}

function toRow(input: UpsertPatientEvaluationInput) {
  return {
    performed_on: input.performedOn,
    anamnesis: emptyToNull(input.anamnesis),
    main_complaint: input.mainComplaint.trim(),
    history: emptyToNull(input.history),
    pain: emptyToNull(input.pain),
    limitations: emptyToNull(input.limitations),
    goals: emptyToNull(input.goals),
    physical_exam: emptyToNull(input.physicalExam),
    tests: emptyToNull(input.tests),
    measurements: emptyToNull(input.measurements),
    physio_diagnosis: emptyToNull(input.physioDiagnosis),
    plan: emptyToNull(input.plan),
    therapist_id: input.therapistId || null,
    therapist_name: emptyToNull(input.therapistName ?? undefined),
  }
}

export async function listPatientEvaluations(patientId: string): Promise<PatientEvaluation[]> {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .select(EVALUATION_COLUMNS)
    .eq('patient_id', patientId)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })

  throwIfError(error)

  const rows = (data ?? []) as EvaluationRow[]
  const oldest = [...rows].sort((a, b) => a.performed_on.localeCompare(b.performed_on))[0]
  return rows.map((row) => mapEvaluation(row, oldest?.id === row.id))
}

export async function createPatientEvaluation(
  patientId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const author = await resolveAuthor()
  const { error } = await supabase.from('patient_evaluations').insert({
    patient_id: patientId,
    ...toRow(input),
    created_by: author.userId,
    created_by_name: author.name,
  })
  throwIfError(error)
}

export async function updatePatientEvaluation(
  evaluationId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const { error } = await supabase
    .from('patient_evaluations')
    .update({
      ...toRow(input),
      updated_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)

  throwIfError(error)
}

export async function deletePatientEvaluation(evaluationId: string): Promise<void> {
  const { error } = await supabase.from('patient_evaluations').delete().eq('id', evaluationId)
  throwIfError(error)
}
