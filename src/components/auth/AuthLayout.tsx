import { BrandWordmark } from '@/components/brand/BrandWordmark'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footer?: React.ReactNode
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="auth-shell relative min-h-dvh overflow-hidden lg:flex lg:h-dvh">
      <aside className="relative z-10 hidden w-1/2 flex-col justify-between p-12 text-white xl:p-16 lg:flex">
        <BrandWordmark size="md" variant="onDark" asLink to="/" />

        <div className="max-w-md">
          <p className="font-display text-5xl font-semibold leading-tight tracking-tight">
            Cuidado em movimento.
          </p>
          <p className="mt-5 text-sm leading-6 text-white/65">
            Agenda, evoluções, exercícios e o histórico de cada paciente — em um painel
            limpo para o dia a dia da clínica.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Evolução clínica em um só lugar
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Agenda e lembretes da equipe
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Visão clara de cada paciente
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/40">FLUXO · Sua prática, mais inteligente.</p>
      </aside>

      <div className="relative z-10 lg:flex lg:w-1/2 lg:flex-col lg:p-2.5">
        <main className="auth-form-card flex min-h-dvh items-center justify-center px-4 py-12 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:rounded-[1.15rem] lg:px-8">
          <div className="w-full max-w-md landing-fade">
            <div className="mb-8 lg:hidden">
              <BrandWordmark size="sm" variant="onLight" asLink to="/" />
            </div>

            <header className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
              <p className="mt-2 text-sm text-muted">{subtitle}</p>
            </header>

            {children}

            {footer ? (
              <footer className="mt-6 text-center text-sm text-muted">{footer}</footer>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
