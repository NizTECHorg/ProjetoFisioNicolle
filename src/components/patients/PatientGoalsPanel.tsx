import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  useCreatePatientGoal,
  useDeletePatientGoal,
  useUpdatePatientGoal,
} from '@/hooks/usePatients'
import { patientGoalSchema, type PatientGoalFormData } from '@/schemas/patient.schema'
import { goalStatusLabels, type PatientGoal } from '@/types/patient'

function todayKey() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function formatGoalDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${iso}T00:00:00`))
}

const emptyForm: PatientGoalFormData = {
  title: '',
  createdOn: todayKey(),
  achievedOn: '',
}

type PatientGoalsPanelProps = {
  patientId: string
  goals: PatientGoal[]
}

export function PatientGoalsPanel({ patientId, goals }: PatientGoalsPanelProps) {
  const createGoal = useCreatePatientGoal(patientId)
  const updateGoal = useUpdatePatientGoal(patientId)
  const deleteGoal = useDeletePatientGoal(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientGoal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientGoal | null>(null)

  const form = useForm<PatientGoalFormData>({
    resolver: zodResolver(patientGoalSchema),
    defaultValues: emptyForm,
  })

  useEffect(() => {
    if (!editorOpen) return
    form.reset(
      editing
        ? {
            title: editing.title,
            createdOn: editing.createdOn || todayKey(),
            achievedOn: editing.achievedOn ?? '',
          }
        : { ...emptyForm, createdOn: todayKey() },
    )
  }, [editorOpen, editing, form])

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(goal: PatientGoal) {
    setEditing(goal)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  function onSubmit(values: PatientGoalFormData) {
    const input = {
      ...values,
      status: editing?.status ?? ('em_andamento' as const),
    }
    if (editing) {
      updateGoal.mutate({ goalId: editing.id, input }, { onSuccess: () => closeEditor() })
      return
    }
    createGoal.mutate(input, { onSuccess: () => closeEditor() })
  }

  function toggleDone(goal: PatientGoal) {
    const nextDone = !goal.isDone
    updateGoal.mutate({
      goalId: goal.id,
      input: {
        title: goal.title,
        status: nextDone ? 'concluido' : 'em_andamento',
        createdOn: goal.createdOn || todayKey(),
        achievedOn: nextDone ? goal.achievedOn || todayKey() : '',
      },
    })
  }

  const saving = createGoal.isPending || updateGoal.isPending

  return (
    <>
      <div className="rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Todos os objetivos
            </p>
          </div>
          <button
            type="button"
            aria-label="Adicionar meta"
            onClick={openCreate}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-forest transition hover:bg-accent-soft"
          >
            <Plus size={14} />
            Nova
          </button>
        </div>

        {goals.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sem objetivos cadastrados.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {goals.map((goal) => (
              <li key={goal.id}>
                <div
                  className={[
                    'group relative flex items-start gap-2 rounded-[7px] border px-2.5 py-2 transition',
                    goal.isDone
                      ? 'border-line bg-canvas'
                      : 'border-line bg-surface hover:border-forest/25',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(goal)}
                    aria-pressed={goal.isDone}
                    aria-label={
                      goal.isDone
                        ? `Marcar “${goal.title}” como em andamento`
                        : `Marcar “${goal.title}” como concluído`
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className={`text-sm leading-5 ${goal.isDone ? 'text-muted line-through' : 'text-ink'}`}>
                      {goal.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          goal.isDone ? 'bg-white text-forest' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {goalStatusLabels[goal.status]}
                      </span>
                      <span className="text-[10px] text-muted">Criada {formatGoalDate(goal.createdOn)}</span>
                      {goal.achievedOn ? (
                        <span className="text-[10px] text-muted">Concluída {formatGoalDate(goal.achievedOn)}</span>
                      ) : null}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
                    <button
                      type="button"
                      aria-label="Editar meta"
                      onClick={() => openEdit(goal)}
                      className="rounded-md p-1 text-muted transition hover:bg-white hover:text-forest"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remover meta"
                      onClick={() => setPendingDelete(goal)}
                      className="rounded-md p-1 text-muted transition hover:bg-white hover:text-error"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editorOpen}
        title={editing ? 'Editar meta' : 'Nova meta'}
        description="Objetivo específico do tratamento. Clique no card para marcar como concluído."
        onClose={closeEditor}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            label="Objetivo"
            placeholder="Ex.: Ganhar 20° de flexão de joelho"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data de criação"
              type="date"
              error={form.formState.errors.createdOn?.message}
              {...form.register('createdOn')}
            />
            <Input
              label="Data de conclusão"
              type="date"
              error={form.formState.errors.achievedOn?.message}
              {...form.register('achievedOn')}
            />
          </div>
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
        title="Remover meta"
        description="Este objetivo sairá do prontuário do paciente."
        confirmLabel="Remover"
        tone="danger"
        isLoading={deleteGoal.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteGoal.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </>
  )
}
