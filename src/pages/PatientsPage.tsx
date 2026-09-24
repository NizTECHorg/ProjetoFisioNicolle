import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PatientPhotoControl } from '@/components/patients/PatientPhotoControl'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { filterPatientsByName } from '@/lib/dashboardShortcut'
import { useAuth } from '@/hooks/useAuth'
import { canWritePatient } from '@/lib/accountAccess'
import { useCreatePatient, usePatients } from '@/hooks/usePatients'
import { createPatientSchema, type CreatePatientFormData } from '@/schemas/patient.schema'
import { statusLabels, type PatientListItem } from '@/types/patient'

type PatientSort = 'recent' | 'name' | 'next'

const SORT_OPTIONS: Array<{ value: PatientSort; label: string }> = [
  { value: 'recent', label: 'Paciente mais recente' },
  { value: 'name', label: 'Ordem alfabética' },
  { value: 'next', label: 'Sessão mais próxima' },
]

function nearestSessionTime(patient: PatientListItem) {
  const iso = patient.nextSession?.scheduledAt
  if (!iso) return Number.POSITIVE_INFINITY
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time) || time < Date.now()) return Number.POSITIVE_INFINITY
  return time
}

function sortPatients(patients: PatientListItem[], sort: PatientSort) {
  const copy = [...patients]
  const byName = (a: PatientListItem, b: PatientListItem) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  if (sort === 'name') {
    copy.sort(byName)
    return copy
  }
  if (sort === 'next') {
    copy.sort((a, b) => nearestSessionTime(a) - nearestSessionTime(b) || byName(a, b))
    return copy
  }
  copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b))
  return copy
}

export function PatientsPage() {
  const { user, profile } = useAuth()
  const { data: patients = [], isLoading, isError } = usePatients()
  const create = useCreatePatient()
  const navigate = useNavigate()

  function fichaDeLine(patient: PatientListItem) {
    if (profile?.accountType !== 'empresa' || !patient.createdBy || patient.createdBy === user?.id) {
      return null
    }
    return `Ficha de ${patient.createdByName || 'fisioterapeuta'}`
  }
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PatientSort>('recent')
  const visible = useMemo(
    () => sortPatients(filterPatientsByName(patients, query), sort),
    [patients, query, sort],
  )

  const form = useForm<CreatePatientFormData>({
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

  function openCreate() {
    form.reset()
    setOpen(true)
  }

  function onSubmit(values: CreatePatientFormData) {
    create.mutate(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        birthDate: values.birthDate,
      },
      {
        onSuccess: ({ id }) => {
          setOpen(false)
          navigate(`/pacientes/${id}`)
        },
      },
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Pacientes"
        description="Cadastros da clínica. Toque no card ou na linha para abrir a ficha."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo paciente
          </Button>
        }
      />

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar os pacientes. Confira se o script SQL já foi executado no Supabase.
        </article>
      ) : null}

      {!isLoading && !isError && patients.length === 0 ? (
        <article className="dash-in rounded-2xl border border-line bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">Nenhum paciente cadastrado ainda.</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={16} />
            Cadastrar primeiro paciente
          </Button>
        </article>
      ) : null}

      {!isLoading && !isError && patients.length > 0 ? (
        <>
          <div className="mb-4 space-y-3">
            <Input
              label="Buscar paciente"
              placeholder="Digite o nome"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Ordenar pacientes">
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSort(option.value)}
                    className={[
                      'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                      selected
                        ? 'bg-forest text-white'
                        : 'border border-line bg-canvas text-muted hover:bg-accent-soft hover:text-forest',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <article className="rounded-2xl border border-line bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum paciente com esse nome.</p>
            </article>
          ) : null}

          {visible.length > 0 ? (
          <>
          <div className="space-y-2 md:hidden">
            {visible.map((patient, index) => {
              const writable = canWritePatient(user?.id, patient.createdBy)
              const nameAndMeta = (
                <>
                  <span className="block truncate font-medium text-ink">{patient.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {fichaDeLine(patient) ?? `${statusLabels[patient.status]} · ${patient.program}`}
                  </span>
                </>
              )
              if (!writable) {
                return (
                  <Link
                    key={patient.id}
                    to={`/pacientes/${patient.id}`}
                    className="dash-card dash-in flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
                    style={{ animationDelay: `${80 + index * 50}ms` }}
                  >
                    <PatientAvatar
                      name={patient.name}
                      tone={patient.photoTone}
                      initials={patient.initials}
                      size="md"
                      photoUrl={patient.photoUrl}
                    />
                    <span className="min-w-0 flex-1">{nameAndMeta}</span>
                  </Link>
                )
              }
              return (
                <div
                  key={patient.id}
                  className="dash-card dash-in flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
                  style={{ animationDelay: `${80 + index * 50}ms` }}
                >
                  <PatientPhotoControl
                    patientId={patient.id}
                    name={patient.name}
                    tone={patient.photoTone}
                    initials={patient.initials}
                    photoUrl={patient.photoUrl}
                    size="md"
                    showRemove={false}
                  />
                  <Link to={`/pacientes/${patient.id}`} className="min-w-0 flex-1">
                    {nameAndMeta}
                  </Link>
                </div>
              )
            })}
          </div>

          <div
            className="dash-in hidden overflow-hidden rounded-2xl border border-line bg-surface md:block"
            style={{ animationDelay: '80ms' }}
          >
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Paciente</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Programa</th>
                  <th className="px-5 py-3 font-medium">Sessões</th>
                  <th className="px-5 py-3 font-medium">Próxima</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((patient) => {
                  const fichaDe = fichaDeLine(patient)
                  const writable = canWritePatient(user?.id, patient.createdBy)
                  return (
                    <tr
                      key={patient.id}
                      tabIndex={0}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/80"
                      onClick={() => navigate(`/pacientes/${patient.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/pacientes/${patient.id}`)
                        }
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {writable ? (
                            <div
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <PatientPhotoControl
                                patientId={patient.id}
                                name={patient.name}
                                tone={patient.photoTone}
                                initials={patient.initials}
                                photoUrl={patient.photoUrl}
                                size="md"
                                showRemove={false}
                              />
                            </div>
                          ) : (
                            <PatientAvatar
                              name={patient.name}
                              tone={patient.photoTone}
                              initials={patient.initials}
                              size="md"
                              photoUrl={patient.photoUrl}
                            />
                          )}
                          <span>
                            <span className="block font-medium text-ink">{patient.name}</span>
                            {fichaDe ? (
                              <span className="block text-xs text-muted">{fichaDe}</span>
                            ) : null}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-forest">
                          {statusLabels[patient.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{patient.program}</td>
                      <td className="px-5 py-3.5 text-muted">
                        <span className="block text-ink">{patient.sessionsDone} feitos</span>
                        {patient.sessionsTotal > 0 ? (
                          <span className="block text-xs">{patient.sessionsTotal} planejados</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {patient.nextSession
                          ? `${patient.nextSession.dateLabel} · ${patient.nextSession.timeLabel}`
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
          ) : null}
        </>
      ) : null}

      <Modal
        open={open}
        title="Novo paciente"
        description="Cadastro rápido. Só o nome é obrigatório — o restante pode ser completado na ficha."
        onClose={() => setOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            label="Nome completo"
            autoFocus
            error={form.formState.errors.fullName?.message}
            {...form.register('fullName')}
          />
          <Input
            label="Telefone"
            type="tel"
            hint="Opcional"
            error={form.formState.errors.phone?.message}
            {...form.register('phone')}
          />
          <Input
            label="Data de nascimento"
            type="date"
            hint="Opcional"
            error={form.formState.errors.birthDate?.message}
            {...form.register('birthDate')}
          />
          <Button type="submit" fullWidth isLoading={create.isPending}>
            Criar ficha
          </Button>
        </form>
      </Modal>
    </section>
  )
}
