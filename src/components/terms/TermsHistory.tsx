import { useMemo, useState } from 'react'
import { TermList } from '@/components/terms/TermList'
import { useAuth } from '@/hooks/useAuth'
import { usePatients } from '@/hooks/usePatients'
import { usePatientTerms } from '@/hooks/usePatientTerms'
import { canWritePatient } from '@/lib/accountAccess'
import { CONSENT_TERMS } from '@/lib/consentTerms'

const EMPTY_BODY = 'Os termos assinados de cada paciente ficam guardados aqui depois de salvos.'

export function TermsHistory({ patientId }: { patientId: string | null }) {
  const { user } = useAuth()
  const { data: patients = [] } = usePatients()
  const q = usePatientTerms(patientId ?? undefined)
  const [filter, setFilter] = useState<string>('all')

  const createdByById = useMemo(() => new Map(patients.map((p) => [p.id, p.createdBy])), [patients])

  const types = useMemo(() => {
    const present = new Set((q.data ?? []).map((t) => t.termType))
    return CONSENT_TERMS.filter((t) => present.has(t.key))
  }, [q.data])

  const activeFilter = types.some((t) => t.key === filter) ? filter : 'all'
  const filtered = useMemo(
    () => (q.data ? q.data.filter((t) => activeFilter === 'all' || t.termType === activeFilter) : q.data),
    [q.data, activeFilter],
  )

  const chipClass = (active: boolean) =>
    [
      'min-h-11 rounded-full border px-4 text-sm font-semibold',
      active ? 'border-forest bg-forest text-white' : 'border-line bg-canvas text-ink hover:border-forest/25',
    ].join(' ')

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 md:p-6">
      <h2 className="text-xl font-semibold text-ink">Termos salvos na nuvem</h2>
      <p className="mt-1 text-sm text-muted">{EMPTY_BODY}</p>
      {types.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de termo">
          <button type="button" className={chipClass(activeFilter === 'all')} onClick={() => setFilter('all')}>
            Todos
          </button>
          {types.map((t) => (
            <button
              key={t.key}
              type="button"
              className={chipClass(activeFilter === t.key)}
              onClick={() => setFilter(t.key)}
            >
              {t.category}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        <TermList
          terms={filtered}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => void q.refetch()}
          showPatient={!patientId}
          canDelete={(t) => canWritePatient(user?.id, createdByById.get(t.patientId))}
          emptyTitle="Nenhum termo salvo ainda."
          emptyBody={EMPTY_BODY}
        />
      </div>
    </section>
  )
}
