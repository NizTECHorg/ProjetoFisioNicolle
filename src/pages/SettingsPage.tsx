import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'

export function SettingsPage() {
  const { profile, user, signOut } = useAuth()

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader
        title="Configurações"
        description="Preferências da conta, segurança da sessão e políticas do sistema."
      />

      <div className="space-y-4">
        <article className="rounded-xl border border-dark-border bg-dark-surface p-6">
          <h2 className="text-sm font-medium">Conta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-cream/40">Nome</dt>
              <dd>{profile?.fullName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cream/40">E-mail</dt>
              <dd>{user?.email ?? profile?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cream/40">Papel</dt>
              <dd>
                <Badge tone="caramel">{profile?.role ?? '—'}</Badge>
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-dark-border bg-dark-surface p-6">
          <h2 className="text-sm font-medium">Segurança</h2>
          <ul className="mt-4 space-y-2 text-sm text-cream/55">
            <li>Sessão autenticada com PKCE no Supabase Auth.</li>
            <li>Acesso aos dados protegido por Row Level Security.</li>
            <li>Históricos preservados — exclusões físicas bloqueadas no cliente.</li>
            <li>Operações críticas (confirmar pedido, produção, estoque) via RPCs no banco.</li>
          </ul>
          <div className="mt-5">
            <Button variant="secondary" onClick={() => void signOut()}>
              Encerrar sessão
            </Button>
          </div>
        </article>
      </div>
    </section>
  )
}
