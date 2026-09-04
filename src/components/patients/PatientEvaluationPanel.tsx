import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PatientPhysicalEvaluationPanel } from '@/components/patients/PatientPhysicalEvaluationPanel'
import {
  useActiveTherapists,
  useCreatePatientEvaluation,
  useDeletePatientEvaluation,
  usePatientEvaluations,
  useUpdatePatientEvaluation,
} from '@/hooks/usePatients'
import { emptyEvaluationForm, evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation.schema'
import type { PatientEvaluation, PhysicalEvaluationResult } from '@/types/evaluation'

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

const DETAIL_FIELDS: Array<{ key: keyof PatientEvaluation; label: string }> = [
  { key: 'mainComplaint', label: 'Queixa principal' },
  { key: 'anamnesis', label: 'Anamnese' },
  { key: 'history', label: 'História do quadro' },
  { key: 'pain', label: 'Dor' },
  { key: 'limitations', label: 'Limitações' },
  { key: 'goals', label: 'Objetivos' },
  { key: 'physicalExam', label: 'Exame físico' },
  { key: 'tests', label: 'Testes' },
  { key: 'measurements', label: 'Medidas' },
  { key: 'physioDiagnosis', label: 'Diagnóstico fisioterapêutico' },
  { key: 'plan', label: 'Planejamento' },
]

function draftFromPdf(result: PhysicalEvaluationResult): EvaluationFormData {
  return {
    ...emptyEvaluationForm(),
    mainComplaint: result.mainComplaint,
    anamnesis: result.summary,
    history: result.mainComplaint,
    physicalExam: result.postureAndMovement,
    tests: result.muscleForceAndTests,
    physioDiagnosis: result.cinesiologicDiagnosis,
    plan: result.suggestedTreatmentPlan,
    goals: result.suggestedGoals.join('\n'),
  }
}

function valuesFromEvaluation(item: PatientEvaluation): EvaluationFormData {
  return {
    performedOn: item.performedOn,
    therapistId: item.therapistId ?? '',
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

type PatientEvaluationPanelProps = {
  patientId: string
  patientName?: string
}

export function PatientEvaluationPanel({ patientId, patientName }: PatientEvaluationPanelProps) {
  const { data: evaluations = [], isLoading, isError } = usePatientEvaluations(patientId)
  const { data: therapists = [] } = useActiveTherapists()
  const createEvaluation = useCreatePatientEvaluation(patientId)
  const updateEvaluation = useUpdatePatientEvaluation(patientId)
  const deleteEvaluation = useDeletePatientEvaluation(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientEvaluation | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientEvaluation | null>(null)

  const selected = evaluations.find((item) => item.id === selectedId) ?? evaluations[0] ?? null

  useEffect(() => {
    if (!selectedId && evaluations[0]) setSelectedId(evaluations[0].id)
  }, [evaluations, selectedId])

  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Selecione…' },
      ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
    ],
    [therapists],
  )

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: emptyEvaluationForm(),
  })

  function openCreate(draft?: EvaluationFormData) {
    setEditing(null)
    setEditorOpen(true)
    form.reset(draft ?? emptyEvaluationForm())
  }

  function openEdit(item: PatientEvaluation) {
    setEditing(item)
    setEditorOpen(true)
    form.reset(valuesFromEvaluation(item))
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

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
      updateEvaluation.mutate({ evaluationId: editing.id, input }, { onSuccess: closeEditor })
      return
    }

    createEvaluation.mutate(input, { onSuccess: closeEditor })
  }

  const saving = createEvaluation.isPending || updateEvaluation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Avaliação</p>
          <p className="mt-1 text-sm text-muted">
            Registro clínico datado: anamnese, exame e planejamento da avaliação inicial.
          </p>
        </div>
        {!editorOpen ? (
          <Button type="button" onClick={() => openCreate()}>
            <Plus size={16} />
            Nova avaliação
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar as avaliações. Confira se o script SQL do REQ-05 já foi executado no Supabase.
        </article>
      ) : null}

      {!isLoading && !isError && editorOpen ? (
        <form className="space-y-5 rounded-2xl border border-line bg-surface p-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">
                {editing ? 'Editar avaliação' : 'Nova avaliação'}
              </h3>
              <p className="mt-1 text-xs text-muted">A data fica vinculada ao registro e não deve ser inventada depois.</p>
            </div>
          </div>

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

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={closeEditor} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      ) : null}

      {!isLoading && !isError && !editorOpen && evaluations.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <ClipboardList className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm text-muted">Nenhuma avaliação registrada.</p>
        </article>
      ) : null}

      {!isLoading && !isError && !editorOpen && evaluations.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <ul className="space-y-2">
            {evaluations.map((item) => {
              const active = selected?.id === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={[
                      'w-full rounded-xl border p-3 text-left transition',
                      active ? 'border-forest bg-surface ring-1 ring-forest' : 'border-line bg-surface/70 hover:bg-surface',
                    ].join(' ')}
                  >
                    <p className="text-sm font-semibold text-ink">{item.performedOnLabel}</p>
                    <p className="mt-1 truncate text-xs text-muted">{item.mainComplaint || 'Sem queixa registrada'}</p>
                    {item.isInitial ? (
                      <span className="mt-2 inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                        Inicial
                      </span>
                    ) : (
                      <span className="mt-2 inline-flex rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                        Posterior
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {selected ? (
            <article className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{selected.performedOnLabel}</h3>
                    {selected.isInitial ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                        Avaliação inicial
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {selected.therapistName ? `${selected.therapistName} · ` : ''}
                    registro vinculado a esta data
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Editar avaliação"
                    onClick={() => openEdit(selected)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-forest"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir avaliação"
                    onClick={() => setPendingDelete(selected)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {DETAIL_FIELDS.map((field) => {
                  const value = selected[field.key]
                  if (typeof value !== 'string' || !value.trim()) return null
                  return (
                    <div key={field.key}>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{field.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value}</p>
                    </div>
                  )
                })}
              </div>
            </article>
          ) : null}
        </div>
      ) : null}

      {!editorOpen ? (
        <details className="rounded-2xl border border-line bg-surface p-5">
          <summary className="cursor-pointer text-sm font-medium text-forest">
            Importar avaliação de PDF (IA)
          </summary>
          <div className="mt-4">
            <PatientPhysicalEvaluationPanel
              patientId={patientId}
              patientName={patientName}
              onUseAsEvaluation={(result) => openCreate(draftFromPdf(result))}
            />
          </div>
        </details>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir avaliação"
        description="O registro clínico desta data será removido. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        tone="danger"
        isLoading={deleteEvaluation.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteEvaluation.mutate(pendingDelete.id, {
            onSuccess: () => {
              if (selectedId === pendingDelete.id) setSelectedId(null)
              setPendingDelete(null)
            },
          })
        }}
      />
    </div>
  )
}
