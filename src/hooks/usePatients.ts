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
import type {
  CreatePatientAlertInput,
  CreatePatientInput,
  UpdatePatientAlertInput,
  UpdatePatientInput,
  UpsertPatientGoalInput,
  UpsertPatientSessionInput,
} from '@/types/patient'
import type { UpsertPatientEvaluationInput } from '@/types/evaluation'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

function invalidatePatient(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
}

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: listPatients,
    staleTime: 60_000,
  })
}

export function usePatient(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: 60_000,
  })
}

export function usePatientDashboard(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id, 'dashboard'],
    queryFn: () => getPatientDashboard(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
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

export function usePatientSessions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'sessions'],
    queryFn: () => listPatientSessions(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

export function useActiveTherapists() {
  return useQuery({
    queryKey: ['therapists'],
    queryFn: listActiveTherapists,
    staleTime: 120_000,
  })
}

export function useCreatePatientSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientSessionInput) => createPatientSession(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Sessão salva', 'success')
    },
    onError,
  })
}

export function useUpdatePatientSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      input,
      evolutionId,
    }: {
      sessionId: string
      input: UpsertPatientSessionInput
      evolutionId: string | null
    }) => updatePatientSession(patientId, sessionId, input, evolutionId),
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
  return useQuery({
    queryKey: ['patients', patientId, 'evaluations'],
    queryFn: () => listPatientEvaluations(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

export function useCreatePatientEvaluation(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientEvaluationInput) => createPatientEvaluation(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Avaliação salva', 'success')
    },
    onError,
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
