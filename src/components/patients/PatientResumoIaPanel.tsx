import { PatientAiComposer } from '@/components/patients/PatientAiComposer'
import { PatientAiReportsList } from '@/components/patients/PatientAiReportsList'

type PatientResumoIaPanelProps = {
  patientId: string
  patientName?: string
  /** Fail-closed like images panel — never default true. */
  canWrite?: boolean
}

/**
 * Ficha hub for REQ-23: composer + PDF reports list (no Avaliação CRUD — D-01/D-06).
 */
export function PatientResumoIaPanel({
  patientId,
  canWrite = false,
}: PatientResumoIaPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Resumo IA</p>
        <p className="mt-1 text-sm text-muted">
          Gere o resumo clínico ou exporte PDFs. O texto gerado aparece em Resumo do paciente.
        </p>
      </div>

      <PatientAiComposer patientId={patientId} canWrite={canWrite} />

      <PatientAiReportsList patientId={patientId} canWrite={canWrite} />
    </div>
  )
}
