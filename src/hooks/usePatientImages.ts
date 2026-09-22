import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePatient } from '@/hooks/usePatients'
import {
  deletePatientImage,
  listPatientImages,
  updatePatientImage,
  uploadPatientImages,
} from '@/services/patientImages.service'
import type { PatientImage, UpdatePatientImageInput } from '@/types/patient'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function usePatientImages(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'images'],
    queryFn: () => listPatientImages(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

export function useUploadPatientImages(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      files,
      sessionId,
      description,
    }: {
      files: File[]
      sessionId: string | null
      description: string
    }) => uploadPatientImages(patientId, files, { sessionId, description }),
    onSuccess: (data) => {
      invalidatePatient(qc, patientId)
      if (data.length === 1) toast('Arquivo adicionado', 'success')
      if (data.length > 1) toast('Arquivos adicionados', 'success')
    },
    onError,
  })
}

export function useUpdatePatientImage(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ imageId, input }: { imageId: string; input: UpdatePatientImageInput }) =>
      updatePatientImage(patientId, imageId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Descrição atualizada', 'success')
    },
    onError,
  })
}

export function useDeletePatientImage(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (image: Pick<PatientImage, 'id' | 'storagePath'>) =>
      deletePatientImage(patientId, image),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Arquivo excluído', 'success')
    },
    onError,
  })
}
