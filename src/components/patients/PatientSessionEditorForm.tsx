import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useActiveTherapists,
  useCreatePatientSession,
  useUpdatePatientSession,
} from '@/hooks/usePatients'
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'
import type { ToastAction } from '@/stores/toast.store'
import type { PatientSessionRecord } from '@/types/patient'

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

type PatientSessionEditorFormProps = {
  patientId: string
  cancelLabel: string
  submitLabel: string
  successAction?: ToastAction
  errorMessage?: string
  editing?: PatientSessionRecord | null
  onCancel: () => void
  onSuccess: () => void
}

export function PatientSessionEditorForm({
  patientId,
  cancelLabel,
  submitLabel,
  successAction,
  errorMessage,
  editing,
  onCancel,
  onSuccess,
}: PatientSessionEditorFormProps) {
  const { data: therapists = [] } = useActiveTherapists()
  const createSession = useCreatePatientSession(patientId, {
    action: successAction,
    errorMessage,
  })
  const updateSession = useUpdatePatientSession(patientId)

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
  }, [editing, form, therapists])

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
        { onSuccess },
      )
      return
    }

    createSession.mutate(input, { onSuccess })
  }

  const saving = createSession.isPending || updateSession.isPending

  return (
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
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button type="submit" isLoading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
