import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { confirmFromInitialUrl, initialUrlHasAuthCallback } from '@/lib/auth/confirmCallback'
import { fetchProfile, signOut as authSignOut } from '@/services/auth.service'
import { fetchMembership } from '@/services/team.service'
import { isPendingTherapist } from '@/lib/accountAccess'
import { AuthContext, type AuthContextValue } from '@/hooks/useAuth'
import type { ClinicProfile, Membership } from '@/types/account'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [profile, setProfile] = useState<ClinicProfile | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    void (async () => {
      if (initialUrlHasAuthCallback()) {
        await confirmFromInitialUrl()
      }
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      setSessionLoaded(true)
    })()

    // IMPORTANTE: este callback precisa ser síncrono. Fazer await de consultas
    // ao banco aqui causa deadlock no lock interno de auth do supabase-js
    // (o spinner infinito no login). O perfil é carregado no efeito abaixo.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setSessionLoaded(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setMembership(null)
      setProfileLoading(false)
      return
    }

    let cancelled = false
    setProfileLoading(true)

    void Promise.all([
      fetchProfile(userId),
      fetchMembership(userId).catch(() => null),
    ]).then(([userProfile, userMembership]) => {
      if (cancelled) return
      setProfile(userProfile)
      setMembership(userMembership)
      setProfileLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
    setProfile(null)
    setMembership(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      membership,
      isLoading: !sessionLoaded || profileLoading,
      // Fail-closed (D-03): pending or fisio-without-membership never enters the clinic.
      isAuthenticated:
        !!session &&
        !!profile &&
        profile.isActive === true &&
        !isPendingTherapist(profile.accountType, membership?.status) &&
        !(profile.accountType === 'fisioterapeuta' && membership === null),
      signOut,
    }),
    [session, profile, membership, sessionLoaded, profileLoading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
