import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
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
    withCode.code === 'insufficient_scope' ||
    error.message === GOOGLE_CALENDAR_COPY.tokenExpired ||
    error.message === GOOGLE_CALENDAR_COPY.insufficientScope
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

/**
 * Captures provider_refresh_token after OAuth return.
 * Must listen to onAuthStateChange — a one-shot getSession on mount races PKCE
 * and often skips vault while still showing a stale connection row.
 */
export function useEnsureGoogleCalendarVaulted(onVaulted?: () => void) {
  const vaultTokens = useVaultGoogleTokens()
  const vaultedRefresh = useRef<string | null>(null)
  const mutateRef = useRef(vaultTokens.mutate)
  mutateRef.current = vaultTokens.mutate

  useEffect(() => {
    let cancelled = false

    function tryVault(providerRefreshToken: string | null | undefined) {
      const token = providerRefreshToken?.trim()
      if (!token || cancelled) return
      if (vaultedRefresh.current === token) return
      vaultedRefresh.current = token

      mutateRef.current(undefined, {
        onSuccess: (result) => {
          if (cancelled || result !== 'vaulted') return
          onVaulted?.()
        },
        onError: () => {
          // Allow retry on next auth event if vault failed
          if (vaultedRefresh.current === token) vaultedRefresh.current = null
        },
      })
    }

    void supabase.auth.getSession().then(({ data }) => {
      tryVault(data.session?.provider_refresh_token)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      tryVault(session?.provider_refresh_token)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [onVaulted])
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
