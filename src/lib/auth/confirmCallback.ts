import type { EmailOtpType } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/security'

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

export type ConfirmCallbackResult =
  | { ok: true }
  | { ok: false; message: string }
  | { ok: false; ignored: true }

type AuthParams = {
  tokenHash: string | null
  type: EmailOtpType | null
  code: string | null
  accessToken: string | null
  errorDescription: string | null
}

const initialHref = typeof window !== 'undefined' ? window.location.href : ''

function readParam(params: URLSearchParams, key: string) {
  return params.get(key) || params.get(`amp;${key}`)
}

function parseHref(href: string): AuthParams {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { tokenHash: null, type: null, code: null, accessToken: null, errorDescription: null }
  }

  const search = url.searchParams
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const rawType = readParam(search, 'type') || readParam(hash, 'type')
  const type = rawType && OTP_TYPES.has(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null

  return {
    tokenHash: readParam(search, 'token_hash') || readParam(hash, 'token_hash'),
    type,
    code: readParam(search, 'code') || readParam(hash, 'code'),
    accessToken: readParam(hash, 'access_token'),
    errorDescription: readParam(search, 'error_description') || readParam(hash, 'error_description'),
  }
}

const initialParams = parseHref(initialHref)

export function initialUrlHasAuthCallback() {
  return Boolean(
    initialParams.tokenHash || initialParams.code || initialParams.accessToken || initialParams.errorDescription,
  )
}

function typesToTry(hint: EmailOtpType | null): EmailOtpType[] {
  const ordered: EmailOtpType[] = []
  if (hint) ordered.push(hint)
  for (const fallback of ['signup', 'email', 'magiclink', 'invite'] as const) {
    if (!ordered.includes(fallback)) ordered.push(fallback)
  }
  return ordered
}

function canTryAnotherType(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? ''
  if (error.status === 429 || message.includes('rate limit')) return false
  if (message.includes('network') || message.includes('fetch')) return false
  return true
}

async function verifyTokenHash(tokenHash: string, hint: EmailOtpType | null): Promise<ConfirmCallbackResult> {
  let lastError: { message?: string; status?: number } | null = null

  for (const type of typesToTry(hint)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return { ok: true }
    lastError = error
    if (!canTryAnotherType(error)) break
  }

  return {
    ok: false,
    message: mapAuthError(lastError ?? { message: 'Email link is invalid or has expired' }),
  }
}

async function sessionExists() {
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}

let confirmPromise: Promise<ConfirmCallbackResult> | null = null

/**
 * Confirma o e-mail uma única vez por carregamento da página.
 * Aceita token_hash (qualquer navegador), code PKCE e o hash do fluxo implícito.
 */
export function confirmFromInitialUrl(): Promise<ConfirmCallbackResult> {
  if (!confirmPromise) {
    confirmPromise = runConfirm()
  }
  return confirmPromise
}

async function runConfirm(): Promise<ConfirmCallbackResult> {
  if (initialParams.tokenHash) {
    return verifyTokenHash(initialParams.tokenHash, initialParams.type)
  }

  if (await sessionExists()) {
    if (initialParams.accessToken || initialParams.code) return { ok: true }
    return { ok: false, ignored: true }
  }

  if (initialParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(initialParams.code)
    if (!error || (await sessionExists())) return { ok: true }
    return { ok: false, message: mapAuthError(error) }
  }

  if (initialParams.errorDescription) {
    return { ok: false, message: mapAuthError({ message: initialParams.errorDescription }) }
  }

  return { ok: false, ignored: true }
}
