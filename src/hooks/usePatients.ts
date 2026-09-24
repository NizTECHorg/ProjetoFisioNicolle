import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPatient,
  createPatientAlert,
  createPatientGoal,
  deletePatientAlert,
  deletePatientGoal,
  getPatientById,
  getPatientDashboard,
  listPatients,
  togglePatientFocusArea,
  updatePatient,
  updatePatientAlert,
  updatePatientGoal,
} from '@/services/patients.service'
import {
  createPatientSession,
  deletePatientSession,
  listActiveTherapists,
  listPatientSessions,
  updatePatientSession,
} from '@/services/sessions.service'
import {
  createPatientEvaluation,
  deletePatientEvaluation,
  listPatientEvaluations,
  updatePatientEvaluation,
} from '@/services/evaluations.service'
import { upsertSessionCharge } from '@/services/finance.service'
import type {
  CreatePatientAlertInput,
  CreatePatientInput,
  Patient,
  PatientDashboard,
  PatientListItem,
  UpdatePatientAlertInput,
  UpdatePatientInput,
  UpsertPatientGoalInput,
  UpsertPatientSessionInput,
} from '@/types/patient'
import type { SessionChargeDraft } from '@/types/finance'
import type { UpsertPatientEvaluationInput } from '@/types/evaluation'
import { removePatientPhoto, uploadPatientPhoto } from '@/services/patientPhoto.service'
import { toast, type ToastAction } from '@/stores/toast.store'
import { useAccountScope } from '@/hooks/useAccountScope'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function invalidatePatient(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'images'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'ai-reports'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
  void qc.invalidateQueries({ queryKey: ['finance'] })
}

function invalidatePatientPhoto(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients', 'list'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
  void qc.invalidateQueries({ queryKey: ['board'] })
}

function shouldUpsertCharge(charge: SessionChargeDraft | null | undefined): charge is SessionChargeDraft {
  return Boolean(charge && (charge.priceId || charge.adHocAmountBrl != null))
}

export function usePatients() {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', 'list', userId],
    queryFn: listPatients,
    enabled: signedIn,
    staleTime: 60_000,
  })
}

export function usePatient(id: string | undefined, options?: { enabled?: boolean }) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', id, userId],
    queryFn: () => getPatientById(id!),
    enabled: Boolean(id) && signedIn && (options?.enabled ?? true),
    staleTime: 60_000,
  })
}

export function usePatientDashboard(id: string | undefined) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', id, 'dashboard', userId],
    queryFn: () => getPatientDashboard(id!),
    enabled: Boolean(id) && signedIn,
    staleTime: 60_000,
  })
}

export function useUploadPatientPhoto(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, mimeType }: { file: Blob; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }) =>
      uploadPatientPhoto(patientId, file, mimeType),
    onSuccess: () => {
      invalidatePatientPhoto(qc, patientId)
      toast('Foto atualizada.', 'success')
    },
    onError,
  })
}

export function useRemovePatientPhoto(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => removePatientPhoto(patientId),
    onSuccess: () => {
      invalidatePatientPhoto(qc, patientId)
      toast('Foto removida.', 'success')
    },
    onError,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatient(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patients'] })
      toast('Paciente cadastrado', 'success')
    },
    onError,
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatientInput }) => updatePatient(id, input),
    onSuccess: (_data, variables) => {
      const status = variables.input.status
      if (status) {
        qc.setQueriesData<PatientListItem[] | undefined>(
          { queryKey: ['patients', 'list'] },
          (current) =>
            current?.map((patient) => (patient.id === variables.id ? { ...patient, status } : patient)),
        )
        qc.setQueriesData<PatientDashboard | null | undefined>(
          {
            predicate: (query) =>
              query.queryKey[0] === 'patients' &&
              query.queryKey[1] === variables.id &&
              query.queryKey[2] === 'dashboard',
          },
          (current) => (current ? { ...current, status } : current),
        )
        qc.setQueriesData<Patient | null | undefined>(
          {
            predicate: (query) =>
              query.queryKey[0] === 'patients' &&
              query.queryKey[1] === variables.id &&
              query.queryKey.length === 3,
          },
          (current) => (current ? { ...current, status } : current),
        )
      }
      invalidatePatient(qc, variables.id)
      toast('Ficha atualizada', 'success')
    },
    onError,
  })
}

export function useCreatePatientAlert(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePatientAlertInput) => createPatientAlert(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Alerta criado', 'success')
    },
    onError,
  })
}

export function useUpdatePatientAlert(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, input }: { alertId: string; input: UpdatePatientAlertInput }) =>
      updatePatientAlert(alertId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Alerta atualizado', 'success')
    },
    onError,
  })
}

export function useDeletePatientAlert(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => deletePatientAlert(alertId),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Alerta removido', 'success')
    },
    onError,
  })
}

export function useCreatePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientGoalInput) => createPatientGoal(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta criada', 'success')
    },
    onError,
  })
}

export function useUpdatePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: UpsertPatientGoalInput }) =>
      updatePatientGoal(goalId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta atualizada', 'success')
    },
    onError,
  })
}

export function useDeletePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deletePatientGoal(goalId),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta removida', 'success')
    },
    onError,
  })
}

export function useTogglePatientFocusArea(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (regionKey: string) => togglePatientFocusArea(patientId, regionKey),
    onSuccess: (result) => {
      invalidatePatient(qc, patientId)
      toast(result === 'marked' ? 'Área marcada' : 'Área desmarcada', 'success')
    },
    onError: (error: unknown) => {
      const permission = 'Você não tem permissão para esta ação.'
      if (error instanceof Error && error.message === permission) {
        toast(permission, 'error')
        return
      }
      toast('Não foi possível salvar a área. Tente de novo em instantes.', 'error')
    },
  })
}

export function usePatientSessions(patientId: string | undefined) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', patientId, 'sessions', userId],
    queryFn: () => listPatientSessions(patientId!),
    enabled: Boolean(patientId) && signedIn,
    staleTime: 30_000,
  })
}

export function useActiveTherapists() {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['therapists', userId],
    queryFn: listActiveTherapists,
    enabled: signedIn,
    staleTime: 120_000,
  })
}

export function useCreatePatientSession(
  patientId: string,
  toastOptions?: { action?: ToastAction; errorMessage?: string },
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      charge,
      ...clinical
    }: UpsertPatientSessionInput & { charge?: SessionChargeDraft | null }) => {
      const created = await createPatientSession(patientId, clinical)
      if (shouldUpsertCharge(charge)) {
        await upsertSessionCharge({ sessionId: created.id, ...charge })
      }
      return created
    },
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(
        'Sessão salva',
        'success',
        toastOptions?.action ? { action: toastOptions.action } : undefined,
      )
    },
    onError: (error: unknown) => {
      toast(
        toastOptions?.errorMessage ?? (error instanceof Error ? error.message : 'Erro inesperado'),
        'error',
      )
    },
  })
}

export function useUpdatePatientSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId,
      input,
      evolutionId,
      charge,
    }: {
      sessionId: string
      input: UpsertPatientSessionInput
      evolutionId: string | null
      charge?: SessionChargeDraft | null
    }) => {
      await updatePatientSession(patientId, sessionId, input, evolutionId)
      if (shouldUpsertCharge(charge)) {
        await upsertSessionCharge({ sessionId, ...charge })
      }
    },
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Sessão atualizada', 'success')
    },
    onError,
  })
}

export function useDeletePatientSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => deletePatientSession(sessionId),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Sessão removida', 'success')
    },
    onError,
  })
}

export function usePatientEvaluations(patientId: string | undefined) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patients', patientId, 'evaluations', userId],
    queryFn: () => listPatientEvaluations(patientId!),
    enabled: Boolean(patientId) && signedIn,
    staleTime: 30_000,
  })
}

export function useCreatePatientEvaluation(
  patientId: string,
  toastOptions?: { action?: ToastAction; errorMessage?: string },
) {
  const qc = useQueryClient()
  return useMutation({
    // Pass UpsertPatientEvaluationInput through intact (incl. optional ficha)
    mutationFn: (input: UpsertPatientEvaluationInput) => createPatientEvaluation(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(
        'Avaliação salva',
        'success',
        toastOptions?.action ? { action: toastOptions.action } : undefined,
      )
    },
    onError: (error: unknown) => {
      toast(
        toastOptions?.errorMessage ?? (error instanceof Error ? error.message : 'Erro inesperado'),
        'error',
      )
    },
  })
}

export function useUpdatePatientEvaluation(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      evaluationId,
      input,
    }: {
      evaluationId: string
      input: UpsertPatientEvaluationInput
    }) => updatePatientEvaluation(evaluationId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Avaliação atualizada', 'success')
    },
    onError,
  })
}

export function useDeletePatientEvaluation(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (evaluationId: string) => deletePatientEvaluation(evaluationId),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Avaliação removida', 'success')
    },
    onError,
  })
}
