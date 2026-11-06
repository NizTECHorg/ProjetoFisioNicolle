import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccountScope } from '@/hooks/useAccountScope'
import { deleteEmailContact, listEmailContacts, saveEmailContact } from '@/services/emailContacts.service'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Não foi possível salvar o contato.', 'error')
}

/** Contatos da conta: os mesmos em todos os pacientes. */
export function useEmailContacts(enabled: boolean) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['email-contacts', userId],
    queryFn: listEmailContacts,
    enabled: enabled && signedIn,
    staleTime: 60_000,
  })
}

export function useSaveEmailContact() {
  const { userId } = useAccountScope()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { nome: string; email: string }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      return saveEmailContact(userId, input.nome, input.email)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['email-contacts'] })
      toast('Contato salvo para todos os pacientes.', 'success')
    },
    onError,
  })
}

export function useDeleteEmailContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEmailContact,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['email-contacts'] }),
    onError,
  })
}
