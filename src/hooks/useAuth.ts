import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { ClinicProfile, Membership } from '@/types/account'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: ClinicProfile | null
  membership: Membership | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
