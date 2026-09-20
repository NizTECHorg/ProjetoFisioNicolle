import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useActiveTherapists,
  useCreatePatientEvaluation,
  useUpdatePatientEvaluation,
} from '@/hooks/usePatients'
import { emptyEvaluationForm, evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation.schema'
import type { ToastAction } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'

const FIELD_SECTIONS: Array<{
  title: string
  fields: Array<{ name: keyof EvaluationFormData; label: string; rows: number }>
}> = [
  {
    title: 'História',
    fields: [
      { name: 'mainComplaint', label: 'Queixa principal', rows: 3 },
      { name: 'anamnesis', label: 'Anamnese', rows: 4 },
      { name: 'history', label: 'História do quadro', rows: 3 },
    ],
  },
  {
    title: 'Funcional',
    fields: [
      { name: 'pain', label: 'Dor', rows: 3 },
      { name: 'limitations', label: 'Limitações', rows: 3 },
      { name: 'goals', label: 'Objetivos', rows: 3 },
    ],
  },
  {
    title: 'Exame',
    fields: [
      { name: 'physicalExam', label: 'Exame físico', rows: 4 },
      { name: 'tests', label: 'Testes', rows: 3 },
      { name: 'measurements', label: 'Medidas', rows: 3 },
    ],
  },
  {
    title: 'Conduta',
    fields: [
      { name: 'physioDiagnosis', label: 'Diagnóstico fisioterapêutico', rows: 3 },
      { name: 'plan', label: 'Planejamento', rows: 4 },
    ],
  },
]

function valuesFromEvaluation(item: PatientEvaluation): EvaluationFormData {
  return {
    performedOn: item.performedOn,
    therapistId: item.therapistId ?? '',
    ficha: item.ficha,
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
    form.reset(draft ?? emptyEvaluationForm())
  }, [draft, editing, form])

  function onSubmit(values: EvaluationFormData) {
    const therapist = therapists.find((item) => item.id === values.therapistId)
    const input = {
      performedOn: values.performedOn,
      mainComplaint: values.mainComplaint,
      anamnesis: values.anamnesis,
      history: values.history,
      pain: values.pain,
      limitations: values.limitations,
      goals: values.goals,
      physicalExam: values.physicalExam,
      tests: values.tests,
      measurements: values.measurements,
      physioDiagnosis: values.physioDiagnosis,
      plan: values.plan,
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

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {showInnerHeading ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {editing ? 'Editar avaliação' : 'Nova avaliação'}
            </h3>
            <p className="mt-1 text-xs text-muted">A data fica vinculada ao registro e não deve ser inventada depois.</p>
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

      {FIELD_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-4 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{section.title}</p>
          {section.fields.map((field) => (
            <Textarea
              key={field.name}
              label={field.label}
              rows={field.rows}
              error={form.formState.errors[field.name]?.message}
              {...form.register(field.name)}
            />
          ))}
        </div>
      ))}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
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
