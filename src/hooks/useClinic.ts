import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSession, listSessionsInRange, updateSessionStatus } from '@/services/calendar.service'
import { deletePatientSession } from '@/services/sessions.service'
import {
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  renameColumn,
  listBoard,
  listDueCards,
  moveCard,
  updateCardDue,
} from '@/services/board.service'
import type { SessionStatus } from '@/types/patient'
import { useAccountScope } from '@/hooks/useAccountScope'
import { upsertSessionCharge } from '@/services/finance.service'
import type { SessionChargeDraft } from '@/types/finance'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function useCalendarSessions(fromIso: string, toIso: string) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['calendar-sessions', fromIso, toIso, userId],
    queryFn: () => listSessionsInRange(fromIso, toIso),
    enabled: signedIn,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    // Valor da sessão (só autônomo): gravado em cada sessão criada. Se falhar, as sessões
    // continuam agendadas e o aviso diz que o valor não entrou (nunca bloqueia agendar).
    mutationFn: async ({
      charge,
      ...input
    }: Parameters<typeof createSession>[0] & { charge?: SessionChargeDraft | null }) => {
      const ids = await createSession(input)
      let chargeFailed = false
      if (charge && (charge.priceId || charge.adHocAmountBrl != null)) {
        for (const sessionId of ids) {
          try {
            await upsertSessionCharge({ sessionId, ...charge })
          } catch {
            chargeFailed = true
          }
        }
      }
      return { ids, chargeFailed }
    },
    onSuccess: ({ chargeFailed }, input) => {
      const count = input.scheduledAts?.length ?? 1
      void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
      void qc.invalidateQueries({ queryKey: ['patients'] })
      void qc.invalidateQueries({ queryKey: ['finance'] })
      toast(count > 1 ? `${count} sessões agendadas` : 'Sessão agendada', 'success')
      if (chargeFailed) {
        toast('O valor não foi salvo. Ajuste o valor na ficha do paciente, em Sessões / Evoluções.', 'error')
      }
    },
    onError,
  })
}

export function useUpdateSessionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) => updateSessionStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
      void qc.invalidateQueries({ queryKey: ['patients'] })
      toast('Status atualizado', 'success')
    },
    onError,
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => deletePatientSession(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
      void qc.invalidateQueries({ queryKey: ['patients'] })
      toast('Sessão removida', 'success')
    },
    onError,
  })
}

export function useBoard() {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['board', userId],
    queryFn: listBoard,
    enabled: signedIn,
  })
}

export function useCreateColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createColumn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
      toast('Lista criada', 'success')
    },
    onError,
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCard,
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
      toast(
        input.dueOn ? 'Card criado. O prazo aparece na Agenda nesse dia.' : 'Card criado',
        'success',
      )
    },
    onError,
  })
}

export function useMoveCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, columnId }: { cardId: string; columnId: string }) => moveCard(cardId, columnId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
    },
    onError,
  })
}

export function useDueCards(fromDate: string, toDate: string) {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['board-dues', fromDate, toDate, userId],
    queryFn: () => listDueCards(fromDate, toDate),
    enabled: signedIn,
  })
}

export function useUpdateCardDue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, dueOn }: { cardId: string; dueOn: string | null }) => updateCardDue(cardId, dueOn),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
    },
    onError,
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
      toast('Card removido', 'success')
    },
    onError,
  })
}

export function useRenameColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: renameColumn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
      toast('Lista renomeada', 'success')
    },
    onError,
  })
}

export function useDeleteColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteColumn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] })
      void qc.invalidateQueries({ queryKey: ['board-dues'] })
      toast('Lista removida', 'success')
    },
    onError,
  })
}
