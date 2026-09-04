import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { mobileNavItems, navigationItems } from '@/config/navigation'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { useAuth } from '@/hooks/useAuth'

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  gerente: 'Gerente',
  atendente: 'Fisioterapeuta',
  confeiteiro: 'Fisioterapeuta',
  entregador: 'Equipe',
}

export function AppShell() {
  const { profile, user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const displayName = profile?.full_name ?? user?.user_metadata.full_name ?? 'Usuário'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
  const roleLabel = profile ? (roleLabels[profile.role] ?? profile.role) : (user?.email ?? '')

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:h-dvh lg:overflow-hidden lg:bg-forest">
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-forest/50 backdrop-blur-[3px] lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-forest text-white transition-transform duration-200',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-[5.5rem] items-center justify-between px-5">
          <BrandWordmark
            size="sm"
            variant="onDark"
            showTagline={false}
            asLink
            to="/painel"
            onClick={() => setIsMenuOpen(false)}
          />
          <button
            type="button"
            aria-label="Fechar menu"
            className="rounded-xl p-2 text-white/60 hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav-scroll flex-1 overflow-y-auto px-3 py-2" aria-label="Navegação principal">
          <div className="space-y-1">
            {navigationItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/painel'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={18} strokeWidth={1.7} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              {initials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-white/45">{roleLabel}</p>
            </div>
            <button
              type="button"
              aria-label="Sair"
              title="Sair"
              onClick={() => void signOut()}
              className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-72 lg:flex lg:h-dvh lg:flex-col lg:p-2.5">
        <div className="min-h-dvh bg-canvas lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-[1.15rem] lg:bg-surface">
          <div className="panel-scroll min-h-dvh lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
            <header className="sticky top-0 z-20 flex items-center gap-3 bg-canvas/90 px-4 py-3 backdrop-blur-md lg:hidden">
              <button
                type="button"
                aria-label="Abrir menu"
                className="rounded-xl border border-line bg-surface p-2 text-ink/70"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <BrandWordmark size="sm" variant="onLight" showTagline={false} asLink to="/painel" />
            </header>

            <main className="px-4 py-6 pb-24 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-6 lg:pb-4 lg:pt-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Navegação móvel"
      >
        <div className="relative mx-auto flex max-w-md items-center justify-around rounded-full bg-forest px-1.5 py-1 shadow-[0_10px_24px_rgba(11,29,54,0.28)]">
          {mobileNavItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/painel'}
              className={({ isActive }) =>
                [
                  'flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-white/50',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                      isActive ? 'bg-white/12' : '',
                    ].join(' ')}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.1 : 1.7} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
