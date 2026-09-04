import { useLocation } from 'react-router-dom'
import { navigationItems } from '@/config/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

export function BlankPage() {
  const { pathname } = useLocation()
  const item = navigationItems.find((entry) => entry.path === pathname)

  return (
    <section className="mx-auto max-w-4xl">
      <PageHeader
        title={item?.label ?? 'Fluxo'}
        description="Este módulo entra em seguida. A navegação e o visual da clínica já estão no padrão azul e branco."
      />
      <article className="rounded-2xl border border-line bg-surface p-8 text-sm leading-6 text-muted">
        Nada por aqui ainda.
      </article>
    </section>
  )
}
