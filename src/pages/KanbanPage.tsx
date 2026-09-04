import { useState, type FormEvent } from 'react'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import {
  useBoard,
  useCreateCard,
  useCreateColumn,
  useDeleteCard,
  useDeleteColumn,
  useMoveCard,
  useUpdateCardDue,
} from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'

function todayKey() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function formatDue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(year, month - 1, day),
  )
}

export function KanbanPage() {
  const { data, isLoading, isError } = useBoard()
  const { data: patients = [] } = usePatients()
  const createColumn = useCreateColumn()
  const createCard = useCreateCard()
  const move = useMoveCard()
  const removeCard = useDeleteCard()
  const removeColumn = useDeleteColumn()
  const updateDue = useUpdateCardDue()

  const [columnTitle, setColumnTitle] = useState('')
  const [cardOpen, setCardOpen] = useState(false)
  const [cardColumnId, setCardColumnId] = useState('')
  const [cardTitle, setCardTitle] = useState('')
  const [cardDescription, setCardDescription] = useState('')
  const [cardPatientId, setCardPatientId] = useState('')
  const [cardDueOn, setCardDueOn] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropColumnId, setDropColumnId] = useState<string | null>(null)
  const [columnToDelete, setColumnToDelete] = useState<{ id: string; title: string } | null>(null)

  const columns = data?.columns ?? []
  const cards = data?.cards ?? []
  const today = todayKey()

  function openCard(columnId: string) {
    setCardColumnId(columnId)
    setCardTitle('')
    setCardDescription('')
    setCardPatientId('')
    setCardDueOn('')
    setCardOpen(true)
  }

  function submitColumn(event: FormEvent) {
    event.preventDefault()
    if (!columnTitle.trim()) return
    createColumn.mutate(columnTitle.trim(), { onSuccess: () => setColumnTitle('') })
  }

  function submitCard(event: FormEvent) {
    event.preventDefault()
    if (!cardTitle.trim() || !cardColumnId) return
    createCard.mutate(
      {
        columnId: cardColumnId,
        title: cardTitle.trim(),
        description: cardDescription.trim(),
        patientId: cardPatientId || null,
        dueOn: cardDueOn || null,
      },
      { onSuccess: () => setCardOpen(false) },
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Quadro"
        description="Organize as tarefas da clínica. Com data limite, o prazo aparece na Agenda."
      />

      <form onSubmit={submitColumn} className="dash-in mb-5 flex max-w-md items-end gap-2" style={{ animationDelay: '80ms' }}>
        <div className="flex-1">
          <Input
            label="Nova lista"
            placeholder="Ex.: Aguardando retorno"
            value={columnTitle}
            onChange={(event) => setColumnTitle(event.target.value)}
          />
        </div>
        <Button type="submit" isLoading={createColumn.isPending} disabled={!columnTitle.trim()}>
          <Plus size={16} />
          Criar
        </Button>
      </form>

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar o quadro. Execute o script supabase/board.sql no Supabase.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma lista ainda. Crie uma acima ou execute o script supabase/board.sql.</p>
          ) : null}
          {columns.map((column, index) => {
            const columnCards = cards.filter((card) => card.columnId === column.id)
            const done = column.title.toLowerCase().includes('conclu')
            return (
              <article
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropColumnId(column.id)
                }}
                onDragLeave={() => setDropColumnId((current) => (current === column.id ? null : current))}
                onDrop={() => {
                  if (draggingId) move.mutate({ cardId: draggingId, columnId: column.id })
                  setDraggingId(null)
                  setDropColumnId(null)
                }}
                className={[
                  'dash-in dash-card flex w-72 shrink-0 flex-col rounded-2xl border bg-canvas p-3',
                  dropColumnId === column.id ? 'border-accent bg-accent-soft/60' : 'border-line',
                ].join(' ')}
                style={{ animationDelay: `${140 + index * 80}ms` }}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted">
                      {columnCards.length}
                    </span>
                    <button
                      type="button"
                      aria-label={`Excluir lista ${column.title}`}
                      className="rounded-lg p-1 text-muted hover:text-error"
                      onClick={() => setColumnToDelete({ id: column.id, title: column.title })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {columnCards.map((card) => {
                    const overdue = Boolean(card.dueOn && card.dueOn < today && !done)
                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => setDraggingId(card.id)}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setDropColumnId(null)
                        }}
                        className="cursor-grab rounded-2xl border border-line bg-surface p-3 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-ink">{card.title}</p>
                          <button
                            type="button"
                            aria-label="Excluir card"
                            className="text-muted hover:text-error"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeCard.mutate(card.id)
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {card.description ? (
                          <p className="mt-1 text-xs leading-5 text-muted">{card.description}</p>
                        ) : null}
                        {card.patientName ? (
                          <div className="mt-3 flex items-center gap-2">
                            <PatientAvatar name={card.patientName} tone={card.photoTone} size="sm" />
                            <span className="truncate text-xs text-muted">{card.patientName}</span>
                          </div>
                        ) : null}
                        <div
                          className={[
                            'relative mt-3 flex items-center gap-1.5 overflow-hidden rounded-xl px-2 py-1.5 text-[11px] font-medium',
                            overdue ? 'bg-error/10 text-error' : 'bg-accent-soft text-forest',
                          ].join(' ')}
                        >
                          <CalendarClock size={12} className="shrink-0" />
                          <span>{card.dueOn ? `${overdue ? 'Atrasado · ' : ''}${formatDue(card.dueOn)}` : 'Definir prazo'}</span>
                          <input
                            type="date"
                            value={card.dueOn ?? ''}
                            onChange={(event) =>
                              updateDue.mutate({ cardId: card.id, dueOn: event.target.value || null })
                            }
                            className="absolute inset-0 cursor-pointer opacity-0"
                            aria-label="Data limite"
                          />
                        </div>
                        {columns.length > 1 ? (
                          <select
                            aria-label="Mover card"
                            className="mt-2 w-full rounded-xl border border-line bg-canvas px-2 py-1.5 text-[11px] text-muted"
                            value={card.columnId}
                            onChange={(event) => move.mutate({ cardId: card.id, columnId: event.target.value })}
                          >
                            {columns.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => openCard(column.id)}
                  className="mt-3 flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted hover:bg-white hover:text-forest"
                >
                  <Plus size={14} />
                  Adicionar card
                </button>
              </article>
            )
          })}
        </div>
      ) : null}

      <Modal open={cardOpen} title="Novo card" onClose={() => setCardOpen(false)}>
        <form className="space-y-4" onSubmit={submitCard}>
          <Input
            label="Título"
            value={cardTitle}
            onChange={(event) => setCardTitle(event.target.value)}
            placeholder="Ligar para o paciente"
          />
          <Textarea
            label="Descrição"
            value={cardDescription}
            onChange={(event) => setCardDescription(event.target.value)}
          />
          <Input
            label="Data limite"
            type="date"
            value={cardDueOn}
            onChange={(event) => setCardDueOn(event.target.value)}
            hint="Opcional. O prazo aparece na Agenda nesse dia."
          />
          <Select
            label="Paciente (opcional)"
            value={cardPatientId}
            onChange={(event) => setCardPatientId(event.target.value)}
            options={[
              { value: '', label: 'Nenhum' },
              ...patients.map((patient) => ({ value: patient.id, label: patient.name })),
            ]}
          />
          <Button type="submit" fullWidth isLoading={createCard.isPending} disabled={!cardTitle.trim()}>
            Criar card
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(columnToDelete)}
        title="Excluir lista"
        description={`A lista "${columnToDelete?.title ?? ''}" e todos os cards dela serão removidos.`}
        confirmLabel="Excluir"
        tone="danger"
        isLoading={removeColumn.isPending}
        onClose={() => setColumnToDelete(null)}
        onConfirm={() => {
          if (!columnToDelete) return
          removeColumn.mutate(columnToDelete.id, { onSuccess: () => setColumnToDelete(null) })
        }}
      />
    </section>
  )
}
