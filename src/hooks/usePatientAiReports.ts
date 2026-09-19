import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePatient } from '@/hooks/usePatients'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import {
  createPatientAiReport,
  deletePatientAiReport,
  listPatientAiReports,
  type CreatePatientAiReportInput,
} from '@/services/patientAiReports.service'
import type { PatientAiReport } from '@/types/patient'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : PATIENT_AI_COPY.exportError, 'error')
}

export function usePatientAiReports(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'ai-reports'],
    queryFn: () => listPatientAiReports(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

export function useCreatePatientAiReport(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePatientAiReportInput) => createPatientAiReport(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_AI_COPY.exportSuccess, 'success')
    },
    onError,
  })
}

export function useDeletePatientAiReport(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (report: Pick<PatientAiReport, 'id' | 'storagePath'>) =>
      deletePatientAiReport(patientId, report),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_AI_COPY.deleteSuccess, 'success')
    },
    onError,
  })
}
