import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  decideMembership,
  fetchMembership,
  fetchOwnerOrganization,
  listTeamMembers,
} from '@/services/team.service'
import { toast } from '@/stores/toast.store'
import { useAccountScope } from '@/hooks/useAccountScope'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function useTeam() {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['team', userId],
    queryFn: async () => {
      const [members, organization] = await Promise.all([listTeamMembers(), fetchOwnerOrganization()])
      return { members, organization }
    },
    enabled: signedIn,
    staleTime: 60_000,
  })
}

export function useMembership(userId: string | undefined) {
  return useQuery({
    queryKey: ['membership', userId],
    queryFn: () => fetchMembership(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })
}

export function useDecideMembership() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      membershipId,
      accept,
    }: {
      membershipId: string
      accept: boolean
      fullName: string
    }) => decideMembership(membershipId, accept),
    onSuccess: (_data, variables) => {
      const nome = variables.fullName.trim() || 'Fisioterapeuta'
      if (variables.accept) {
        toast(`${nome} entrou na equipe.`, 'success')
      } else {
        toast(`Pedido de ${nome} recusado. A conta foi cancelada.`, 'success')
      }
      void qc.invalidateQueries({ queryKey: ['team'] })
    },
    onError,
  })
}
