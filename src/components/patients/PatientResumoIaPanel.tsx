import { PatientAiComposer } from '@/components/patients/PatientAiComposer'
import { PatientAiReportsList } from '@/components/patients/PatientAiReportsList'
import { usePatient } from '@/hooks/usePatients'
import { formatGeneratedAt, SUMMARY_FIELD_KEYS, SUMMARY_FIELD_LABELS } from '@/lib/patientSummary'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'

type PatientResumoIaPanelProps = {
  patientId: string
  patientName?: string
  /** Fail-closed like images panel — never default true. */
  canWrite?: boolean
}

/**
 * Ficha hub for REQ-23: composer + PDF reports list (no Avaliação CRUD — D-01/D-06).
 * PDF export selects a saved evaluation ficha (D-07) via PatientAiComposer.
 * The original generation is read-only here; edited text lives on the Resumo tab.
 */
export function PatientResumoIaPanel({
  patientId,
  canWrite = false,
}: PatientResumoIaPanelProps) {
  const { data: detail } = usePatient(patientId)
  const generatedAtLabel = formatGeneratedAt(detail?.aiSummaryFields?.generatedAt)
  const extraFields = SUMMARY_FIELD_KEYS.flatMap((key) => {
    if (key === 'summary') return []
    const text = detail?.aiSummaryFields?.[key]
    if (typeof text !== 'string' || text.trim().length === 0) return []
    return [{ key, label: SUMMARY_FIELD_LABELS[key], text }]
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Resumo IA</p>
        <p className="mt-1 text-sm text-muted">{PATIENT_AI_COPY.resumoIaHelp}</p>
      </div>

      <PatientAiComposer patientId={patientId} canWrite={canWrite} />

      <section
        aria-label="Resumo original da IA"
        className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {PATIENT_AI_COPY.originalBlockLabel}
        </p>
        {generatedAtLabel ? <p className="mt-1 text-xs text-muted">{generatedAtLabel}</p> : null}
        {detail?.aiSummary ? (
          <>
            <p className="mt-4 text-sm leading-7 text-ink sm:text-base whitespace-pre-line break-words">
              {detail.aiSummary}
            </p>
            {extraFields.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {extraFields.map((field) => (
                  <li key={field.key}>
                    <p className="text-xs text-muted">{field.label}</p>
                    <p className="mt-1 text-sm leading-6 text-ink whitespace-pre-line break-words">
                      {field.text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {canWrite
              ? PATIENT_AI_COPY.originalEmptyCanWrite
              : PATIENT_AI_COPY.originalEmptyReadOnly}
          </p>
        )}
      </section>

      <PatientAiReportsList
        patientId={patientId}
        canWrite={canWrite}
        phone={detail?.phone}
        email={detail?.email}
      />
    </div>
  )
}
