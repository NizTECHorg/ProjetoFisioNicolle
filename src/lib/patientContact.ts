export type ContactFailure = 'missing' | 'invalid'

export type ResolvedEmail =
  | { ok: true; email: string }
  | { ok: false; reason: ContactFailure }

export type ResolvedWhatsApp =
  | { ok: true; digits: string }
  | { ok: false; reason: ContactFailure }

const PLACEHOLDER = '—'

function usableText(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed === PLACEHOLDER) return null
  return trimmed
}

/** Local part, one @, domain with a dot, no spaces. */
const USABLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function resolvePatientEmail(value: string | null | undefined): ResolvedEmail {
  const email = usableText(value)
  if (email == null) return { ok: false, reason: 'missing' }
  if (!USABLE_EMAIL.test(email)) return { ok: false, reason: 'invalid' }
  return { ok: true, email }
}

export function resolveWhatsAppDigits(value: string | null | undefined): ResolvedWhatsApp {
  const text = usableText(value)
  if (text == null) return { ok: false, reason: 'missing' }
  const digits = text.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) {
    return { ok: true, digits: `55${digits}` }
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return { ok: true, digits }
  }
  return { ok: false, reason: 'invalid' }
}
