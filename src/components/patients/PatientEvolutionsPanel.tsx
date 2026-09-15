import { useMemo, useState } from 'react'
import { CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { SignedPhoto } from '@/components/patients/SignedPhoto'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useSessionCharges } from '@/hooks/useFinance'
import { usePatientImages } from '@/hooks/usePatientImages'
import { useDeletePatientSession, usePatientSessions } from '@/hooks/usePatients'
import { canSeeFinance } from '@/lib/accountAccess'
import { formatCurrency } from '@/lib/security'
import type { PatientImage, PatientSessionRecord, SessionStatus } from '@/types/patient'
import type { SessionCharge } from '@/types/finance'

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

function photosForSession(images: PatientImage[], sessionId: string) {
  return images.filter((image) => image.sessionId === sessionId)
}

function photoCountLabel(count: number) {
  if (count === 1) return '1 foto'
  return `${count} fotos`
}

function SessionFinanceBadges({ charge }: { charge: SessionCharge | null | undefined }) {
  if (!charge) {
    return (
      <>
        <Badge>Não pago</Badge>
        <span className="text-xs text-muted">Sem valor</span>
      </>
    )
  }

  return (
    <>
      <Badge tone={charge.isPaid ? 'success' : 'muted'}>{charge.isPaid ? 'Pago' : 'Não pago'}</Badge>
      <span className="text-xs font-medium text-ink">{formatCurrency(charge.amountBrl)}</span>
      {charge.priceName ? <span className="text-xs text-muted">{charge.priceName}</span> : null}
    </>
  )
}

function EvolutionField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null
  return (
    <p>
      <span className="text-xs text-muted">{label} · </span>
      {value}
    </p>
  )
}

function SessionPhotosFold({
  photos,
  onOpenPhoto,
}: {
  photos: PatientImage[]
  onOpenPhoto: (imageId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const panelId = photos[0] ? `session-photos-${photos[0].id}` : undefined

  if (photos.length === 0) {
    return <p className="mt-2 text-xs text-muted">Sem fotos</p>
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-forest"
      >
        <span>{photoCountLabel(photos.length)}</span>
        <ChevronDown
          size={16}
          className={['shrink-0 transition-transform duration-500 ease-in-out', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>
      <div
        id={panelId}
        className={[
          'grid transition-[grid-template-rows] duration-500 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap gap-2 pt-2">
            {photos.map((image) => (
              <button
                key={image.id}
                type="button"
                className="size-36 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas"
                onClick={() => onOpenPhoto(image.id)}
              >
                <SignedPhoto
                  src={image.thumbUrl ?? image.signedUrl}
                  fallbackSrc={image.signedUrl}
                  alt={image.description.trim() || 'Foto da sessão'}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PatientEvolutionsPanel({ patientId, canWrite = true }: PatientEvolutionsPanelProps) {
  const { profile } = useAuth()
  const showFinance = canSeeFinance(profile?.accountType)
  const { data: sessions = [], isLoading } = usePatientSessions(patientId)
  const { data: images = [] } = usePatientImages(patientId)
  const sessionIds = useMemo(() => sessions.map((session) => session.id), [sessions])
  const { data: charges = [] } = useSessionCharges(patientId, sessionIds, showFinance)
  const deleteSession = useDeletePatientSession(patientId)

  const chargeBySession = useMemo(() => {
    const map = new Map<string, SessionCharge>()
    for (const charge of charges) map.set(charge.sessionId, charge)
    return map
  }, [charges])

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PatientSessionRecord | null>(null)
  const [viewing, setViewing] = useState<PatientSessionRecord | null>(null)
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientSessionRecord | null>(null)

  const viewingPhotos = viewing ? photosForSession(images, viewing.id) : []
  const openPhoto = viewingPhotos.find((image) => image.id === openPhotoId) ?? viewingPhotos[0] ?? null

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
  }

  function closeViewer() {
    setViewing(null)
    setOpenPhotoId(null)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sessões</p>
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
            {sessions.map((session) => {
              const photos = photosForSession(images, session.id)
              const charge = chargeBySession.get(session.id) ?? null
              return (
                <li key={session.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
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
                      {showFinance ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <SessionFinanceBadges charge={charge} />
                        </div>
                      ) : null}
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

                  <SessionPhotosFold
                    photos={photos}
                    onOpenPhoto={(imageId) => {
                      setViewing(session)
                      setOpenPhotoId(imageId)
                    }}
                  />

                  {session.evolution ? (
                    <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm text-ink">
                      <EvolutionField label="Estado" value={session.evolution.patientState} />
                      <EvolutionField label="Condutas" value={session.evolution.conducts} />
                      <EvolutionField label="Plano" value={session.evolution.nextPlan} />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(viewing)}
        title={viewing ? `${viewing.dateLabel} · ${viewing.timeLabel}` : 'Sessão'}
        description={viewing ? `${statusLabel[viewing.status]} · ${viewing.type} · ${viewing.place}` : undefined}
        onClose={closeViewer}
        wide
      >
        {viewing ? (
          <div className="space-y-4">
            {viewing.therapistName ? (
              <p className="text-sm text-muted">Profissional · {viewing.therapistName}</p>
            ) : null}

            {showFinance ? (
              <div className="flex flex-wrap items-center gap-2">
                <SessionFinanceBadges charge={chargeBySession.get(viewing.id) ?? null} />
              </div>
            ) : null}

            {viewing.evolution ? (
              <div className="space-y-2 text-sm text-ink">
                <EvolutionField label="Estado" value={viewing.evolution.patientState} />
                <EvolutionField label="Condutas" value={viewing.evolution.conducts} />
                <EvolutionField label="Mudanças" value={viewing.evolution.changesSinceLast} />
                <EvolutionField label="Resposta" value={viewing.evolution.treatmentResponse} />
                <EvolutionField label="Intercorrências" value={viewing.evolution.incidents} />
                <EvolutionField label="Plano" value={viewing.evolution.nextPlan} />
              </div>
            ) : (
              <p className="text-sm text-muted">Sem evolução registrada nesta sessão.</p>
            )}

            <div>
              <p className="text-sm font-semibold text-ink">Fotos da sessão</p>
              {viewingPhotos.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nenhuma foto anexada a esta sessão.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {openPhoto ? (
                    <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
                      <SignedPhoto
                        src={openPhoto.signedUrl}
                        alt={openPhoto.description.trim() || 'Foto da sessão'}
                        contain
                      />
                      <p className="px-3 py-2 text-sm text-ink">
                        {openPhoto.description.trim() || 'Sem descrição.'}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-4 gap-2">
                    {viewingPhotos.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        className={[
                          'aspect-square overflow-hidden rounded-xl border bg-canvas',
                          image.id === openPhoto?.id ? 'border-accent ring-2 ring-accent/40' : 'border-line',
                        ].join(' ')}
                        onClick={() => setOpenPhotoId(image.id)}
                      >
                        <SignedPhoto
                          src={image.thumbUrl ?? image.signedUrl}
                          fallbackSrc={image.signedUrl}
                          alt={image.description.trim() || 'Foto da sessão'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

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
          description="A sessão e a evolução vinculada serão removidas. Essa ação não pode ser desfeita. As fotos dessa sessão ficam na ficha como avulsas."
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
