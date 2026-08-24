import { Navigate, useParams } from 'react-router-dom'

/** Mantém links antigos de /cadastro redirecionando para a aba unificada. */
export function PatientCadastroPage() {
  const { id } = useParams()
  if (!id) return <Navigate to="/pacientes" replace />
  return <Navigate to={`/pacientes/${id}?aba=cadastro`} replace />
}
