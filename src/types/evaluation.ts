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
