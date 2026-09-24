import { useAuth } from '@/hooks/useAuth'

/** Escopo de cache por conta. O uid fica no fim da chave para o invalidate por prefixo continuar valendo. */
export function useAccountScope() {
  const { user } = useAuth()
  const userId = user?.id
  return {
    userId,
    signedIn: Boolean(userId),
  }
}
