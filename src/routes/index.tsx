import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PatientsPage } from '@/pages/PatientsPage'
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

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/painel" element={<DashboardPage />} />
          <Route path="/pacientes" element={<PatientsPage />} />
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
