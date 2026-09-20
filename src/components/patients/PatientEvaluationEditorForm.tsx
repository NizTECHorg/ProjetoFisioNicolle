import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EvaluationFichaForm } from '@/components/patients/evaluation/EvaluationFichaForm'
import {
  useActiveTherapists,
  useCreatePatientEvaluation,
  useUpdatePatientEvaluation,
} from '@/hooks/usePatients'
import {
  emptyEvaluationForm,
  evaluationFormSchema,
  type EvaluationFormData,
} from '@/schemas/evaluation.schema'
import { emptyEvaluationFicha } from '@/schemas/evaluationFicha.schema'
import type { ToastAction } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'

export type EvaluationPatientSnapshot = {
  name?: string
  birthDateRaw?: string | null
  birthDate?: string
  profession?: string
  phone?: string
  email?: string
}

function dash(value: string | null | undefined) {
  if (!value || value === '—') return ''
  return value
}

function contactFromSnapshot(snapshot?: EvaluationPatientSnapshot) {
  if (!snapshot) return ''
  return [dash(snapshot.phone), dash(snapshot.email)].filter(Boolean).join(' · ')
}

function prefillIdentification(
  base: EvaluationFormData,
  snapshot: EvaluationPatientSnapshot | undefined,
): EvaluationFormData {
  if (!snapshot) return base
  const id = base.ficha.anamnese?.identificacao ?? {}
  return {
    ...base,
    ficha: {
      ...base.ficha,
      anamnese: {
        ...base.ficha.anamnese,
        identificacao: {
          ...id,
          nomeCompleto: id.nomeCompleto || dash(snapshot.name),
          dataNascimento: id.dataNascimento || dash(snapshot.birthDateRaw) || dash(snapshot.birthDate),
          profissao: id.profissao || dash(snapshot.profession),
          contato: id.contato || contactFromSnapshot(snapshot),
          dataAvaliacao: id.dataAvaliacao || base.performedOn,
        },
      },
    },
  }
}

function valuesFromEvaluation(item: PatientEvaluation): EvaluationFormData {
  return {
    performedOn: item.performedOn,
    therapistId: item.therapistId ?? '',
    ficha: item.ficha ?? emptyEvaluationFicha(),
    mainComplaint: item.mainComplaint,
    anamnesis: item.anamnesis,
    history: item.history,
    pain: item.pain,
    limitations: item.limitations,
    goals: item.goals,
    physicalExam: item.physicalExam,
    tests: item.tests,
    measurements: item.measurements,
    physioDiagnosis: item.physioDiagnosis,
    plan: item.plan,
  }
}

type PatientEvaluationEditorFormProps = {
  patientId: string
  cancelLabel: string
  submitLabel: string
  successAction?: ToastAction
  errorMessage?: string
  editing?: PatientEvaluation | null
  draft?: EvaluationFormData
  patientSnapshot?: EvaluationPatientSnapshot
  showInnerHeading?: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function PatientEvaluationEditorForm({
  patientId,
  cancelLabel,
  submitLabel,
  successAction,
  errorMessage,
  editing,
  draft,
  patientSnapshot,
  showInnerHeading = true,
  onCancel,
  onSuccess,
}: PatientEvaluationEditorFormProps) {
  const { data: therapists = [] } = useActiveTherapists()
  const createEvaluation = useCreatePatientEvaluation(patientId, {
    action: successAction,
    errorMessage,
  })
  const updateEvaluation = useUpdatePatientEvaluation(patientId)

  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Selecione…' },
      ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
    ],
    [therapists],
  )

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema) as Resolver<EvaluationFormData>,
    defaultValues: emptyEvaluationForm(),
  })

  useEffect(() => {
    if (editing) {
      form.reset(valuesFromEvaluation(editing))
      return
    }
    const base = draft ?? emptyEvaluationForm()
    form.reset(prefillIdentification(base, patientSnapshot))
  }, [draft, editing, form, patientSnapshot])

  function onSubmit(values: EvaluationFormData) {
    const therapist = therapists.find((item) => item.id === values.therapistId)
    const ficha = values.ficha
    const input = {
      performedOn: values.performedOn,
      ficha,
      mainComplaint: ficha.anamnese?.queixa?.oQueTrouxe ?? values.mainComplaint ?? '',
      anamnesis: values.anamnesis ?? '',
      history: ficha.anamnese?.historiaAtual?.comoComecou ?? values.history ?? '',
      pain: values.pain ?? '',
      limitations: ficha.funcao?.limitacaoFuncional?.item1 ?? values.limitations ?? '',
      goals: ficha.avaliacaoPlano?.objetivos?.curto1 ?? values.goals ?? '',
      physicalExam: ficha.avaliacaoPlano?.inspecao?.achados ?? values.physicalExam ?? '',
      tests: ficha.avaliacaoPlano?.palpacaoTestes?.testesClinicos ?? values.tests ?? '',
      measurements: values.measurements ?? '',
      physioDiagnosis: ficha.avaliacaoPlano?.sintese?.diagnosticoFisio ?? values.physioDiagnosis ?? '',
      plan: ficha.avaliacaoPlano?.planejamento?.criteriosProgressao ?? values.plan ?? '',
      therapistId: therapist?.id ?? null,
      therapistName: therapist?.fullName ?? null,
    }

    if (editing) {
      updateEvaluation.mutate({ evaluationId: editing.id, input }, { onSuccess })
      return
    }

    createEvaluation.mutate(input, { onSuccess })
  }

  const saving = createEvaluation.isPending || updateEvaluation.isPending
  const performedOnValid = /^\d{4}-\d{2}-\d{2}$/.test(form.watch('performedOn') ?? '')

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {showInnerHeading ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {editing ? 'Editar avaliação' : 'Nova avaliação'}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Só a data é obrigatória — salve parcial e complete depois.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Data da avaliação"
          type="date"
          error={form.formState.errors.performedOn?.message}
          {...form.register('performedOn')}
        />
        <Select
          label="Profissional"
          options={therapistOptions}
          error={form.formState.errors.therapistId?.message}
          {...form.register('therapistId')}
        />
      </div>

      <EvaluationFichaForm
        register={form.register}
        watch={form.watch}
        setValue={form.setValue}
        control={form.control}
      />

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button type="submit" isLoading={saving} disabled={!performedOnValid}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
