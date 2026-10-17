import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { useAuth } from '@/hooks/useAuth'
import { usePatients } from '@/hooks/usePatients'
import { filterPatientsByName, writablePatients } from '@/lib/dashboardShortcut'
import type { PatientListItem } from '@/types/patient'

type PatientPickerProps = {
  value: PatientListItem | null
  onChange: (patient: PatientListItem | null) => void
  disabled?: boolean
}

export function PatientPicker({ value, onChange, disabled }: PatientPickerProps) {
  const { user } = useAuth()
  const { data: patients = [], isLoading } = usePatients()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const writable = useMemo(() => writablePatients(patients, user?.id), [patients, user?.id])
  const matches = useMemo(() => filterPatientsByName(writable, query).slice(0, 30), [writable, query])

  if (value) {
    return (
      <div className="space-y-2">
        <p className="block text-sm font-medium text-ink">Paciente</p>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-2.5">
          <PatientAvatar
            name={value.name}
            tone={value.photoTone}
            initials={value.initials}
            size="sm"
            photoUrl={value.photoUrl}
          />
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{value.name}</span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={disabled}
            onClick={() => {
              setQuery('')
              onChange(null)
            }}
          >
            Trocar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute bottom-[1.1rem] left-4 text-muted"
        />
        <Input
          label="Paciente"
          placeholder="Digite o nome"
          autoComplete="off"
          className="pl-11"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </div>
      {open ? (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-line bg-canvas">
          {isLoading ? (
            <li className="px-4 py-3 text-sm text-muted">Carregando pacientes…</li>
          ) : matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">Nenhum paciente encontrado.</li>
          ) : (
            matches.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(patient)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <PatientAvatar
                    name={patient.name}
                    tone={patient.photoTone}
                    initials={patient.initials}
                    size="sm"
                    photoUrl={patient.photoUrl}
                  />
                  <span className="min-w-0 truncate text-sm font-medium text-ink">{patient.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
