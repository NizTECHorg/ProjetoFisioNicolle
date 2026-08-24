import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useActiveTherapists,
  useCreatePatientSession,
  useDeletePatientSession,
  usePatientSessions,
  useUpdatePatientSession,
} from '@/hooks/usePatients'
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'
import type { PatientSessionRecord, SessionStatus } from '@/types/patient'

const statusLabel: Record<SessionStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  faltou: 'Faltou',
}

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString()
}

function defaultScheduledLocal() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return toDatetimeLocalValue(date.toISOString())
}

type PatientEvolutionsPanelProps = {
  patientId: string
}

export function PatientEvolutionsPanel({ patientId }: PatientEvolutionsPanelProps) {
  const { data: sessions = [], isLoading } = usePatientSessions(patientId)
  const { data: therapists = [] } = useActiveTherapists()
  const createSession = useCreatePatientSession(patientId)
  const updateSession = useUpdatePatientSession(patientId)
  const deleteSession = useDeletePatientSession(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientSessionRecord | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientSessionRecord | null>(null)

  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Selecione…' },
      ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
    ],
    [therapists],
  )

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      mode: 'agendar',
      scheduledAt: defaultScheduledLocal(),
      sessionType: 'Sessão',
      place: '',
      therapistId: '',
      patientState: '',
      changesSinceLast: '',
      conducts: '',
      treatmentResponse: '',
      incidents: '',
      nextPlan: '',
    },
  })

  const mode = form.watch('mode')

  useEffect(() => {
    if (!editorOpen) return
    if (editing) {
      form.reset({
        mode: editing.status === 'realizada' ? 'realizada' : 'agendar',
        scheduledAt: toDatetimeLocalValue(editing.scheduledAt),
        sessionType: editing.type,
        place: editing.place === '—' ? '' : editing.place,
        therapistId: editing.therapistId ?? '',
        patientState: editing.evolution?.patientState ?? '',
        changesSinceLast: editing.evolution?.changesSinceLast ?? '',
        conducts: editing.evolution?.conducts ?? '',
        treatmentResponse: editing.evolution?.treatmentResponse ?? '',
        incidents: editing.evolution?.incidents ?? '',
        nextPlan: editing.evolution?.nextPlan ?? '',
      })
      return
    }
    form.reset({
      mode: 'agendar',
      scheduledAt: defaultScheduledLocal(),
      sessionType: 'Sessão',
      place: '',
      therapistId: therapists[0]?.id ?? '',
      patientState: '',
      changesSinceLast: '',
      conducts: '',
      treatmentResponse: '',
      incidents: '',
      nextPlan: '',
    })
  }, [editorOpen, editing, form, therapists])

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  function onSubmit(values: SessionFormData) {
    const therapist = therapists.find((item) => item.id === values.therapistId)
    if (!therapist) {
      form.setError('therapistId', { message: 'Selecione o profissional' })
      return
    }

    const input = {
      mode: values.mode,
      scheduledAt: fromDatetimeLocalValue(values.scheduledAt),
      sessionType: values.sessionType,
      place: values.place,
      therapistId: therapist.id,
      therapistName: therapist.fullName,
      patientState: values.patientState,
      changesSinceLast: values.changesSinceLast,
      conducts: values.conducts,
      treatmentResponse: values.treatmentResponse,
      incidents: values.incidents,
      nextPlan: values.nextPlan,
    }

    if (editing) {
      updateSession.mutate(
        {
          sessionId: editing.id,
          input,
          evolutionId: editing.evolution?.id ?? null,
        },
        { onSuccess: () => closeEditor() },
      )
      return
    }

    createSession.mutate(input, { onSuccess: () => closeEditor() })
  }

  const saving = createSession.isPending || updateSession.isPending

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Evoluções</p>
            <p className="mt-1 text-sm text-muted">Sessões e registros clínicos deste paciente.</p>
          </div>
          <Button type="button" onClick={() => { setEditing(null); setEditorOpen(true) }}>
            <Plus size={16} />
            Nova sessão
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
            <CalendarClock className="mx-auto text-muted" size={22} />
            <p className="mt-3 text-sm text-muted">Nenhuma sessão registrada.</p>
          </article>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li key={session.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {session.dateLabel} · {session.timeLabel}
                      </p>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                        {statusLabel[session.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {session.type} · {session.place}
                      {session.therapistName ? ` · ${session.therapistName}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Editar sessão"
                      onClick={() => {
                        setEditing(session)
                        setEditorOpen(true)
                      }}
                      className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-forest"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir sessão"
                      onClick={() => setPendingDelete(session)}
                      className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {session.evolution ? (
                  <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm text-ink">
                    <p>
                      <span className="text-xs text-muted">Estado · </span>
                      {session.evolution.patientState}
                    </p>
                    <p>
                      <span className="text-xs text-muted">Condutas · </span>
                      {session.evolution.conducts}
                    </p>
                    {session.evolution.nextPlan ? (
                      <p>
                        <span className="text-xs text-muted">Plano · </span>
                        {session.evolution.nextPlan}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editorOpen}
        title={editing ? 'Editar sessão' : 'Nova sessão'}
        description="Toggle Agendar / Realizada. Agendadas aparecem na Agenda."
        onClose={closeEditor}
        wide
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
            <button
              type="button"
              onClick={() => form.setValue('mode', 'agendar', { shouldValidate: true })}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                mode === 'agendar' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              Agendar
            </button>
            <button
              type="button"
              onClick={() => form.setValue('mode', 'realizada', { shouldValidate: true })}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                mode === 'realizada' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              Realizada
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data e horário"
              type="datetime-local"
              error={form.formState.errors.scheduledAt?.message}
              {...form.register('scheduledAt')}
            />
            <Select
              label="Profissional"
              options={therapistOptions}
              error={form.formState.errors.therapistId?.message}
              {...form.register('therapistId')}
            />
            <Input
              label="Tipo"
              error={form.formState.errors.sessionType?.message}
              {...form.register('sessionType')}
            />
            <Input
              label="Local"
              error={form.formState.errors.place?.message}
              {...form.register('place')}
            />
          </div>

          {mode === 'realizada' ? (
            <div className="space-y-4 border-t border-line pt-4">
              <Textarea
                label="Estado do paciente"
                rows={3}
                error={form.formState.errors.patientState?.message}
                {...form.register('patientState')}
              />
              <Textarea
                label="Condutas realizadas"
                rows={3}
                error={form.formState.errors.conducts?.message}
                {...form.register('conducts')}
              />
              <Textarea
                label="Mudanças desde a última sessão"
                rows={2}
                error={form.formState.errors.changesSinceLast?.message}
                {...form.register('changesSinceLast')}
              />
              <Textarea
                label="Resposta ao tratamento"
                rows={2}
                error={form.formState.errors.treatmentResponse?.message}
                {...form.register('treatmentResponse')}
              />
              <Textarea
                label="Intercorrências"
                rows={2}
                error={form.formState.errors.incidents?.message}
                {...form.register('incidents')}
              />
              <Textarea
                label="Planejamento"
                rows={2}
                error={form.formState.errors.nextPlan?.message}
                {...form.register('nextPlan')}
              />
            </div>
          ) : (
            <p className="text-sm text-muted">
              Esta sessão ficará agendada e aparecerá na Agenda.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={closeEditor} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir sessão"
        description="A sessão e a evolução vinculada serão removidas. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        tone="danger"
        isLoading={deleteSession.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteSession.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </>
  )
}
