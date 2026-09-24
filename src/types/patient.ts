export type PatientStatus = 'em_tratamento' | 'avaliacao' | 'alta' | 'inativo'
export type SessionStatus = 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'faltou'
export type AlertTone = 'info' | 'warning' | 'success'
export type GoalStatus = 'em_andamento' | 'concluido'

export const statusLabels: Record<PatientStatus, string> = {
  em_tratamento: 'Em tratamento',
  avaliacao: 'Avaliação',
  alta: 'Alta',
  inativo: 'Inativo',
}

export const goalStatusLabels: Record<GoalStatus, string> = {
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export interface PatientGoal {
  id: string
  title: string
  status: GoalStatus
  createdOn: string
  achievedOn: string | null
  isDone: boolean
}

export interface PatientFocusArea {
  id: string
  regionKey: string
  label: string
  isActive: boolean
}

export interface PatientPainLog {
  date: string
  label: string
  value: number
}

export interface PatientSession {
  id: string
  scheduledAt: string | null
  dateLabel: string
  timeLabel: string
  type: string
  place: string
  status: SessionStatus
  notes: string | null
}

export interface SessionEvolution {
  id: string
  patientState: string
  changesSinceLast: string | null
  conducts: string
  treatmentResponse: string | null
  incidents: string | null
  nextPlan: string | null
  createdAt: string
  createdByName: string | null
}

/** Sessão na aba Sessões (com profissional e evolução quando houver). */
export interface PatientSessionRecord {
  id: string
  patientId: string
  scheduledAt: string
  dateLabel: string
  timeLabel: string
  type: string
  place: string
  status: SessionStatus
  therapistId: string | null
  therapistName: string | null
  evolution: SessionEvolution | null
}

export type PatientImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

/** Foto da galeria. signedUrl só no DTO (createSignedUrls). sessionRemoved é D-07. */
export interface PatientImage {
  id: string
  patientId: string
  sessionId: string | null
  storagePath: string
  description: string
  mimeType: PatientImageMime
  byteSize: number
  createdAt: string
  sessionRemoved: boolean
  signedUrl: string | null
  thumbUrl: string | null
}

export interface UpdatePatientImageInput {
  description: string
  sessionId: string | null
}

export type PatientAiReportKind = 'geral' | 'sessao' | 'avaliacao' | 'evolucao'

/** PDF de avaliação IA. signedUrl só no DTO (createSignedUrls), nunca coluna no DB. */
export interface PatientAiReport {
  id: string
  patientId: string
  sessionId: string | null
  kind: PatientAiReportKind
  storagePath: string
  byteSize: number
  mimeType: 'application/pdf'
  sessionLabel: string | null
  createdAt: string
  signedUrl: string | null
}

export interface TherapistOption {
  id: string
  fullName: string
}

export type SessionFormMode = 'agendar' | 'realizada'

export interface UpsertPatientSessionInput {
  mode: SessionFormMode
  scheduledAt: string
  sessionType?: string
  place?: string
  therapistId: string | null
  therapistName: string
  patientState?: string
  changesSinceLast?: string
  conducts?: string
  treatmentResponse?: string
  incidents?: string
  nextPlan?: string
}

export interface PatientAlert {
  id: string
  message: string
  tone: AlertTone
  createdAt: string
  createdById: string | null
  createdByName: string | null
}

/** Lista enxuta — sem histórico clínico completo (LGPD + performance). */
export interface PatientListItem {
  id: string
  name: string
  initials: string
  photoTone: string
  photoUrl: string | null
  status: PatientStatus
  code: string
  phone: string
  program: string
  sessionsDone: number
  sessionsTotal: number
  nextSession: PatientSession | null
  createdBy: string | null
  createdByName: string | null
}

export interface Patient {
  id: string
  name: string
  initials: string
  photoTone: string
  photoUrl: string | null
  status: PatientStatus
  code: string
  age: number | null
  birthDate: string
  birthDateRaw: string | null
  startDateRaw: string | null
  phone: string
  email: string
  profession: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  adminNotes: string
  referralSource: string
  startDate: string
  sessionsDone: number
  sessionsTotal: number
  frequency: string
  therapist: string
  program: string
  programProgress: number
  complaint: string
  diagnosis: string
  eva: number
  lastVisit: string
  aiSummary: string
  evolutionSummary: string
  lastConducts: string
  nextSessionPlan: string
  goals: PatientGoal[]
  focusAreas: PatientFocusArea[]
  painSeries: PatientPainLog[]
  alerts: PatientAlert[]
  nextSession: PatientSession | null
  createdBy: string | null
  createdByName: string | null
}

/** Resumo enxuto para a abertura do paciente (REQ-02). */
export interface PatientDashboard {
  id: string
  name: string
  initials: string
  photoTone: string
  photoUrl: string | null
  status: PatientStatus
  code: string
  phone: string
  complaint: string
  diagnosis: string
  startDate: string
  lastSessionLabel: string
  sessionsDone: number
  sessionsTotal: number
  activeGoals: PatientGoal[]
  alerts: PatientAlert[]
  nextSession: PatientSession | null
  lastSession: PatientSession | null
  createdBy: string | null
  createdByName: string | null
}

export interface CreatePatientInput {
  fullName: string
  phone?: string
  email?: string
  birthDate?: string
  profession?: string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelation?: string
  adminNotes?: string
  referralSource?: string
  therapistName?: string
}

export interface UpdatePatientInput {
  fullName?: string
  phone?: string
  email?: string
  birthDate?: string
  profession?: string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelation?: string
  adminNotes?: string
  referralSource?: string
  therapistName?: string
  status?: PatientStatus
  code?: string
  treatmentStartedOn?: string
  sessionsDone?: number
  sessionsTotal?: number
  frequency?: string
  complaint?: string
  diagnosis?: string
  /** D-04 — grava patients.ai_summary via updatePatient. */
  aiSummary?: string
}

export interface CreatePatientAlertInput {
  message: string
  tone: AlertTone
}

export interface UpdatePatientAlertInput {
  message: string
  tone: AlertTone
}

export interface UpsertPatientGoalInput {
  title: string
  status: GoalStatus
  createdOn: string
  achievedOn: string
}
