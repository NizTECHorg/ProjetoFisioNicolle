import { supabase } from '@/lib/supabase/client'
import {
  checkRateLimit,
  mapAuthError,
  resetRateLimit,
  sanitizeEmail,
  sanitizeText,
} from '@/lib/security'
import { isRejectedAccount, normalizeJoinCode } from '@/lib/accountAccess'
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/schemas/auth.schema'
import { fetchMembership } from '@/services/team.service'
import type { AccountType, ClinicProfile } from '@/types/account'

const ACCOUNT_TYPES = new Set<AccountType>(['autonomo', 'empresa', 'fisioterapeuta'])

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: string
  avatar_url: string | null
  is_active: boolean
  account_type: string | null
  created_at: string
  updated_at: string
}

function mapAccountType(value: string | null): AccountType {
  if (value && ACCOUNT_TYPES.has(value as AccountType)) {
    return value as AccountType
  }
  return 'autonomo'
}

function mapClinicProfile(row: ProfileRow): ClinicProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    email: row.email ?? '',
    role: row.role,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    accountType: mapAccountType(row.account_type),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

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

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.password,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  resetRateLimit(`auth:login:${email}`)

  const userId = authData.user?.id
  if (!userId) return

  const profile = await fetchProfile(userId)
  if (!profile) return

  let membership = null
  try {
    membership = await fetchMembership(userId)
  } catch {
    // Query error: keep session. AuthProvider fail-closes fisio to /aguardando (D-03).
  }

  if (isRejectedAccount(profile.isActive, membership?.status)) {
    await signOut()
    throw new Error('Pedido recusado. Use outro e-mail para um novo cadastro.')
  }
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

export async function fetchProfile(userId: string): Promise<ClinicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, is_active, account_type, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapClinicProfile(data as ProfileRow)
}
