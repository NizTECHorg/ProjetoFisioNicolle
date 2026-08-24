import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useCreatePatientAlert,
  useDeletePatientAlert,
  useUpdatePatientAlert,
} from '@/hooks/usePatients'
import {
  alertToneOptions,
  patientAlertSchema,
  type PatientAlertFormData,
} from '@/schemas/patient.schema'
import type { AlertTone, PatientAlert } from '@/types/patient'

function alertToneClass(tone: AlertTone) {
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'success') return 'border-accent/30 bg-accent-soft text-forest'
  return 'border-line bg-canvas text-ink'
}

function alertIconClass(tone: AlertTone) {
  if (tone === 'warning') return 'text-amber-500'
  if (tone === 'success') return 'text-accent'
  return 'text-forest'
}

function formatAlertDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

type PatientAlertsPanelProps = {
  patientId: string
  alerts: PatientAlert[]
  /** Sidebar compacta (desktop 20%) com scroll */
  compact?: boolean
}

export function PatientAlertsPanel({ patientId, alerts, compact = false }: PatientAlertsPanelProps) {
  const createAlert = useCreatePatientAlert(patientId)
  const updateAlert = useUpdatePatientAlert(patientId)
  const deleteAlert = useDeletePatientAlert(patientId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientAlert | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientAlert | null>(null)

  const form = useForm<PatientAlertFormData>({
    resolver: zodResolver(patientAlertSchema),
    defaultValues: { message: '', tone: 'warning' },
  })

  useEffect(() => {
    if (!editorOpen) return
    form.reset(
      editing
        ? { message: editing.message, tone: editing.tone }
        : { message: '', tone: 'warning' },
    )
  }, [editorOpen, editing, form])

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(alert: PatientAlert) {
    setEditing(alert)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  function onSubmit(values: PatientAlertFormData) {
    if (editing) {
      updateAlert.mutate(
        { alertId: editing.id, input: values },
        { onSuccess: () => closeEditor() },
      )
      return
    }
    createAlert.mutate(values, { onSuccess: () => closeEditor() })
  }

  const saving = createAlert.isPending || updateAlert.isPending

  return (
    <>
      <article
        className={[
          'flex flex-col rounded-2xl border border-line bg-surface',
          compact ? 'h-full max-h-[28rem] min-h-0 p-3 lg:max-h-full' : 'p-4 sm:p-5',
        ].join(' ')}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell size={compact ? 14 : 16} className="text-accent" />
            <p
              className={[
                'font-semibold uppercase tracking-[0.14em] text-accent',
                compact ? 'text-[10px]' : 'text-xs',
              ].join(' ')}
            >
              Alertas
            </p>
          </div>
          <button
            type="button"
            aria-label="Adicionar alerta"
            onClick={openCreate}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-forest transition hover:bg-accent-soft"
          >
            <Plus size={14} />
            {!compact && <span>Adicionar</span>}
          </button>
        </div>

        <div
          className={[
            'mt-3 min-h-0',
            compact ? 'flex-1 overflow-y-auto overscroll-contain pr-0.5' : '',
          ].join(' ')}
        >
          {alerts.length === 0 ? (
            <p className="text-xs text-muted">Nenhum alerta fixado.</p>
          ) : (
            <ul className={compact ? 'space-y-2' : 'space-y-3'}>
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`rounded-xl border px-2.5 py-2 ${alertToneClass(alert.tone)}`}
                >
                  <div className="flex items-start gap-2">
                    <Bell size={12} className={`mt-0.5 shrink-0 ${alertIconClass(alert.tone)}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`leading-5 text-ink ${compact ? 'text-xs' : 'text-sm leading-6'}`}>
                        {alert.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        {alert.createdByName || '—'} · {formatAlertDate(alert.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        aria-label="Editar alerta"
                        onClick={() => openEdit(alert)}
                        className="rounded-md p-1 text-muted transition hover:bg-surface hover:text-forest"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remover alerta"
                        onClick={() => setPendingDelete(alert)}
                        className="rounded-md p-1 text-muted transition hover:bg-surface hover:text-error"
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
      </article>

      <Modal
        open={editorOpen}
        title={editing ? 'Editar alerta' : 'Novo alerta'}
        description="Informação que deve permanecer visível ao abrir o prontuário."
        onClose={closeEditor}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Textarea
            label="Mensagem"
            rows={4}
            error={form.formState.errors.message?.message}
            {...form.register('message')}
          />
          <Select
            label="Tom"
            options={alertToneOptions}
            error={form.formState.errors.tone?.message}
            {...form.register('tone')}
          />
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
        title="Remover alerta"
        description="Este alerta deixará de aparecer no resumo do paciente."
        confirmLabel="Remover"
        tone="danger"
        isLoading={deleteAlert.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteAlert.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </>
  )
}
