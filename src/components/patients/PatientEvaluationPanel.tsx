import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PatientEvaluationEditorForm } from '@/components/patients/PatientEvaluationEditorForm'
import { PatientPhysicalEvaluationPanel } from '@/components/patients/PatientPhysicalEvaluationPanel'
import { EvaluationFichaDetail } from '@/components/patients/evaluation/EvaluationFichaDetail'
import { fichaHasClinicalContent } from '@/lib/evaluationFichaContent'
import {
  useDeletePatientEvaluation,
  usePatient,
  usePatientEvaluations,
} from '@/hooks/usePatients'
import { emptyEvaluationForm, type EvaluationFormData } from '@/schemas/evaluation.schema'
import type { PatientEvaluation, PhysicalEvaluationResult } from '@/types/evaluation'

function draftFromPdf(result: PhysicalEvaluationResult): EvaluationFormData {
  const base = emptyEvaluationForm()
  return {
    ...base,
    mainComplaint: result.mainComplaint,
    anamnesis: result.summary,
    history: result.mainComplaint,
    physicalExam: result.postureAndMovement,
    tests: result.muscleForceAndTests,
    physioDiagnosis: result.cinesiologicDiagnosis,
    plan: result.suggestedTreatmentPlan,
    goals: result.suggestedGoals.join('\n'),
    ficha: {
      ...base.ficha,
      anamnese: {
        ...base.ficha.anamnese,
        queixa: {
          ...base.ficha.anamnese.queixa,
          oQueTrouxe: result.mainComplaint,
        },
        historiaAtual: {
          ...base.ficha.anamnese.historiaAtual,
          comoComecou: result.summary,
        },
      },
      avaliacaoPlano: {
        ...base.ficha.avaliacaoPlano,
        inspecao: {
          ...base.ficha.avaliacaoPlano.inspecao,
          achados: result.postureAndMovement,
        },
        palpacaoTestes: {
          ...base.ficha.avaliacaoPlano.palpacaoTestes,
          testesClinicos: result.muscleForceAndTests,
        },
        sintese: {
          ...base.ficha.avaliacaoPlano.sintese,
          diagnosticoFisio: result.cinesiologicDiagnosis,
        },
        planejamento: {
          ...base.ficha.avaliacaoPlano.planejamento,
          criteriosProgressao: result.suggestedTreatmentPlan,
        },
        objetivos: {
          ...base.ficha.avaliacaoPlano.objetivos,
          curto1: result.suggestedGoals[0] ?? '',
          curto2: result.suggestedGoals[1] ?? '',
        },
      },
    },
  }
}

type PatientEvaluationPanelProps = {
  patientId: string
  patientName?: string
  /** Fail-closed — never default true (T-12-04). */
  canWrite?: boolean
  /** When true (from ?nova=1), open composer once then notify parent to clear query. */
  openCreateOnMount?: boolean
  onOpenCreateConsumed?: () => void
}

export function PatientEvaluationPanel({
  patientId,
  patientName,
  canWrite = false,
  openCreateOnMount = false,
  onOpenCreateConsumed,
}: PatientEvaluationPanelProps) {
  const { data: evaluations = [], isLoading, isError } = usePatientEvaluations(patientId)
  const { data: patientDetail } = usePatient(patientId)
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

  useEffect(() => {
    if (!openCreateOnMount || !canWrite) return
    openCreate()
    onOpenCreateConsumed?.()
    // Open once when deep-linked; parent clears nova via replace.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot mount open
  }, [openCreateOnMount, canWrite])

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

  const patientSnapshot = useMemo(() => {
    if (patientDetail) {
      return {
        name: patientDetail.name,
        birthDateRaw: patientDetail.birthDateRaw,
        birthDate: patientDetail.birthDate,
        profession: patientDetail.profession,
        phone: patientDetail.phone,
        email: patientDetail.email,
      }
    }
    if (patientName) return { name: patientName }
    return undefined
  }, [patientDetail, patientName])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Avaliações</p>
          <p className="mt-1 text-sm text-muted">
            Registre fichas musculoesqueléticas datadas. Salve com campos em branco e complete depois.
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
          Não foi possível carregar as avaliações. Confira se o script SQL do REQ-05 e da ficha (Phase 12) já foi executado no Supabase.
        </article>
      ) : null}

      {!isLoading && !isError && canWrite && editorOpen ? (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <PatientEvaluationEditorForm
            key={editing?.id ?? (createDraft ? 'draft' : 'create')}
            patientId={patientId}
            cancelLabel="Cancelar"
            submitLabel="Salvar"
            showInnerHeading
            editing={editing}
            draft={createDraft ?? undefined}
            patientSnapshot={patientSnapshot}
            onCancel={closeEditor}
            onSuccess={closeEditor}
          />
        </div>
      ) : null}

      {!isLoading && !isError && !editorOpen && evaluations.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <ClipboardList className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm font-medium text-ink">Nenhuma avaliação ainda.</p>
          <p className="mt-1 text-sm text-muted">
            {canWrite
              ? 'Crie a primeira avaliação — só a data é obrigatória.'
              : 'Nenhuma avaliação nesta ficha.'}
          </p>
        </article>
      ) : null}

      {!isLoading && !isError && !editorOpen && evaluations.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <ul className="space-y-2">
            {evaluations.map((item) => {
              const active = selected?.id === item.id
              const complete = fichaHasClinicalContent(item.ficha)
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
                    <p className="text-sm font-semibold text-ink">
                      {item.title || item.performedOnLabel}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {[
                        item.title ? item.performedOnLabel : null,
                        item.mainComplaint || item.ficha?.anamnese?.queixa?.oQueTrouxe || null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sem queixa registrada'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.isInitial ? (
                        <span className="inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                          Inicial
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                          Posterior
                        </span>
                      )}
                      <span className="inline-flex rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                        {complete ? 'Completa' : 'Parcial'}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          {selected ? (
            <article className="group rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">
                      {selected.title || selected.performedOnLabel}
                    </h3>
                    {selected.isInitial ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                        Inicial
                      </span>
                    ) : null}
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                      {fichaHasClinicalContent(selected.ficha) ? 'Completa' : 'Parcial'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {selected.title ? `${selected.performedOnLabel} · ` : ''}
                    {selected.therapistName ? `${selected.therapistName} · ` : ''}
                    registro vinculado a esta data
                  </p>
                </div>
                {canWrite ? (
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                    <button
                      type="button"
                      aria-label="Editar avaliação"
                      onClick={() => openEdit(selected)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-forest"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir avaliação"
                      onClick={() => setPendingDelete(selected)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <EvaluationFichaDetail ficha={selected.ficha} />
              </div>
            </article>
          ) : null}
        </div>
      ) : null}

      {canWrite && !editorOpen ? (
        <details className="rounded-2xl border border-line bg-surface p-5">
          <summary className="cursor-pointer text-sm font-medium text-forest">
            Importar avaliação de PDF (IA) — legado
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
          title="Excluir avaliação?"
          description="Esta avaliação será removida da ficha. Esta ação não pode ser desfeita."
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
