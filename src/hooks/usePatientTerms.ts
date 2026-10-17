import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePatient } from '@/hooks/usePatients'
import { useAccountScope } from '@/hooks/useAccountScope'
import { createPatientTerm, deletePatientTerm, listPatientTerms } from '@/services/patientTerms.service'
import type { CreatePatientTermInput, PatientTerm } from '@/types/patientTerm'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function usePatientTerms(patientId?: string) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['patient-terms', patientId ?? 'all', userId],
    queryFn: () => listPatientTerms(patientId),
    enabled: signedIn,
    staleTime: 30_000,
  })
}

export function useCreatePatientTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, input, pdf }: { patientId: string; input: CreatePatientTermInput; pdf: Blob }) =>
      createPatientTerm(patientId, input, pdf),
    onSuccess: (_term, { patientId }) => {
      void qc.invalidateQueries({ queryKey: ['patient-terms'] })
      invalidatePatient(qc, patientId)
      toast('Termo salvo na nuvem.', 'success')
    },
    onError,
  })
}

export function useDeletePatientTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (term: Pick<PatientTerm, 'id' | 'patientId' | 'storagePath'>) => deletePatientTerm(term),
    onSuccess: (_data, term) => {
      void qc.invalidateQueries({ queryKey: ['patient-terms'] })
      invalidatePatient(qc, term.patientId)
      toast('Termo excluído.', 'success')
    },
    onError,
  })
}
