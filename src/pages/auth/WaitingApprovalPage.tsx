import { Navigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function WaitingApprovalPage() {
  const { session, profile, membership, isAuthenticated, isLoading, signOut } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (isAuthenticated) {
    return <Navigate to="/painel" replace />
  }

  const membershipUnknown =
    profile?.accountType === 'fisioterapeuta' && membership === null && profile.isActive

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(11,29,54,0.06)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Clock size={22} />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink">Aguardando aprovação</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {membershipUnknown
            ? 'Não foi possível confirmar seu pedido. Saia e entre de novo.'
            : 'Seu cadastro foi concluído. A empresa ainda precisa aceitar seu pedido. Você não pode usar a clínica até lá.'}
        </p>
        <div className="mt-6">
          <Button variant="secondary" fullWidth onClick={() => void signOut()}>
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}
