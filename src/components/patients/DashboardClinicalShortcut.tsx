import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { PatientEvaluationEditorForm } from '@/components/patients/PatientEvaluationEditorForm'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import { useAuth } from '@/hooks/useAuth'
import { usePatients } from '@/hooks/usePatients'
import { canWritePatient } from '@/lib/accountAccess'
import {
  PATIENT_SEARCH_THRESHOLD,
  filterPatientsByName,
  patientFichaPath,
  writablePatients,
} from '@/lib/dashboardShortcut'
import { statusLabels, type PatientListItem } from '@/types/patient'

type ShortcutKind = 'evolucao' | 'avaliacao'

type ShortcutState =
  | { step: 'closed' }
  | { step: 'picker'; kind: ShortcutKind }
  | { step: 'editor'; kind: ShortcutKind; patientId: string; patientName: string }

const SAVE_ERROR = 'Não foi possível salvar. Verifique os campos e tente de novo.'

export function DashboardClinicalShortcut() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: patients = [], isLoading, isError } = usePatients()
  const [state, setState] = useState<ShortcutState>({ step: 'closed' })
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const firstRowRef = useRef<HTMLButtonElement>(null)

  const writable = useMemo(
    () => writablePatients(patients, user?.id),
    [patients, user?.id],
  )
  const filtered = useMemo(
    () => filterPatientsByName(writable, query),
    [query, writable],
  )
  const showSearch = writable.length >= PATIENT_SEARCH_THRESHOLD
  const pickerKind = state.step === 'picker' ? state.kind : null

  function closeShortcut() {
    setQuery('')
    setState({ step: 'closed' })
  }

  function openPicker(kind: ShortcutKind) {
    setQuery('')
    setState({ step: 'picker', kind })
  }

  function goToPatients() {
    closeShortcut()
    navigate('/pacientes')
  }

  function selectPatient(kind: ShortcutKind, patient: PatientListItem) {
    if (!canWritePatient(user?.id, patient.createdBy)) return
    setQuery('')
    setState({
      step: 'editor',
      kind,
      patientId: patient.id,
      patientName: patient.name,
    })
  }

  useEffect(() => {
    if (state.step !== 'picker') return
    if (isLoading || isError || writable.length === 0) return
    if (showSearch) {
      searchInputRef.current?.focus()
      return
    }
    firstRowRef.current?.focus()
  }, [isError, isLoading, pickerKind, showSearch, state.step, writable.length])

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={() => openPicker('evolucao')}>
          <Plus size={16} />
          Nova evolução
        </Button>
        <Button type="button" variant="secondary" onClick={() => openPicker('avaliacao')}>
          <Plus size={16} />
          Nova avaliação
        </Button>
      </div>

      {state.step === 'picker' ? (
        <Modal
          open
          title={state.kind === 'evolucao' ? 'Nova evolução' : 'Nova avaliação'}
          description="Escolha o paciente para abrir o formulário."
          onClose={closeShortcut}
        >
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
          ) : null}

          {isError ? (
            <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
              Não foi possível carregar os pacientes. Tente de novo em instantes.
            </article>
          ) : null}

          {!isLoading && !isError && writable.length === 0 ? (
            <article className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Users size={22} />
              </div>
              <p className="mt-4 text-sm font-semibold text-ink">Nenhum paciente para registrar</p>
              <p className="mt-1 max-w-sm text-sm leading-5 text-muted">
                Cadastre um paciente em Pacientes. Depois volte aqui para criar a evolução ou a avaliação.
              </p>
              <Button type="button" variant="secondary" className="mt-4" onClick={goToPatients}>
                Ir para pacientes
              </Button>
            </article>
          ) : null}

          {!isLoading && !isError && writable.length > 0 ? (
            <div className="space-y-3">
              {showSearch ? (
                <Input
                  ref={searchInputRef}
                  label="Buscar paciente"
                  placeholder="Nome do paciente"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              ) : null}

              {filtered.length === 0 ? (
                <p className="text-sm text-muted">Nenhum paciente com esse nome.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((patient, index) => (
                    <button
                      key={patient.id}
                      ref={index === 0 ? firstRowRef : undefined}
                      type="button"
                      className={[
                        'flex w-full min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface p-4 text-left',
                        'hover:bg-canvas',
                      ].join(' ')}
                      onClick={() => selectPatient(state.kind, patient)}
                    >
                      <PatientAvatar name={patient.name} tone={patient.photoTone} initials={patient.initials} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{patient.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {statusLabels[patient.status]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {state.step === 'editor' ? (
        <Modal
          open
          wide
          title={state.kind === 'evolucao' ? 'Nova sessão' : 'Nova avaliação'}
          description={state.patientName}
          onClose={closeShortcut}
        >
          {state.kind === 'evolucao' ? (
            <PatientSessionEditorForm
              patientId={state.patientId}
              cancelLabel="Voltar ao dashboard"
              submitLabel="Salvar sessão"
              successAction={{
                label: 'Ver ficha',
                href: patientFichaPath(state.patientId, 'evolucoes'),
              }}
              errorMessage={SAVE_ERROR}
              onCancel={closeShortcut}
              onSuccess={closeShortcut}
            />
          ) : (
            <PatientEvaluationEditorForm
              patientId={state.patientId}
              cancelLabel="Voltar ao dashboard"
              submitLabel="Salvar avaliação"
              showInnerHeading={false}
              successAction={{
                label: 'Ver ficha',
                href: patientFichaPath(state.patientId, 'avaliacao'),
              }}
              errorMessage={SAVE_ERROR}
              onCancel={closeShortcut}
              onSuccess={closeShortcut}
            />
          )}
        </Modal>
      ) : null}
    </>
  )
}
