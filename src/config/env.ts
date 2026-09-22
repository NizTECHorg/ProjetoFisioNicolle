const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** Public SPA origin for Auth email links (confirm / reset). Never use localhost here. */
const DEFAULT_APP_URL = 'https://fluxofisio.vercel.app'

export function isEnvConfigured(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  if (SUPABASE_URL.includes('seu-projeto') || SUPABASE_ANON_KEY.includes('sua-chave')) return false

  try {
    const url = new URL(SUPABASE_URL)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

function resolveAppUrl(): string {
  const configured = String(import.meta.env.VITE_APP_URL ?? '').trim().replace(/\/$/, '')
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_APP_URL
}

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  /** Origin used in Auth `emailRedirectTo` (confirm signup / recovery). */
  appUrl: resolveAppUrl(),
  isDev: import.meta.env.DEV,
  isConfigured: isEnvConfigured(),
} as const
