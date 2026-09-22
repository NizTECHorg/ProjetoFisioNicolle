import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { AuthConfirmPage } from '@/pages/auth/AuthConfirmPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { WaitingApprovalPage } from '@/pages/auth/WaitingApprovalPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PatientsPage } from '@/pages/PatientsPage'
import { TeamPage } from '@/pages/TeamPage'
import { AutonomoFinancePage } from '@/pages/AutonomoFinancePage'
import { PatientPage } from '@/pages/PatientPage'
import { PatientCadastroPage } from '@/pages/PatientCadastroPage'
import { PatientModuleStubPage } from '@/pages/PatientModuleStubPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { KanbanPage } from '@/pages/KanbanPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/cadastro" element={<RegisterPage />} />
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
          <Route path="*" element={<Navigate to="/pacientes" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
