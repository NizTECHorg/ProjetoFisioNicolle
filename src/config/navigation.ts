import { CalendarDays, Home, LayoutDashboard, SquareKanban, UserPlus, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { AccountType } from '@/types/account'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/painel', icon: LayoutDashboard },
  { label: 'Pacientes', path: '/pacientes', icon: Users },
  { label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { label: 'Quadro', path: '/quadro', icon: SquareKanban },
  { label: 'Equipe', path: '/equipe', icon: UserPlus },
  { label: 'Financeiro', path: '/financeiro', icon: Wallet },
]

export function clinicNavigationItems(accountType: AccountType | null | undefined): NavigationItem[] {
  return navigationItems.filter((item) => {
    if (item.path === '/equipe') return accountType === 'empresa'
    if (item.path === '/financeiro') return accountType === 'autonomo'
    return true
  })
}

export const mobileNavItems: NavigationItem[] = [
  { label: 'Início', path: '/painel', icon: Home },
  { label: 'Pacientes', path: '/pacientes', icon: Users },
  { label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { label: 'Quadro', path: '/quadro', icon: SquareKanban },
]
