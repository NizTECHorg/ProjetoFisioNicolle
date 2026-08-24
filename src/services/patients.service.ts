import { supabase } from '@/lib/supabase/client'
import type {
  AlertTone,
  CreatePatientAlertInput,
  CreatePatientInput,
  Patient,
  PatientAlert,
  PatientDashboard,
  PatientListItem,
  PatientStatus,
  SessionStatus,
  UpdatePatientAlertInput,
  UpdatePatientInput,
} from '@/types/patient'
interface PatientRow {
  id: string
  full_name: string
  code: string
  birth_date: string | null
  phone: string | null
  email: string | null
  status: PatientStatus
  profession: string | null
  emergency_name: string | null
  emergency_phone: string | null
  emergency_relation: string | null
  admin_notes: string | null
  referral_source: string | null
  treatment_started_on: string | null
  sessions_done: number
  sessions_planned: number
  frequency: string | null
  therapist_name: string | null
  program_name: string | null
  program_progress: number
  complaint: string | null
  diagnosis: string | null
  current_eva: number
  last_visit_on: string | null
  ai_summary: string | null
  evolution_summary: string | null
  last_conducts: string | null
  next_session_plan: string | null
  photo_tone: string
}

interface ListPatientRow {
  id: string
  full_name: string
  code: string
  phone: string | null
  status: PatientStatus
  photo_tone: string
  program_name: string | null
  sessions_done: number
  sessions_planned: number
}

interface GoalRow {
  id: string
  title: string
  is_done: boolean
  sort_order: number
}

interface FocusRow {
  id: string
  label: string
  is_active: boolean
  sort_order: number
}

interface PainRow {
  recorded_on: string
  eva: number
}

interface SessionRow {
  id: string
  scheduled_at: string | null
  session_type: string | null
  place: string | null
  status: SessionStatus
  notes: string | null
}

interface AlertRow {
  id: string
  message: string
  tone: AlertTone
  created_at: string
  created_by: string | null
  created_by_name: string | null
}

const ALERT_COLUMNS = 'id, message, tone, created_at, created_by, created_by_name'

const DETAIL_COLUMNS =
  'id, full_name, code, birth_date, phone, email, status, profession, emergency_name, emergency_phone, emergency_relation, admin_notes, referral_source, treatment_started_on, sessions_done, sessions_planned, frequency, therapist_name, program_name, program_progress, complaint, diagnosis, current_eva, last_visit_on, ai_summary, evolution_summary, last_conducts, next_session_plan, photo_tone'

const LIST_COLUMNS =
  'id, full_name, code, phone, status, photo_tone, program_name, sessions_done, sessions_planned'

const DASHBOARD_COLUMNS =
  'id, full_name, code, phone, status, photo_tone, complaint, diagnosis, treatment_started_on, sessions_done, sessions_planned, last_visit_on'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function ageFrom(isoDate: string | null) {
  if (!isoDate) return null
  const birth = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const month = today.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

function initialsFrom(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(isoDate: string | null) {
  if (!isoDate) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${isoDate}T00:00:00`))
}

function formatDateTime(iso: string | null) {
  if (!iso) return { dateLabel: '—', timeLabel: '—' }
  const date = new Date(iso)
  return {
    dateLabel: new Intl.DateTimeFormat('pt-BR').format(date),
    timeLabel: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date),
  }
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function generatePatientCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `PAC-${suffix}`
}

function mapSession(row: SessionRow): Patient['nextSession'] {
  const { dateLabel, timeLabel } = formatDateTime(row.scheduled_at)
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    dateLabel,
    timeLabel,
    type: row.session_type ?? '—',
    place: row.place ?? '—',
    status: row.status,
    notes: row.notes,
  }
}

function mapAlert(alert: AlertRow): PatientAlert {
  return {
    id: alert.id,
    message: alert.message,
    tone: alert.tone,
    createdAt: alert.created_at,
    createdById: alert.created_by,
    createdByName: alert.created_by_name,
  }
}

function pickUpcoming(sessions: SessionRow[]) {
  return sessions
    .filter((session) => session.status === 'agendada' || session.status === 'confirmada')
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))[0]
}

function pickLastDone(sessions: SessionRow[]) {
  return sessions
    .filter((session) => session.status === 'realizada' && session.scheduled_at)
    .sort((a, b) => (b.scheduled_at ?? '').localeCompare(a.scheduled_at ?? ''))[0]
}

function mapListItem(row: ListPatientRow, sessions: SessionRow[]): PatientListItem {
  const upcoming = pickUpcoming(sessions)
  return {
    id: row.id,
    name: row.full_name,
    initials: initialsFrom(row.full_name),
    photoTone: row.photo_tone || 'bg-forest',
    status: row.status,
    code: row.code,
    phone: row.phone ?? '—',
    program: row.program_name ?? '—',
    sessionsDone: row.sessions_done,
    sessionsTotal: row.sessions_planned,
    nextSession: upcoming ? mapSession(upcoming) : null,
  }
}

function mapPatient(
  row: PatientRow,
  extras: {
    goals?: GoalRow[]
    focus?: FocusRow[]
    pain?: PainRow[]
    sessions?: SessionRow[]
    alerts?: AlertRow[]
  } = {},
): Patient {
  const upcoming = pickUpcoming(extras.sessions ?? [])

  return {
    id: row.id,
    name: row.full_name,
    initials: initialsFrom(row.full_name),
    photoTone: row.photo_tone || 'bg-forest',
    status: row.status,
    code: row.code,
    age: ageFrom(row.birth_date),
    birthDate: formatDate(row.birth_date),
    birthDateRaw: row.birth_date,
    startDateRaw: row.treatment_started_on,
    phone: row.phone ?? '—',
    email: row.email ?? '—',
    profession: row.profession ?? '—',
    emergencyName: row.emergency_name ?? '—',
    emergencyPhone: row.emergency_phone ?? '—',
    emergencyRelation: row.emergency_relation ?? '—',
    adminNotes: row.admin_notes ?? '',
    referralSource: row.referral_source ?? '—',
    startDate: formatDate(row.treatment_started_on),
    sessionsDone: row.sessions_done,
    sessionsTotal: row.sessions_planned,
    frequency: row.frequency ?? '—',
    therapist: row.therapist_name ?? '—',
    program: row.program_name ?? '—',
    programProgress: row.program_progress,
    complaint: row.complaint ?? '—',
    diagnosis: row.diagnosis ?? '—',
    eva: row.current_eva,
    lastVisit: formatDate(row.last_visit_on),
    aiSummary: row.ai_summary ?? '',
    evolutionSummary: row.evolution_summary ?? '',
    lastConducts: row.last_conducts ?? '',
    nextSessionPlan: row.next_session_plan ?? '',
    goals: (extras.goals ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((goal) => ({ id: goal.id, title: goal.title, isDone: goal.is_done })),
    focusAreas: (extras.focus ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((area) => ({ id: area.id, label: area.label, isActive: area.is_active })),
    painSeries: (extras.pain ?? [])
      .sort((a, b) => a.recorded_on.localeCompare(b.recorded_on))
      .map((log) => ({
        date: log.recorded_on,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
          new Date(`${log.recorded_on}T00:00:00`),
        ),
        value: log.eva,
      })),
    alerts: (extras.alerts ?? []).map(mapAlert),
    nextSession: upcoming ? mapSession(upcoming) : null,
  }
}

export async function listPatients(): Promise<PatientListItem[]> {
  const { data, error } = await supabase
    .from('patients')
    .select(LIST_COLUMNS)
    .order('full_name', { ascending: true })

  throwIfError(error)

  const rows = (data ?? []) as ListPatientRow[]
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)
  const { data: sessions, error: sessionsError } = await supabase
    .from('patient_sessions')
    .select('id, patient_id, scheduled_at, session_type, place, status, notes')
    .in('patient_id', ids)

  throwIfError(sessionsError)

  const sessionsByPatient = new Map<string, SessionRow[]>()
  for (const session of (sessions ?? []) as Array<SessionRow & { patient_id: string }>) {
    const list = sessionsByPatient.get(session.patient_id) ?? []
    list.push(session)
    sessionsByPatient.set(session.patient_id, list)
  }

  return rows.map((row) => mapListItem(row, sessionsByPatient.get(row.id) ?? []))
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  throwIfError(error)
  if (!data) return null

  const row = data as PatientRow

  const [goals, focus, pain, sessions, alerts] = await Promise.all([
    supabase.from('patient_goals').select('id, title, is_done, sort_order').eq('patient_id', id),
    supabase.from('patient_focus_areas').select('id, label, is_active, sort_order').eq('patient_id', id),
    supabase.from('patient_pain_logs').select('recorded_on, eva').eq('patient_id', id),
    supabase
      .from('patient_sessions')
      .select('id, scheduled_at, session_type, place, status, notes')
      .eq('patient_id', id),
    supabase
      .from('patient_alerts')
      .select(ALERT_COLUMNS)
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
  ])

  throwIfError(goals.error)
  throwIfError(focus.error)
  throwIfError(pain.error)
  throwIfError(sessions.error)
  throwIfError(alerts.error)

  return mapPatient(row, {
    goals: (goals.data ?? []) as GoalRow[],
    focus: (focus.data ?? []) as FocusRow[],
    pain: (pain.data ?? []) as PainRow[],
    sessions: (sessions.data ?? []) as SessionRow[],
    alerts: (alerts.data ?? []) as AlertRow[],
  })
}

export async function getPatientDashboard(id: string): Promise<PatientDashboard | null> {
  const { data, error } = await supabase
    .from('patients')
    .select(DASHBOARD_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  throwIfError(error)
  if (!data) return null

  const row = data as Pick<
    PatientRow,
    | 'id'
    | 'full_name'
    | 'code'
    | 'phone'
    | 'status'
    | 'photo_tone'
    | 'complaint'
    | 'diagnosis'
    | 'treatment_started_on'
    | 'sessions_done'
    | 'sessions_planned'
    | 'last_visit_on'
  >

  const [goals, alerts, sessions] = await Promise.all([
    supabase
      .from('patient_goals')
      .select('id, title, is_done, sort_order')
      .eq('patient_id', id)
      .eq('is_done', false)
      .order('sort_order', { ascending: true })
      .limit(3),
    supabase
      .from('patient_alerts')
      .select(ALERT_COLUMNS)
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('patient_sessions')
      .select('id, scheduled_at, session_type, place, status, notes')
      .eq('patient_id', id)
      .in('status', ['agendada', 'confirmada', 'realizada']),
  ])

  throwIfError(goals.error)
  throwIfError(alerts.error)
  throwIfError(sessions.error)

  const sessionRows = (sessions.data ?? []) as SessionRow[]
  const next = pickUpcoming(sessionRows)
  const last = pickLastDone(sessionRows)

  return {
    id: row.id,
    name: row.full_name,
    initials: initialsFrom(row.full_name),
    photoTone: row.photo_tone || 'bg-forest',
    status: row.status,
    code: row.code,
    phone: row.phone ?? '—',
    complaint: row.complaint ?? '—',
    diagnosis: row.diagnosis ?? '—',
    startDate: formatDate(row.treatment_started_on),
    lastSessionLabel: last ? formatDateTime(last.scheduled_at).dateLabel : formatDate(row.last_visit_on),
    sessionsDone: row.sessions_done,
    sessionsTotal: row.sessions_planned,
    activeGoals: ((goals.data ?? []) as GoalRow[]).map((goal) => ({
      id: goal.id,
      title: goal.title,
      isDone: goal.is_done,
    })),
    alerts: ((alerts.data ?? []) as AlertRow[]).map(mapAlert),
    nextSession: next ? mapSession(next) : null,
    lastSession: last ? mapSession(last) : null,
  }
}

export async function createPatient(input: CreatePatientInput): Promise<{ id: string }> {
  const payload = {
    full_name: input.fullName.trim(),
    code: generatePatientCode(),
    birth_date: emptyToNull(input.birthDate),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email)?.toLowerCase() ?? null,
    profession: emptyToNull(input.profession),
    emergency_name: emptyToNull(input.emergencyName),
    emergency_phone: emptyToNull(input.emergencyPhone),
    emergency_relation: emptyToNull(input.emergencyRelation),
    admin_notes: emptyToNull(input.adminNotes),
    referral_source: emptyToNull(input.referralSource),
    therapist_name: emptyToNull(input.therapistName),
    status: 'avaliacao' as const,
  }

  const { data, error } = await supabase.from('patients').insert(payload).select('id').single()
  throwIfError(error)
  if (!data?.id) throw new Error('Paciente criado sem identificador')
  return { id: data.id as string }
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<void> {
  const payload: Record<string, string | number | null> = {}

  if (input.fullName !== undefined) payload.full_name = input.fullName.trim()
  if (input.birthDate !== undefined) payload.birth_date = emptyToNull(input.birthDate)
  if (input.phone !== undefined) payload.phone = emptyToNull(input.phone)
  if (input.email !== undefined) payload.email = emptyToNull(input.email)?.toLowerCase() ?? null
  if (input.profession !== undefined) payload.profession = emptyToNull(input.profession)
  if (input.emergencyName !== undefined) payload.emergency_name = emptyToNull(input.emergencyName)
  if (input.emergencyPhone !== undefined) payload.emergency_phone = emptyToNull(input.emergencyPhone)
  if (input.emergencyRelation !== undefined) {
    payload.emergency_relation = emptyToNull(input.emergencyRelation)
  }
  if (input.adminNotes !== undefined) payload.admin_notes = emptyToNull(input.adminNotes)
  if (input.referralSource !== undefined) payload.referral_source = emptyToNull(input.referralSource)
  if (input.therapistName !== undefined) payload.therapist_name = emptyToNull(input.therapistName)
  if (input.status !== undefined) payload.status = input.status
  if (input.code !== undefined && input.code.trim()) payload.code = input.code.trim()
  if (input.treatmentStartedOn !== undefined) {
    payload.treatment_started_on = emptyToNull(input.treatmentStartedOn)
  }
  if (input.sessionsDone !== undefined) payload.sessions_done = input.sessionsDone
  if (input.sessionsTotal !== undefined) payload.sessions_planned = input.sessionsTotal
  if (input.frequency !== undefined) payload.frequency = emptyToNull(input.frequency)
  if (input.complaint !== undefined) payload.complaint = emptyToNull(input.complaint)
  if (input.diagnosis !== undefined) payload.diagnosis = emptyToNull(input.diagnosis)

  if (Object.keys(payload).length === 0) return

  const { error } = await supabase.from('patients').update(payload).eq('id', id)
  throwIfError(error)
}

export async function createPatientAlert(
  patientId: string,
  input: CreatePatientAlertInput,
): Promise<PatientAlert> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  throwIfError(userError)
  if (!user) throw new Error('Sessão expirada. Entre novamente.')

  let authorName: string | null = null
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()
  authorName = (profile as { full_name?: string } | null)?.full_name?.trim() || null

  const { data, error } = await supabase
    .from('patient_alerts')
    .insert({
      patient_id: patientId,
      message: input.message.trim(),
      tone: input.tone,
      created_by: user.id,
      created_by_name: authorName,
    })
    .select(ALERT_COLUMNS)
    .single()

  throwIfError(error)
  if (!data) throw new Error('Alerta criado sem identificador')
  return mapAlert(data as AlertRow)
}

export async function updatePatientAlert(
  alertId: string,
  input: UpdatePatientAlertInput,
): Promise<void> {
  const { error } = await supabase
    .from('patient_alerts')
    .update({
      message: input.message.trim(),
      tone: input.tone,
    })
    .eq('id', alertId)

  throwIfError(error)
}

export async function deletePatientAlert(alertId: string): Promise<void> {
  const { error } = await supabase.from('patient_alerts').delete().eq('id', alertId)
  throwIfError(error)
}
