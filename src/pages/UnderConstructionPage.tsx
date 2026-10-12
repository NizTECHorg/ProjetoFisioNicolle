import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { navigationItems } from '@/config/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

/** Página provisória dos módulos que ainda estão sendo construídos (ícone de obra no menu). */
export function UnderConstructionPage() {
  const { pathname } = useLocation()
  const item = navigationItems.find((entry) => entry.path === pathname)

  return (
    <section className="mx-auto w-full max-w-4xl">
      <PageHeader className="dash-in" title={item?.label ?? 'Em construção'} />
      <article className="dash-in flex min-h-60 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-forest">
          <Construction size={26} aria-hidden />
        </span>
        <p className="mt-4 text-base font-semibold text-ink">Em construção</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted">
          Esta área está sendo preparada e chega em breve.
        </p>
      </article>
    </section>
  )
}
