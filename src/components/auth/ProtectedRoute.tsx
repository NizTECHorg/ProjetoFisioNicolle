import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { safeRedirectPath } from '@/lib/security'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
    </div>
  )
}

function AccountWithoutProfile() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(11,29,54,0.06)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
          <ShieldAlert size={22} />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink">Conta sem perfil ativo</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sua conta foi autenticada, mas não possui um perfil ativo no sistema. Isso acontece
          quando o usuário foi criado antes da configuração do banco ou quando o perfil foi
          desativado por um administrador.
        </p>
        <div className="mt-6">
          <Button variant="secondary" fullWidth onClick={() => void signOut()}>
            Sair e voltar ao login
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { session, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!isAuthenticated) {
    return <AccountWithoutProfile />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  const from = safeRedirectPath(
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname,
  )

  if (isLoading) {
    return <LoadingScreen />
  }

  if (session) {
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
