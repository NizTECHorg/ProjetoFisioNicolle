import { supabase } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/security'
import {
  ACCOUNT_DELETE_WORD,
  ACCOUNT_DELETION_ERRORS,
  accountDeletionErrorMessage,
} from '@/lib/accountDeletion'

async function readFunctionsErrorPayload(
  error: { context?: unknown; message?: string } | null,
  data: unknown,
): Promise<{ status?: number; code?: string }> {
  if (data && typeof data === 'object' && typeof (data as { code?: unknown }).code === 'string') {
    return { code: (data as { code: string }).code }
  }
  const context = error?.context
  if (context && typeof context === 'object' && 'status' in context) {
    const response = context as Response
    const status = response.status
    try {
      const body = (await response.clone().json()) as { code?: unknown }
      return { status, code: typeof body.code === 'string' ? body.code : undefined }
    } catch {
      return { status }
    }
  }
  return {}
}

export async function deleteOwnAccount(userId: string, password: string): Promise<void> {
  const limit = checkRateLimit('account:delete:' + userId)
  if (!limit.allowed) {
    throw new Error(ACCOUNT_DELETION_ERRORS.rateLimited)
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: ACCOUNT_DELETE_WORD, password },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    // Diagnóstico sem PII: só status HTTP, código fixo e o tipo do erro do supabase-js.
    console.error('[delete-account]', {
      status: payload.status ?? null,
      code: payload.code ?? null,
      kind: (error as { name?: string }).name ?? null,
    })
    throw new Error(accountDeletionErrorMessage(payload.code, payload.status))
  }
  if ((data as { ok?: unknown } | null)?.ok !== true) {
    throw new Error(ACCOUNT_DELETION_ERRORS.generic)
  }
}

export async function countAccountDeletionPatients(): Promise<number | null> {
  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
  if (error) return null
  return count ?? null
}

export async function signOutAfterAccountDeletion(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* sessão já inválida no servidor */
  }
}
