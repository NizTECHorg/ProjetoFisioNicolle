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
  | { ok: false; message: string; consumed?: true }
  | { ok: false; ignored: true }

type AuthParams = {
  tokenHash: string | null
  type: EmailOtpType | null
  code: string | null
  accessToken: string | null
  errorDescription: string | null
  errorCode: string | null
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
    return {
      tokenHash: null,
      type: null,
      code: null,
      accessToken: null,
      errorDescription: null,
      errorCode: null,
    }
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
    errorCode: readParam(search, 'error_code') || readParam(hash, 'error_code'),
  }
}

const initialParams = parseHref(initialHref)

export function initialUrlHasAuthCallback() {
  return Boolean(
    initialParams.tokenHash ||
      initialParams.code ||
      initialParams.accessToken ||
      initialParams.errorDescription ||
      initialParams.errorCode,
  )
}

function typesToTry(hint: EmailOtpType | null): EmailOtpType[] {
  if (hint) return [hint]
  return ['signup', 'email', 'magiclink', 'invite']
}

function isConsumedErrorCode(code: string | null): boolean {
  const normalized = code?.toLowerCase() ?? ''
  return normalized === 'otp_expired' || normalized === 'access_denied'
}

function linkErrorIndicatesConsumed(message: string | undefined): boolean {
  const text = message?.toLowerCase() ?? ''
  if (text.includes('expired') || text.includes('otp_expired')) return true
  return text.includes('already') && text.includes('used')
}

function consumedFailure(message: string | undefined): ConfirmCallbackResult {
  return {
    ok: false,
    consumed: true,
    message: mapAuthError({ message: message ?? 'Email link is invalid or has expired' }),
  }
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

  if (linkErrorIndicatesConsumed(lastError?.message)) {
    return consumedFailure(lastError?.message)
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

  if (isConsumedErrorCode(initialParams.errorCode)) {
    return consumedFailure(initialParams.errorDescription ?? undefined)
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
    if (linkErrorIndicatesConsumed(initialParams.errorDescription)) {
      return consumedFailure(initialParams.errorDescription)
    }
    return { ok: false, message: mapAuthError({ message: initialParams.errorDescription }) }
  }

  return { ok: false, ignored: true }
}
