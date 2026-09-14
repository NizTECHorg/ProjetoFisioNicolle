import { useState } from 'react'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import {
  useDeletePatientSession,
  usePatientSessions,
} from '@/hooks/usePatients'
import type { PatientSessionRecord, SessionStatus } from '@/types/patient'

const statusLabel: Record<SessionStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  faltou: 'Faltou',
}

type PatientEvolutionsPanelProps = {
  patientId: string
  canWrite?: boolean
}

export function PatientEvolutionsPanel({ patientId, canWrite = true }: PatientEvolutionsPanelProps) {
  const { data: sessions = [], isLoading } = usePatientSessions(patientId)
  const deleteSession = useDeletePatientSession(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientSessionRecord | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientSessionRecord | null>(null)

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Evoluções</p>
            <p className="mt-1 text-sm text-muted">Sessões e registros clínicos deste paciente.</p>
          </div>
          {canWrite ? (
            <Button type="button" onClick={() => { setEditing(null); setEditorOpen(true) }}>
              <Plus size={16} />
              Nova sessão
            </Button>
          ) : null}
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
                  {canWrite ? (
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
                  ) : null}
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

      {canWrite ? (
        <Modal
          open={editorOpen}
          title={editing ? 'Editar sessão' : 'Nova sessão'}
          description="Toggle Agendar / Realizada. Agendadas aparecem na Agenda."
          onClose={closeEditor}
          wide
        >
          <PatientSessionEditorForm
            patientId={patientId}
            editing={editing}
            cancelLabel="Cancelar"
            submitLabel="Salvar"
            onCancel={closeEditor}
            onSuccess={closeEditor}
          />
        </Modal>
      ) : null}

      {canWrite ? (
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
      ) : null}
    </>
  )
}
