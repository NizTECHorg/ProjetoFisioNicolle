import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

/**
 * Cliente tipado de forma pragmática: o schema completo vive em database.types.ts
 * para o domínio da aplicação. Evitamos o genérico rígido do supabase-js aqui
 * porque Insert/Update circulares quebram a inferência (virando `never`).
 * A autoridade de segurança continua sendo RLS + RPCs no Postgres.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any

let client: SupabaseClient<AnyDatabase> | null = null

export function getSupabase(): SupabaseClient<AnyDatabase> {
  if (!env.isConfigured) {
    throw new Error('Supabase não configurado')
  }

  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Implícito: o link do e-mail confirma a conta em qualquer navegador.
        // No PKCE o Supabase desfaz a confirmação quando o code verifier não está nesse aparelho.
        flowType: 'implicit',
      },
      global: {
        headers: {
          'X-Client-Info': 'fisio-web',
        },
      },
    })
  }

  return client
}

export const supabase = new Proxy({} as SupabaseClient<AnyDatabase>, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop)
  },
})
