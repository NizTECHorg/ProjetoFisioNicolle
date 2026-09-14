import { useEffect, useState } from 'react'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PatientEvaluationEditorForm } from '@/components/patients/PatientEvaluationEditorForm'
import { PatientPhysicalEvaluationPanel } from '@/components/patients/PatientPhysicalEvaluationPanel'
import {
  useDeletePatientEvaluation,
  usePatientEvaluations,
} from '@/hooks/usePatients'
import { emptyEvaluationForm, type EvaluationFormData } from '@/schemas/evaluation.schema'
import type { PatientEvaluation, PhysicalEvaluationResult } from '@/types/evaluation'

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

type PatientEvaluationPanelProps = {
  patientId: string
  patientName?: string
  canWrite?: boolean
}

export function PatientEvaluationPanel({
  patientId,
  patientName,
  canWrite = true,
}: PatientEvaluationPanelProps) {
  const { data: evaluations = [], isLoading, isError } = usePatientEvaluations(patientId)
  const deleteEvaluation = useDeletePatientEvaluation(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientEvaluation | null>(null)
  const [createDraft, setCreateDraft] = useState<EvaluationFormData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientEvaluation | null>(null)

  const selected = evaluations.find((item) => item.id === selectedId) ?? evaluations[0] ?? null

  useEffect(() => {
    if (!selectedId && evaluations[0]) setSelectedId(evaluations[0].id)
  }, [evaluations, selectedId])

  function openCreate(draft?: EvaluationFormData) {
    setEditing(null)
    setCreateDraft(draft ?? null)
    setEditorOpen(true)
  }

  function openEdit(item: PatientEvaluation) {
    setEditing(item)
    setCreateDraft(null)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
    setCreateDraft(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Avaliação</p>
          <p className="mt-1 text-sm text-muted">
            Registro clínico datado: anamnese, exame e planejamento da avaliação inicial.
          </p>
        </div>
        {canWrite && !editorOpen ? (
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

      {!isLoading && !isError && canWrite && editorOpen ? (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <PatientEvaluationEditorForm
            patientId={patientId}
            cancelLabel="Cancelar"
            submitLabel="Salvar"
            showInnerHeading
            editing={editing}
            draft={createDraft ?? undefined}
            onCancel={closeEditor}
            onSuccess={closeEditor}
          />
        </div>
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
                {canWrite ? (
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
                ) : null}
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

      {canWrite && !editorOpen ? (
        <details className="rounded-2xl border border-line bg-surface p-5">
          <summary className="cursor-pointer text-sm font-medium text-forest">
            Importar avaliação de PDF (IA)
          </summary>
          <div className="mt-4">
            <PatientPhysicalEvaluationPanel
              patientId={patientId}
              patientName={patientName}
              canWrite={canWrite}
              onUseAsEvaluation={(result) => openCreate(draftFromPdf(result))}
            />
          </div>
        </details>
      ) : null}

      {canWrite ? (
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
      ) : null}
    </div>
  )
}
