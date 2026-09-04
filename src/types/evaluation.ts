export interface PatientEvaluation {
  id: string
  patientId: string
  performedOn: string
  performedOnLabel: string
  isInitial: boolean
  anamnesis: string
  mainComplaint: string
  history: string
  pain: string
  limitations: string
  goals: string
  physicalExam: string
  tests: string
  measurements: string
  physioDiagnosis: string
  plan: string
  therapistId: string | null
  therapistName: string | null
  createdByName: string | null
  createdAt: string
}

export interface UpsertPatientEvaluationInput {
  performedOn: string
  anamnesis?: string
  mainComplaint: string
  history?: string
  pain?: string
  limitations?: string
  goals?: string
  physicalExam?: string
  tests?: string
  measurements?: string
  physioDiagnosis?: string
  plan?: string
  therapistId?: string | null
  therapistName?: string | null
}

export interface PhysicalEvaluationResult {
  id: string
  patientId: string
  fileName: string
  fileSize: string
  uploadedAt: string
  summary: string
  mainComplaint: string
  postureAndMovement: string
  muscleForceAndTests: string
  cinesiologicDiagnosis: string
  suggestedTreatmentPlan: string
  suggestedGoals: string[]
}

export interface AnalyzePdfInput {
  patientId: string
  file: File
}
