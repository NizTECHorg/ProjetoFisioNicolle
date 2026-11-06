import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccountScope } from '@/hooks/useAccountScope'
import {
  deleteWhatsappContact,
  listWhatsappContacts,
  saveWhatsappContact,
} from '@/services/whatsappContacts.service'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Não foi possível salvar o contato.', 'error')
}

/** Contatos da conta: os mesmos em todos os pacientes. */
export function useWhatsappContacts(enabled: boolean) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['whatsapp-contacts', userId],
    queryFn: listWhatsappContacts,
    enabled: enabled && signedIn,
    staleTime: 60_000,
  })
}

export function useSaveWhatsappContact() {
  const { userId } = useAccountScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { nome: string; digits: string }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      return saveWhatsappContact(userId, input.nome, input.digits)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['whatsapp-contacts'] })
      toast('Contato salvo para todos os pacientes.', 'success')
    },
    onError,
  })
}

export function useDeleteWhatsappContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWhatsappContact,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['whatsapp-contacts'] }),
    onError,
  })
}
