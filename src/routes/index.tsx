import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthConfirmPage } from '@/pages/auth/AuthConfirmPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { WaitingApprovalPage } from '@/pages/auth/WaitingApprovalPage'
import { ChunkErrorBoundary, RouteFallback } from './RouteFallback'

const LandingPage = lazy(() =>
  import('@/pages/landing/LandingPage').then((m) => ({
    default: m.LandingPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((m) => ({ default: m.AppShell })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const PatientsPage = lazy(() =>
  import('@/pages/PatientsPage').then((m) => ({ default: m.PatientsPage })),
)
const TeamPage = lazy(() => import('@/pages/TeamPage').then((m) => ({ default: m.TeamPage })))
const AutonomoFinancePage = lazy(() =>
  import('@/pages/AutonomoFinancePage').then((m) => ({
    default: m.AutonomoFinancePage,
  })),
)
const TermsPage = lazy(() =>
  import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })),
)
const PatientPage = lazy(() =>
  import('@/pages/PatientPage').then((m) => ({ default: m.PatientPage })),
)
const PatientCadastroPage = lazy(() =>
  import('@/pages/PatientCadastroPage').then((m) => ({
    default: m.PatientCadastroPage,
  })),
)
const PatientModuleStubPage = lazy(() =>
  import('@/pages/PatientModuleStubPage').then((m) => ({
    default: m.PatientModuleStubPage,
  })),
)
const CalendarPage = lazy(() =>
  import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const KanbanPage = lazy(() => import('@/pages/KanbanPage').then((m) => ({ default: m.KanbanPage })))
const AccountPage = lazy(() =>
  import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })),
)
const UnderConstructionPage = lazy(() =>
  import('@/pages/UnderConstructionPage').then((m) => ({
    default: m.UnderConstructionPage,
  })),
)

export function AppRoutes() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          </Route>

          {/* Público: verifyOtp por token_hash (confirm / recovery) — fora do GuestRoute */}
          <Route path="/auth/confirm" element={<AuthConfirmPage />} />
          <Route path="/aguardando" element={<WaitingApprovalPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/painel" element={<DashboardPage />} />
              <Route path="/pacientes" element={<PatientsPage />} />
              <Route path="/equipe" element={<TeamPage />} />
              <Route path="/financeiro" element={<AutonomoFinancePage />} />
              <Route path="/pacientes/:id" element={<PatientPage />} />
              <Route path="/pacientes/:id/cadastro" element={<PatientCadastroPage />} />
              <Route path="/pacientes/:id/:module" element={<PatientModuleStubPage />} />
              <Route path="/agenda" element={<CalendarPage />} />
              <Route path="/quadro" element={<KanbanPage />} />
              <Route path="/kanban" element={<Navigate to="/quadro" replace />} />
              <Route path="/conta" element={<AccountPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="/testes-especiais" element={<UnderConstructionPage />} />
            </Route>
          </Route>

          {/* Endereço inexistente (logado ou não): página 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ChunkErrorBoundary>
  )
}
