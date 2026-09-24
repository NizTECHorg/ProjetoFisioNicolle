import { useEffect, useState } from 'react'
import { useUpdatePatient } from '@/hooks/usePatients'
import type { PatientStatus } from '@/types/patient'

const OPTIONS: Array<{ value: PatientStatus; label: string }> = [
  { value: 'em_tratamento', label: 'Em tratamento' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'alta', label: 'Alta' },
  { value: 'inativo', label: 'Inativo' },
]

type PatientStatusToggleProps = {
  patientId: string
  status: PatientStatus
}

export function PatientStatusToggle({ patientId, status }: PatientStatusToggleProps) {
  const update = useUpdatePatient()
  const [current, setCurrent] = useState(status)

  useEffect(() => {
    setCurrent(status)
  }, [status])

  return (
    <div
      className="inline-flex flex-wrap items-center gap-0.5 rounded-full border border-ink/15 p-0.5"
      role="radiogroup"
      aria-label="Status do paciente"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {OPTIONS.map((option) => {
        const selected = current === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={update.isPending && current === option.value}
            onClick={() => {
              if (selected) return
              const previous = current
              setCurrent(option.value)
              update.mutate(
                { id: patientId, input: { status: option.value } },
                { onError: () => setCurrent(previous) },
              )
            }}
            className={[
              'rounded-full px-2.5 py-1 text-xs transition',
              selected ? 'bg-accent-soft font-medium text-forest' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
