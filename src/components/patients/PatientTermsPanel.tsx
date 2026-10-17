import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TermList } from '@/components/terms/TermList'
import { usePatientTerms } from '@/hooks/usePatientTerms'

interface PatientTermsPanelProps {
  patientId: string
  canWrite: boolean
}

export function PatientTermsPanel({ patientId, canWrite }: PatientTermsPanelProps) {
  const navigate = useNavigate()
  const q = usePatientTerms(patientId)
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Arquivos</p>
        <p className="mt-1 text-sm text-muted">Termos assinados pelo paciente, em PDF.</p>
      </div>
      <TermList
        terms={q.data}
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={() => void q.refetch()}
        showPatient={false}
        canDelete={() => canWrite}
        emptyTitle="Nenhum termo assinado."
        emptyBody="Abra Termos no menu para o paciente assinar. Os PDFs ficam aqui."
        emptyAction={
          <Button type="button" variant="secondary" onClick={() => navigate('/termos')}>
            Ir para Termos
          </Button>
        }
      />
    </div>
  )
}
