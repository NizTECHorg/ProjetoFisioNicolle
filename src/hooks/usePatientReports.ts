import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePatient } from '@/hooks/usePatients'
import { useAccountScope } from '@/hooks/useAccountScope'
import {
  PATIENT_REPORT_COPY,
  type PatientReportCreateInput,
  type PatientReportInvokeInput,
  type PatientReportUpdateInput,
} from '@/schemas/patientReport.schema'
import { generateReportText } from '@/services/patientAi.service'
import {
  createPatientReport,
  deletePatientReport,
  ensurePatientReportPdf,
  listPatientReports,
  updatePatientReport,
} from '@/services/patientReports.service'
import type { PatientReport } from '@/types/patient'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : PATIENT_REPORT_COPY.saveError, 'error')
}

export function usePatientReports(patientId: string | undefined) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', patientId, 'reports', userId],
    queryFn: () => listPatientReports(patientId!),
    enabled: Boolean(patientId) && signedIn,
    staleTime: 30_000,
  })
}

export function useCreatePatientReport(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PatientReportCreateInput) => createPatientReport(input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_REPORT_COPY.saved, 'success')
    },
    onError,
  })
}

export function useUpdatePatientReport(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { report: PatientReport; input: PatientReportUpdateInput }) =>
      updatePatientReport(patientId, vars.report, vars.input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_REPORT_COPY.updated, 'success')
    },
    onError,
  })
}

export function useDeletePatientReport(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (report: PatientReport) => deletePatientReport(patientId, report),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_REPORT_COPY.deleted, 'success')
    },
    onError,
  })
}

export function useEnsurePatientReportPdf(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { report: PatientReport; build: () => Promise<Blob> }) =>
      ensurePatientReportPdf(patientId, vars.report, vars.build),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
    },
    // Sem onError: o painel mostra o erro de cada canal.
  })
}

export function useGenerateReportText() {
  return useMutation({
    mutationFn: (input: PatientReportInvokeInput) => generateReportText(input),
    onError,
  })
}
