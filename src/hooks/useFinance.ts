import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archivePrice,
  createPrice,
  fetchChargeBySessionId,
  fetchFinanceTotals,
  listActivePrices,
  listFinanceRealizadas,
  markChargePaid,
  updatePrice,
  upsertSessionCharge,
} from '@/services/finance.service'
import type { CreatePriceInput, UpdatePriceInput, UpsertSessionChargeInput } from '@/types/finance'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

function invalidateFinance(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['finance'] })
}

export function useFinancePrices() {
  return useQuery({
    queryKey: ['finance', 'prices'],
    queryFn: listActivePrices,
    staleTime: 60_000,
  })
}

export function useFinanceTotals() {
  return useQuery({
    queryKey: ['finance', 'totals'],
    queryFn: fetchFinanceTotals,
    staleTime: 60_000,
  })
}

export function useFinanceRealizadas() {
  return useQuery({
    queryKey: ['finance', 'sessions'],
    queryFn: listFinanceRealizadas,
    staleTime: 30_000,
  })
}

export function useSessionCharge(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['finance', 'charge', sessionId],
    queryFn: () => fetchChargeBySessionId(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 30_000,
  })
}

export function useCreatePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePriceInput) => createPrice(input),
    onSuccess: () => {
      toast('Preço cadastrado', 'success')
      invalidateFinance(qc)
    },
    onError,
  })
}

export function useUpdatePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePriceInput }) => updatePrice(id, input),
    onSuccess: () => {
      toast('Preço atualizado. Sessões já gravadas não mudam.', 'success')
      invalidateFinance(qc)
    },
    onError,
  })
}

export function useArchivePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archivePrice(id),
    onSuccess: () => {
      toast('Preço arquivado', 'success')
      invalidateFinance(qc)
    },
    onError,
  })
}

export function useUpsertCharge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertSessionChargeInput) => upsertSessionCharge(input),
    onSuccess: () => {
      toast('Valor da sessão salvo', 'success')
      invalidateFinance(qc)
    },
    onError,
  })
}

export function useMarkChargePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => markChargePaid(sessionId),
    onSuccess: () => {
      toast('Sessão marcada como paga', 'success')
      invalidateFinance(qc)
    },
    onError,
  })
}
