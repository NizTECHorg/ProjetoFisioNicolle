import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Users } from 'lucide-react'
import userAddIcon from '@/assets/brand/icon.svg'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import { useAuth } from '@/hooks/useAuth'
import { useCreatePatient, usePatients } from '@/hooks/usePatients'
import { canWritePatient } from '@/lib/accountAccess'
import {
  PATIENT_SEARCH_THRESHOLD,
  filterPatientsByName,
  patientFichaPath,
  writablePatients,
} from '@/lib/dashboardShortcut'
import { createPatientSchema, type CreatePatientFormData } from '@/schemas/patient.schema'
import { statusLabels, type PatientListItem } from '@/types/patient'

type ShortcutKind = 'evolucao' | 'avaliacao'

type ShortcutState =
  | { step: 'closed' }
  | { step: 'create-patient' }
  | { step: 'picker'; kind: ShortcutKind }
  | { step: 'editor'; kind: 'evolucao'; patientId: string; patientName: string }

const SAVE_ERROR = 'Não foi possível salvar. Verifique os campos e tente de novo.'

export function DashboardClinicalShortcut() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: patients = [], isLoading, isError } = usePatients()
  const createPatient = useCreatePatient()
  const [state, setState] = useState<ShortcutState>({ step: 'closed' })
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const firstRowRef = useRef<HTMLButtonElement>(null)
  const createForm = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      birthDate: '',
      profession: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      adminNotes: '',
      referralSource: '',
      therapistName: '',
    },
  })

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

  function openCreatePatient() {
    createForm.reset()
    setState({ step: 'create-patient' })
  }

  function submitCreatePatient(values: CreatePatientFormData) {
    createPatient.mutate(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        birthDate: values.birthDate,
      },
      {
        onSuccess: ({ id }) => {
          closeShortcut()
          navigate(`/pacientes/${id}`)
        },
      },
    )
  }

  function goToPatients() {
    closeShortcut()
    navigate('/pacientes')
  }

  function selectPatient(kind: ShortcutKind, patient: PatientListItem) {
    if (!canWritePatient(user?.id, patient.createdBy)) return
    if (kind === 'avaliacao') {
      closeShortcut()
      navigate(patientFichaPath(patient.id, 'avaliacoes', { nova: true }))
      return
    }
    setQuery('')
    setState({
      step: 'editor',
      kind: 'evolucao',
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
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          aria-label="Criar paciente"
          title="Criar paciente"
          onClick={openCreatePatient}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:border-forest/20 hover:bg-accent-soft hover:text-forest"
        >
          <img src={userAddIcon} alt="" width={24} height={24} aria-hidden="true" className="h-6 w-6" />
        </button>
        <Button type="button" variant="secondary" onClick={() => openPicker('avaliacao')}>
          <Plus size={16} />
          Nova avaliação
        </Button>
        <Button type="button" onClick={() => openPicker('evolucao')}>
          <Plus size={16} />
          Nova evolução
        </Button>
      </div>

      {state.step === 'create-patient' ? (
        <Modal
          open
          title="Novo paciente"
          description="Cadastro rápido. Só o nome é obrigatório — o restante pode ser completado na ficha."
          onClose={closeShortcut}
        >
          <form className="space-y-4" onSubmit={createForm.handleSubmit(submitCreatePatient)}>
            <Input
              label="Nome completo"
              autoFocus
              error={createForm.formState.errors.fullName?.message}
              {...createForm.register('fullName')}
            />
            <Input
              label="Telefone"
              type="tel"
              hint="Opcional"
              error={createForm.formState.errors.phone?.message}
              {...createForm.register('phone')}
            />
            <Input
              label="Data de nascimento"
              type="date"
              hint="Opcional"
              error={createForm.formState.errors.birthDate?.message}
              {...createForm.register('birthDate')}
            />
            <Button type="submit" fullWidth isLoading={createPatient.isPending}>
              Criar ficha
            </Button>
          </form>
        </Modal>
      ) : null}

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
            <div className="min-w-0 space-y-3">
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
                <div className="min-w-0 space-y-2">
                  {filtered.map((patient, index) => (
                    <button
                      key={patient.id}
                      ref={index === 0 ? firstRowRef : undefined}
                      type="button"
                      className={[
                        'flex w-full min-h-11 min-w-0 items-center gap-2 rounded-2xl border border-line bg-surface p-4 text-left',
                        'hover:bg-canvas',
                      ].join(' ')}
                      onClick={() => selectPatient(state.kind, patient)}
                    >
                      <PatientAvatar name={patient.name} tone={patient.photoTone} initials={patient.initials} photoUrl={patient.photoUrl} />
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
          title="Nova sessão"
          description={state.patientName}
          onClose={closeShortcut}
        >
          <PatientSessionEditorForm
            patientId={state.patientId}
            cancelLabel="Voltar ao dashboard"
            submitLabel="Salvar sessão"
            successAction={{
              label: 'Ver ficha',
              href: patientFichaPath(state.patientId, 'secoes'),
            }}
            errorMessage={SAVE_ERROR}
            onCancel={closeShortcut}
            onSuccess={closeShortcut}
          />
        </Modal>
      ) : null}
    </>
  )
}
