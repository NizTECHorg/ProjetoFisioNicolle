import { supabase } from '@/lib/supabase/client'
import {
  checkRateLimit,
  mapAuthError,
  resetRateLimit,
  sanitizeEmail,
  sanitizeText,
} from '@/lib/security'
import { normalizeJoinCode } from '@/lib/accountAccess'
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/schemas/auth.schema'
import type { Profile } from '@/types/database.types'

function assertRateLimit(keys: string[]) {
  for (const key of keys) {
    const rateCheck = checkRateLimit(key)
    if (!rateCheck.allowed) {
      throw new Error(
        `Muitas tentativas. Tente novamente em ${Math.ceil((rateCheck.retryAfterMs ?? 0) / 60_000)} minutos.`,
      )
    }
  }
}

export async function signInWithEmail(data: LoginFormData): Promise<void> {
  const parsed = loginSchema.parse(data)
  const email = sanitizeEmail(parsed.email)

  assertRateLimit([`auth:login:${email}`, 'auth:login:global'])

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.password,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  resetRateLimit(`auth:login:${email}`)
}

export async function signUpWithEmail(
  data: RegisterFormData,
): Promise<{ needsEmailConfirmation: boolean }> {
  const parsed = registerSchema.parse(data)
  const email = sanitizeEmail(parsed.email)
  const fullName = sanitizeText(parsed.fullName, 100)

  assertRateLimit([`auth:register:${email}`, 'auth:register:global'])

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password: parsed.password,
    options: {
      data: {
        full_name: fullName,
        account_type: parsed.accountType,
        join_code:
          parsed.accountType === 'fisioterapeuta'
            ? normalizeJoinCode(parsed.joinCode ?? '')
            : null,
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  const identities = authData.user?.identities ?? []
  const isDuplicateProbe = Boolean(authData.user) && identities.length === 0

  if (!isDuplicateProbe) {
    resetRateLimit(`auth:register:${email}`)
  }

  return { needsEmailConfirmation: !authData.session || isDuplicateProbe }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(mapAuthError(error))
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, is_active, created_at, updated_at')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    return null
  }

  return data
}
