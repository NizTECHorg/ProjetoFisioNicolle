import { supabase } from '@/lib/supabase/client'
import type {
  PatientSessionRecord,
  SessionEvolution,
  SessionStatus,
  TherapistOption,
  UpsertPatientSessionInput,
} from '@/types/patient'

type EvolutionRow = {
  id: string
  patient_state: string
  changes_since_last: string | null
  conducts: string
  treatment_response: string | null
  incidents: string | null
  next_plan: string | null
  created_at: string
  created_by_name: string | null
}

type SessionRow = {
  id: string
  patient_id: string
  scheduled_at: string
  session_type: string | null
  place: string | null
  status: SessionStatus
  therapist_id: string | null
  therapist_name: string | null
  patient_session_evolutions: EvolutionRow | EvolutionRow[] | null
}

const SESSION_LIST_COLUMNS = `
  id,
  patient_id,
  scheduled_at,
  session_type,
  place,
  status,
  therapist_id,
  therapist_name,
  patient_session_evolutions (
    id,
    patient_state,
    changes_since_last,
    conducts,
    treatment_response,
    incidents,
    next_plan,
    created_at,
    created_by_name
  )
`

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

function formatDateLabel(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function mapEvolution(row: EvolutionRow | null | undefined): SessionEvolution | null {
  if (!row) return null
  return {
    id: row.id,
    patientState: row.patient_state,
    changesSinceLast: row.changes_since_last,
    conducts: row.conducts,
    treatmentResponse: row.treatment_response,
    incidents: row.incidents,
    nextPlan: row.next_plan,
    createdAt: row.created_at,
    createdByName: row.created_by_name,
  }
}

function pickEvolution(
  value: EvolutionRow | EvolutionRow[] | null | undefined,
): EvolutionRow | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapSessionRecord(row: SessionRow): PatientSessionRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    scheduledAt: row.scheduled_at,
    dateLabel: formatDateLabel(row.scheduled_at),
    timeLabel: formatTimeLabel(row.scheduled_at),
    type: row.session_type ?? 'Sessão',
    place: row.place ?? '—',
    status: row.status,
    therapistId: row.therapist_id,
    therapistName: row.therapist_name,
    evolution: mapEvolution(pickEvolution(row.patient_session_evolutions)),
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

export async function listActiveTherapists(): Promise<TherapistOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  throwIfError(error)

  return ((data ?? []) as Array<{ id: string; full_name: string }>).map((row) => ({
    id: row.id,
    fullName: row.full_name,
  }))
}

export async function listPatientSessions(patientId: string): Promise<PatientSessionRecord[]> {
  const { data, error } = await supabase
    .from('patient_sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('patient_id', patientId)
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: false })

  throwIfError(error)
  return ((data ?? []) as SessionRow[]).map(mapSessionRecord)
}

export async function createPatientSession(
  patientId: string,
  input: UpsertPatientSessionInput,
): Promise<void> {
  const author = await resolveAuthor()
  const status: SessionStatus = input.mode === 'realizada' ? 'realizada' : 'agendada'

  const { data, error } = await supabase
    .from('patient_sessions')
    .insert({
      patient_id: patientId,
      scheduled_at: input.scheduledAt,
      session_type: emptyToNull(input.sessionType) ?? 'Sessão',
      place: emptyToNull(input.place),
      status,
      therapist_id: input.therapistId,
      therapist_name: input.therapistName,
      created_by: author.userId,
    })
    .select('id')
    .single()

  throwIfError(error)
  const sessionId = (data as { id: string }).id

  if (input.mode !== 'realizada') return

  const { error: evoError } = await supabase.from('patient_session_evolutions').insert({
    session_id: sessionId,
    patient_id: patientId,
    patient_state: input.patientState!.trim(),
    changes_since_last: emptyToNull(input.changesSinceLast),
    conducts: input.conducts!.trim(),
    treatment_response: emptyToNull(input.treatmentResponse),
    incidents: emptyToNull(input.incidents),
    next_plan: emptyToNull(input.nextPlan),
    created_by: author.userId,
    created_by_name: author.name,
  })
  throwIfError(evoError)
}

export async function updatePatientSession(
  patientId: string,
  sessionId: string,
  input: UpsertPatientSessionInput,
  existingEvolutionId: string | null,
): Promise<void> {
  const author = await resolveAuthor()
  const status: SessionStatus = input.mode === 'realizada' ? 'realizada' : 'agendada'

  const { error } = await supabase
    .from('patient_sessions')
    .update({
      scheduled_at: input.scheduledAt,
      session_type: emptyToNull(input.sessionType) ?? 'Sessão',
      place: emptyToNull(input.place),
      status,
      therapist_id: input.therapistId,
      therapist_name: input.therapistName,
    })
    .eq('id', sessionId)
    .eq('patient_id', patientId)

  throwIfError(error)

  if (input.mode === 'agendar') {
    if (existingEvolutionId) {
      const { error: delError } = await supabase
        .from('patient_session_evolutions')
        .delete()
        .eq('id', existingEvolutionId)
      throwIfError(delError)
    }
    return
  }

  const payload = {
    patient_state: input.patientState!.trim(),
    changes_since_last: emptyToNull(input.changesSinceLast),
    conducts: input.conducts!.trim(),
    treatment_response: emptyToNull(input.treatmentResponse),
    incidents: emptyToNull(input.incidents),
    next_plan: emptyToNull(input.nextPlan),
  }

  if (existingEvolutionId) {
    const { error: evoError } = await supabase
      .from('patient_session_evolutions')
      .update(payload)
      .eq('id', existingEvolutionId)
    throwIfError(evoError)
    return
  }

  const { error: insertError } = await supabase.from('patient_session_evolutions').insert({
    session_id: sessionId,
    patient_id: patientId,
    ...payload,
    created_by: author.userId,
    created_by_name: author.name,
  })
  throwIfError(insertError)
}

export async function deletePatientSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('patient_sessions').delete().eq('id', sessionId)
  throwIfError(error)
}
