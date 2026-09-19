import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  GOOGLE_CALENDAR_COPY,
  type ExportMonthInput,
} from '@/schemas/googleCalendar.schema'
import {
  disconnectGoogleCalendar,
  exportVisibleMonth,
  getGoogleCalendarConnection,
  linkGoogleCalendar,
  vaultGoogleTokensIfPresent,
} from '@/services/googleCalendar.service'
import type { GoogleCalendarExportResult } from '@/types/googleCalendar'
import { toast } from '@/stores/toast.store'

const CONNECTION_QUERY_KEY = ['google-calendar', 'connection'] as const

function onError(error: unknown) {
  toast(
    error instanceof Error ? error.message : GOOGLE_CALENDAR_COPY.exportError,
    'error',
  )
}

function isNeedsReconnect(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const withCode = error as Error & { code?: string }
  return (
    withCode.code === 'needs_reconnect' ||
    error.message === GOOGLE_CALENDAR_COPY.tokenExpired
  )
}

export function useGoogleCalendarConnection() {
  return useQuery({
    queryKey: CONNECTION_QUERY_KEY,
    queryFn: getGoogleCalendarConnection,
    staleTime: 30_000,
  })
}

export function useLinkGoogleCalendar() {
  return useMutation({
    mutationFn: linkGoogleCalendar,
    onError,
  })
}

export function useVaultGoogleTokens() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: vaultGoogleTokensIfPresent,
    onSuccess: (result) => {
      if (result !== 'vaulted') return
      void qc.invalidateQueries({ queryKey: CONNECTION_QUERY_KEY })
      toast(GOOGLE_CALENDAR_COPY.connectSuccess, 'success')
    },
    onError,
  })
}

export function useExportGoogleCalendarMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ExportMonthInput) => exportVisibleMonth(input),
    onSuccess: (result: GoogleCalendarExportResult) => {
      if (result.code === 'empty_month') {
        toast(GOOGLE_CALENDAR_COPY.exportEmpty, 'info')
        return
      }
      if (result.code === 'partial') {
        toast(GOOGLE_CALENDAR_COPY.exportPartial, 'info')
        return
      }
      if (result.exportedCount > 0) {
        toast(GOOGLE_CALENDAR_COPY.exportSuccess, 'success')
        return
      }
      toast(GOOGLE_CALENDAR_COPY.exportError, 'error')
    },
    onError: (error: unknown) => {
      if (isNeedsReconnect(error)) {
        void qc.invalidateQueries({ queryKey: CONNECTION_QUERY_KEY })
      }
      onError(error)
    },
  })
}

export function useDisconnectGoogleCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONNECTION_QUERY_KEY })
      toast(GOOGLE_CALENDAR_COPY.disconnectSuccess, 'success')
    },
    onError,
  })
}
