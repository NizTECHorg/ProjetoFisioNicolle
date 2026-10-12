import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'
import {
  checkRateLimit,
  formatRetryAfter,
  mapAuthError,
  mapDbError,
  resetRateLimit,
  sanitizeEmail,
  sanitizeText,
} from '@/lib/security'
import { isRejectedAccount, normalizeJoinCode } from '@/lib/accountAccess'
import {
  accountNameSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  recoveryPasswordSchema,
  registerSchema,
  type LoginFormData,
  type RecoveryPasswordFormData,
  type RegisterFormData,
} from '@/schemas/auth.schema'
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
        `Muitas tentativas. Tente novamente em ${formatRetryAfter(rateCheck.retryAfterMs ?? 0)}.`,
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

  const { error } = await supabase.auth.signUp({
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
      emailRedirectTo: `${env.appUrl}/auth/confirm`,
    },
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }

  // Para evitar enumeração de contas (Account Enumeration) segundo as melhores práticas
  // de segurança e privacidade (LGPD), não vazamos para o cliente se o e-mail já existe.
  resetRateLimit(`auth:register:${email}`)

  return { needsEmailConfirmation: true }
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

export async function updateOwnName(userId: string, fullName: string): Promise<void> {
  const parsedName = accountNameSchema.parse(fullName)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ full_name: parsedName })
    .eq('id', userId)

  if (updateError) {
    throw new Error(mapDbError(updateError))
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { full_name: parsedName },
  })

  if (metadataError) {
    throw new Error(mapAuthError(metadataError))
  }
}

export async function changePassword(
  email: string,
  input: { currentPassword: string; newPassword: string; confirmPassword: string },
): Promise<void> {
  const parsed = changePasswordSchema(email).parse(input)

  const { error } = await supabase.auth.updateUser({
    password: parsed.newPassword,
    current_password: parsed.currentPassword,
  })

  if (error) {
    throw new Error(mapAuthError(error))
  }
}

function mapRecoveryRequestError(error: {
  message?: string
  status?: number
  code?: string
}): string {
  if (
    error.code === 'over_request_rate_limit' ||
    error.status === 429 ||
    (error.message?.toLowerCase().includes('rate limit') ?? false)
  ) {
    return mapAuthError(error)
  }

  return 'Não foi possível enviar o link. Tente de novo.'
}

export async function requestPasswordReset(emailInput: string): Promise<void> {
  const parsed = forgotPasswordSchema.parse({ email: emailInput })
  const email = sanitizeEmail(parsed.email)

  assertRateLimit([`auth:recovery:${email}`, 'auth:recovery:global'])

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/auth/confirm`,
  })

  if (error) {
    throw new Error(mapRecoveryRequestError(error))
  }

  resetRateLimit(`auth:recovery:${email}`)
}

export async function setPasswordFromRecovery(
  input: RecoveryPasswordFormData,
): Promise<void> {
  const parsed = recoveryPasswordSchema.parse(input)

  const rateKeys = ['auth:recovery:set:global']
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id) {
    rateKeys.unshift(`auth:recovery:set:${user.id}`)
  }
  assertRateLimit(rateKeys)

  const { error } = await supabase.auth.updateUser({
    password: parsed.password,
  })

  if (error) {
    throw new Error(
      mapAuthError(error) || 'Não foi possível salvar a nova senha. Tente de novo.',
    )
  }

  await signOut()
}
