import { Navigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useFinancePrices, useFinanceRealizadas, useFinanceTotals } from '@/hooks/useFinance'
import { canSeeFinance } from '@/lib/accountAccess'

export function AutonomoFinancePage() {
  const { profile } = useAuth()
  const prices = useFinancePrices()
  const totals = useFinanceTotals()
  const realizadas = useFinanceRealizadas()

  if (!canSeeFinance(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }

  const isLoading = prices.isLoading || totals.isLoading || realizadas.isLoading
  const isError = prices.isError || totals.isError || realizadas.isError

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Financeiro"
        description="Catálogo de preços, sessões realizadas e o que já foi pago."
        action={
          <Button type="button">
            <Plus size={16} />
            Novo preço
          </Button>
        }
      />

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar o financeiro. Tente de novo em instantes.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-6">
          <section className="dash-in">
            <h2 className="text-xl font-semibold leading-tight text-ink">Totais</h2>
          </section>
          <section className="dash-in" style={{ animationDelay: '80ms' }}>
            <h2 className="text-xl font-semibold leading-tight text-ink">Catálogo de preços</h2>
          </section>
          <section className="dash-in" style={{ animationDelay: '120ms' }}>
            <h2 className="text-xl font-semibold leading-tight text-ink">Sessões realizadas</h2>
          </section>
        </div>
      ) : null}
    </section>
  )
}
