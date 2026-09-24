import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSession, listSessionsInRange, updateSessionStatus } from '@/services/calendar.service'
import {
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  listBoard,
  listDueCards,
  moveCard,
  updateCardDue,
} from '@/services/board.service'
import type { SessionStatus } from '@/types/patient'
import { useAccountScope } from '@/hooks/useAccountScope'
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
    mutationFn: createSession,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
      void qc.invalidateQueries({ queryKey: ['patients'] })
      toast('Sessão agendada', 'success')
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
