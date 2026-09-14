import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'
import { useFinancePrices, useSessionCharge } from '@/hooks/useFinance'
import {
  useActiveTherapists,
  useCreatePatientSession,
  useUpdatePatientSession,
} from '@/hooks/usePatients'
import { parseBrlInput } from '@/schemas/finance.schema'
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'
import { canSeeFinance } from '@/lib/accountAccess'
import { formatCurrency } from '@/lib/security'
import type { SessionCharge, SessionChargeDraft } from '@/types/finance'
import type { ToastAction } from '@/stores/toast.store'
import type { PatientSessionRecord } from '@/types/patient'

const emptyFinanceFields = {
  priceId: '',
  adHocAmount: '',
  isPaid: false,
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

function financeFieldsFromCharge(charge: SessionCharge | null | undefined) {
  if (!charge) return emptyFinanceFields
  if (charge.priceName === 'Avulso') {
    return {
      priceId: '',
      adHocAmount: charge.amountBrl.toFixed(2).replace('.', ','),
      isPaid: charge.isPaid,
    }
  }
  return {
    priceId: charge.priceId ?? '',
    adHocAmount: '',
    isPaid: charge.isPaid,
  }
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
  const { profile } = useAuth()
  const showFinance = canSeeFinance(profile?.accountType)
  const { data: therapists = [] } = useActiveTherapists()
  const { data: prices = [], isLoading: pricesLoading } = useFinancePrices()
  const { data: charge } = useSessionCharge(showFinance ? editing?.id : undefined)
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

  const catalogOptions = useMemo(
    () => [
      { value: '', label: 'Sem valor' },
      ...prices.map((item) => ({
        value: item.id,
        label: `${item.name} — ${formatCurrency(item.amountBrl)}`,
      })),
    ],
    [prices],
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
      ...emptyFinanceFields,
    },
  })

  const mode = form.watch('mode')
  const priceId = form.watch('priceId')
  const selectValue = prices.some((item) => item.id === priceId) ? priceId : ''

  useEffect(() => {
    const finance = editing && showFinance ? financeFieldsFromCharge(charge) : emptyFinanceFields
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
        ...finance,
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
      ...emptyFinanceFields,
    })
  }, [editing, form, therapists, charge, showFinance])

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

    const chargeDraft: SessionChargeDraft = {
      priceId: values.priceId || null,
      adHocAmountBrl: parseBrlInput(values.adHocAmount),
      isPaid: values.isPaid,
    }

    if (editing) {
      if (showFinance) {
        updateSession.mutate(
          {
            sessionId: editing.id,
            input,
            evolutionId: editing.evolution?.id ?? null,
            charge: chargeDraft,
          },
          { onSuccess },
        )
        return
      }
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

    if (showFinance) {
      createSession.mutate({ ...input, charge: chargeDraft }, { onSuccess })
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

      {showFinance ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink">Valor da consulta</p>
          <input type="hidden" {...form.register('priceId')} />
          <div className="grid gap-4 sm:grid-cols-2">
            {!pricesLoading && prices.length > 0 ? (
              <Select
                label="Preço do catálogo"
                options={catalogOptions}
                value={selectValue}
                onChange={(event) => {
                  const next = event.target.value
                  form.setValue('priceId', next, { shouldValidate: true })
                  if (next) {
                    form.setValue('adHocAmount', '', { shouldValidate: true })
                  }
                }}
              />
            ) : null}
            {!pricesLoading && prices.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum preço ativo no catálogo. Informe um valor avulso ou cadastre um preço em
                Financeiro.
              </p>
            ) : null}
            <Input
              label="Valor avulso (R$)"
              placeholder="0,00"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              error={form.formState.errors.adHocAmount?.message}
              {...form.register('adHocAmount', {
                onChange: () => {
                  form.setValue('priceId', '', { shouldValidate: true })
                },
              })}
            />
          </div>
          <div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="accent-forest" {...form.register('isPaid')} />
              Pago
            </label>
            <p className="text-xs text-muted">
              {mode === 'agendar'
                ? 'Se estiver pago, o valor entra nos totais mesmo com a sessão só agendada.'
                : 'Se estiver pago, o valor entra nos totais do mês, do ano e do acumulado.'}
            </p>
            {form.formState.errors.isPaid?.message ? (
              <p role="alert" className="text-xs text-error">
                {form.formState.errors.isPaid.message}
              </p>
            ) : null}
          </div>
          {editing && charge ? (
            <p className="text-xs text-muted">
              Valor gravado: {charge.priceName} · {formatCurrency(charge.amountBrl)}
            </p>
          ) : null}
        </div>
      ) : null}

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
